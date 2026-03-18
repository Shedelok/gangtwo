import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { ADDONS } from '@shared/addons';
export const CARD_W = 80;
export const CARD_H = 110;
function isAddonAvailable(addonId, state) {
    if (state.phase !== 'game')
        return false;
    // Imprisoned players cannot use any action cards
    if (state.prisonPlayerId === state.myId)
        return false;
    if (addonId === 'show-1-card-to-1-player')
        return !state.showCardUsed && !!state.myHoleCards;
    if (addonId === 'action-unsuited-jack')
        return !state.unsuitedJackUsed && !!state.myHoleCards;
    if (addonId === 'action-unsuited-x')
        return !state.unsuitedXUsed && !!state.myHoleCards;
    if (addonId === 'action-reroll-common')
        return !state.rerollCommonUsed && state.communityCards.length > 0;
    return false;
}
function isAddonUsed(addonId, state) {
    if (addonId === 'show-1-card-to-1-player')
        return state.showCardUsed;
    if (addonId === 'action-unsuited-jack')
        return state.unsuitedJackUsed;
    if (addonId === 'action-unsuited-x')
        return state.unsuitedXUsed;
    if (addonId === 'action-reroll-common')
        return state.rerollCommonUsed;
    return false;
}
const UNSUITED_RANK_ORDER = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2'];
function getUnsuitedSortKey(addonId, state) {
    if (addonId === 'action-unsuited-jack')
        return UNSUITED_RANK_ORDER.indexOf('J');
    if (addonId === 'action-unsuited-x') {
        const rank = state.unsuitedXRank ?? null;
        return rank !== null ? UNSUITED_RANK_ORDER.indexOf(rank) : null;
    }
    return null;
}
export default function ActionCardPanel({ state, step, activeAddonId, returningAddonId, onStart, onCancel, onCardElRef }) {
    const actionAddons = ADDONS.filter(a => a.hasAction && state.enabledAddons.includes(a.id) && !isAddonUsed(a.id, state)).sort((a, b) => {
        const aKey = getUnsuitedSortKey(a.id, state);
        const bKey = getUnsuitedSortKey(b.id, state);
        if (aKey !== null && bKey !== null)
            return aKey - bKey;
        return 0;
    });
    if (actionAddons.length === 0)
        return null;
    const lockedByOther = !!state.actionCardLock && state.actionCardLock.playerId !== state.myId;
    const iAmUsingACard = step !== 'idle';
    const iAmImprisoned = state.prisonPlayerId === state.myId;
    const handleCardClick = (addonId) => {
        if (lockedByOther)
            return;
        if (iAmUsingACard && activeAddonId === addonId) {
            onCancel();
            return;
        }
        if (iAmUsingACard)
            return; // can't start another card while already using one
        if (!isAddonAvailable(addonId, state))
            return;
        onStart(addonId);
    };
    return (_jsx("div", { style: {
            position: 'fixed', right: 16, top: 60,
            display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start',
        }, children: _jsxs("div", { style: {
                background: '#1a2030', border: '1px solid #2a3a4a', borderRadius: 8,
                padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 6,
                minWidth: CARD_W + 20,
            }, children: [_jsx("div", { style: { fontSize: 10, color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }, children: "Actions" }), actionAddons.map(addon => {
                    const active = step !== 'idle' && activeAddonId === addon.id;
                    const locked = (lockedByOther && state.actionCardLock?.addonId === addon.id) || returningAddonId === addon.id;
                    const dimmed = iAmImprisoned || (lockedByOther && !locked) || (iAmUsingACard && !active);
                    return (_jsxs("div", { ref: el => onCardElRef(addon.id, el), onClick: () => handleCardClick(addon.id), style: {
                            width: CARD_W, height: CARD_H,
                            borderRadius: 6,
                            border: active
                                ? '2px solid #f87171'
                                : (addon.id === 'action-unsuited-jack' || addon.id === 'action-unsuited-x') ? '2px solid #8B5A1A' : '2px solid #4a7a4a',
                            background: active
                                ? '#3d1515'
                                : (addon.id === 'action-unsuited-jack' || addon.id === 'action-unsuited-x') ? '#B87333' : addon.id === 'show-1-card-to-1-player' ? '#000' : addon.id === 'action-reroll-common' ? '#fff' : '#1a2d1a',
                            display: 'flex', flexDirection: 'column',
                            padding: '6px 6px', cursor: (locked || dimmed) ? 'default' : 'pointer',
                            userSelect: 'none',
                            visibility: locked ? 'hidden' : 'visible',
                            opacity: dimmed ? 0.4 : 1,
                            position: 'relative',
                        }, children: [!active && (addon.id === 'action-unsuited-jack' || addon.id === 'action-unsuited-x') && (() => {
                                const rank = addon.id === 'action-unsuited-jack' ? 'J' : (state.unsuitedXRank ?? 'X');
                                return (_jsxs(_Fragment, { children: [_jsx("div", { style: { display: 'flex', flexDirection: 'column', lineHeight: 1, color: '#fff' }, children: _jsx("span", { style: { fontSize: 18, fontWeight: 'bold' }, children: rank }) }), _jsx("div", { style: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, color: '#fff', fontWeight: 'bold' }, children: rank })] }));
                            })(), !active && addon.id === 'show-1-card-to-1-player' && (_jsx("div", { style: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }, children: _jsxs("svg", { viewBox: "0 0 24 24", width: "36", height: "36", fill: "none", stroke: "#90c090", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("ellipse", { cx: "12", cy: "12", rx: "10", ry: "6" }), _jsx("circle", { cx: "12", cy: "12", r: "3" })] }) })), !active && addon.id === 'action-reroll-common' && (_jsx("div", { style: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }, children: _jsxs("svg", { viewBox: "0 0 24 24", width: "36", height: "36", fill: "none", stroke: "#333", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("polyline", { points: "23,4 23,10 17,10" }), _jsx("polyline", { points: "1,20 1,14 7,14" }), _jsx("path", { d: "M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" })] }) })), !active && addon.id !== 'action-unsuited-jack' && addon.id !== 'action-unsuited-x' && addon.id !== 'show-1-card-to-1-player' && addon.id !== 'action-reroll-common' && (_jsx("div", { style: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#90c090', lineHeight: 1.4, textAlign: 'center' }, children: addon.short })), active && (_jsx("div", { style: {
                                    position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    borderRadius: 6, pointerEvents: 'none',
                                }, children: _jsx("span", { style: { fontSize: 36, color: '#ef4444', lineHeight: 1, fontWeight: 'bold', textShadow: '0 0 6px rgba(239,68,68,0.6)' }, children: "\u2715" }) }))] }, addon.id));
                })] }) }));
}
