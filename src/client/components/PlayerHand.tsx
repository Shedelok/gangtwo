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

function PlayingCard({ card, small, blackAndRed, shortDeck }: { card: Card; small: boolean; blackAndRed: boolean; shortDeck: boolean }) {
  const isRed = RED_SUITS.has(card.suit);
  const suitBg = isRed ? '#c0392b' : '#1a1a2e';
  const background = blackAndRed ? suitBg : 'white';
  const color = blackAndRed ? 'white' : (isRed ? '#c0392b' : '#1a1a2e');
  const symbol = SUIT_SYMBOLS[card.suit];
  const w = small ? 52 : 80;
  const h = small ? 78 : 120;

  if (shortDeck) {
    // Short deck style: value and suit stacked vertically at the middle of the card.
    // Both value and suit take 50% of the height. Font chosen so text takes ~50% of the card width.
    return (
      <div style={{
        width: w, height: h,
        background,
        borderRadius: small ? 5 : 8,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
        userSelect: 'none',
        flexShrink: 0,
      }}>
        <div style={{ height: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
          <span style={{ fontSize: small ? 24 : 36, fontWeight: 'bold', lineHeight: 1 }}>{card.rank}</span>
        </div>
        <div style={{ height: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
          <span style={{ fontSize: small ? 24 : 36, lineHeight: 1 }}>{symbol}</span>
        </div>
      </div>
    );
  }

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

function UnsuitedCard({ small, rank }: { small: boolean; rank: string }) {
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
        <span style={{ fontSize: small ? 12 : 18, fontWeight: 'bold' }}>{rank}</span>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: small ? 20 : 32, color: '#fff', fontWeight: 'bold' }}>
        {rank}
      </div>
    </div>
  );
}

/**
 * Blank slot placeholder used when a pocket card has been destroyed by [A] Destroy all Xs.
 * Same outer dimensions as a regular card so neighbors keep their positions.
 */
function BlankCardSlot({ small }: { small: boolean }) {
  const w = small ? 52 : 80;
  const h = small ? 78 : 120;
  return (
    <div style={{
      width: w, height: h,
      background: 'transparent',
      borderRadius: small ? 5 : 8,
      flexShrink: 0,
    }} />
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
      boxSizing: 'border-box',
      boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    }}>
      <div style={{
        width: '80%', height: '80%',
        borderRadius: 3,
        border: '2px solid #3366cc',
        boxSizing: 'border-box',
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
  shortDeck?: boolean;
  onCardClick?: (idx: 0 | 1) => void;
  unsuitedJackIndex?: number;
  unsuitedXIndex?: number;
  unsuitedXRank?: string;
  // When set, the card at this index plays a flip animation (face-down → face-up or back)
  shownCardInfo?: { idx: 0 | 1; card: Card; faceUp: boolean } | null;
  // When true, dark gray diagonal stripes are overlaid on the cards (guess-rank pending indicator)
  striped?: boolean;
  // Try Another Card addon: 3-card hand for the acting player
  tryAnotherCards?: Card[];
  tryAnotherDropIndex?: number;
  onTryAnotherCardSelect?: (idx: number) => void;
  // Try Another Card addon: face-down card count for other players (when > 2)
  tryAnotherFaceDownCount?: number;
  // Pass-1-card addon: when set, this card index is highlighted as the chosen card to pass
  passCardChoiceIndex?: number;
  // Pass-1-card animation: while a card is flying in/out of this slot, the slot is rendered
  // as a face-down card placeholder so the visual matches the flying card animation.
  passCardAnimatingSlot?: 0 | 1;
  // Ranks destroyed by the [A] Destroy all Xs addon. Used together with destroyedSlots to
  // decide which slot indices render as blank (spec: "Same with pocket cards - other cards
  // don't change their position if some other are discarded.")
  destroyedRanks?: Set<string>;
  // Slot indices (0, 1, ...) whose underlying card is destroyed for the displayed player.
  // The server computes this so face-down cards can also be rendered as blank.
  destroyedSlots?: Set<number>;
  // The rank whose cards are currently playing the 5-second destroy wipe animation. When a
  // slot's effective rank matches this, the card visual is rendered with a top→bottom wipe
  // instead of being instantly blanked.
  destroyAllXsAnimatingRank?: string | null;
}

export default function PlayerHand({ cards, faceDown = false, small = false, blackAndRed = false, shortDeck = false, onCardClick, unsuitedJackIndex, unsuitedXIndex, unsuitedXRank, shownCardInfo, striped = false, tryAnotherCards, tryAnotherDropIndex, onTryAnotherCardSelect, tryAnotherFaceDownCount, passCardChoiceIndex, passCardAnimatingSlot, destroyedRanks, destroyedSlots, destroyAllXsAnimatingRank }: Props) {
  const gap = small ? 6 : 12;
  const w = small ? 52 : 80;
  const h = small ? 78 : 120;

  // Try Another Card: show 3 face-down cards for other players
  if (tryAnotherFaceDownCount && tryAnotherFaceDownCount > 2) {
    return (
      <div style={{ display: 'flex', gap, justifyContent: 'center' }}>
        {Array.from({ length: tryAnotherFaceDownCount }, (_, idx) => (
          <CardBack key={idx} small={small} />
        ))}
      </div>
    );
  }

  // Try Another Card: show 3 face-up cards for acting player with selection
  if (tryAnotherCards && tryAnotherCards.length > 0) {
    return (
      <div style={{ display: 'flex', gap, justifyContent: 'center' }}>
        {tryAnotherCards.map((card, idx) => {
          const selected = tryAnotherDropIndex === idx;
          const isJack = unsuitedJackIndex === idx;
          const isX = unsuitedXIndex === idx;
          // Spec ([A] Destroy all Xs): destroyed-rank cards render as blank slots.
          const effRank = isJack ? 'J' : isX ? (unsuitedXRank ?? null) : card.rank;
          const isDestroyed = !!effRank && !!destroyedRanks?.has(effRank);
          // While the destroy animation is in flight, the card visual is rendered with a
          // top→bottom wipe instead of being instantly blanked.
          const isAnimating = isDestroyed && !!effRank && destroyAllXsAnimatingRank === effRank;
          const inner = isJack
            ? <UnsuitedCard small={small} rank="J" />
            : isX
              ? <UnsuitedCard small={small} rank={unsuitedXRank ?? 'X'} />
              : <PlayingCard card={card} small={small} blackAndRed={blackAndRed} shortDeck={shortDeck} />;
          return (
            <div
              key={idx}
              onClick={onTryAnotherCardSelect && !isDestroyed ? () => onTryAnotherCardSelect(idx) : undefined}
              style={{
                cursor: onTryAnotherCardSelect && !isDestroyed ? 'pointer' : 'default',
                borderRadius: small ? 5 : 8,
                boxShadow: onTryAnotherCardSelect && !isDestroyed ? (selected ? '0 0 10px 4px rgba(239,68,68,0.75)' : '0 0 8px 3px rgba(250,204,21,0.75)') : undefined,
                position: 'relative',
              }}
            >
              {isAnimating
                ? <div className="destroy-wipe">{inner}</div>
                : isDestroyed
                  ? <BlankCardSlot small={small} />
                  : inner
              }
            </div>
          );
        })}
      </div>
    );
  }

  // If neither card is special and we have no card data, show placeholder
  if (!cards && unsuitedJackIndex === undefined && unsuitedXIndex === undefined && !faceDown && !shownCardInfo) {
    return (
      <div style={{ display: 'flex', gap, justifyContent: 'center' }}>
        <div style={{ color: '#555', fontSize: 12 }}>—</div>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', gap, justifyContent: 'center' }}>
      {([0, 1] as const).map(idx => {
        const isJack = unsuitedJackIndex === idx;
        const isX = unsuitedXIndex === idx;
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

        const passSelected = passCardChoiceIndex === idx;
        const passAnimating = passCardAnimatingSlot === idx;
        // Spec ([A] Destroy all Xs): if the card in this slot has a destroyed rank, render a
        // blank slot. We rely on `destroyedSlots` (computed by the server, so it also covers
        // face-down cards) and additionally check the locally-visible card rank.
        let isDestroyed = !!destroyedSlots?.has(idx);
        if (!isDestroyed && destroyedRanks && destroyedRanks.size > 0) {
          const localRank = isJack ? 'J' : isX ? (unsuitedXRank ?? null) : (cards ? cards[idx].rank : null);
          if (localRank && destroyedRanks.has(localRank)) isDestroyed = true;
        }
        // While the destroy animation is in flight for the matching rank, the card visual is
        // rendered with a top→bottom wipe. The effective rank for this slot is either the
        // overlay rank (J/X) or the underlying card's rank. For face-down cards belonging to
        // other players we don't know the rank locally; we infer animating from
        // `destroyedSlots?.has(idx)` together with `destroyAllXsAnimatingRank` being set —
        // any slot the server marks as destroyed during the animating window must be
        // animating for the currently-animating rank.
        const localEffRank = isJack ? 'J' : isX ? (unsuitedXRank ?? null) : (cards ? cards[idx].rank : null);
        const isAnimating = isDestroyed && !!destroyAllXsAnimatingRank && (
          (localEffRank !== null && localEffRank === destroyAllXsAnimatingRank) ||
          (localEffRank === null && !!destroyedSlots?.has(idx))
        );
        return (
          <div
            key={idx}
            onClick={onCardClick && !isDestroyed ? () => onCardClick(idx) : undefined}
            style={{
              cursor: glowing && !isDestroyed ? 'pointer' : 'default',
              borderRadius: small ? 5 : 8,
              boxShadow: isDestroyed
                ? undefined
                : (passSelected
                    ? '0 0 10px 4px rgba(239,68,68,0.75)'
                    : glowing ? '0 0 8px 3px rgba(250,204,21,0.75)' : undefined),
              position: 'relative',
              // Hide this slot during the pass-1-card flying animation so the
              // animating card visually appears to leave/enter this slot.
              visibility: passAnimating ? 'hidden' : 'visible',
            }}
          >
            {isAnimating
              ? <div className="destroy-wipe">{
                  isJack ? <UnsuitedCard small={small} rank="J" />
                  : isX ? <UnsuitedCard small={small} rank={unsuitedXRank ?? 'X'} />
                  : (faceDown || !cards) ? <CardBack small={small} />
                  : <PlayingCard card={cards[idx]} small={small} blackAndRed={blackAndRed} shortDeck={shortDeck} />
                }</div>
              : isDestroyed
                ? <BlankCardSlot small={small} />
                : isJack
                ? <UnsuitedCard small={small} rank="J" />
                : isX
                  ? <UnsuitedCard small={small} rank={unsuitedXRank ?? 'X'} />
                : (faceDown || !cards)
                  ? <CardBack small={small} />
                  : <PlayingCard card={cards[idx]} small={small} blackAndRed={blackAndRed} shortDeck={shortDeck} />
            }
            {striped && !isDestroyed && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                borderRadius: small ? 5 : 8,
                background: 'repeating-linear-gradient(135deg, transparent 0px, transparent 8px, rgba(59,59,59,0.8) 8px, rgba(59,59,59,0.8) 18px)',
                pointerEvents: 'none',
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}
