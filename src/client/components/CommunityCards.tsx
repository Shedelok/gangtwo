import React from 'react';
import type { Card } from '@shared/types';

const SUIT_SYMBOLS: Record<string, string> = {
  spades: '♠',
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
};

const RED_SUITS = new Set(['hearts', 'diamonds']);

function CommunityCard({ card }: { card: Card }) {
  const color = RED_SUITS.has(card.suit) ? '#c0392b' : '#1a1a2e';
  const symbol = SUIT_SYMBOLS[card.suit];
  return (
    <div style={{
      width: 46, height: 66,
      background: 'white',
      borderRadius: 5,
      display: 'flex',
      flexDirection: 'column',
      padding: 4,
      boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
      userSelect: 'none',
      flexShrink: 0,
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1, color }}>
        <span style={{ fontSize: 11, fontWeight: 'bold' }}>{card.rank}</span>
        <span style={{ fontSize: 9 }}>{symbol}</span>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color }}>
        {symbol}
      </div>
    </div>
  );
}

interface Props {
  cards: Card[];
}

export default function CommunityCards({ cards }: Props) {
  return (
    <div style={{ display: 'flex', gap: 5, justifyContent: 'center', flexWrap: 'wrap' }}>
      {cards.map((card, i) => <CommunityCard key={i} card={card} />)}
    </div>
  );
}
