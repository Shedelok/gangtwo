import React, { useState, useEffect } from 'react';
import type { PlayerPublicState, Card, RoundNumber, ClientAction } from '@shared/types';
import PlayerHand from './PlayerHand';
import ChipCircle from './ChipCircle';

const HAND_RANKS = [
  'Royal Flush', 'Straight Flush', 'Four of a Kind', 'Full House',
  'Flush', 'Straight', 'Three of a Kind', 'Two Pair', 'One Pair', 'High Card',
];

const CARD_VALUES = [
  '(A) Ace', '(K) King', '(Q) Queen', '(J) Jack', '(10) Ten', '(9) Nine',
  '(8) Eight', '(7) Seven', '(6) Six', '(5) Five', '(4) Four', '(3) Three', '(2) Two',
];

/** Card values available only in Short Deck (10 through Ace). */
const SHORT_DECK_CARD_VALUES = [
  '(A) Ace', '(K) King', '(Q) Queen', '(J) Jack', '(10) Ten',
];

const btn: React.CSSProperties = {
  padding: '2px 7px',
  borderRadius: 10,
  border: 'none',
  cursor: 'pointer',
  fontSize: 11,
  fontWeight: 'bold',
};

interface Props {
  player: PlayerPublicState;
  isMe: boolean;
  holeCards: [Card, Card] | null;
  showFaceDown: boolean;
  currentRound: RoundNumber;
  iHaveCurrentRoundChip: boolean;
  sendAction: (a: ClientAction) => void;
  readOnly: boolean;
  myCardsRevealed: boolean;
  canReveal?: boolean;
  blackNumbers?: number[];
  canStealFrom?: boolean;
  blackAndRed?: boolean;
  shortDeck?: boolean;
  showRestartTick?: boolean;
  hasRestartVoted?: boolean;
  showShareInfoTick?: boolean;
  showReadinessTick?: boolean;
  // Guess addon props
  guessRankUIs?: Array<{ addonId: string; myVote?: string; locked: boolean; feature?: 'hand-rank' | 'card-value' }>; // one per feature targeting this seat
  dialogueClouds?: Array<{ text: string; winner: boolean; locked: boolean }>; // one cloud per vote
  onCardSelect?: (idx: 0 | 1) => void; // in-place card selection for action cards
  onPlayerSelect?: () => void; // in-place player selection for action cards
  actionInProgress?: boolean;
  onSeatElRef?: (el: HTMLDivElement | null) => void;
  unsuitedJackIndex?: number;
  unsuitedXIndex?: number;
  unsuitedXRank?: string;
  shownCardInfo?: { idx: 0 | 1; card: Card; faceUp: boolean } | null;
  striped?: boolean;
  imprisoned?: boolean;
  guessTargetedRedChipNumbers?: Set<number>;
  style?: React.CSSProperties;
}

