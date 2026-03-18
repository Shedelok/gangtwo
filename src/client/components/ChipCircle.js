import { jsx as _jsx } from "react/jsx-runtime";
import { useContext, useCallback } from 'react';
import { ChipAnimContext } from './ChipAnimContext';
const COLORS = {
    1: { bg: '#e8e8e8', border: '#aaa' },
    2: { bg: '#f5e642', border: '#c9b800' },
    3: { bg: '#f5a623', border: '#c47d00' },
    4: { bg: '#e74c3c', border: '#a93226' },
};
function starPositions(count, size) {
    const cx = size / 2;
    const cy = size / 2;
    if (count === 1) {
        return [{ x: cx, y: cy }];
    }
    if (count === 2) {
        const gap = size * 0.28;
        return [{ x: cx - gap, y: cy }, { x: cx + gap, y: cy }];
    }
    const r = size * 0.28;
    if (count === 4) {
        const d = r * Math.SQRT1_2;
        return [
            { x: cx - d, y: cy - d },
            { x: cx + d, y: cy - d },
            { x: cx - d, y: cy + d },
            { x: cx + d, y: cy + d },
        ];
    }
    return Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * 2 * Math.PI - Math.PI / 2;
        return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
    });
}
function starPolygonPoints(cx, cy, outerR) {
    const innerR = outerR * 0.382;
    return Array.from({ length: 10 }, (_, i) => {
        const angle = (i * Math.PI / 5) - Math.PI / 2;
        const r = i % 2 === 0 ? outerR : innerR;
        return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
    }).join(' ');
}
function Stars({ count, size, fill }) {
    if (count === 0)
        return null;
    const outerR = size * 0.13;
    const positions = starPositions(count, size);
    return (_jsx("svg", { width: size, height: size, style: { position: 'absolute', top: -2, left: -2, pointerEvents: 'none' }, children: positions.map(({ x, y }, i) => (_jsx("polygon", { points: starPolygonPoints(x, y, outerR), fill: fill }, i))) }));
}
export default function ChipCircle({ chip, dim = false, size = 32, blackInside = false }) {
    const { register, hiding } = useContext(ChipAnimContext);
    const key = `${chip.round}-${chip.number}`;
    const ref = useCallback((el) => {
        register(key, el);
    }, [register, key]);
    const c = dim ? { bg: '#333', border: '#555' } : COLORS[chip.round];
    const bg = blackInside ? '#000' : c.bg;
    const starFill = blackInside ? 'white' : 'black';
    return (_jsx("div", { ref: ref, style: {
            width: size,
            height: size,
            borderRadius: '50%',
            background: bg,
            border: `2px solid ${c.border}`,
            position: 'relative',
            userSelect: 'none',
            flexShrink: 0,
            opacity: hiding.has(key) ? 0 : 1,
        }, children: _jsx(Stars, { count: chip.number, size: size, fill: starFill }) }));
}
