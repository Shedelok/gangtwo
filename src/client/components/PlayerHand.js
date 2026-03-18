import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import './PlayerHand.css';
const SUIT_SYMBOLS = {
    spades: '♠',
    hearts: '♥',
    diamonds: '♦',
    clubs: '♣',
};
const RED_SUITS = new Set(['hearts', 'diamonds']);
function PlayingCard({ card, small, blackAndRed }) {
    const isRed = RED_SUITS.has(card.suit);
    const suitBg = isRed ? '#c0392b' : '#1a1a2e';
    const background = blackAndRed ? suitBg : 'white';
    const color = blackAndRed ? 'white' : (isRed ? '#c0392b' : '#1a1a2e');
    const symbol = SUIT_SYMBOLS[card.suit];
    const w = small ? 52 : 80;
    const h = small ? 78 : 120;
    return (_jsxs("div", { style: {
            width: w, height: h,
            background,
            borderRadius: small ? 5 : 8,
            display: 'flex',
            flexDirection: 'column',
            padding: small ? 4 : 8,
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
            userSelect: 'none',
            flexShrink: 0,
        }, children: [_jsxs("div", { style: { display: 'flex', flexDirection: 'column', lineHeight: 1, color }, children: [_jsx("span", { style: { fontSize: small ? 12 : 18, fontWeight: 'bold' }, children: card.rank }), _jsx("span", { style: { fontSize: small ? 10 : 14 }, children: symbol })] }), _jsx("div", { style: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: small ? 20 : 32, color }, children: symbol })] }));
}
function UnsuitedCard({ small, rank }) {
    const w = small ? 52 : 80;
    const h = small ? 78 : 120;
    return (_jsxs("div", { style: {
            width: w, height: h,
            background: '#B87333',
            borderRadius: small ? 5 : 8,
            display: 'flex',
            flexDirection: 'column',
            padding: small ? 4 : 8,
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
            userSelect: 'none',
            flexShrink: 0,
        }, children: [_jsx("div", { style: { display: 'flex', flexDirection: 'column', lineHeight: 1, color: '#fff' }, children: _jsx("span", { style: { fontSize: small ? 12 : 18, fontWeight: 'bold' }, children: rank }) }), _jsx("div", { style: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: small ? 20 : 32, color: '#fff', fontWeight: 'bold' }, children: rank })] }));
}
function CardBack({ small }) {
    const w = small ? 52 : 80;
    const h = small ? 78 : 120;
    return (_jsx("div", { style: {
            width: w, height: h,
            background: '#1a3a6e',
            borderRadius: small ? 5 : 8,
            border: '2px solid #2255aa',
            boxSizing: 'border-box',
            boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
        }, children: _jsx("div", { style: {
                width: '80%', height: '80%',
                borderRadius: 3,
                border: '2px solid #3366cc',
                boxSizing: 'border-box',
                background: 'repeating-linear-gradient(45deg, #1a3a6e 0px, #1a3a6e 4px, #1e42a0 4px, #1e42a0 8px)',
            } }) }));
}
export default function PlayerHand({ cards, faceDown = false, small = false, blackAndRed = false, onCardClick, unsuitedJackIndex, unsuitedXIndex, unsuitedXRank, shownCardInfo, striped = false }) {
    const gap = small ? 6 : 12;
    // If neither card is special and we have no card data, show placeholder
    if (!cards && unsuitedJackIndex === undefined && unsuitedXIndex === undefined && !faceDown && !shownCardInfo) {
        return (_jsx("div", { style: { display: 'flex', gap, justifyContent: 'center' }, children: _jsx("div", { style: { color: '#555', fontSize: 12 }, children: "\u2014" }) }));
    }
    const w = small ? 52 : 80;
    const h = small ? 78 : 120;
    return (_jsx("div", { style: { display: 'flex', gap, justifyContent: 'center' }, children: [0, 1].map(idx => {
            const isJack = unsuitedJackIndex === idx;
            const isX = unsuitedXIndex === idx;
            const glowing = !!onCardClick;
            const isShown = shownCardInfo?.idx === idx;
            if (isShown && shownCardInfo) {
                const card = shownCardInfo.card;
                const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
                const suitColor = isRed ? '#c0392b' : '#1a1a2e';
                const symbol = SUIT_SYMBOLS[card.suit];
                return (_jsx("div", { className: "ph-flip-container", style: { width: w, height: h }, children: _jsxs("div", { className: `ph-flipper ${shownCardInfo.faceUp ? 'face-up' : 'face-down'}`, children: [_jsx("div", { className: "ph-face ph-back" }), _jsxs("div", { className: "ph-face ph-front", style: { color: suitColor }, children: [_jsxs("div", { style: { display: 'flex', flexDirection: 'column', lineHeight: 1 }, children: [_jsx("span", { style: { fontSize: small ? 12 : 18, fontWeight: 'bold' }, children: card.rank }), _jsx("span", { style: { fontSize: small ? 10 : 14 }, children: symbol })] }), _jsx("div", { style: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: small ? 20 : 32 }, children: symbol })] })] }) }, idx));
            }
            return (_jsxs("div", { onClick: onCardClick ? () => onCardClick(idx) : undefined, style: {
                    cursor: glowing ? 'pointer' : 'default',
                    borderRadius: small ? 5 : 8,
                    boxShadow: glowing ? '0 0 8px 3px rgba(250,204,21,0.75)' : undefined,
                    position: 'relative',
                }, children: [isJack
                        ? _jsx(UnsuitedCard, { small: small, rank: "J" })
                        : isX
                            ? _jsx(UnsuitedCard, { small: small, rank: unsuitedXRank ?? 'X' })
                            : (faceDown || !cards)
                                ? _jsx(CardBack, { small: small })
                                : _jsx(PlayingCard, { card: cards[idx], small: small, blackAndRed: blackAndRed }), striped && (_jsx("div", { style: {
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            borderRadius: small ? 5 : 8,
                            background: 'repeating-linear-gradient(135deg, transparent 0px, transparent 8px, rgba(59,59,59,0.8) 8px, rgba(59,59,59,0.8) 18px)',
                            pointerEvents: 'none',
                        } }))] }, idx));
        }) }));
}