export default function PlayerSeat({
  player, isMe, holeCards, showFaceDown,
  currentRound, iHaveCurrentRoundChip,
  sendAction, readOnly, myCardsRevealed, canReveal = true, blackNumbers = [], canStealFrom = true,
  blackAndRed = false, shortDeck = false, showRestartTick = false, hasRestartVoted = false, showShareInfoTick = false, showReadinessTick = false,
  guessRankUIs = [], dialogueClouds = [], onCardSelect, onPlayerSelect, actionInProgress = false, onSeatElRef, unsuitedJackIndex, unsuitedXIndex, unsuitedXRank, shownCardInfo, striped = false, imprisoned = false, guessTargetedRedChipNumbers, style,
}: Props) {
  const [activePickerAddon, setActivePickerAddon] = useState<string | null>(null);
  useEffect(() => {
    if (activePickerAddon !== null) {
      const ui = guessRankUIs.find(u => u.addonId === activePickerAddon);
      if (!ui || ui.locked) setActivePickerAddon(null);
    }
  }, [guessRankUIs, activePickerAddon]);
  useEffect(() => {
    if (activePickerAddon === null) return;
    const handler = () => setActivePickerAddon(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [activePickerAddon]);

  // Sort by round asc, then number asc within the same round
  const sortedChips = [...player.chips].sort((a, b) =>
    a.round !== b.round ? a.round - b.round : a.number - b.number
  );

  return (
    <div
      ref={onSeatElRef}
      onClick={onPlayerSelect}
      style={{
        background: isMe ? '#1a3050' : '#16213e',
        border: onPlayerSelect ? '2px solid #facc15' : `2px solid ${isMe ? '#3a6090' : '#2a3a4a'}`,
        borderRadius: 10,
        padding: !readOnly && isMe ? '8px 10px 30px' : '8px 10px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 5,
        position: 'relative',
        cursor: onPlayerSelect ? 'pointer' : 'default',
        boxShadow: onPlayerSelect ? '0 0 10px 3px rgba(250,204,21,0.5)' : undefined,
        ...style,
      }}>
      {/* Dialogue clouds — shows this player's rank guess(es) above their seat */}
      {dialogueClouds.length > 0 && (
        <div style={{
          position: 'absolute', top: -26 * dialogueClouds.length, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center', pointerEvents: 'none',
        }}>
          {dialogueClouds.map((cloud, idx) => (
            <div key={idx} style={{
              background: cloud.locked
                ? cloud.winner ? '#fef08a' : '#4b5563'
                : '#f0f4ff',
              color: cloud.locked
                ? cloud.winner ? '#713f12' : '#9ca3af'
                : '#1e293b',
              borderRadius: 8, padding: '2px 8px',
              fontSize: 11, fontWeight: 'bold',
              border: `1px solid ${cloud.locked ? (cloud.winner ? '#ca8a04' : '#374151') : '#94a3b8'}`,
              whiteSpace: 'nowrap',
            }}>
              {cloud.text}
            </div>
          ))}
        </div>
      )}

      {/* Name */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 12, fontWeight: 'bold', color: isMe ? '#90c0ff' : '#bbb', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140 }}>
          {player.name}{isMe ? ' (you)' : ''}
        </div>
        {showRestartTick && (
          <span style={{ position: 'absolute', left: '100%', marginLeft: 3, fontSize: 11, color: hasRestartVoted ? '#4ade80' : '#f87171', pointerEvents: 'none' }}>{hasRestartVoted ? '✓' : '✕'}</span>
        )}
        {showShareInfoTick && (
          <span style={{ position: 'absolute', left: '100%', marginLeft: 3, fontSize: 11, color: player.readyForNextRound ? '#4ade80' : '#f87171', pointerEvents: 'none' }}>{player.readyForNextRound ? '✓' : '✕'}</span>
        )}
        {showReadinessTick && (
          <span style={{ position: 'absolute', left: '100%', marginLeft: 3, fontSize: 11, color: player.readyForNextRound ? '#4ade80' : '#f87171', pointerEvents: 'none' }}>{player.readyForNextRound ? '✓' : '\u2715'}</span>
        )}
      </div>

      {/* Cards */}
      <PlayerHand cards={holeCards} faceDown={showFaceDown} small blackAndRed={blackAndRed} shortDeck={shortDeck} onCardClick={isMe && onCardSelect ? onCardSelect : undefined} unsuitedJackIndex={unsuitedJackIndex} unsuitedXIndex={unsuitedXIndex} unsuitedXRank={unsuitedXRank} shownCardInfo={shownCardInfo} striped={striped} />

      {/* Chips — sorted by round asc, number asc; always rendered to reserve height */}
      <div style={{ display: 'flex', flexWrap: 'nowrap', gap: 4, justifyContent: 'center', minHeight: 54 }}>
        {sortedChips.map(chip => {
            const isCurrent = chip.round === currentRound;
            const isBlack = blackNumbers.includes(chip.number);
            return (
              <div key={`${chip.round}-${chip.number}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <ChipCircle chip={chip} blackInside={isBlack} guessTarget={chip.round === 4 && !!guessTargetedRedChipNumbers?.has(chip.number)} />
                {!readOnly && isCurrent && isMe && !isBlack && !actionInProgress && (
                  <button style={{ ...btn, background: '#7f1c1c', color: '#fca5a5' }}
                    onClick={() => sendAction({ type: 'DISCARD_CHIP', chipNumber: chip.number })}>
                    Return
                  </button>
                )}
                {!readOnly && isCurrent && !isMe && !iHaveCurrentRoundChip && !isBlack && canStealFrom && !actionInProgress && (
                  <button style={{ ...btn, background: '#5b21b6', color: '#ddd6fe' }}
                    onClick={() => sendAction({ type: 'STEAL_CHIP', fromPlayerId: player.id, chipNumber: chip.number })}>
                    Steal
                  </button>
                )}
              </div>
            );
        })}
      </div>

      {/* Guess UI — one per feature targeting this seat (shown for non-target viewers) */}
      {guessRankUIs.map(ui => {
        const options = ui.feature === 'card-value' ? (shortDeck ? SHORT_DECK_CARD_VALUES : CARD_VALUES) : HAND_RANKS;
        const buttonLabel = ui.feature === 'card-value' ? 'Guess Card' : 'Guess Hand';
        return (
          <div key={ui.addonId} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {activePickerAddon === ui.addonId && (
              <div style={{
                position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)',
                background: '#1e293b', border: '1px solid #475569', borderRadius: 8,
                padding: 4, zIndex: 100, display: 'flex', flexDirection: 'column', gap: 1,
                marginBottom: 2, maxHeight: 8 * 20, overflowY: 'auto',
              }}
                onClick={(e) => e.stopPropagation()}>
                {options.map(r => (
                  <button key={r} style={{
                    ...btn, background: r === ui.myVote ? '#3b5bdb' : '#334155',
                    color: '#e2e8f0', textAlign: 'left', whiteSpace: 'nowrap',
                  }}
                    onClick={() => { sendAction({ type: 'SUBMIT_RANK_GUESS', addonId: ui.addonId, rank: r }); setActivePickerAddon(null); }}>
                    {r}
                  </button>
                ))}
              </div>
            )}
            {ui.myVote ? (
              <button style={{ ...btn, background: '#1e3a5f', color: '#93c5fd', cursor: ui.locked ? 'default' : 'pointer' }}
                onClick={(e) => { if (!ui.locked) { e.stopPropagation(); setActivePickerAddon(prev => prev === ui.addonId ? null : ui.addonId); } }}>
                {ui.myVote}{!ui.locked && <span style={{ marginLeft: 4 }}>{'\u{1F589}'}</span>}
              </button>
            ) : (
              <button style={{ ...btn, background: '#7c3aed', color: '#ede9fe' }}
                onClick={(e) => { e.stopPropagation(); setActivePickerAddon(prev => prev === ui.addonId ? null : ui.addonId); }}>
                {buttonLabel}
              </button>
            )}
          </div>
        );
      })}

      {/* Reveal cards button — shown to self in finished phase until revealed */}
      {readOnly && isMe && !myCardsRevealed && (
        <button style={{ ...btn, background: canReveal ? '#166534' : '#374151', color: canReveal ? '#bbf7d0' : '#9ca3af', cursor: canReveal ? 'pointer' : 'not-allowed' }}
          disabled={!canReveal}
          onClick={() => sendAction({ type: 'REVEAL_CARDS' })}>
          Reveal cards
        </button>
      )}

      {/* Ready — only shown to the player themselves, absolutely positioned to not affect seat size; hidden when imprisoned */}
      {!readOnly && isMe && !actionInProgress && !imprisoned && (
        <button
          style={{
            ...btn,
            position: 'absolute',
            bottom: 8,
            background: player.readyForNextRound ? '#555' : '#1d4ed8',
            color: player.readyForNextRound ? '#aaa' : '#fff',
          }}
          onClick={() => sendAction({ type: 'SET_READY', ready: !player.readyForNextRound })}>
          {player.readyForNextRound ? 'Waiting' : 'Move to next round'}
        </button>
      )}

      {/* Prison bars overlay — vertical black lines imitating prison bars */}
      {imprisoned && (
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 10,
          pointerEvents: 'none',
          zIndex: 50,
          display: 'flex',
          justifyContent: 'space-evenly',
          alignItems: 'stretch',
          overflow: 'hidden',
        }}>
          {Array.from({ length: 7 }, (_, i) => (
            <div key={i} style={{ width: 3, background: '#000', opacity: 0.7 }} />
          ))}
        </div>
      )}
    </div>
  );
}
