import React from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import Lobby from './components/Lobby';
import Game from './components/Game';
const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: '60px 20px 40px',
  },
  status: {
    color: '#888',
    fontSize: '14px',
  },
  error: {
    background: '#3d1a1a',
    border: '1px solid #c0392b',
    color: '#e74c3c',
    padding: '10px 16px',
    borderRadius: '6px',
    marginBottom: '16px',
    fontSize: '14px',
  },
  stopButton: {
    position: 'fixed',
    top: '16px',
    right: '16px',
    padding: '8px 18px',
    fontSize: '13px',
    background: '#7f1c1c',
    color: '#fca5a5',
    border: '1px solid #b91c1c',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  restartButton: {
    position: 'fixed',
    top: '16px',
    right: '140px',
    padding: '8px 18px',
    fontSize: '13px',
    background: '#1a4731',
    color: '#bbf7d0',
    border: '1px solid #166534',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
};


export default function App() {
  const { state, sendAction, lastError, status } = useWebSocket();

  if (status === 'disconnected' && !state) {
    return (
      <div style={styles.container}>
        <div style={styles.status}>Disconnected. Reconnecting...</div>
      </div>
    );
  }

  if (!state) {
    return (
      <div style={styles.container}>
        <div style={styles.status}>Connecting...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <button style={styles.restartButton} onClick={() => sendAction({ type: 'RESTART_GAME' })}>
        Restart
      </button>
      <button style={styles.stopButton} onClick={() => sendAction({ type: 'FINISH_GAME' })}>
        Stop the game
      </button>
      {lastError && <div style={styles.error}>{lastError}</div>}
      {state.phase === 'lobby' && <Lobby state={state} sendAction={sendAction} />}
      {state.phase === 'game' && <Game state={state} sendAction={sendAction} />}
      {state.phase === 'finished' && <Game state={state} sendAction={sendAction} readOnly={true} />}
    </div>
  );
}
