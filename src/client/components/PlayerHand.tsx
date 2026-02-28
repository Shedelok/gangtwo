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
    gap: '12px',
    justifyContent: 'center',
  },
  card: {
    width: '80px',
    height: '120px',
    background: 'white',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    padding: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
    userSelect: 'none',
  },
  topLeft: {
    display: 'flex',
    flexDirection: 'column',
    lineHeight: '1',
  },
  rank: {
    fontSize: '18px',
    fontWeight: 'bold',
  },
  suit: {
    fontSize: '14px',
  },
  centerSuit: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '32px',
  },
};

function PlayingCard({ card }: { card: Card }) {
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
  cards: [Card, Card] | null;
}

export default function PlayerHand({ cards }: Props) {
  if (!cards) {
    return (
      <div style={s.container}>
        <div style={{ color: '#666', fontSize: '14px' }}>No cards dealt</div>
      </div>
    );
  }
  return (
    <div style={s.container}>
      <PlayingCard card={cards[0]} />
      <PlayingCard card={cards[1]} />
    </div>
  );
}
