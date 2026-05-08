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

// Unsuited (orange) common card — used when [A] Unsuited Jack or [A] Unsuited X card has been
// moved to a common-card slot (per spec: "This Jack is always unsuited (orange) even if it
// becomes a common card."). Mirrors the in-hand UnsuitedCard rendering but at the
// community-card size.
function UnsuitedCommunityCard({ rank }: { rank: string }) {
  return (
    <div className="cc-flip-container">
      <div className="cc-flipper" style={{ transform: 'rotateY(180deg)' }}>
        <div className="cc-face cc-back" />
        <div className="cc-face cc-front" style={{ background: '#B87333' }}>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1, color: '#fff' }}>
            <span style={{ fontSize: 11, fontWeight: 'bold' }}>{rank}</span>
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: '#fff', fontWeight: 'bold' }}>
            {rank}
          </div>
        </div>
      </div>
    </div>
  );
}

function CommunityCard({ card, animate, blackAndRed, shortDeck, rerollFrom, rerollFromUnsuitedRank }: { card: Card; animate: boolean; blackAndRed: boolean; shortDeck: boolean; rerollFrom?: Card; rerollFromUnsuitedRank?: string | null }) {
  const [faceUp, setFaceUp] = useState(!animate && rerollFrom == null);
  const [displayCard, setDisplayCard] = useState<Card>(rerollFrom ?? card);
  // When rerolling a previously unsuited (orange) common card, render the orange face
  // during the initial face-up portion of the reroll animation. After the card flips
  // face-down and back face-up, the new card from the deck is rendered as a normal card.
  // Spec ([A] Reroll Common): "This works for any common card (even if it's unsuited)."
  // Spec ([A] Unsuited Jack): "When unsuited Jack is flipped (animation), it flips just
  // as a normal card." So a normal flip animation is used, just with the orange face for
  // the initial side.
  const [unsuitedFaceRank, setUnsuitedFaceRank] = useState<string | null>(rerollFromUnsuitedRank ?? null);

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
    setUnsuitedFaceRank(rerollFromUnsuitedRank ?? null);
    setFaceUp(true);
    const t1 = setTimeout(() => setFaceUp(false), 50);
    const t2 = setTimeout(() => { setDisplayCard(card); setUnsuitedFaceRank(null); }, 1050);
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
        <div className="cc-face cc-front" style={unsuitedFaceRank ? { background: '#B87333' } : (blackAndRed ? { background: suitBg } : undefined)}>
          {unsuitedFaceRank ? (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1, color: '#fff' }}>
                <span style={{ fontSize: 11, fontWeight: 'bold' }}>{unsuitedFaceRank}</span>
              </div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: '#fff', fontWeight: 'bold' }}>
                {unsuitedFaceRank}
              </div>
            </>
          ) : shortDeck ? (
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
  onCardElRef?: (idx: number, el: HTMLDivElement | null) => void;
  // When set, these card indices are hidden in place (used for swap-with-common animation,
  // where the actual card image is being shown by an overlay flying card).
  hiddenIndices?: Set<number>;
  // When the unsuited Jack/X has been moved to a common-card slot, this slot is rendered as
  // an orange unsuited card with the appropriate rank instead of the underlying card data.
  unsuitedJackCommonIndex?: number | null;
  unsuitedXCommonIndex?: number | null;
  unsuitedXRank?: string | null;
}

