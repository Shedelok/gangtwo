import React, { useState, useEffect, useRef } from 'react';
import type { Card } from '@shared/types';
import './CommunityCards.css';

const SUIT_SYMBOLS: Record<string, string> = {
  spades: '♠',
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
};

const RED_SUITS = new Set(['hearts', 'diamonds']);

function CommunityCard({ card, animate }: { card: Card; animate: boolean }) {
  const [faceUp, setFaceUp] = useState(!animate);

  useEffect(() => {
    if (animate) {
      // Small delay so the face-down state is painted before the transition starts
      const t = setTimeout(() => setFaceUp(true), 50);
      return () => clearTimeout(t);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const color = RED_SUITS.has(card.suit) ? '#c0392b' : '#1a1a2e';
  const symbol = SUIT_SYMBOLS[card.suit];

  return (
    <div className="cc-flip-container">
      <div className="cc-flipper" style={{ transform: faceUp ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>
        <div className="cc-face cc-back" />
        <div className="cc-face cc-front">
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1, color }}>
            <span style={{ fontSize: 11, fontWeight: 'bold' }}>{card.rank}</span>
            <span style={{ fontSize: 9 }}>{symbol}</span>
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color }}>
            {symbol}
          </div>
        </div>
      </div>
    </div>
  );
}

interface Props {
  cards: Card[];
}

export default function CommunityCards({ cards }: Props) {
  // animateFromIndex: cards at index >= this value were newly added and should animate.
  // Initialized to cards.length so cards present on first render never animate.
  const [animateFromIndex, setAnimateFromIndex] = useState<number>(() => cards.length);
  const prevCountRef = useRef<number | null>(null);

  useEffect(() => {
    if (prevCountRef.current === null) {
      prevCountRef.current = cards.length;
    } else if (cards.length > prevCountRef.current) {
      setAnimateFromIndex(prevCountRef.current);
      prevCountRef.current = cards.length;
    } else if (cards.length < prevCountRef.current) {
      // Cards were cleared (new round started); reset tracking without animating
      prevCountRef.current = cards.length;
      setAnimateFromIndex(cards.length);
    }
  }, [cards.length]);

  return (
    <div style={{ display: 'flex', gap: 5, justifyContent: 'center', flexWrap: 'wrap' }}>
      {cards.map((card, i) => (
        <CommunityCard key={i} card={card} animate={i >= animateFromIndex} />
      ))}
    </div>
  );
}
