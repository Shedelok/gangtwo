import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useWebSocket } from './hooks/useWebSocket';
import Lobby from './components/Lobby';
import Game from './components/Game';
import ActionCardPanel, { type ActionWorkflowStep, CARD_W, CARD_H } from './components/ActionCardPanel';
import type { ClientGameState } from '@shared/types';
import { ADDONS, type AddonDef } from './addons';

const AVAILABLE_MP3S = ['bell-1.mp3', 'car-engine-start.mp3', 'card-flip.mp3', 'ding-dong.mp3', 'fast-woosh.mp3', 'honk-honk.mp3', 'kick-1.mp3', 'kick-2.mp3', 'magic-1.mp3', 'punch-1.mp3', 'punch-2.mp3'];

type SoundKey = 'STEAL_FROM_YOU' | 'CHIP_MOVE' | 'CARD_FLIP' | 'GAME_START' | 'ACTION_CARD_PLAYED';
const SOUND_DEFAULTS: Record<SoundKey, string> = {
  STEAL_FROM_YOU: 'bell-1.mp3',
  CHIP_MOVE: 'fast-woosh.mp3',
  CARD_FLIP: 'card-flip.mp3',
  GAME_START: 'car-engine-start.mp3',
  ACTION_CARD_PLAYED: 'magic-1.mp3',
};
const SOUND_LABELS: Record<SoundKey, string> = {
  STEAL_FROM_YOU: 'Steal from you',
  CHIP_MOVE: 'Chip move',
  CARD_FLIP: 'Card flip',
  GAME_START: 'Game start',
  ACTION_CARD_PLAYED: 'Action card played',
};
const SOUND_VOLUME_MULTIPLIER: Record<SoundKey, number> = {
  STEAL_FROM_YOU: 1,
  CHIP_MOVE: 0.2,
  CARD_FLIP: 1,
  GAME_START: 1,
  ACTION_CARD_PLAYED: 1,
};

const preloadedAudio: Record<string, HTMLAudioElement> = {};
for (const file of AVAILABLE_MP3S) {
  try {
    const audio = new Audio(`/${file}`);
    audio.preload = 'auto';
    preloadedAudio[file] = audio;
  } catch { /* audio not supported */ }
}

function playSound(file: string, masterVolume: number, multiplier: number): void {
  try {
    const audio = preloadedAudio[file];
    if (!audio) return;
    audio.currentTime = 0;
    audio.volume = Math.min(1, masterVolume * multiplier);
    audio.play().catch(() => {});
  } catch { /* audio not supported */ }
}

const ADDON_COUNT_BITS = 3; // covers 0–6 negative addons
const POS_COUNT_BITS = 2;  // covers 0–2 positive addons
const RFC4648 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function encodeSetup(addonPool: string[], negativeAddonCount: number, positiveAddonCount: number): string {
  let bits = '';
  for (const addon of ADDONS) {
    bits += addonPool.includes(addon.id) ? '1' : '0';
  }
  bits += Math.min(negativeAddonCount, (1 << ADDON_COUNT_BITS) - 1).toString(2).padStart(ADDON_COUNT_BITS, '0');
  bits += Math.min(positiveAddonCount, (1 << POS_COUNT_BITS) - 1).toString(2).padStart(POS_COUNT_BITS, '0');
  let num = parseInt(bits, 2);
  if (num === 0) return RFC4648[0];
  let result = '';
  while (num > 0) {
    result = RFC4648[num % 32] + result;
    num = Math.floor(num / 32);
  }
  return result;
}