export default function CommunityCards({ cards, blackAndRed = false, shortDeck = false, onCardClick, onCardElRef, hiddenIndices, unsuitedJackCommonIndex, unsuitedXCommonIndex, unsuitedXRank }: Props) {
  // animateFromIndex: cards at index >= this value were newly added and should animate.
  // Initialized to cards.length so cards present on first render never animate.
  const [animateFromIndex, setAnimateFromIndex] = useState<number>(() => cards.length);
  const prevCountRef = useRef<number | null>(null);
  const [rerollingCards, setRerollingCards] = useState<Map<number, Card>>(new Map());
  // Per-slot record of the unsuited rank that was occupying the slot just before a reroll
  // (if any). Used to render the orange face during the first half of the reroll flip
  // animation when an unsuited common card was rerolled.
  const [rerollingUnsuitedRanks, setRerollingUnsuitedRanks] = useState<Map<number, string>>(new Map());
  const prevCardsRef = useRef<Card[]>([]);
  const prevUnsuitedJackIndexRef = useRef<number | null>(null);
  const prevUnsuitedXIndexRef = useRef<number | null>(null);
  const prevUnsuitedXRankRef = useRef<string | null>(null);
  const rerollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const prev = prevCardsRef.current;
    const prevJackIdx = prevUnsuitedJackIndexRef.current;
    const prevXIdx = prevUnsuitedXIndexRef.current;
    const prevXRank = prevUnsuitedXRankRef.current;

    // Detect in-place card replacements (reroll common addon)
    if (prev.length === cards.length && cards.length > 0) {
      const replaced = new Map<number, Card>();
      const replacedUnsuited = new Map<number, string>();
      for (let i = 0; i < cards.length; i++) {
        const wasUnsuited = (prevJackIdx === i) || (prevXIdx === i);
        const isStillUnsuited = (unsuitedJackCommonIndex === i) || (unsuitedXCommonIndex === i);
        const cardChanged = !!prev[i] && (prev[i].rank !== cards[i].rank || prev[i].suit !== cards[i].suit);
        // Reroll triggers when the underlying card data changed OR an unsuited slot
        // transitioned away (was unsuited, now is not — even if the underlying card
        // happened to be the same, which can happen if the new deck draw matches).
        if (cardChanged || (wasUnsuited && !isStillUnsuited)) {
          replaced.set(i, prev[i] ?? cards[i]);
          if (wasUnsuited) {
            replacedUnsuited.set(i, prevJackIdx === i ? 'J' : (prevXRank ?? 'X'));
          }
        }
      }
      if (replaced.size > 0) {
        setRerollingCards(replaced);
        setRerollingUnsuitedRanks(replacedUnsuited);
        if (rerollTimerRef.current) clearTimeout(rerollTimerRef.current);
        rerollTimerRef.current = setTimeout(() => {
          setRerollingCards(new Map());
          setRerollingUnsuitedRanks(new Map());
        }, 2500);
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
      setRerollingUnsuitedRanks(new Map());
    }

    prevCardsRef.current = [...cards];
    prevUnsuitedJackIndexRef.current = unsuitedJackCommonIndex ?? null;
    prevUnsuitedXIndexRef.current = unsuitedXCommonIndex ?? null;
    prevUnsuitedXRankRef.current = unsuitedXRank ?? null;
  }, [cards, unsuitedJackCommonIndex, unsuitedXCommonIndex, unsuitedXRank]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ display: 'flex', gap: 5, justifyContent: 'center', flexWrap: 'wrap' }}>
      {cards.map((card, i) => {
        const isUnsuitedJackHere = unsuitedJackCommonIndex === i;
        const isUnsuitedXHere = unsuitedXCommonIndex === i;
        const rerollFrom = rerollingCards.get(i);
        const rerollFromUnsuitedRank = rerollingUnsuitedRanks.get(i) ?? null;
        // While a reroll animation is in progress for this slot, render via CommunityCard
        // (which handles the flip animation) even if the slot was previously unsuited.
        const renderAsUnsuited = (isUnsuitedJackHere || isUnsuitedXHere) && !rerollFrom;
        return (
          <div
            key={i}
            ref={el => onCardElRef?.(i, el)}
            onClick={onCardClick ? () => onCardClick(i) : undefined}
            style={{
              cursor: onCardClick ? 'pointer' : 'default',
              borderRadius: 4,
              boxShadow: onCardClick ? '0 0 8px 3px rgba(250,204,21,0.75)' : undefined,
              visibility: hiddenIndices?.has(i) ? 'hidden' : 'visible',
            }}
          >
            {renderAsUnsuited && isUnsuitedJackHere ? (
              <UnsuitedCommunityCard rank="J" />
            ) : renderAsUnsuited && isUnsuitedXHere ? (
              <UnsuitedCommunityCard rank={unsuitedXRank ?? 'X'} />
            ) : (
              <CommunityCard
                card={card}
                animate={i >= animateFromIndex}
                blackAndRed={blackAndRed}
                shortDeck={shortDeck}
                rerollFrom={rerollFrom}
                rerollFromUnsuitedRank={rerollFromUnsuitedRank}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
