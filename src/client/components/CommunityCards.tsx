import React from 'react';
import type { Card } from '@shared/types';

const SUIT_SYMBOLS: Record<string, string> = {
  spades: '♠',
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
};

const RED_SUITS = new Set(['hearts', 'diamonds']);

const s: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  label: {
    textAlign: 'center',
    color: '#888',
    fontSize: '13px',
    marginBottom: '8px',
  },
  card: {
    width: '70px',
    height: '105px',
    background: 'white',
    borderRadius: '7px',
    display: 'flex',
    flexDirection: 'column',
    padding: '6px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
    userSelect: 'none',
  },
  topLeft: {
    display: 'flex',
    flexDirection: 'column',
    lineHeight: '1',
  },
  rank: {
    fontSize: '16px',
    fontWeight: 'bold',
  },
  suit: {
    fontSize: '12px',
  },
  centerSuit: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '28px',
  },
  placeholder: {
    color: '#555',
    fontSize: '13px',
    padding: '20px 0',
  },
};

function CommunityCard({ card }: { card: Card }) {
  const color = RED_SUITS.has(card.suit) ? '#c0392b' : '#1a1a2e';
  const symbol = SUIT_SYMBOLS[card.suit];
  return (
    <div style={s.card}>
      <div style={{ ...s.topLeft, color }}>
        <span style={s.rank}>{card.rank}</span>
        <span style={s.suit}>{symbol}</span>
      </div>
      <div style={{ ...s.centerSuit, color }}>{symbol}</div>
    </div>
  );
}

interface Props {
  cards: Card[];
}

export default function CommunityCards({ cards }: Props) {
  return (
    <div>
      <div style={s.label}>Community Cards ({cards.length}/5)</div>
      <div style={s.container}>
        {cards.length === 0 ? (
          <div style={s.placeholder}>None yet</div>
        ) : (
          cards.map((card, i) => <CommunityCard key={i} card={card} />)
        )}
      </div>
    </div>
  );
}
