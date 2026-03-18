import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
// Round-specific chip colors: white, yellow, orange, red
const ROUND_COLORS = {
    1: { bg: '#e8e8e8', border: '#bbb', text: '#222', bgDim: '#2a2a2a', borderDim: '#555' },
    2: { bg: '#f5e642', border: '#c9b800', text: '#333', bgDim: '#2a2a2a', borderDim: '#555' },
    3: { bg: '#f5a623', border: '#c47d00', text: '#222', bgDim: '#2a2a2a', borderDim: '#555' },
    4: { bg: '#e74c3c', border: '#a93226', text: '#fff', bgDim: '#2a2a2a', borderDim: '#555' },
};
const s = {
    section: {
        marginBottom: '20px',
    },
    sectionLabel: {
        color: '#888',
        fontSize: '13px',
        marginBottom: '8px',
        textTransform: 'uppercase',
        letterSpacing: '1px',
    },
    chipRow: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        alignItems: 'center',
    },
    chip: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 10px',
        borderRadius: '20px',
        fontSize: '13px',
        fontWeight: 'bold',
        border: '2px solid',
        userSelect: 'none',
    },
    actionButton: {
        padding: '3px 10px',
        borderRadius: '12px',
        border: 'none',
        cursor: 'pointer',
        fontSize: '12px',
        fontWeight: 'bold',
    },
    takeButton: {
        background: '#27ae60',
        color: 'white',
    },
    discardButton: {
        background: '#c0392b',
        color: 'white',
    },
    stealButton: {
        background: '#8e44ad',
        color: 'white',
    },
    playerRow: {
        marginBottom: '10px',
        padding: '10px 12px',
        background: '#16213e',
        borderRadius: '8px',
    },
    playerName: {
        fontSize: '13px',
        color: '#aaa',
        marginBottom: '6px',
    },
    readyRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginTop: '8px',
    },
    readyLabel: {
        fontSize: '13px',
        color: '#aaa',
    },
    checkboxContainer: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
    },
    readyDot: {
        width: '10px',
        height: '10px',
        borderRadius: '50%',
        display: 'inline-block',
    },
};
const ROUND_NAMES = { 1: 'White', 2: 'Yellow', 3: 'Orange', 4: 'Red' };
function chipLabel(chip) {
    return `${ROUND_NAMES[chip.round]} #${chip.number}`;
}
function chipActiveStyle(round) {
    const c = ROUND_COLORS[round];
    return { background: c.bg, borderColor: c.border, color: c.text };
}
function chipDimStyle(round) {
    const c = ROUND_COLORS[round];
    return { background: c.bgDim, borderColor: c.borderDim, color: '#666' };
}
export default function ChipTable({ state, sendAction, readOnly = false }) {
    const currentRound = state.currentRound;
    const myPlayer = state.players.find((p) => p.id === state.myId);
    const iHaveCurrentRoundChip = myPlayer?.chips.some((c) => c.round === currentRound) ?? false;
    // Split middle chips by round
    const middleCurrentChips = state.middleChips.filter((c) => c.round === currentRound);
    return (_jsxs("div", { children: [_jsxs("div", { style: s.section, children: [_jsxs("div", { style: s.sectionLabel, children: ["Middle (Round ", currentRound, ")"] }), _jsx("div", { style: s.chipRow, children: middleCurrentChips.length === 0 ? (_jsx("span", { style: { color: '#555', fontSize: '13px' }, children: "Empty" })) : (middleCurrentChips.map((chip) => (_jsxs("span", { style: { ...s.chip, ...chipActiveStyle(chip.round) }, children: [chipLabel(chip), !readOnly && !iHaveCurrentRoundChip && (_jsx("button", { style: { ...s.actionButton, ...s.takeButton }, onClick: () => sendAction({ type: 'TAKE_FROM_MIDDLE', chipNumber: chip.number }), children: "Take" }))] }, chip.number)))) })] }), _jsxs("div", { style: s.section, children: [_jsx("div", { style: s.sectionLabel, children: "Players" }), state.players.map((player) => {
                        const isMe = player.id === state.myId;
                        const currentChips = player.chips.filter((c) => c.round === currentRound);
                        const oldChips = player.chips.filter((c) => c.round !== currentRound);
                        return (_jsxs("div", { style: s.playerRow, children: [_jsxs("div", { style: s.playerName, children: [player.name, " ", isMe ? '(you)' : ''] }), _jsxs("div", { style: s.chipRow, children: [currentChips.map((chip) => (_jsxs("span", { style: { ...s.chip, ...chipActiveStyle(chip.round) }, children: [chipLabel(chip), !readOnly && isMe && (_jsx("button", { style: { ...s.actionButton, ...s.discardButton }, onClick: () => sendAction({ type: 'DISCARD_CHIP', chipNumber: chip.number }), children: "Discard" })), !readOnly && !isMe && !iHaveCurrentRoundChip && (_jsx("button", { style: { ...s.actionButton, ...s.stealButton }, onClick: () => sendAction({
                                                        type: 'STEAL_CHIP',
                                                        fromPlayerId: player.id,
                                                        chipNumber: chip.number,
                                                    }), children: "Steal" }))] }, `${chip.round}-${chip.number}`))), oldChips.map((chip) => (_jsx("span", { style: { ...s.chip, ...chipDimStyle(chip.round) }, children: chipLabel(chip) }, `${chip.round}-${chip.number}`))), player.chips.length === 0 && (_jsx("span", { style: { color: '#555', fontSize: '13px' }, children: "No chips" }))] }), _jsx("div", { style: s.readyRow, children: isMe && !readOnly ? (_jsxs("label", { style: s.checkboxContainer, children: [_jsx("input", { type: "checkbox", checked: player.readyForNextRound, onChange: (e) => sendAction({ type: 'SET_READY', ready: e.target.checked }) }), _jsx("span", { style: s.readyLabel, children: "Move to next round" })] })) : (_jsxs(_Fragment, { children: [_jsx("span", { style: {
                                                    ...s.readyDot,
                                                    background: player.readyForNextRound ? '#2ecc71' : '#555',
                                                } }), _jsx("span", { style: s.readyLabel, children: player.readyForNextRound ? 'Ready' : 'Not ready' })] })) })] }, player.id));
                    })] })] }));
}
