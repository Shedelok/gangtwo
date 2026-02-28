import React from 'react';
import type { Card } from '@shared/types';

const SUIT_SYMBOLS: Record<string, string> = {
  spades: '♠',
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
};

const RED_SUITS = new Set(['hearts', 'diamonds']);

function PlayingCard({ card, small }: { card: Card; small: boolean }) {
  const color = RED_SUITS.has(card.suit) ? '#c0392b' : '#1a1a2e';
  const symbol = SUIT_SYMBOLS[card.suit];
  const w = small ? 52 : 80;
  const h = small ? 78 : 120;
  return (
    <div style={{
      width: w, height: h,
      background: 'white',
      borderRadius: small ? 5 : 8,
      display: 'flex',
      flexDirection: 'column',
      padding: small ? 4 : 8,
      boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
      userSelect: 'none',
      flexShrink: 0,
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1, color }}>
        <span style={{ fontSize: small ? 12 : 18, fontWeight: 'bold' }}>{card.rank}</span>
        <span style={{ fontSize: small ? 10 : 14 }}>{symbol}</span>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: small ? 20 : 32, color }}>
        {symbol}
      </div>
    </div>
  );
}

function CardBack({ small }: { small: boolean }) {
  const w = small ? 52 : 80;
  const h = small ? 78 : 120;
  return (
    <div style={{
      width: w, height: h,
      background: '#1a3a6e',
      borderRadius: small ? 5 : 8,
      border: '2px solid #2255aa',
      boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    }}>
      <div style={{
        width: w - 14, height: h - 14,
        borderRadius: 3,
        border: '2px solid #3366cc',
        background: 'repeating-linear-gradient(45deg, #1a3a6e 0px, #1a3a6e 4px, #1e42a0 4px, #1e42a0 8px)',
      }} />
    </div>
  );
}

interface Props {
  cards: [Card, Card] | null;
  faceDown?: boolean;
  small?: boolean;
}

export default function PlayerHand({ cards, faceDown = false, small = false }: Props) {
  const gap = small ? 6 : 12;
  if (faceDown) {
    return (
      <div style={{ display: 'flex', gap, justifyContent: 'center' }}>
        <CardBack small={small} />
        <CardBack small={small} />
      </div>
    );
  }
  if (!cards) {
    return (
      <div style={{ display: 'flex', gap, justifyContent: 'center' }}>
        <div style={{ color: '#555', fontSize: 12 }}>—</div>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', gap, justifyContent: 'center' }}>
      <PlayingCard card={cards[0]} small={small} />
      <PlayingCard card={cards[1]} small={small} />
    </div>
  );
}
