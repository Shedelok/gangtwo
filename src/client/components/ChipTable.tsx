import React from 'react';
import type { ClientGameState, ClientAction, Chip, RoundNumber } from '@shared/types';

// Round-specific chip colors: white, yellow, orange, red
const ROUND_COLORS: Record<number, { bg: string; border: string; text: string; bgDim: string; borderDim: string }> = {
  1: { bg: '#e8e8e8', border: '#bbb',    text: '#222',    bgDim: '#2a2a2a', borderDim: '#555' },
  2: { bg: '#f5e642', border: '#c9b800', text: '#333',    bgDim: '#2a2a2a', borderDim: '#555' },
  3: { bg: '#f5a623', border: '#c47d00', text: '#222',    bgDim: '#2a2a2a', borderDim: '#555' },
  4: { bg: '#e74c3c', border: '#a93226', text: '#fff',    bgDim: '#2a2a2a', borderDim: '#555' },
};

const s: Record<string, React.CSSProperties> = {
  section: {
    marginBottom: '20px',
  },
  sectionLabel: {
    color: '#888',
    fontSize: '13px',
    marginBottom: '8px',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  chipRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    alignItems: 'center',
  },
  chip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: 'bold',
    border: '2px solid',
    userSelect: 'none',
  },
  actionButton: {
    padding: '3px 10px',
    borderRadius: '12px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  takeButton: {
    background: '#27ae60',
    color: 'white',
  },
  discardButton: {
    background: '#c0392b',
    color: 'white',
  },
  stealButton: {
    background: '#8e44ad',
    color: 'white',
  },
  playerRow: {
    marginBottom: '10px',
    padding: '10px 12px',
    background: '#16213e',
    borderRadius: '8px',
  },
  playerName: {
    fontSize: '13px',
    color: '#aaa',
    marginBottom: '6px',
  },
  readyRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: '8px',
  },
  readyLabel: {
    fontSize: '13px',
    color: '#aaa',
  },
  checkboxContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  readyDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    display: 'inline-block',
  },
};

const ROUND_NAMES: Record<number, string> = { 1: 'White', 2: 'Yellow', 3: 'Orange', 4: 'Red' };

function chipLabel(chip: Chip): string {
  return `${ROUND_NAMES[chip.round]} #${chip.number}`;
}

function chipActiveStyle(round: number): React.CSSProperties {
  const c = ROUND_COLORS[round];
  return { background: c.bg, borderColor: c.border, color: c.text };
}

function chipDimStyle(round: number): React.CSSProperties {
  const c = ROUND_COLORS[round];
  return { background: c.bgDim, borderColor: c.borderDim, color: '#666' };
}

interface Props {
  state: ClientGameState;
  sendAction: (a: ClientAction) => void;
  readOnly?: boolean;
}

export default function ChipTable({ state, sendAction, readOnly = false }: Props) {
  const currentRound = state.currentRound as RoundNumber;
  const myPlayer = state.players.find((p) => p.id === state.myId);
  const iHaveCurrentRoundChip = myPlayer?.chips.some((c) => c.round === currentRound) ?? false;

  // Split middle chips by round
  const middleCurrentChips = state.middleChips.filter((c) => c.round === currentRound);

  return (
    <div>
      {/* Middle chips */}
      <div style={s.section}>
        <div style={s.sectionLabel}>Middle (Round {currentRound})</div>
        <div style={s.chipRow}>
          {middleCurrentChips.length === 0 ? (
            <span style={{ color: '#555', fontSize: '13px' }}>Empty</span>
          ) : (
            middleCurrentChips.map((chip) => (
              <span key={chip.number} style={{ ...s.chip, ...chipActiveStyle(chip.round) }}>
                {chipLabel(chip)}
                {!readOnly && !iHaveCurrentRoundChip && (
                  <button
                    style={{ ...s.actionButton, ...s.takeButton }}
                    onClick={() => sendAction({ type: 'TAKE_FROM_MIDDLE', chipNumber: chip.number })}
                  >
                    Take
                  </button>
                )}
              </span>
            ))
          )}
        </div>
      </div>

      {/* Players */}
      <div style={s.section}>
        <div style={s.sectionLabel}>Players</div>
        {state.players.map((player) => {
          const isMe = player.id === state.myId;
          const currentChips = player.chips.filter((c) => c.round === currentRound);
          const oldChips = player.chips.filter((c) => c.round !== currentRound);

          return (
            <div key={player.id} style={s.playerRow}>
              <div style={s.playerName}>
                {player.name} {isMe ? '(you)' : ''}
              </div>
              <div style={s.chipRow}>
                {currentChips.map((chip) => (
                  <span key={`${chip.round}-${chip.number}`} style={{ ...s.chip, ...chipActiveStyle(chip.round) }}>
                    {chipLabel(chip)}
                    {!readOnly && isMe && (
                      <button
                        style={{ ...s.actionButton, ...s.discardButton }}
                        onClick={() => sendAction({ type: 'DISCARD_CHIP', chipNumber: chip.number })}
                      >
                        Discard
                      </button>
                    )}
                    {!readOnly && !isMe && !iHaveCurrentRoundChip && (
                      <button
                        style={{ ...s.actionButton, ...s.stealButton }}
                        onClick={() =>
                          sendAction({
                            type: 'STEAL_CHIP',
                            fromPlayerId: player.id,
                            chipNumber: chip.number,
                          })
                        }
                      >
                        Steal
                      </button>
                    )}
                  </span>
                ))}
                {oldChips.map((chip) => (
                  <span key={`${chip.round}-${chip.number}`} style={{ ...s.chip, ...chipDimStyle(chip.round) }}>
                    {chipLabel(chip)}
                  </span>
                ))}
                {player.chips.length === 0 && (
                  <span style={{ color: '#555', fontSize: '13px' }}>No chips</span>
                )}
              </div>

              {/* Ready checkbox / indicator */}
              <div style={s.readyRow}>
                {isMe && !readOnly ? (
                  <label style={s.checkboxContainer}>
                    <input
                      type="checkbox"
                      checked={player.readyForNextRound}
                      onChange={(e) => sendAction({ type: 'SET_READY', ready: e.target.checked })}
                    />
                    <span style={s.readyLabel}>Move to next round</span>
                  </label>
                ) : (
                  <>
                    <span
                      style={{
                        ...s.readyDot,
                        background: player.readyForNextRound ? '#2ecc71' : '#555',
                      }}
                    />
                    <span style={s.readyLabel}>
                      {player.readyForNextRound ? 'Ready' : 'Not ready'}
                    </span>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
