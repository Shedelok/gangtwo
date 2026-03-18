import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { NEGATIVE_ADDON_TREE, POSITIVE_ADDON_TREE, countAvailableInTree } from '@shared/addons';
const s = {
    container: {
        width: '100%',
        maxWidth: '480px',
    },
    title: {
        fontSize: '36px',
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: '8px',
        color: '#f0c040',
        letterSpacing: '2px',
    },
    subtitle: {
        textAlign: 'center',
        color: '#888',
        marginBottom: '32px',
    },
    card: {
        background: '#16213e',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '20px',
    },
    label: {
        display: 'block',
        marginBottom: '8px',
        color: '#aaa',
        fontSize: '14px',
    },
    input: {
        width: '100%',
        padding: '10px 14px',
        borderRadius: '8px',
        border: '1px solid #333',
        background: '#0f3460',
        color: 'white',
        fontSize: '16px',
        marginBottom: '12px',
        outline: 'none',
    },
    button: {
        width: '100%',
        padding: '12px',
        borderRadius: '8px',
        border: 'none',
        background: '#2980b9',
        color: 'white',
        fontSize: '16px',
        fontWeight: 'bold',
        cursor: 'pointer',
    },
    startButton: {
        width: '100%',
        padding: '12px',
        borderRadius: '8px',
        border: 'none',
        background: '#27ae60',
        color: 'white',
        fontSize: '16px',
        fontWeight: 'bold',
        cursor: 'pointer',
        marginTop: '8px',
    },
    disabledButton: {
        opacity: 0.5,
        cursor: 'not-allowed',
        background: '#888',
    },
    playerList: {
        listStyle: 'none',
    },
    playerItem: {
        padding: '8px 12px',
        borderRadius: '6px',
        background: '#0f3460',
        marginBottom: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
    },
    dot: {
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        background: '#2ecc71',
        display: 'inline-block',
    },
    hint: {
        color: '#666',
        fontSize: '13px',
        textAlign: 'center',
        marginTop: '8px',
    },
};
const LAST_NAME_KEY = 'gang_last_name';
export default function Lobby({ state, sendAction }) {
    const [nameInput, setNameInput] = useState(() => localStorage.getItem(LAST_NAME_KEY) ?? '');
    const hasJoined = state.myId !== '';
    const addonPoolSet = new Set(state.addonPool);
    const negativePoolCount = countAvailableInTree(NEGATIVE_ADDON_TREE, addonPoolSet);
    const positivePoolCount = countAvailableInTree(POSITIVE_ADDON_TREE, addonPoolSet);
    const canStart = state.players.length >= 2 &&
        state.negativeAddonCount <= negativePoolCount &&
        state.positiveAddonCount <= positivePoolCount;
    function handleJoin(e) {
        e.preventDefault();
        if (nameInput.trim()) {
            localStorage.setItem(LAST_NAME_KEY, nameInput.trim());
            sendAction({ type: 'JOIN_LOBBY', name: nameInput.trim() });
        }
    }
    return (_jsxs("div", { style: s.container, children: [_jsx("div", { style: s.title, children: "GANG GAME" }), _jsx("div", { style: s.subtitle, children: "A multiplayer card game" }), !hasJoined ? (_jsx("div", { style: s.card, children: _jsxs("form", { onSubmit: handleJoin, children: [_jsx("label", { style: s.label, children: "Enter your display name" }), _jsx("input", { style: s.input, type: "text", value: nameInput, onChange: (e) => setNameInput(e.target.value), placeholder: "Your name...", maxLength: 20, autoFocus: true }), _jsxs("button", { style: s.button, type: "submit", disabled: !nameInput.trim(), children: ["Join Lobby (", state.players.length, " ", state.players.length === 1 ? 'player' : 'players', ")"] })] }) })) : (_jsxs("div", { style: s.card, children: [_jsxs("label", { style: s.label, children: ["Players in lobby (", state.players.length, ")"] }), _jsx("ul", { style: s.playerList, children: state.players.map((p) => (_jsxs("li", { style: { ...s.playerItem, justifyContent: 'space-between' }, children: [_jsxs("span", { style: { display: 'flex', alignItems: 'center', gap: '8px' }, children: [_jsx("span", { style: s.dot }), p.name, p.id === state.myId && ' (you)'] }), _jsx("span", { style: { visibility: state.startGameVoterIds.includes(p.id) ? 'visible' : 'hidden', color: '#2ecc71', fontSize: 16, minWidth: 20, textAlign: 'right' }, children: "\u2713" })] }, p.id))) }), _jsx("button", { style: {
                            ...s.startButton,
                            ...(!canStart ? s.disabledButton : state.myStartGameVote ? { background: '#555', color: '#aaa' } : {}),
                        }, onClick: () => canStart && sendAction({ type: 'START_GAME' }), disabled: !canStart, children: state.myStartGameVote ? `Waiting (${state.startGameVotes}/${state.players.length})` : `Start Game (${state.startGameVotes}/${state.players.length})` }), !canStart && (_jsx("div", { style: s.hint, children: state.players.length < 2
                            ? 'Need at least 2 players to start'
                            : 'Too many addons requested for the selected pool' }))] }))] }));
}
