import React from 'react';
import type { PlayerPublicState, Card, RoundNumber, ClientAction } from '@shared/types';
import PlayerHand from './PlayerHand';
import ChipCircle from './ChipCircle';

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
  blackNumbers?: number[];
  style?: React.CSSProperties;
}

export default function PlayerSeat({
  player, isMe, holeCards, showFaceDown,
  currentRound, iHaveCurrentRoundChip,
  sendAction, readOnly, myCardsRevealed, blackNumbers = [], style,
}: Props) {
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
      {/* Name */}
      <div style={{ fontSize: 12, fontWeight: 'bold', color: isMe ? '#90c0ff' : '#bbb', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140 }}>
        {player.name}{isMe ? ' (you)' : ''}
      </div>

      {/* Cards */}
      <PlayerHand cards={holeCards} faceDown={showFaceDown} small />

      {/* Chips — sorted by round asc, number asc */}
      {sortedChips.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'nowrap', gap: 4, justifyContent: 'center' }}>
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
                {!readOnly && isCurrent && !isMe && !iHaveCurrentRoundChip && !isBlack && (
                  <button style={{ ...btn, background: '#5b21b6', color: '#ddd6fe' }}
                    onClick={() => sendAction({ type: 'STEAL_CHIP', fromPlayerId: player.id, chipNumber: chip.number })}>
                    Steal
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Reveal cards button — shown to self in finished phase until revealed */}
      {readOnly && isMe && !myCardsRevealed && (
        <button style={{ ...btn, background: '#166534', color: '#bbf7d0' }}
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
