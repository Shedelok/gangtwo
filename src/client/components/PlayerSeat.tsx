import React, { useState, useEffect } from 'react';
import type { PlayerPublicState, Card, RoundNumber, ClientAction } from '@shared/types';
import PlayerHand from './PlayerHand';
import ChipCircle from './ChipCircle';

const HAND_RANKS = [
  'Royal Flush', 'Straight Flush', 'Four of a Kind', 'Full House',
  'Flush', 'Straight', 'Three of a Kind', 'Two Pair', 'One Pair', 'High Card',
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
  // Guess-rank addon props
  guessRankUIs?: Array<{ addonId: string; myVote?: string; locked: boolean }>; // one per addon targeting this seat
  dialogueClouds?: Array<{ text: string; winner: boolean; locked: boolean }>; // one cloud per vote
  style?: React.CSSProperties;
}

export default function PlayerSeat({
  player, isMe, holeCards, showFaceDown,
  currentRound, iHaveCurrentRoundChip,
  sendAction, readOnly, myCardsRevealed, canReveal = true, blackNumbers = [], canStealFrom = true,
  blackAndRed = false, guessRankUIs = [], dialogueClouds = [], style,
}: Props) {
  const [activePickerAddon, setActivePickerAddon] = useState<string | null>(null);
  useEffect(() => {
    if (activePickerAddon !== null) {
      const ui = guessRankUIs.find(u => u.addonId === activePickerAddon);
      if (!ui || ui.locked) setActivePickerAddon(null);
    }
  }, [guessRankUIs, activePickerAddon]);

  // Sort by round asc, then number asc within the same round
  const sortedChips = [...player.chips].sort((a, b) =>
    a.round !== b.round ? a.round - b.round : a.number - b.number
  );

  return (
    <div style={{
      background: isMe ? '#1a3050' : '#16213e',
      border: `2px solid ${isMe ? '#3a6090' : '#2a3a4a'}`,
      borderRadius: 10,
      padding: !readOnly && isMe ? '8px 10px 30px' : '8px 10px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 5,
      position: 'relative',
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
      <div style={{ fontSize: 12, fontWeight: 'bold', color: isMe ? '#90c0ff' : '#bbb', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140 }}>
        {player.name}{isMe ? ' (you)' : ''}
      </div>

      {/* Cards */}
      <PlayerHand cards={holeCards} faceDown={showFaceDown} small blackAndRed={blackAndRed} />

      {/* Chips — sorted by round asc, number asc; always rendered to reserve height */}
      <div style={{ display: 'flex', flexWrap: 'nowrap', gap: 4, justifyContent: 'center', minHeight: 54 }}>
        {sortedChips.map(chip => {
            const isCurrent = chip.round === currentRound;
            const isBlack = blackNumbers.includes(chip.number);
            return (
              <div key={`${chip.round}-${chip.number}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <ChipCircle chip={chip} blackInside={isBlack} />
                {!readOnly && isCurrent && isMe && !isBlack && (
                  <button style={{ ...btn, background: '#7f1c1c', color: '#fca5a5' }}
                    onClick={() => sendAction({ type: 'DISCARD_CHIP', chipNumber: chip.number })}>
                    Return
                  </button>
                )}
                {!readOnly && isCurrent && !isMe && !iHaveCurrentRoundChip && !isBlack && canStealFrom && (
                  <button style={{ ...btn, background: '#5b21b6', color: '#ddd6fe' }}
                    onClick={() => sendAction({ type: 'STEAL_CHIP', fromPlayerId: player.id, chipNumber: chip.number })}>
                    Steal
                  </button>
                )}
              </div>
            );
        })}
      </div>

      {/* Guess Rank UI — one per addon targeting this seat (shown for non-target viewers) */}
      {guessRankUIs.map(ui => (
        <div key={ui.addonId} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {activePickerAddon === ui.addonId && (
            <div style={{
              position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)',
              background: '#1e293b', border: '1px solid #475569', borderRadius: 8,
              padding: 4, zIndex: 100, display: 'flex', flexDirection: 'column', gap: 1,
              marginBottom: 2,
            }}>
              {HAND_RANKS.map(r => (
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
              onClick={() => { if (!ui.locked) setActivePickerAddon(ui.addonId); }}>
              {ui.myVote}
            </button>
          ) : (
            <button style={{ ...btn, background: '#7c3aed', color: '#ede9fe' }}
              onClick={() => setActivePickerAddon(ui.addonId)}>
              Guess Rank
            </button>
          )}
        </div>
      ))}

      {/* Reveal cards button — shown to self in finished phase until revealed */}
      {readOnly && isMe && !myCardsRevealed && (
        <button style={{ ...btn, background: canReveal ? '#166534' : '#374151', color: canReveal ? '#bbf7d0' : '#9ca3af', cursor: canReveal ? 'pointer' : 'not-allowed' }}
          disabled={!canReveal}
          onClick={() => sendAction({ type: 'REVEAL_CARDS' })}>
          Reveal cards
        </button>
      )}

      {/* Ready — only shown to the player themselves, absolutely positioned to not affect seat size */}
      {!readOnly && isMe && (
        <button
          style={{
            ...btn,
            position: 'absolute',
            bottom: 8,
            background: player.readyForNextRound ? '#166534' : '#1d4ed8',
            color: '#fff',
          }}
          onClick={() => sendAction({ type: 'SET_READY', ready: !player.readyForNextRound })}>
          {player.readyForNextRound ? 'Ready!' : 'Move to next round'}
        </button>
      )}
    </div>
  );
}
