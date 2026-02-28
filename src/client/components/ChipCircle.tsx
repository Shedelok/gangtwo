import React from 'react';
import type { Chip } from '@shared/types';

const COLORS: Record<number, { bg: string; border: string; text: string }> = {
  1: { bg: '#e8e8e8', border: '#aaa',    text: '#222' },
  2: { bg: '#f5e642', border: '#c9b800', text: '#333' },
  3: { bg: '#f5a623', border: '#c47d00', text: '#222' },
  4: { bg: '#e74c3c', border: '#a93226', text: '#fff' },
};

interface Props {
  chip: Chip;
  dim?: boolean;
  size?: number;
}

export default function ChipCircle({ chip, dim = false, size = 32 }: Props) {
  const c = dim ? { bg: '#333', border: '#555', text: '#555' } : COLORS[chip.round];
  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: c.bg,
      border: `2px solid ${c.border}`,
      color: c.text,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 'bold',
      fontSize: Math.round(size * 0.38),
      userSelect: 'none',
      flexShrink: 0,
    }}>
      {chip.number}
    </div>
  );
}
