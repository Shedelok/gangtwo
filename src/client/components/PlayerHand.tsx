import React from 'react';
import type { Card } from '@shared/types';
import './PlayerHand.css';

const SUIT_SYMBOLS: Record<string, string> = {
  spades: '♠',
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
};

const RED_SUITS = new Set(['hearts', 'diamonds']);

function PlayingCard({ card, small, blackAndRed }: { card: Card; small: boolean; blackAndRed: boolean }) {
  const isRed = RED_SUITS.has(card.suit);
  const suitBg = isRed ? '#c0392b' : '#1a1a2e';
  const background = blackAndRed ? suitBg : 'white';
  const color = blackAndRed ? 'white' : (isRed ? '#c0392b' : '#1a1a2e');
  const symbol = SUIT_SYMBOLS[card.suit];
  const w = small ? 52 : 80;
  const h = small ? 78 : 120;
  return (
    <div style={{
      width: w, height: h,
      background,
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

function UnsuitedJack({ small }: { small: boolean }) {
  const w = small ? 52 : 80;
  const h = small ? 78 : 120;
  return (
    <div style={{
      width: w, height: h,
      background: '#B87333',
      borderRadius: small ? 5 : 8,
      display: 'flex',
      flexDirection: 'column',
      padding: small ? 4 : 8,
      boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
      userSelect: 'none',
      flexShrink: 0,
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1, color: '#fff' }}>
        <span style={{ fontSize: small ? 12 : 18, fontWeight: 'bold' }}>J</span>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: small ? 20 : 32, color: '#fff', fontWeight: 'bold' }}>
        J
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
  blackAndRed?: boolean;
  onCardClick?: (idx: 0 | 1) => void;
  unsuitedJackIndex?: number;
  // When set, the card at this index plays a flip animation (face-down → face-up or back)
  shownCardInfo?: { idx: 0 | 1; card: Card; faceUp: boolean } | null;
}

export default function PlayerHand({ cards, faceDown = false, small = false, blackAndRed = false, onCardClick, unsuitedJackIndex, shownCardInfo }: Props) {
  const gap = small ? 6 : 12;
  // If neither card is special and we have no card data, show placeholder
  if (!cards && unsuitedJackIndex === undefined && !faceDown && !shownCardInfo) {
    return (
      <div style={{ display: 'flex', gap, justifyContent: 'center' }}>
        <div style={{ color: '#555', fontSize: 12 }}>—</div>
      </div>
    );
  }
  const w = small ? 52 : 80;
  const h = small ? 78 : 120;
  return (
    <div style={{ display: 'flex', gap, justifyContent: 'center' }}>
      {([0, 1] as const).map(idx => {
        const isJack = unsuitedJackIndex === idx;
        const glowing = !!onCardClick;
        const isShown = shownCardInfo?.idx === idx;

        if (isShown && shownCardInfo) {
          const card = shownCardInfo.card;
          const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
          const suitColor = isRed ? '#c0392b' : '#1a1a2e';
          const symbol = SUIT_SYMBOLS[card.suit];
          return (
            <div key={idx} className="ph-flip-container" style={{ width: w, height: h }}>
              <div className={`ph-flipper ${shownCardInfo.faceUp ? 'face-up' : 'face-down'}`}>
                <div className="ph-face ph-back" />
                <div className="ph-face ph-front" style={{ color: suitColor }}>
                  <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
                    <span style={{ fontSize: small ? 12 : 18, fontWeight: 'bold' }}>{card.rank}</span>
                    <span style={{ fontSize: small ? 10 : 14 }}>{symbol}</span>
                  </div>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: small ? 20 : 32 }}>
                    {symbol}
                  </div>
                </div>
              </div>
            </div>
          );
        }

        return (
          <div
            key={idx}
            onClick={onCardClick ? () => onCardClick(idx) : undefined}
            style={{
              cursor: glowing ? 'pointer' : 'default',
              borderRadius: small ? 5 : 8,
              boxShadow: glowing ? '0 0 8px 3px rgba(250,204,21,0.75)' : undefined,
            }}
          >
            {isJack
              ? <UnsuitedJack small={small} />
              : (faceDown || !cards)
                ? <CardBack small={small} />
                : <PlayingCard card={cards[idx]} small={small} blackAndRed={blackAndRed} />
            }
          </div>
        );
      })}
    </div>
  );
}
