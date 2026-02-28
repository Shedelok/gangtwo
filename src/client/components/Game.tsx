import React from 'react';
import type { ClientGameState, ClientAction } from '@shared/types';
import CommunityCards from './CommunityCards';
import ChipTable from './ChipTable';
import PlayerHand from './PlayerHand';

const s: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    maxWidth: '640px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#f0c040',
  },
  roundBadge: {
    background: '#2980b9',
    color: 'white',
    borderRadius: '20px',
    padding: '4px 16px',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  section: {
    background: '#16213e',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '16px',
  },
  sectionTitle: {
    color: '#888',
    fontSize: '12px',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    marginBottom: '12px',
  },
};

interface Props {
  state: ClientGameState;
  sendAction: (a: ClientAction) => void;
  readOnly?: boolean;
}

export default function Game({ state, sendAction, readOnly = false }: Props) {
  return (
    <div style={s.container}>
      <div style={s.header}>
        <div style={s.title}>Gang Game</div>
        <div style={s.roundBadge}>
          {readOnly ? 'Game Over' : `Round ${state.currentRound} / 4`}
        </div>
      </div>

      <div style={s.section}>
        <div style={s.sectionTitle}>Community Cards</div>
        <CommunityCards cards={state.communityCards} />
      </div>

      {readOnly ? (
        <div style={s.section}>
          <div style={s.sectionTitle}>All Hands</div>
          {state.players.map((p) => (
            <div key={p.id} style={{ marginBottom: '12px' }}>
              <div style={{ color: '#aaa', fontSize: '13px', marginBottom: '6px' }}>
                {p.name}{p.id === state.myId ? ' (you)' : ''}
              </div>
              <PlayerHand cards={state.revealedHoleCards[p.id] ?? null} />
            </div>
          ))}
        </div>
      ) : (
        <div style={s.section}>
          <div style={s.sectionTitle}>Your Hand</div>
          <PlayerHand cards={state.myHoleCards} />
        </div>
      )}

      <div style={s.section}>
        <div style={s.sectionTitle}>Chips</div>
        <ChipTable state={state} sendAction={sendAction} readOnly={readOnly} />
      </div>
    </div>
  );
}
