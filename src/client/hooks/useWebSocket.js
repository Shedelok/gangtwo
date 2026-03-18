import { useState, useEffect, useRef, useCallback } from 'react';
function getSessionId() {
    let id = localStorage.getItem('gangGameSessionId');
    if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem('gangGameSessionId', id);
    }
    return id;
}
export function useWebSocket() {
    const [state, setState] = useState(null);
    const [lastError, setLastError] = useState(null);
    const [status, setStatus] = useState('connecting');
    const wsRef = useRef(null);
    const retriesRef = useRef(0);
    const intentionalCloseRef = useRef(false);
    const MAX_RETRIES = 3;
    const connect = useCallback(() => {
        const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
        const ws = new WebSocket(`${protocol}//${location.host}/ws`);
        wsRef.current = ws;
        ws.onopen = () => {
            retriesRef.current = 0;
            setStatus('connected');
            ws.send(JSON.stringify({ type: 'RESUME_SESSION', sessionId: getSessionId() }));
        };
        ws.onmessage = (ev) => {
            const msg = JSON.parse(ev.data);
            if (msg.type === 'STATE_UPDATE') {
                setState(msg.state);
                setLastError(null);
            }
            else if (msg.type === 'ERROR') {
                setLastError(msg.message);
            }
        };
        ws.onclose = () => {
            if (intentionalCloseRef.current) {
                intentionalCloseRef.current = false;
                return;
            }
            setStatus('disconnected');
            if (retriesRef.current < MAX_RETRIES) {
                retriesRef.current++;
                const delay = retriesRef.current * 1000;
                setTimeout(connect, delay);
            }
        };
        ws.onerror = () => {
            ws.close();
        };
    }, []);
    useEffect(() => {
        connect();
        return () => {
            intentionalCloseRef.current = true;
            wsRef.current?.close();
        };
    }, [connect]);
    const sendAction = useCallback((action) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(action));
        }
    }, []);
    return { state, sendAction, lastError, status };
}