function decodeSetup(code: string): { addonPool: string[]; negativeAddonCount: number; positiveAddonCount: number } | null {
  if (!code) return null;
  let num = 0;
  for (const ch of code.toUpperCase()) {
    const val = RFC4648.indexOf(ch);
    if (val === -1) return null;
    num = num * 32 + val;
  }
  const totalBits = ADDONS.length + ADDON_COUNT_BITS + POS_COUNT_BITS;
  const bits = num.toString(2).padStart(totalBits, '0');
  if (bits.length > totalBits) return null;
  const addonPool: string[] = [];
  for (let i = 0; i < ADDONS.length; i++) {
    if (bits[i] === '1') addonPool.push(ADDONS[i].id);
  }
  const negCount = parseInt(bits.slice(ADDONS.length, ADDONS.length + ADDON_COUNT_BITS), 2);
  const posCount = parseInt(bits.slice(ADDONS.length + ADDON_COUNT_BITS), 2);
  return { addonPool, negativeAddonCount: negCount, positiveAddonCount: posCount };
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
  topRightButtons: {
    position: 'fixed',
    top: '16px',
    right: '16px',
    display: 'flex',
    gap: '8px',
  },
  stopButton: {
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
    color: '#aaa',
    fontSize: '12px',
    marginBottom: '4px',
    textTransform: 'uppercase',
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

function FlyingActionCard({ from, to, label, snap = false }: { from: { x: number; y: number }; to: { x: number; y: number }; label: string; snap?: boolean }) {
  const [arrived, setArrived] = useState(snap);
  useEffect(() => {
    if (snap) return;
    const raf = requestAnimationFrame(() => setArrived(true));
    return () => cancelAnimationFrame(raf);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const atDest = arrived || snap;
  return createPortal(
    <div style={{
      position: 'fixed',
      left: atDest ? to.x : from.x,
      top: atDest ? to.y : from.y,
      width: CARD_W,
      height: CARD_H,
      transition: atDest && !snap ? 'left 2s ease, top 2s ease' : 'none',
      zIndex: 1000,
      pointerEvents: 'none',
      borderRadius: 6,
      border: '2px solid #4a7a4a',
      background: '#1a2d1a',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '6px 4px', textAlign: 'center',
      userSelect: 'none',
    }}>
      <div style={{ fontSize: 9, color: '#90c090', lineHeight: 1.4 }}>{label}</div>
    </div>,
    document.body
  );
}

export default function App() {
  const { state, sendAction, lastError, status } = useWebSocket();
  const [volume, setVolume] = useState(0.5);
  const volumeRef = useRef(volume);
  volumeRef.current = volume;

  const [soundFiles, setSoundFiles] = useState<Record<SoundKey, string>>(SOUND_DEFAULTS);
  const soundFilesRef = useRef(soundFiles);
  soundFilesRef.current = soundFiles;

  const [soundPanelOpen, setSoundPanelOpen] = useState(false);
  const [handHintVisible, setHandHintVisible] = useState(false);
  const [hoveredAddon, setHoveredAddon] = useState<string | null>(null);
  const [hoveredAddonRow, setHoveredAddonRow] = useState<string | null>(null);
  const [codeInput, setCodeInput] = useState('');
  const [codeFocused, setCodeFocused] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const handHintRef = useRef<HTMLDivElement>(null);
  const [handHintPos, setHandHintPos] = useState<{ top: number; left: number } | null>(null);
  const [actionStep, setActionStep] = useState<ActionWorkflowStep>('idle');
  const [actionCardIndex, setActionCardIndex] = useState<0 | 1 | null>(null);
  const [activeAddonId, setActiveAddonId] = useState<string | null>(null);
  const cardElsRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const seatElsRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const prevLockRef = useRef<ClientGameState['actionCardLock'] | undefined>(undefined);
  const [flyingCard, setFlyingCard] = useState<{ from: { x: number; y: number }; to: { x: number; y: number }; label: string; snap?: boolean } | null>(null);
  const flyingCardRef = useRef(flyingCard);
  flyingCardRef.current = flyingCard;
  const returnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!state || state.phase !== 'lobby' || codeFocused) return;
    setCodeInput(encodeSetup(state.addonPool, state.negativeAddonCount, state.positiveAddonCount));
  }, [state, codeFocused]);

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

    const gameJustStarted = state.phase === 'game' && state.gameId !== prev.gameId;
    if (gameJustStarted) {
      playSound(files.GAME_START, vol, SOUND_VOLUME_MULTIPLIER.GAME_START);
      return;
    }

    if (stolenFromMe) playSound(files.STEAL_FROM_YOU, vol, SOUND_VOLUME_MULTIPLIER.STEAL_FROM_YOU);
    else if (anyMoved) playSound(files.CHIP_MOVE, vol, SOUND_VOLUME_MULTIPLIER.CHIP_MOVE);

    if (state.communityCards.length > prev.communityCards.length) {
      playSound(files.CARD_FLIP, vol, SOUND_VOLUME_MULTIPLIER.CARD_FLIP);
    }

    const shownCardChanged = state.myShownCard !== prev.myShownCard;
    if (shownCardChanged) {
      playSound(files.CARD_FLIP, vol, SOUND_VOLUME_MULTIPLIER.CARD_FLIP);
    }

    const actionCardCommitted =
      (!prev.showCardUsed && state.showCardUsed) ||
      (!prev.unsuitedJackUsed && state.unsuitedJackUsed) ||
      (!prev.rerollCommonUsed && state.rerollCommonUsed);
    if (actionCardCommitted) {
      playSound(files.ACTION_CARD_PLAYED, vol, SOUND_VOLUME_MULTIPLIER.ACTION_CARD_PLAYED);
    }
  }, [state]);

  useLayoutEffect(() => {
    if (!state) return;
    const prev = prevLockRef.current;
    const curr = state.actionCardLock;
    prevLockRef.current = curr;
    const isInitial = prev === undefined;

    // Helper: show card at player's seat immediately without animation
    const snapToSeat = (addonId: string, playerId: string) => {
      const seatEl = seatElsRef.current.get(playerId);
      if (seatEl) {
        const sr = seatEl.getBoundingClientRect();
        const addonDef = ADDONS.find(a => a.id === addonId);
        const pos = { x: sr.left + sr.width / 2 - CARD_W / 2, y: sr.top + sr.height / 2 - CARD_H / 2 };
        setFlyingCard({ from: pos, to: pos, label: addonDef?.short ?? addonId, snap: true });
      }
    };

    // Initial page load: if lock already set, show card at player without animation
    if (isInitial) {
      if (curr && curr.playerId !== state.myId) snapToSeat(curr.addonId, curr.playerId);
      return;
    }

    // Lock acquired by another player — animate card to their seat
    if (!prev && curr && curr.playerId !== state.myId) {
      if (returnTimerRef.current) { clearTimeout(returnTimerRef.current); returnTimerRef.current = null; }
      if (document.hidden) {
        // Tab was hidden — skip animation, snap to destination
        snapToSeat(curr.addonId, curr.playerId);
      } else {
        const cardEl = cardElsRef.current.get(curr.addonId);
        const seatEl = seatElsRef.current.get(curr.playerId);
        if (cardEl && seatEl) {
          const cr = cardEl.getBoundingClientRect();
          const sr = seatEl.getBoundingClientRect();
          const addonDef = ADDONS.find(a => a.id === curr.addonId);
          setFlyingCard({
            from: { x: cr.left, y: cr.top },
            to: { x: sr.left + sr.width / 2 - CARD_W / 2, y: sr.top + sr.height / 2 - CARD_H / 2 },
            label: addonDef?.short ?? curr.addonId,
          });
        }
      }
    }
    // Lock released
    if (prev && !curr) {
      const wasUsed = (prev.addonId === 'show-1-card-to-1-player' && state.showCardUsed)
        || (prev.addonId === 'action-unsuited-jack' && state.unsuitedJackUsed)
        || (prev.addonId === 'action-reroll-common' && state.rerollCommonUsed);
      if (wasUsed) {
        setFlyingCard(null);
      } else {
        // Card was cancelled — animate back to the panel
        const current = flyingCardRef.current;
        const cardEl = cardElsRef.current.get(prev.addonId);
        if (current && cardEl) {
          const cr = cardEl.getBoundingClientRect();
          setFlyingCard({ from: current.to, to: { x: cr.left, y: cr.top }, label: current.label });
          returnTimerRef.current = setTimeout(() => { setFlyingCard(null); returnTimerRef.current = null; }, 2100);
        } else {
          setFlyingCard(null);
        }
      }
    }
  }, [state?.actionCardLock]); // eslint-disable-line react-hooks/exhaustive-deps

  // Snap in-progress outgoing animation to destination when tab becomes visible
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        const fc = flyingCardRef.current;
        if (fc && returnTimerRef.current === null) {
          setFlyingCard({ from: fc.to, to: fc.to, label: fc.label, snap: true });
        }
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

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
  const negativeAddons = visibleAddons.filter(a => a.type === 'negative');
  const positiveAddons = visibleAddons.filter(a => a.type === 'positive');

  const currentCode = encodeSetup(state.addonPool, state.negativeAddonCount, state.positiveAddonCount);

  const adjustCount = (addonType: 'negative' | 'positive', delta: number) => {
    const current = addonType === 'negative' ? state.negativeAddonCount : state.positiveAddonCount;
    sendAction({ type: 'SET_ADDON_COUNT', addonType, count: Math.max(0, current + delta) });
  };

  const applySetupCode = (code: string) => {
    setCodeInput(code);
    const decoded = decodeSetup(code);
    if (!decoded) return;
    for (const addon of ADDONS) {
      const shouldBeInPool = decoded.addonPool.includes(addon.id);
      const isInPool = state.addonPool.includes(addon.id);
      if (shouldBeInPool !== isInPool) {
        sendAction({ type: 'TOGGLE_ADDON', addonId: addon.id });
      }
    }
    if (decoded.negativeAddonCount !== state.negativeAddonCount) {
      sendAction({ type: 'SET_ADDON_COUNT', addonType: 'negative', count: decoded.negativeAddonCount });
    }
    if (decoded.positiveAddonCount !== state.positiveAddonCount) {
      sendAction({ type: 'SET_ADDON_COUNT', addonType: 'positive', count: decoded.positiveAddonCount });
    }
  };

  const renderAddon = (addon: AddonDef) => {
    const inPool = state.addonPool.includes(addon.id);
    const hovered = hoveredAddon === addon.id;
    const rowHovered = hoveredAddonRow === addon.id;
    return (
      <div key={addon.id} style={{ ...styles.addonItem, ...(rowHovered ? { background: '#1e2d4a' } : {}) }}
        onMouseEnter={() => setHoveredAddonRow(addon.id)}
        onMouseLeave={() => setHoveredAddonRow(null)}>
        {isLobby && (
          <input
            type="checkbox"
            checked={inPool}
            onChange={() => sendAction({ type: 'TOGGLE_ADDON', addonId: addon.id })}
            style={{ marginTop: '2px', flexShrink: 0, cursor: 'pointer' }}
          />
        )}
        <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={styles.addonShort}>{addon.short}</span>
          <span
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 14, height: 14, borderRadius: '50%', border: '1px solid #555', color: '#888', fontSize: 10, cursor: 'default', userSelect: 'none', flexShrink: 0 }}
            onMouseEnter={() => setHoveredAddon(addon.id)}
            onMouseLeave={() => setHoveredAddon(null)}
          >?</span>
          {hovered && <div style={styles.addonTooltip} onMouseEnter={() => setHoveredAddon(null)}>{addon.long}</div>}
        </div>
      </div>
    );
  };

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
          <div ref={handHintRef} style={{ display: 'inline-block' }}
            onMouseEnter={() => {
              const rect = handHintRef.current?.getBoundingClientRect();
              if (rect) setHandHintPos({ top: rect.bottom + 6, left: rect.left });
              setHandHintVisible(true);
            }}
            onMouseLeave={() => setHandHintVisible(false)}>
            <span style={{ color: '#aaa', fontSize: 11, cursor: 'default', userSelect: 'none', textDecoration: 'underline dotted' }}>Hand Ranking</span>
            {handHintVisible && handHintPos && createPortal(
              <img src="/hand-ranking.png" alt="Hand rankings"
                style={{ position: 'fixed', top: handHintPos.top, left: handHintPos.left, maxWidth: 320, borderRadius: 6, boxShadow: '0 4px 16px rgba(0,0,0,0.6)', zIndex: 9999 }} />,
              document.body
            )}
          </div>
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
            <div style={{ ...styles.addonTitle, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>Addons</span>
              {isLobby ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <input
                    value={codeInput}
                    onChange={e => applySetupCode(e.target.value)}
                    onFocus={() => setCodeFocused(true)}
                    onBlur={() => { setCodeFocused(false); setCodeInput(currentCode); }}
                    spellCheck={false}
                    style={{ width: 48, fontSize: 10, fontFamily: 'monospace', background: '#1a2030', color: '#aaa', border: '1px solid #444', borderRadius: 3, padding: '1px 4px' }}
                    placeholder="code"
                  />
                  <button
                    onClick={() => navigator.clipboard.writeText(currentCode).then(() => { setCodeCopied(true); setTimeout(() => setCodeCopied(false), 2000); }).catch(() => {})}
                    style={{ padding: '1px 5px', fontSize: 10, cursor: 'pointer', borderRadius: 3, border: '1px solid #444', background: '#2a3a4a', color: '#aaa', position: 'relative' }}
                    title="Copy setup code"
                  ><span style={{ visibility: 'hidden' }}>Copy</span><span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{codeCopied ? '✓' : 'Copy'}</span></button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#aaa' }}>{currentCode}</span>
                  <button
                    onClick={() => navigator.clipboard.writeText(currentCode).then(() => { setCodeCopied(true); setTimeout(() => setCodeCopied(false), 2000); }).catch(() => {})}
                    style={{ padding: '1px 5px', fontSize: 10, cursor: 'pointer', borderRadius: 3, border: '1px solid #444', background: '#2a3a4a', color: '#aaa', position: 'relative' }}
                    title="Copy setup code"
                  ><span style={{ visibility: 'hidden' }}>Copy</span><span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{codeCopied ? '✓' : 'Copy'}</span></button>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'row', gap: '8px', alignItems: 'flex-start' }}>
              {negativeAddons.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', background: '#2d1515', borderRadius: 6, padding: '4px 6px', width: '14vw' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 10, color: '#a05050', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>
                    <span>Negative</span>
                    {isLobby && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <button onClick={() => adjustCount('negative', -1)} style={{ width: 16, height: 16, padding: 0, fontSize: 12, lineHeight: 1, cursor: 'pointer', borderRadius: 3, border: '1px solid #7a3030', background: '#3d1a1a', color: '#a05050' }}>−</button>
                        <span style={{ minWidth: 14, textAlign: 'center', color: '#ccc' }}>{state.negativeAddonCount}</span>
                        <button onClick={() => adjustCount('negative', 1)} style={{ width: 16, height: 16, padding: 0, fontSize: 12, lineHeight: 1, cursor: 'pointer', borderRadius: 3, border: '1px solid #7a3030', background: '#3d1a1a', color: '#a05050' }}>+</button>
                      </div>
                    )}
                  </div>
                  {negativeAddons.map(renderAddon)}
                </div>
              )}
              {positiveAddons.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', background: '#152d15', borderRadius: 6, padding: '4px 6px', width: '14vw' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 10, color: '#50a050', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>
                    <span>Positive</span>
                    {isLobby && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <button onClick={() => adjustCount('positive', -1)} style={{ width: 16, height: 16, padding: 0, fontSize: 12, lineHeight: 1, cursor: 'pointer', borderRadius: 3, border: '1px solid #307a30', background: '#1a3d1a', color: '#50a050' }}>−</button>
                        <span style={{ minWidth: 14, textAlign: 'center', color: '#ccc' }}>{state.positiveAddonCount}</span>
                        <button onClick={() => adjustCount('positive', 1)} style={{ width: 16, height: 16, padding: 0, fontSize: 12, lineHeight: 1, cursor: 'pointer', borderRadius: 3, border: '1px solid #307a30', background: '#1a3d1a', color: '#50a050' }}>+</button>
                      </div>
                    )}
                  </div>
                  {positiveAddons.map(renderAddon)}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <div style={styles.topRightButtons}>
        <button
          style={{ ...styles.restartButton, ...(state.myRestartVote ? { background: '#555', borderColor: '#444', color: '#aaa' } : {}) }}
          onClick={() => sendAction({ type: 'TOGGLE_RESTART_VOTE' })}>
          {state.myRestartVote ? `Waiting (${state.restartVotes}/${state.players.length})` : `Restart (${state.restartVotes}/${state.players.length})`}
        </button>
        <button style={styles.stopButton} onClick={() => sendAction({ type: 'FINISH_GAME' })}>
          Stop the game
        </button>
      </div>
      {lastError && <div style={styles.error}>{lastError}</div>}
      {state.phase === 'lobby' && <Lobby state={state} sendAction={sendAction} />}
      {state.phase === 'game' && (
        <Game state={state} sendAction={sendAction}
          actionInProgress={actionStep !== 'idle'}
          onCardSelect={actionStep === 'select-card' && activeAddonId !== 'action-reroll-common' ? (idx) => {
            if (activeAddonId === 'action-unsuited-jack') {
              sendAction({ type: 'USE_UNSUITED_JACK', cardIndex: idx });
              setActionStep('idle'); setActiveAddonId(null);
            } else {
              setActionCardIndex(idx); setActionStep('select-player');
            }
          } : undefined}
          onPlayerSelect={actionStep === 'select-player' && actionCardIndex !== null ? (playerId) => { sendAction({ type: 'USE_SHOW_CARD', targetPlayerId: playerId, cardIndex: actionCardIndex }); setActionStep('idle'); setActionCardIndex(null); setActiveAddonId(null); } : undefined}
          onCommonCardClick={actionStep === 'select-card' && activeAddonId === 'action-reroll-common' ? (idx) => { sendAction({ type: 'USE_REROLL_COMMON', cardIndex: idx }); setActionStep('idle'); setActiveAddonId(null); } : undefined}
          onSeatElRef={(id, el) => { if (el) seatElsRef.current.set(id, el); else seatElsRef.current.delete(id); }}
        />
      )}
      {state.phase === 'finished' && <Game state={state} sendAction={sendAction} readOnly={true} />}
      {state.phase === 'game' && (
        <ActionCardPanel
          state={state}
          step={actionStep}
          activeAddonId={activeAddonId}
          onStart={(addonId) => { sendAction({ type: 'LOCK_ACTION_CARD', addonId }); setActiveAddonId(addonId); setActionStep('select-card'); setActionCardIndex(null); }}
          onCancel={() => { if (activeAddonId) sendAction({ type: 'UNLOCK_ACTION_CARD', addonId: activeAddonId }); setActionStep('idle'); setActionCardIndex(null); setActiveAddonId(null); }}
          onCardElRef={(addonId, el) => { if (el) cardElsRef.current.set(addonId, el); else cardElsRef.current.delete(addonId); }}
        />
      )}
      {flyingCard && <FlyingActionCard from={flyingCard.from} to={flyingCard.to} label={flyingCard.label} snap={flyingCard.snap} />}
    </div>
  );
}
