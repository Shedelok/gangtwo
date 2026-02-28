import React, { useEffect, useRef, useState } from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import Lobby from './components/Lobby';
import Game from './components/Game';
import type { ClientGameState } from '@shared/types';

function playSound(src: string, speed: number, masterVolume: number): void {
  try {
    const audio = new Audio(src);
    audio.volume = masterVolume;
    audio.playbackRate = speed;
    audio.play().catch(() => {});
  } catch { /* audio not supported */ }
}
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
  volumeControl: {
    position: 'fixed',
    top: '16px',
    left: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
    color: '#aaa',
  },
};


export default function App() {
  const { state, sendAction, lastError, status } = useWebSocket();
  const [volume, setVolume] = useState(1);
  const volumeRef = useRef(volume);
  volumeRef.current = volume;

  const prevStateRef = useRef<ClientGameState | null>(null);

  useEffect(() => {
    const prev = prevStateRef.current;
    prevStateRef.current = state;
    if (!state || !prev || state.phase !== 'game') return;

    const currentRound = state.currentRound;
    if (!currentRound) return;

    // Collect all chip locations in prev and current state
    function chipLocs(s: ClientGameState): Map<string, string> {
      const m = new Map<string, string>();
      for (const c of s.middleChips) m.set(`${c.round}-${c.number}`, 'middle');
      for (const p of s.players)
        for (const c of p.chips) m.set(`${c.round}-${c.number}`, p.id);
      return m;
    }
    const prevLocs = chipLocs(prev);
    const currLocs = chipLocs(state);

    let anyMoved = false;
    let stolenFromMe = false;
    for (const [key, currLoc] of currLocs) {
      const prevLoc = prevLocs.get(key);
      if (prevLoc !== undefined && prevLoc !== currLoc) {
        anyMoved = true;
        if (state.myId && prevLoc === state.myId && currLoc !== 'middle') {
          stolenFromMe = true;
        }
      }
    }

    if (stolenFromMe) playSound('/honk-honk.mp3', 1.8, volumeRef.current);
    else if (anyMoved) playSound('/fast-woosh.mp3', 1, volumeRef.current * 0.2);
  }, [state]);

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
      <div style={styles.volumeControl}>
        <span>Volume</span>
        <input type="range" min={0} max={1} step={0.01} value={volume}
          onChange={e => setVolume(parseFloat(e.target.value))}
          style={{ width: 80 }} />
      </div>
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
