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

function CommunityCard({ card, animate, blackAndRed, shortDeck, rerollFrom }: { card: Card; animate: boolean; blackAndRed: boolean; shortDeck: boolean; rerollFrom?: Card }) {
  const [faceUp, setFaceUp] = useState(!animate && rerollFrom == null);
  const [displayCard, setDisplayCard] = useState<Card>(rerollFrom ?? card);

  useEffect(() => {
    if (animate) {
      // Small delay so the face-down state is painted before the transition starts
      const t = setTimeout(() => setFaceUp(true), 50);
      return () => clearTimeout(t);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Reroll animation: show old card flipping down, then new card flipping up
  const rerollInProgressRef = useRef(false);
  useEffect(() => {
    if (!rerollFrom || rerollInProgressRef.current) return;
    rerollInProgressRef.current = true;
    setDisplayCard(rerollFrom);
    setFaceUp(true);
    const t1 = setTimeout(() => setFaceUp(false), 50);
    const t2 = setTimeout(() => setDisplayCard(card), 1050);
    const t3 = setTimeout(() => {
      setFaceUp(true);
      rerollInProgressRef.current = false;
    }, 1100);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [rerollFrom]); // eslint-disable-line react-hooks/exhaustive-deps

  const c = displayCard;
  const isRed = RED_SUITS.has(c.suit);
  const suitBg = isRed ? '#c0392b' : '#1a1a2e';
  const color = blackAndRed ? 'white' : (isRed ? '#c0392b' : '#1a1a2e');
  const symbol = SUIT_SYMBOLS[c.suit];

  return (
    <div className="cc-flip-container">
      <div className="cc-flipper" style={{ transform: faceUp ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>
        <div className="cc-face cc-back" />
        <div className="cc-face cc-front" style={blackAndRed ? { background: suitBg } : undefined}>
          {shortDeck ? (
            <>
              <div style={{ height: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
                <span style={{ fontSize: 20, fontWeight: 'bold', lineHeight: 1 }}>{c.rank}</span>
              </div>
              <div style={{ height: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
                <span style={{ fontSize: 20, lineHeight: 1 }}>{symbol}</span>
              </div>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1, color }}>
                <span style={{ fontSize: 11, fontWeight: 'bold' }}>{c.rank}</span>
                <span style={{ fontSize: 9 }}>{symbol}</span>
              </div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color }}>
                {symbol}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

interface Props {
  cards: Card[];
  blackAndRed?: boolean;
  shortDeck?: boolean;
  onCardClick?: (idx: number) => void;
}

export default function CommunityCards({ cards, blackAndRed = false, shortDeck = false, onCardClick }: Props) {
  // animateFromIndex: cards at index >= this value were newly added and should animate.
  // Initialized to cards.length so cards present on first render never animate.
  const [animateFromIndex, setAnimateFromIndex] = useState<number>(() => cards.length);
  const prevCountRef = useRef<number | null>(null);
  const [rerollingCards, setRerollingCards] = useState<Map<number, Card>>(new Map());
  const prevCardsRef = useRef<Card[]>([]);
  const rerollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const prev = prevCardsRef.current;

    // Detect in-place card replacements (reroll common addon)
    if (prev.length === cards.length && cards.length > 0) {
      const replaced = new Map<number, Card>();
      for (let i = 0; i < cards.length; i++) {
        if (prev[i] && (prev[i].rank !== cards[i].rank || prev[i].suit !== cards[i].suit)) {
          replaced.set(i, prev[i]);
        }
      }
      if (replaced.size > 0) {
        setRerollingCards(replaced);
        if (rerollTimerRef.current) clearTimeout(rerollTimerRef.current);
        rerollTimerRef.current = setTimeout(() => setRerollingCards(new Map()), 2500);
      }
    }

    if (prevCountRef.current === null) {
      prevCountRef.current = cards.length;
    } else if (cards.length > prevCountRef.current) {
      setAnimateFromIndex(prevCountRef.current);
      prevCountRef.current = cards.length;
    } else if (cards.length < prevCountRef.current) {
      // Cards were cleared (new round started); reset tracking without animating
      prevCountRef.current = cards.length;
      setAnimateFromIndex(cards.length);
      if (rerollTimerRef.current) clearTimeout(rerollTimerRef.current);
      setRerollingCards(new Map());
    }

    prevCardsRef.current = [...cards];
  }, [cards]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ display: 'flex', gap: 5, justifyContent: 'center', flexWrap: 'wrap' }}>
      {cards.map((card, i) => (
        <div
          key={i}
          onClick={onCardClick ? () => onCardClick(i) : undefined}
          style={{
            cursor: onCardClick ? 'pointer' : 'default',
            borderRadius: 4,
            boxShadow: onCardClick ? '0 0 8px 3px rgba(250,204,21,0.75)' : undefined,
          }}
        >
          <CommunityCard card={card} animate={i >= animateFromIndex} blackAndRed={blackAndRed} shortDeck={shortDeck} rerollFrom={rerollingCards.get(i)} />
        </div>
      ))}
    </div>
  );
}
