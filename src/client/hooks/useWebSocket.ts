import { useState, useEffect, useRef, useCallback } from 'react';
import type { ClientGameState, ClientAction, ServerMessage } from '@shared/types';

type Status = 'connecting' | 'connected' | 'disconnected';

export function useWebSocket() {
  const [state, setState] = useState<ClientGameState | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('connecting');
  const wsRef = useRef<WebSocket | null>(null);
  const retriesRef = useRef(0);
  const MAX_RETRIES = 3;

  const connect = useCallback(() => {
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${location.host}/ws`);
    wsRef.current = ws;

    ws.onopen = () => {
      retriesRef.current = 0;
      setStatus('connected');
    };

    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data) as ServerMessage;
      if (msg.type === 'STATE_UPDATE') {
        setState(msg.state);
        setLastError(null);
      } else if (msg.type === 'ERROR') {
        setLastError(msg.message);
      }
    };

    ws.onclose = () => {
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
      wsRef.current?.close();
    };
  }, [connect]);

  const sendAction = useCallback((action: ClientAction) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(action));
    }
  }, []);

  return { state, sendAction, lastError, status };
}
