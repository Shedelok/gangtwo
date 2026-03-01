import React, { useEffect, useRef, useState } from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import Lobby from './components/Lobby';
import Game from './components/Game';
import type { ClientGameState } from '@shared/types';
import { ADDONS } from './addons';

const AVAILABLE_MP3S = ['bell-1.mp3', 'ding-dong.mp3', 'fast-woosh.mp3', 'honk-honk.mp3', 'kick-1.mp3', 'kick-2.mp3', 'punch-1.mp3', 'punch-2.mp3'];

type SoundKey = 'STEAL_FROM_YOU' | 'CHIP_MOVE';
const SOUND_DEFAULTS: Record<SoundKey, string> = {
  STEAL_FROM_YOU: 'bell-1.mp3',
  CHIP_MOVE: 'fast-woosh.mp3',
};
const SOUND_LABELS: Record<SoundKey, string> = {
  STEAL_FROM_YOU: 'Steal from you',
  CHIP_MOVE: 'Chip move',
};
const SOUND_VOLUME_MULTIPLIER: Record<SoundKey, number> = {
  STEAL_FROM_YOU: 1,
  CHIP_MOVE: 0.2,
};

function playSound(file: string, masterVolume: number, multiplier: number): void {
  try {
    const audio = new Audio(`/${file}`);
    audio.volume = Math.min(1, masterVolume * multiplier);
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
  leftPanel: {
    position: 'fixed',
    top: '16px',
    left: '16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '8px',
    fontSize: '12px',
    color: '#aaa',
    maxWidth: '220px',
  },
  soundBarRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  soundPanel: {
    background: '#1a2030',
    border: '1px solid #2a3a4a',
    borderRadius: '8px',
    padding: '10px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginTop: '4px',
  },
  soundPanelRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
    color: '#ccc',
  },
  addonPanel: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    marginTop: '4px',
  },
  addonTitle: {
    color: '#666',
    fontSize: '11px',
    marginBottom: '4px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  addonItem: {
    position: 'relative',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '6px',
    padding: '5px 6px',
    borderRadius: '5px',
    cursor: 'default',
  },
  addonItemHovered: {
    background: '#1e2d4a',
  },
  addonShort: {
    fontSize: '12px',
    color: '#ccc',
    lineHeight: '1.4',
  },
  addonTooltip: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: '4px',
    background: '#0f1a2e',
    border: '1px solid #2a3a4a',
    borderRadius: '6px',
    padding: '8px 10px',
    fontSize: '12px',
    color: '#aaa',
    lineHeight: '1.5',
    zIndex: 10,
    whiteSpace: 'normal',
  },
};

export default function App() {
  const { state, sendAction, lastError, status } = useWebSocket();
  const [volume, setVolume] = useState(0.5);
  const volumeRef = useRef(volume);
  volumeRef.current = volume;

  const [soundFiles, setSoundFiles] = useState<Record<SoundKey, string>>(SOUND_DEFAULTS);
  const soundFilesRef = useRef(soundFiles);
  soundFilesRef.current = soundFiles;

  const [soundPanelOpen, setSoundPanelOpen] = useState(false);
  const [hoveredAddon, setHoveredAddon] = useState<string | null>(null);

  const prevStateRef = useRef<ClientGameState | null>(null);

  useEffect(() => {
    const prev = prevStateRef.current;
    prevStateRef.current = state;
    if (!state || !prev || state.phase !== 'game') return;

    const currentRound = state.currentRound;
    if (!currentRound) return;

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

    const files = soundFilesRef.current;
    const vol = volumeRef.current;
    if (stolenFromMe) playSound(files.STEAL_FROM_YOU, vol, SOUND_VOLUME_MULTIPLIER.STEAL_FROM_YOU);
    else if (anyMoved) playSound(files.CHIP_MOVE, vol, SOUND_VOLUME_MULTIPLIER.CHIP_MOVE);
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

  const isLobby = state.phase === 'lobby';
  const visibleAddons = isLobby ? ADDONS : ADDONS.filter(a => state.enabledAddons.includes(a.id));

  return (
    <div style={styles.container}>
      <div style={styles.leftPanel}>
        <div style={styles.soundBarRow}>
          <span>Volume</span>
          <input type="range" min={0} max={1} step={0.01} value={volume}
            onChange={e => setVolume(parseFloat(e.target.value))}
            style={{ width: 80 }} />
          <button
            onClick={() => setSoundPanelOpen(o => !o)}
            style={{ padding: '2px 8px', fontSize: 11, cursor: 'pointer', borderRadius: 4, border: '1px solid #444', background: '#2a3a4a', color: '#ccc' }}>
            {soundPanelOpen ? 'Close sounds' : 'Sounds'}
          </button>
        </div>
        {soundPanelOpen && (
          <div style={styles.soundPanel}>
            {(Object.keys(SOUND_DEFAULTS) as SoundKey[]).map(key => (
              <div key={key} style={styles.soundPanelRow}>
                <span style={{ minWidth: 110 }}>{SOUND_LABELS[key]}</span>
                <select
                  value={soundFiles[key]}
                  onChange={e => setSoundFiles(prev => ({ ...prev, [key]: e.target.value }))}
                  style={{ background: '#1a2030', color: '#ccc', border: '1px solid #444', borderRadius: 4, fontSize: 11 }}>
                  {AVAILABLE_MP3S.map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )}
        {visibleAddons.length > 0 && (
          <div style={styles.addonPanel}>
            <div style={styles.addonTitle}>Addons</div>
            {visibleAddons.map((addon) => {
              const enabled = state.enabledAddons.includes(addon.id);
              const hovered = hoveredAddon === addon.id;
              return (
                <div
                  key={addon.id}
                  style={{ ...styles.addonItem, ...(hovered ? styles.addonItemHovered : {}) }}
                  onMouseEnter={() => setHoveredAddon(addon.id)}
                  onMouseLeave={() => setHoveredAddon(null)}
                >
                  {isLobby && (
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={() => sendAction({ type: 'TOGGLE_ADDON', addonId: addon.id })}
                      style={{ marginTop: '2px', flexShrink: 0, cursor: 'pointer' }}
                    />
                  )}
                  <span style={styles.addonShort}>{addon.short}</span>
                  {hovered && <div style={styles.addonTooltip}>{addon.long}</div>}
                </div>
              );
            })}
          </div>
        )}
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
