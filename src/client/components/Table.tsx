import React from 'react';
import type { ClientGameState, ClientAction, RoundNumber } from '@shared/types';
import PlayerSeat from './PlayerSeat';
import ChipCircle from './ChipCircle';
import CommunityCards from './CommunityCards';

// Layout constants
const CONTAINER_W = 860;
const CONTAINER_H = 600;
const OVAL_W = 440;
const OVAL_H = 230;
const OVAL_LEFT = (CONTAINER_W - OVAL_W) / 2;   // 210
const OVAL_TOP  = (CONTAINER_H - OVAL_H) / 2;   // 185
const CENTER_X  = CONTAINER_W / 2;              // 430
const CENTER_Y  = CONTAINER_H / 2;              // 300
// Seat centers are placed just outside the oval perimeter
const SEAT_RX = OVAL_W / 2 + 95;  // 315
const SEAT_RY = OVAL_H / 2 + 80;  // 195

function getSeatPos(i: number, n: number): { x: number; y: number } {
  const theta = (2 * Math.PI * i) / n;
  return {
    x: CENTER_X + SEAT_RX * Math.sin(theta),
    y: CENTER_Y + SEAT_RY * Math.cos(theta),
  };
}

interface Props {
  state: ClientGameState;
  sendAction: (a: ClientAction) => void;
  readOnly: boolean;
}

export default function Table({ state, sendAction, readOnly }: Props) {
  const currentRound = (state.currentRound ?? 1) as RoundNumber;

  // Rotate players so current player is first (bottom)
  const myIndex = state.players.findIndex(p => p.id === state.myId);
  const rotated = myIndex >= 0
    ? [...state.players.slice(myIndex), ...state.players.slice(0, myIndex)]
    : state.players;

  const myPlayer = state.players.find(p => p.id === state.myId);
  const iHaveCurrentRoundChip = !!myPlayer?.chips.some(c => c.round === currentRound);

  const n = rotated.length;

  return (
    <div style={{ position: 'relative', width: CONTAINER_W, height: CONTAINER_H }}>

      {/* Green oval */}
      <div style={{
        position: 'absolute',
        left: OVAL_LEFT,
        top: OVAL_TOP,
        width: OVAL_W,
        height: OVAL_H,
        borderRadius: '50%',
        background: 'radial-gradient(ellipse at center, #1e6b1e 0%, #155215 100%)',
        boxShadow: 'inset 0 0 40px rgba(0,0,0,0.4), 0 4px 24px rgba(0,0,0,0.5)',
        border: '3px solid #0d3d0d',
      }}>
        {/* Center content: round indicator + community cards + middle chips */}
        <div style={{
          width: '100%', height: '100%',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: 8,
        }}>
          {/* Round / Game Over badge */}
          <div style={{
            background: 'rgba(0,0,0,0.45)',
            color: '#f0c040',
            borderRadius: 12,
            padding: '2px 12px',
            fontSize: 12,
            fontWeight: 'bold',
            letterSpacing: 1,
          }}>
            {readOnly ? 'GAME OVER' : `ROUND ${currentRound} / 4`}
          </div>

          {/* Community cards */}
          {state.communityCards.length > 0 && (
            <CommunityCards cards={state.communityCards} />
          )}

          {/* Middle chips */}
          {state.middleChips.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
              {[...state.middleChips].sort((a, b) => a.number - b.number).map(chip => (
                <div key={chip.number} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <ChipCircle chip={chip} size={30} />
                  {!readOnly && !iHaveCurrentRoundChip && (
                    <button onClick={() => sendAction({ type: 'TAKE_FROM_MIDDLE', chipNumber: chip.number })}
                      style={{
                        padding: '2px 7px', borderRadius: 10, border: 'none',
                        cursor: 'pointer', fontSize: 10, fontWeight: 'bold',
                        background: '#166534', color: '#bbf7d0',
                      }}>
                      Take
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Player seats */}
      {rotated.map((player, i) => {
        const { x, y } = getSeatPos(i, n);
        const isMe = player.id === state.myId;
        const holeCards = readOnly
          ? (state.revealedHoleCards[player.id] ?? null)
          : isMe ? state.myHoleCards : null;
        const showFaceDown = !readOnly && !isMe;

        return (
          <PlayerSeat
            key={player.id}
            player={player}
            isMe={isMe}
            holeCards={holeCards}
            showFaceDown={showFaceDown}
            currentRound={currentRound}
            iHaveCurrentRoundChip={iHaveCurrentRoundChip}
            sendAction={sendAction}
            readOnly={readOnly}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              transform: 'translate(-50%, -50%)',
            }}
          />
        );
      })}
    </div>
  );
}
