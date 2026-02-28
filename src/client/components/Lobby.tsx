import React, { useState } from 'react';
import type { ClientGameState, ClientAction } from '@shared/types';

const s: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    maxWidth: '480px',
  },
  title: {
    fontSize: '36px',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: '8px',
    color: '#f0c040',
    letterSpacing: '2px',
  },
  subtitle: {
    textAlign: 'center',
    color: '#888',
    marginBottom: '32px',
  },
  card: {
    background: '#16213e',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    color: '#aaa',
    fontSize: '14px',
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid #333',
    background: '#0f3460',
    color: 'white',
    fontSize: '16px',
    marginBottom: '12px',
    outline: 'none',
  },
  button: {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: 'none',
    background: '#2980b9',
    color: 'white',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  startButton: {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: 'none',
    background: '#27ae60',
    color: 'white',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: '8px',
  },
  disabledButton: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  playerList: {
    listStyle: 'none',
  },
  playerItem: {
    padding: '8px 12px',
    borderRadius: '6px',
    background: '#0f3460',
    marginBottom: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  dot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#2ecc71',
    display: 'inline-block',
  },
  hint: {
    color: '#666',
    fontSize: '13px',
    textAlign: 'center',
    marginTop: '8px',
  },
};

interface Props {
  state: ClientGameState;
  sendAction: (a: ClientAction) => void;
}

export default function Lobby({ state, sendAction }: Props) {
  const [nameInput, setNameInput] = useState('');

  const hasJoined = state.myId !== '';
  const canStart = state.players.length >= 2;

  function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (nameInput.trim()) {
      sendAction({ type: 'JOIN_LOBBY', name: nameInput.trim() });
      setNameInput('');
    }
  }

  return (
    <div style={s.container}>
      <div style={s.title}>GANG GAME</div>
      <div style={s.subtitle}>A multiplayer card game</div>

      {!hasJoined ? (
        <div style={s.card}>
          <form onSubmit={handleJoin}>
            <label style={s.label}>Enter your display name</label>
            <input
              style={s.input}
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Your name..."
              maxLength={20}
              autoFocus
            />
            <button style={s.button} type="submit" disabled={!nameInput.trim()}>
              Join Lobby
            </button>
          </form>
        </div>
      ) : (
        <div style={s.card}>
          <label style={s.label}>Players in lobby ({state.players.length})</label>
          <ul style={s.playerList}>
            {state.players.map((p) => (
              <li key={p.id} style={s.playerItem}>
                <span style={s.dot} />
                {p.name}
                {p.id === state.myId && ' (you)'}
              </li>
            ))}
          </ul>
          <button
            style={{ ...s.startButton, ...(canStart ? {} : s.disabledButton) }}
            onClick={() => sendAction({ type: 'START_GAME' })}
            disabled={!canStart}
          >
            Start Game
          </button>
          {!canStart && <div style={s.hint}>Need at least 2 players to start</div>}
        </div>
      )}
    </div>
  );
}
