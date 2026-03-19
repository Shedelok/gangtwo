import React, { useContext, useCallback } from 'react';
import type { Chip } from '@shared/types';
import { ChipAnimContext } from './ChipAnimContext';

const COLORS: Record<number, { bg: string; border: string }> = {
  1: { bg: '#e8e8e8', border: '#aaa' },
  2: { bg: '#f5e642', border: '#c9b800' },
  3: { bg: '#f5a623', border: '#c47d00' },
  4: { bg: '#e74c3c', border: '#a93226' },
};

function starPositions(count: number, size: number): { x: number; y: number }[] {
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

function starPolygonPoints(cx: number, cy: number, outerR: number): string {
  const innerR = outerR * 0.382;
  return Array.from({ length: 10 }, (_, i) => {
    const angle = (i * Math.PI / 5) - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
  }).join(' ');
}

function Stars({ count, size, fill }: { count: number; size: number; fill: string }) {
  if (count === 0) return null;
  const outerR = size * 0.13;
  const positions = starPositions(count, size);
  return (
    <svg width={size} height={size} style={{ position: 'absolute', top: -2, left: -2, pointerEvents: 'none' }}>
      {positions.map(({ x, y }, i) => (
        <polygon
          key={i}
          points={starPolygonPoints(x, y, outerR)}
          fill={fill}
        />
      ))}
    </svg>
  );
}

interface Props {
  chip: Chip;
  dim?: boolean;
  size?: number;
  blackInside?: boolean;
  guessTarget?: boolean;
}

export default function ChipCircle({ chip, dim = false, size = 32, blackInside = false, guessTarget = false }: Props) {
  const { register, hiding } = useContext(ChipAnimContext);
  const key = `${chip.round}-${chip.number}`;

  const ref = useCallback((el: HTMLDivElement | null) => {
    register(key, el);
  }, [register, key]);

  const c = dim ? { bg: '#333', border: '#555' } : COLORS[chip.round];
  const bg = blackInside ? '#000' : c.bg;
  const starFill = blackInside ? 'white' : 'black';

  return (
    <div ref={ref} style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: bg,
      border: `2px solid ${c.border}`,
      position: 'relative',
      userSelect: 'none',
      flexShrink: 0,
      opacity: hiding.has(key) ? 0 : 1,
    }}>
      {/* Question mark watermark for red chips targeted by guess addons — rendered behind stars */}
      {guessTarget && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: size - 4, // subtract border (2px each side)
          height: size - 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
          overflow: 'hidden',
        }}>
          <span style={{
            color: 'white',
            opacity: 0.20,
            fontSize: size * 0.9 * 0.85, // 90% of chip bg height, scaled down slightly to account for font metrics
            lineHeight: 1,
            fontWeight: 'bold',
            userSelect: 'none',
            // Shift up slightly to compensate for the question mark's dot making the visual center
            // lower than the geometric center of the bounding box. The dot + curve together form the
            // glyph; the visual center (geometric center of all pixels) sits a bit above the
            // typographic center. A small upward nudge (~5% of font size) corrects this.
            marginTop: `-${size * 0.9 * 0.85 * 0.06}px`,
          }}>?</span>
        </div>
      )}
      <Stars count={chip.number} size={size} fill={starFill} />
    </div>
  );
}
