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
  style?: React.CSSProperties;
}

export default function PlayerSeat({
  player, isMe, holeCards, showFaceDown,
  currentRound, iHaveCurrentRoundChip,
  sendAction, readOnly, style,
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
      padding: '8px 10px',
      width: 148,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 5,
      ...style,
    }}>
      {/* Name */}
      <div style={{ fontSize: 12, fontWeight: 'bold', color: isMe ? '#90c0ff' : '#bbb', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
        {player.name}{isMe ? ' (you)' : ''}
      </div>

      {/* Cards */}
      <PlayerHand cards={holeCards} faceDown={showFaceDown} small />

      {/* Chips — sorted by round asc, number asc */}
      {sortedChips.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'center' }}>
          {sortedChips.map(chip => {
            const isCurrent = chip.round === currentRound;
            return (
              <div key={`${chip.round}-${chip.number}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <ChipCircle chip={chip} />
                {!readOnly && isCurrent && isMe && (
                  <button style={{ ...btn, background: '#7f1c1c', color: '#fca5a5' }}
                    onClick={() => sendAction({ type: 'DISCARD_CHIP', chipNumber: chip.number })}>
                    Return
                  </button>
                )}
                {!readOnly && isCurrent && !isMe && !iHaveCurrentRoundChip && (
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

      {/* Ready — only shown to the player themselves */}
      {!readOnly && isMe && (
        <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', fontSize: 11, color: '#aaa' }}>
          <input type="checkbox" checked={player.readyForNextRound}
            onChange={e => sendAction({ type: 'SET_READY', ready: e.target.checked })} />
          Move to next round
        </label>
      )}
    </div>
  );
}
