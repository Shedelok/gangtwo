import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useWebSocket } from './hooks/useWebSocket';
import Lobby from './components/Lobby';
import Game from './components/Game';
import ActionCardPanel, { CARD_W, CARD_H } from './components/ActionCardPanel';
import { ADDONS } from './addons';
const AVAILABLE_MP3S = ['bell-1.mp3', 'car-engine-start.mp3', 'card-flip.mp3', 'ding-dong.mp3', 'fast-woosh.mp3', 'honk-honk.mp3', 'kick-1.mp3', 'kick-2.mp3', 'magic-1.mp3', 'minutochku.mp3', 'prison-close.mp3', 'punch-1.mp3', 'punch-2.mp3'];
const SOUND_DEFAULTS = {
    STEAL_FROM_YOU: 'bell-1.mp3',
    CHIP_MOVE: 'fast-woosh.mp3',
    CARD_FLIP: 'card-flip.mp3',
    GAME_START: 'car-engine-start.mp3',
    ACTION_CARD_PLAYED: 'magic-1.mp3',
    ACTION_CARD_TAKEN: 'minutochku.mp3',
    PRISON_TAKEN_EFFECT: 'prison-close.mp3',
};
const SOUND_LABELS = {
    STEAL_FROM_YOU: 'Steal from you',
    CHIP_MOVE: 'Chip move',
    CARD_FLIP: 'Card flip',
    GAME_START: 'Game start',
    ACTION_CARD_PLAYED: 'Action card played',
    ACTION_CARD_TAKEN: 'Action card taken',
    PRISON_TAKEN_EFFECT: 'Prison taken effect',
};
const SOUND_VOLUME_MULTIPLIER = {
    STEAL_FROM_YOU: 1,
    CHIP_MOVE: 0.2,
    CARD_FLIP: 1,
    GAME_START: 1,
    ACTION_CARD_PLAYED: 1,
    ACTION_CARD_TAKEN: 1,
    PRISON_TAKEN_EFFECT: 1,
};
const preloadedAudio = {};
for (const file of AVAILABLE_MP3S) {
    try {
        const audio = new Audio(`/${file}`);
        audio.preload = 'auto';
        preloadedAudio[file] = audio;
    }
    catch { /* audio not supported */ }
}
function playSound(file, masterVolume, multiplier) {
    try {
        const audio = preloadedAudio[file];
        if (!audio)
            return;
        audio.currentTime = 0;
        audio.volume = Math.min(1, masterVolume * multiplier);
        audio.play().catch(() => { });
    }
    catch { /* audio not supported */ }
}
const ADDON_COUNT_BITS = 4; // covers 0–15 negative addons
const POS_COUNT_BITS = 2; // covers 0–2 positive addons
const RFC4648 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
function encodeSetup(addonPool, negativeAddonCount, positiveAddonCount) {
    let bits = '';
    for (const addon of ADDONS) {
        bits += addonPool.includes(addon.id) ? '1' : '0';
    }
    bits += Math.min(negativeAddonCount, (1 << ADDON_COUNT_BITS) - 1).toString(2).padStart(ADDON_COUNT_BITS, '0');
    bits += Math.min(positiveAddonCount, (1 << POS_COUNT_BITS) - 1).toString(2).padStart(POS_COUNT_BITS, '0');
    let num = parseInt(bits, 2);
    if (num === 0)
        return RFC4648[0];
    let result = '';
    while (num > 0) {
        result = RFC4648[num % 32] + result;
        num = Math.floor(num / 32);
    }
    return result;
}
function decodeSetup(code) {
    if (!code)
        return null;
    let num = 0;
    for (const ch of code.toUpperCase()) {
        const val = RFC4648.indexOf(ch);
        if (val === -1)
            return null;
        num = num * 32 + val;
    }
    const totalBits = ADDONS.length + ADDON_COUNT_BITS + POS_COUNT_BITS;
    const bits = num.toString(2).padStart(totalBits, '0');
    if (bits.length > totalBits)
        return null;
    const addonPool = [];
    for (let i = 0; i < ADDONS.length; i++) {
        if (bits[i] === '1')
            addonPool.push(ADDONS[i].id);
    }
    const negCount = parseInt(bits.slice(ADDONS.length, ADDONS.length + ADDON_COUNT_BITS), 2);
    const posCount = parseInt(bits.slice(ADDONS.length + ADDON_COUNT_BITS), 2);
    return { addonPool, negativeAddonCount: negCount, positiveAddonCount: posCount };
}
const styles = {
    container: {
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        padding: '60px 20px 40px',
    },
    status: {
        color: '#888',
        fontSize: '14px',
    },
    error: {
        background: '#3d1a1a',
        border: '1px solid #c0392b',
        color: '#e74c3c',
        padding: '10px 16px',
        borderRadius: '6px',
        marginBottom: '16px',
        fontSize: '14px',
    },
    topRightButtons: {
        position: 'fixed',
        top: '16px',
        right: '16px',
        display: 'flex',
        gap: '8px',
    },
    stopButton: {
        padding: '8px 18px',
        fontSize: '13px',
        background: '#7f1c1c',
        color: '#fca5a5',
        border: '1px solid #b91c1c',
        borderRadius: '6px',
        cursor: 'pointer',
        fontWeight: 'bold',
    },
    restartButton: {
        padding: '8px 18px',
        fontSize: '13px',
        background: '#1a4731',
        color: '#bbf7d0',
        border: '1px solid #166534',
        borderRadius: '6px',
        cursor: 'pointer',
        fontWeight: 'bold',
    },
    leftPanel: {
        position: 'fixed',
        top: '16px',
        left: '16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: '8px',
        fontSize: '12px',
        color: '#aaa',
        zIndex: 300,
    },
    soundBarRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
    },
    soundPanel: {
        background: '#1a2030',
        border: '1px solid #2a3a4a',
        borderRadius: '8px',
        padding: '10px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        marginTop: '4px',
    },
    soundPanelRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '12px',
        color: '#ccc',
    },
    addonPanel: {
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
        marginTop: '4px',
    },
    addonTitle: {
        color: '#aaa',
        fontSize: '12px',
        marginBottom: '4px',
        textTransform: 'uppercase',
    },
    addonItem: {
        position: 'relative',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '6px',
        padding: '5px 6px',
        borderRadius: '5px',
        cursor: 'default',
    },
    addonShort: {
        fontSize: '12px',
        color: '#ccc',
        lineHeight: '1.4',
    },
    addonTooltip: {
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        marginTop: '4px',
        background: '#0f1a2e',
        border: '1px solid #2a3a4a',
        borderRadius: '6px',
        padding: '8px 10px',
        fontSize: '12px',
        color: '#aaa',
        lineHeight: '1.5',
        zIndex: 10,
        whiteSpace: 'normal',
    },
};
function FlyingActionCard({ from, to, addonId, label, snap = false, unsuitedXRank, onClick }) {
    const [arrived, setArrived] = useState(snap);
    useEffect(() => {
        if (snap)
            return;
        const raf = requestAnimationFrame(() => setArrived(true));
        return () => cancelAnimationFrame(raf);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps
    const atDest = arrived || snap;
    const isUnsuited = addonId === 'action-unsuited-jack' || addonId === 'action-unsuited-x';
    const unsuitedRank = addonId === 'action-unsuited-jack' ? 'J' : (unsuitedXRank ?? 'X');
    return createPortal(_jsx("div", { onClick: onClick, style: {
            position: 'fixed',
            left: atDest ? to.x : from.x,
            top: atDest ? to.y : from.y,
            width: CARD_W,
            height: CARD_H,
            transition: atDest && !snap ? 'left 2s ease, top 2s ease' : 'none',
            zIndex: 1000,
            pointerEvents: onClick ? 'auto' : 'none',
            cursor: onClick ? 'pointer' : 'default',
            borderRadius: 6,
            border: isUnsuited ? '2px solid #8B5A1A' : '2px solid #4a7a4a',
            background: isUnsuited ? '#B87333' : addonId === 'show-1-card-to-1-player' ? '#000' : addonId === 'action-reroll-common' ? '#fff' : '#1a2d1a',
            display: 'flex', flexDirection: 'column',
            padding: '6px 6px',
            userSelect: 'none',
        }, children: isUnsuited ? (_jsxs(_Fragment, { children: [_jsx("div", { style: { display: 'flex', flexDirection: 'column', lineHeight: 1, color: '#fff' }, children: _jsx("span", { style: { fontSize: 18, fontWeight: 'bold' }, children: unsuitedRank }) }), _jsx("div", { style: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, color: '#fff', fontWeight: 'bold' }, children: unsuitedRank })] })) : addonId === 'show-1-card-to-1-player' ? (_jsx("div", { style: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }, children: _jsxs("svg", { viewBox: "0 0 24 24", width: "36", height: "36", fill: "none", stroke: "#90c090", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("ellipse", { cx: "12", cy: "12", rx: "10", ry: "6" }), _jsx("circle", { cx: "12", cy: "12", r: "3" })] }) })) : addonId === 'action-reroll-common' ? (_jsx("div", { style: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }, children: _jsxs("svg", { viewBox: "0 0 24 24", width: "36", height: "36", fill: "none", stroke: "#333", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("polyline", { points: "23,4 23,10 17,10" }), _jsx("polyline", { points: "1,20 1,14 7,14" }), _jsx("path", { d: "M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" })] }) })) : (_jsx("div", { style: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#90c090', lineHeight: 1.4, textAlign: 'center' }, children: label })) }), document.body);
}
export default function App() {
    const { state, sendAction, lastError, status } = useWebSocket();
    const [volume, setVolume] = useState(0.5);
    const volumeRef = useRef(volume);
    volumeRef.current = volume;
    const [soundFiles, setSoundFiles] = useState(SOUND_DEFAULTS);
    const soundFilesRef = useRef(soundFiles);
    soundFilesRef.current = soundFiles;
    const [soundPanelOpen, setSoundPanelOpen] = useState(false);
    const [handHintVisible, setHandHintVisible] = useState(false);
    const [hoveredAddon, setHoveredAddon] = useState(null);
    const [hoveredAddonRow, setHoveredAddonRow] = useState(null);
    const [codeInput, setCodeInput] = useState('');
    const [codeFocused, setCodeFocused] = useState(false);
    const [codeCopied, setCodeCopied] = useState(false);
    const handHintRef = useRef(null);
    const [handHintPos, setHandHintPos] = useState(null);
    const [actionStep, setActionStep] = useState('idle');
    const [actionCardIndex, setActionCardIndex] = useState(null);
    const [activeAddonId, setActiveAddonId] = useState(null);
    const cardElsRef = useRef(new Map());
    const seatElsRef = useRef(new Map());
    const prevLockRef = useRef(undefined);
    const [flyingCard, setFlyingCard] = useState(null);
    const [returningAddonId, setReturningAddonId] = useState(null);
    const flyingCardRef = useRef(flyingCard);
    flyingCardRef.current = flyingCard;
    const returnTimerRef = useRef(null);
    useEffect(() => {
        if (!state || state.phase !== 'lobby' || codeFocused)
            return;
        setCodeInput(encodeSetup(state.addonPool, state.negativeAddonCount, state.positiveAddonCount));
    }, [state, codeFocused]);
    const prevStateRef = useRef(null);
    useEffect(() => {
        const prev = prevStateRef.current;
        prevStateRef.current = state;
        if (!state || !prev || state.phase !== 'game')
            return;
        const currentRound = state.currentRound;
        if (!currentRound)
            return;
        function chipLocs(s) {
            const m = new Map();
            for (const c of s.middleChips)
                m.set(`${c.round}-${c.number}`, 'middle');
            for (const p of s.players)
                for (const c of p.chips)
                    m.set(`${c.round}-${c.number}`, p.id);
            return m;
        }
        const prevLocs = chipLocs(prev);
        const currLocs = chipLocs(state);
        let anyMoved = false;
        let stolenFromMe = false;
        for (const [key, currLoc] of currLocs) {
            const prevLoc = prevLocs.get(key);
            if (prevLoc !== undefined && prevLoc !== currLoc) {
                anyMoved = true;
                if (state.myId && prevLoc === state.myId && currLoc !== 'middle') {
                    stolenFromMe = true;
                }
            }
        }
        const files = soundFilesRef.current;
        const vol = volumeRef.current;
        const gameJustStarted = state.phase === 'game' && state.gameId !== prev.gameId;
        if (gameJustStarted) {
            playSound(files.GAME_START, vol, SOUND_VOLUME_MULTIPLIER.GAME_START);
            // Also play prison sound if the starting round is a prison round
            if (state.prisonPlayerId) {
                playSound(files.PRISON_TAKEN_EFFECT, vol, SOUND_VOLUME_MULTIPLIER.PRISON_TAKEN_EFFECT);
            }
            return;
        }
        if (stolenFromMe)
            playSound(files.STEAL_FROM_YOU, vol, SOUND_VOLUME_MULTIPLIER.STEAL_FROM_YOU);
        else if (anyMoved)
            playSound(files.CHIP_MOVE, vol, SOUND_VOLUME_MULTIPLIER.CHIP_MOVE);
        if (state.communityCards.length > prev.communityCards.length) {
            playSound(files.CARD_FLIP, vol, SOUND_VOLUME_MULTIPLIER.CARD_FLIP);
        }
        const rerollJustHappened = !prev.rerollCommonUsed && state.rerollCommonUsed;
        if (rerollJustHappened) {
            // Two flips: first flip-down (~50ms after action), then flip-up (~1100ms after action)
            playSound(files.CARD_FLIP, vol, SOUND_VOLUME_MULTIPLIER.CARD_FLIP);
            setTimeout(() => playSound(files.CARD_FLIP, vol, SOUND_VOLUME_MULTIPLIER.CARD_FLIP), 1100);
        }
        const shownCardChanged = state.myShownCard !== prev.myShownCard;
        if (shownCardChanged) {
            playSound(files.CARD_FLIP, vol, SOUND_VOLUME_MULTIPLIER.CARD_FLIP);
        }
        const shownCardOutChanged = state.myShownCardOutIndex !== prev.myShownCardOutIndex;
        if (shownCardOutChanged) {
            playSound(files.CARD_FLIP, vol, SOUND_VOLUME_MULTIPLIER.CARD_FLIP);
        }
        const actionCardCommitted = (!prev.showCardUsed && state.showCardUsed) ||
            (!prev.unsuitedJackUsed && state.unsuitedJackUsed) ||
            (!prev.unsuitedXUsed && state.unsuitedXUsed) ||
            (!prev.rerollCommonUsed && state.rerollCommonUsed);
        if (actionCardCommitted) {
            playSound(files.ACTION_CARD_PLAYED, vol, SOUND_VOLUME_MULTIPLIER.ACTION_CARD_PLAYED);
        }
        // Prison sound: play when entering the prison round (prisonPlayerId becomes non-null)
        if (state.prisonPlayerId && !prev.prisonPlayerId) {
            playSound(files.PRISON_TAKEN_EFFECT, vol, SOUND_VOLUME_MULTIPLIER.PRISON_TAKEN_EFFECT);
        }
    }, [state]);
    useLayoutEffect(() => {
        if (!state)
            return;
        const prev = prevLockRef.current;
        const curr = state.actionCardLock;
        prevLockRef.current = curr;
        const isInitial = prev === undefined;
        // Helper: show card at player's seat immediately without animation
        const snapToSeat = (addonId, playerId) => {
            const seatEl = seatElsRef.current.get(playerId);
            if (seatEl) {
                const sr = seatEl.getBoundingClientRect();
                const addonDef = ADDONS.find(a => a.id === addonId);
                const pos = { x: sr.left + sr.width / 2 - CARD_W / 2, y: sr.top + sr.height / 2 - CARD_H / 2 };
                setFlyingCard({ from: pos, to: pos, addonId, label: addonDef?.short ?? addonId, snap: true });
            }
        };
        // Initial page load: if lock already set, show card at player without animation
        if (isInitial) {
            if (curr && curr.playerId !== state.myId)
                snapToSeat(curr.addonId, curr.playerId);
            return;
        }
        // Lock acquired — play sound
        if (!prev && curr) {
            playSound(soundFilesRef.current.ACTION_CARD_TAKEN, volumeRef.current, SOUND_VOLUME_MULTIPLIER.ACTION_CARD_TAKEN);
        }
        // Race condition guard: if another player won the lock while we were optimistically
        // in a workflow, silently reset our local workflow state (spec: "silently ignored").
        if (curr && curr.playerId !== state.myId && actionStep !== 'idle') {
            setActionStep('idle');
            setActionCardIndex(null);
            setActiveAddonId(null);
        }
        // Lock acquired by another player — animate card to their seat
        if (!prev && curr && curr.playerId !== state.myId) {
            if (returnTimerRef.current) {
                clearTimeout(returnTimerRef.current);
                returnTimerRef.current = null;
            }
            if (document.hidden) {
                // Tab was hidden — skip animation, snap to destination
                snapToSeat(curr.addonId, curr.playerId);
            }
            else {
                const cardEl = cardElsRef.current.get(curr.addonId);
                const seatEl = seatElsRef.current.get(curr.playerId);
                if (cardEl && seatEl) {
                    const cr = cardEl.getBoundingClientRect();
                    const sr = seatEl.getBoundingClientRect();
                    const addonDef = ADDONS.find(a => a.id === curr.addonId);
                    setFlyingCard({
                        from: { x: cr.left, y: cr.top },
                        to: { x: sr.left + sr.width / 2 - CARD_W / 2, y: sr.top + sr.height / 2 - CARD_H / 2 },
                        addonId: curr.addonId,
                        label: addonDef?.short ?? curr.addonId,
                    });
                }
            }
        }
        // Lock released
        if (prev && !curr) {
            const wasUsed = (prev.addonId === 'show-1-card-to-1-player' && state.showCardUsed)
                || (prev.addonId === 'action-unsuited-jack' && state.unsuitedJackUsed)
                || (prev.addonId === 'action-unsuited-x' && state.unsuitedXUsed)
                || (prev.addonId === 'action-reroll-common' && state.rerollCommonUsed);
            if (wasUsed) {
                setFlyingCard(null);
            }
            else {
                // Card was cancelled — animate back to the panel
                const current = flyingCardRef.current;
                const cardEl = cardElsRef.current.get(prev.addonId);
                if (current && cardEl) {
                    const cr = cardEl.getBoundingClientRect();
                    setFlyingCard({ from: current.to, to: { x: cr.left, y: cr.top }, addonId: current.addonId, label: current.label });
                    setReturningAddonId(prev.addonId);
                    returnTimerRef.current = setTimeout(() => { setFlyingCard(null); setReturningAddonId(null); returnTimerRef.current = null; }, 2100);
                }
                else {
                    setFlyingCard(null);
                }
            }
        }
    }, [state?.actionCardLock]); // eslint-disable-line react-hooks/exhaustive-deps
    // Snap in-progress outgoing animation to destination when tab becomes visible
    useEffect(() => {
        const onVisibility = () => {
            if (document.visibilityState === 'visible') {
                const fc = flyingCardRef.current;
                if (fc && returnTimerRef.current === null) {
                    setFlyingCard({ from: fc.to, to: fc.to, addonId: fc.addonId, label: fc.label, snap: true });
                }
            }
        };
        document.addEventListener('visibilitychange', onVisibility);
        return () => document.removeEventListener('visibilitychange', onVisibility);
    }, []);
    const handleReturnCardClick = () => {
        if (!flyingCard || !state)
            return;
        const lockedByOther = !!state.actionCardLock && state.actionCardLock.playerId !== state.myId;
        if (lockedByOther || actionStep !== 'idle')
            return;
        const addonId = flyingCard.addonId;
        if (returnTimerRef.current) {
            clearTimeout(returnTimerRef.current);
            returnTimerRef.current = null;
        }
        setFlyingCard(null);
        setReturningAddonId(null);
        sendAction({ type: 'LOCK_ACTION_CARD', addonId });
        setActiveAddonId(addonId);
        setActionStep('select-card');
        setActionCardIndex(null);
    };
    if (status === 'disconnected' && !state) {
        return (_jsx("div", { style: styles.container, children: _jsx("div", { style: styles.status, children: "Disconnected. Reconnecting..." }) }));
    }
    if (!state) {
        return (_jsx("div", { style: styles.container, children: _jsx("div", { style: styles.status, children: "Connecting..." }) }));
    }
    const isLobby = state.phase === 'lobby';
    const visibleAddons = isLobby ? ADDONS : ADDONS.filter(a => state.enabledAddons.includes(a.id));
    const negativeAddons = visibleAddons.filter(a => a.type === 'negative');
    const positiveAddons = visibleAddons.filter(a => a.type === 'positive');
    const currentCode = encodeSetup(state.addonPool, state.negativeAddonCount, state.positiveAddonCount);
    const adjustCount = (addonType, delta) => {
        const current = addonType === 'negative' ? state.negativeAddonCount : state.positiveAddonCount;
        sendAction({ type: 'SET_ADDON_COUNT', addonType, count: Math.max(0, current + delta) });
    };
    const applySetupCode = (code) => {
        setCodeInput(code);
        const decoded = decodeSetup(code);
        if (!decoded)
            return;
        for (const addon of ADDONS) {
            const shouldBeInPool = decoded.addonPool.includes(addon.id);
            const isInPool = state.addonPool.includes(addon.id);
            if (shouldBeInPool !== isInPool) {
                sendAction({ type: 'TOGGLE_ADDON', addonId: addon.id });
            }
        }
        if (decoded.negativeAddonCount !== state.negativeAddonCount) {
            sendAction({ type: 'SET_ADDON_COUNT', addonType: 'negative', count: decoded.negativeAddonCount });
        }
        if (decoded.positiveAddonCount !== state.positiveAddonCount) {
            sendAction({ type: 'SET_ADDON_COUNT', addonType: 'positive', count: decoded.positiveAddonCount });
        }
    };
    const renderAddon = (addon) => {
        const inPool = state.addonPool.includes(addon.id);
        const hovered = hoveredAddon === addon.id;
        const rowHovered = hoveredAddonRow === addon.id;
        return (_jsxs("div", { style: { ...styles.addonItem, ...(rowHovered ? { background: '#1e2d4a' } : {}) }, onMouseEnter: () => setHoveredAddonRow(addon.id), onMouseLeave: () => setHoveredAddonRow(null), children: [isLobby && (_jsx("input", { type: "checkbox", checked: inPool, onChange: () => sendAction({ type: 'TOGGLE_ADDON', addonId: addon.id }), style: { marginTop: '2px', flexShrink: 0, cursor: 'pointer' } })), _jsxs("div", { style: { position: 'relative', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }, children: [_jsx("span", { style: styles.addonShort, children: addon.short }), _jsx("span", { style: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 14, height: 14, borderRadius: '50%', border: '1px solid #555', color: '#888', fontSize: 10, cursor: 'default', userSelect: 'none', flexShrink: 0 }, onMouseEnter: () => setHoveredAddon(addon.id), onMouseLeave: () => setHoveredAddon(null), children: "?" }), hovered && _jsx("div", { style: styles.addonTooltip, onMouseEnter: () => setHoveredAddon(null), children: addon.long })] })] }, addon.id));
    };
    return (_jsxs("div", { style: styles.container, children: [_jsxs("div", { style: styles.leftPanel, children: [_jsxs("div", { style: styles.soundBarRow, children: [_jsx("span", { children: "Volume" }), _jsx("input", { type: "range", min: 0, max: 1, step: 0.01, value: volume, onChange: e => setVolume(parseFloat(e.target.value)), style: { width: 80 } }), _jsx("button", { onClick: () => setSoundPanelOpen(o => !o), style: { padding: '2px 8px', fontSize: 11, cursor: 'pointer', borderRadius: 4, border: '1px solid #444', background: '#2a3a4a', color: '#ccc' }, children: soundPanelOpen ? 'Close sounds' : 'Sounds' }), _jsxs("div", { ref: handHintRef, style: { display: 'inline-block' }, onMouseEnter: () => {
                                    const rect = handHintRef.current?.getBoundingClientRect();
                                    if (rect)
                                        setHandHintPos({ top: rect.bottom + 6, left: rect.left });
                                    setHandHintVisible(true);
                                }, onMouseLeave: () => setHandHintVisible(false), children: [_jsx("span", { style: { color: '#aaa', fontSize: 11, cursor: 'default', userSelect: 'none', textDecoration: 'underline dotted' }, children: "Hand Ranking" }), handHintVisible && handHintPos && createPortal(_jsx("img", { src: "/hand-ranking.png", alt: "Hand rankings", style: { position: 'fixed', top: handHintPos.top, left: handHintPos.left, maxWidth: 320, borderRadius: 6, boxShadow: '0 4px 16px rgba(0,0,0,0.6)', zIndex: 9999 } }), document.body)] })] }), soundPanelOpen && (_jsx("div", { style: styles.soundPanel, children: Object.keys(SOUND_DEFAULTS).map(key => (_jsxs("div", { style: styles.soundPanelRow, children: [_jsx("span", { style: { minWidth: 110 }, children: SOUND_LABELS[key] }), _jsx("select", { value: soundFiles[key], onChange: e => setSoundFiles(prev => ({ ...prev, [key]: e.target.value })), style: { background: '#1a2030', color: '#ccc', border: '1px solid #444', borderRadius: 4, fontSize: 11 }, children: AVAILABLE_MP3S.map(f => (_jsx("option", { value: f, children: f }, f))) })] }, key))) })), visibleAddons.length > 0 && (_jsxs("div", { style: styles.addonPanel, children: [_jsxs("div", { style: { ...styles.addonTitle, display: 'flex', alignItems: 'center', gap: 6 }, children: [_jsx("span", { children: "Addons" }), isLobby ? (_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 4 }, children: [_jsx("input", { value: codeInput, onChange: e => applySetupCode(e.target.value), onFocus: () => setCodeFocused(true), onBlur: () => { setCodeFocused(false); setCodeInput(currentCode); }, spellCheck: false, style: { width: 48, fontSize: 10, fontFamily: 'monospace', background: '#1a2030', color: '#aaa', border: '1px solid #444', borderRadius: 3, padding: '1px 4px' }, placeholder: "code" }), _jsxs("button", { onClick: () => navigator.clipboard.writeText(currentCode).then(() => { setCodeCopied(true); setTimeout(() => setCodeCopied(false), 2000); }).catch(() => { }), style: { padding: '1px 5px', fontSize: 10, cursor: 'pointer', borderRadius: 3, border: '1px solid #444', background: '#2a3a4a', color: '#aaa', position: 'relative' }, title: "Copy setup code", children: [_jsx("span", { style: { visibility: 'hidden' }, children: "Copy" }), _jsx("span", { style: { position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }, children: codeCopied ? '✓' : 'Copy' })] })] })) : (_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 4 }, children: [_jsx("span", { style: { fontFamily: 'monospace', fontSize: 10, color: '#aaa' }, children: currentCode }), _jsxs("button", { onClick: () => navigator.clipboard.writeText(currentCode).then(() => { setCodeCopied(true); setTimeout(() => setCodeCopied(false), 2000); }).catch(() => { }), style: { padding: '1px 5px', fontSize: 10, cursor: 'pointer', borderRadius: 3, border: '1px solid #444', background: '#2a3a4a', color: '#aaa', position: 'relative' }, title: "Copy setup code", children: [_jsx("span", { style: { visibility: 'hidden' }, children: "Copy" }), _jsx("span", { style: { position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }, children: codeCopied ? '✓' : 'Copy' })] })] }))] }), _jsxs("div", { style: { display: 'flex', flexDirection: 'row', gap: '8px', alignItems: 'flex-start' }, children: [negativeAddons.length > 0 && (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '2px', background: '#2d1515', borderRadius: 6, padding: '4px 6px', width: isLobby ? '14vw' : '10vw' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 10, color: '#a05050', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }, children: [_jsx("span", { children: "Negative" }), isLobby && (_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 3 }, children: [_jsx("button", { onClick: () => adjustCount('negative', -1), style: { width: 16, height: 16, padding: 0, fontSize: 12, lineHeight: 1, cursor: 'pointer', borderRadius: 3, border: '1px solid #7a3030', background: '#3d1a1a', color: '#a05050' }, children: "\u2212" }), _jsx("span", { style: { minWidth: 14, textAlign: 'center', color: '#ccc' }, children: state.negativeAddonCount }), _jsx("button", { onClick: () => adjustCount('negative', 1), style: { width: 16, height: 16, padding: 0, fontSize: 12, lineHeight: 1, cursor: 'pointer', borderRadius: 3, border: '1px solid #7a3030', background: '#3d1a1a', color: '#a05050' }, children: "+" })] }))] }), negativeAddons.map(renderAddon)] })), positiveAddons.length > 0 && (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '2px', background: '#152d15', borderRadius: 6, padding: '4px 6px', width: isLobby ? '14vw' : '10vw' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 10, color: '#50a050', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }, children: [_jsx("span", { children: "Positive" }), isLobby && (_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 3 }, children: [_jsx("button", { onClick: () => adjustCount('positive', -1), style: { width: 16, height: 16, padding: 0, fontSize: 12, lineHeight: 1, cursor: 'pointer', borderRadius: 3, border: '1px solid #307a30', background: '#1a3d1a', color: '#50a050' }, children: "\u2212" }), _jsx("span", { style: { minWidth: 14, textAlign: 'center', color: '#ccc' }, children: state.positiveAddonCount }), _jsx("button", { onClick: () => adjustCount('positive', 1), style: { width: 16, height: 16, padding: 0, fontSize: 12, lineHeight: 1, cursor: 'pointer', borderRadius: 3, border: '1px solid #307a30', background: '#1a3d1a', color: '#50a050' }, children: "+" })] }))] }), positiveAddons.map(renderAddon)] }))] })] }))] }), _jsxs("div", { style: styles.topRightButtons, children: [_jsx("button", { style: { ...styles.restartButton, ...(state.myRestartVote ? { background: '#555', borderColor: '#444', color: '#aaa' } : {}) }, onClick: () => sendAction({ type: 'TOGGLE_RESTART_VOTE' }), children: state.myRestartVote ? `Waiting (${state.restartVotes}/${state.players.length})` : `Restart (${state.restartVotes}/${state.players.length})` }), _jsx("button", { style: styles.stopButton, onClick: () => sendAction({ type: 'FINISH_GAME' }), children: "Stop the game" })] }), lastError && _jsx("div", { style: styles.error, children: lastError }), state.phase === 'lobby' && _jsx(Lobby, { state: state, sendAction: sendAction }), state.phase === 'game' && (_jsx(Game, { state: state, sendAction: sendAction, actionInProgress: actionStep !== 'idle', onCardSelect: actionStep === 'select-card' && activeAddonId !== 'action-reroll-common' ? (idx) => {
                    if (activeAddonId === 'action-unsuited-jack') {
                        sendAction({ type: 'USE_UNSUITED_JACK', cardIndex: idx });
                        setActionStep('idle');
                        setActiveAddonId(null);
                    }
                    else if (activeAddonId === 'action-unsuited-x') {
                        sendAction({ type: 'USE_UNSUITED_X', cardIndex: idx });
                        setActionStep('idle');
                        setActiveAddonId(null);
                    }
                    else {
                        setActionCardIndex(idx);
                        setActionStep('select-player');
                    }
                } : undefined, onPlayerSelect: actionStep === 'select-player' && actionCardIndex !== null ? (playerId) => { sendAction({ type: 'USE_SHOW_CARD', targetPlayerId: playerId, cardIndex: actionCardIndex }); setActionStep('idle'); setActionCardIndex(null); setActiveAddonId(null); } : undefined, onCommonCardClick: actionStep === 'select-card' && activeAddonId === 'action-reroll-common' ? (idx) => { sendAction({ type: 'USE_REROLL_COMMON', cardIndex: idx }); setActionStep('idle'); setActiveAddonId(null); } : undefined, onSeatElRef: (id, el) => { if (el)
                    seatElsRef.current.set(id, el);
                else
                    seatElsRef.current.delete(id); } })), state.phase === 'finished' && _jsx(Game, { state: state, sendAction: sendAction, readOnly: true }), state.phase === 'game' && (_jsx(ActionCardPanel, { state: state, step: actionStep, activeAddonId: activeAddonId, returningAddonId: returningAddonId, onStart: (addonId) => { sendAction({ type: 'LOCK_ACTION_CARD', addonId }); setActiveAddonId(addonId); setActionStep('select-card'); setActionCardIndex(null); }, onCancel: () => { if (activeAddonId)
                    sendAction({ type: 'UNLOCK_ACTION_CARD', addonId: activeAddonId }); setActionStep('idle'); setActionCardIndex(null); setActiveAddonId(null); }, onCardElRef: (addonId, el) => { if (el)
                    cardElsRef.current.set(addonId, el);
                else
                    cardElsRef.current.delete(addonId); } })), flyingCard && _jsx(FlyingActionCard, { from: flyingCard.from, to: flyingCard.to, addonId: flyingCard.addonId, label: flyingCard.label, snap: flyingCard.snap, unsuitedXRank: state?.unsuitedXRank, onClick: returningAddonId === flyingCard.addonId ? handleReturnCardClick : undefined })] }));
}
