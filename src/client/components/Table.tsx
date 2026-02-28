import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ClientGameState, ClientAction, RoundNumber, Chip } from '@shared/types';
import PlayerSeat from './PlayerSeat';
import ChipCircle from './ChipCircle';
import CommunityCards from './CommunityCards';
import { ChipAnimContext, type ChipAnimCtxValue } from './ChipAnimContext';

// ── Layout constants ───────────────────────────────────────────────────────────
const CONTAINER_W = 860;
const CONTAINER_H = 600;
const OVAL_W = 440;
const OVAL_H = 230;
const OVAL_LEFT = (CONTAINER_W - OVAL_W) / 2;
const OVAL_TOP  = (CONTAINER_H - OVAL_H) / 2;
const CENTER_X  = CONTAINER_W / 2;
const CENTER_Y  = CONTAINER_H / 2;
const SEAT_RX   = OVAL_W / 2 + 95;
const SEAT_RY   = OVAL_H / 2 + 80;

function getSeatPos(i: number, n: number) {
  const theta = (2 * Math.PI * i) / n;
  return { x: CENTER_X + SEAT_RX * Math.sin(theta), y: CENTER_Y + SEAT_RY * Math.cos(theta) };
}

// ── Chip location helpers ──────────────────────────────────────────────────────
type ChipLoc = { kind: 'middle' } | { kind: 'player'; id: string };

function getChipLocations(s: ClientGameState): Map<string, ChipLoc> {
  const map = new Map<string, ChipLoc>();
  for (const chip of s.middleChips) map.set(`${chip.round}-${chip.number}`, { kind: 'middle' });
  for (const player of s.players)
    for (const chip of player.chips)
      map.set(`${chip.round}-${chip.number}`, { kind: 'player', id: player.id });
  return map;
}

function findChip(s: ClientGameState, key: string): Chip | undefined {
  for (const chip of s.middleChips) if (`${chip.round}-${chip.number}` === key) return chip;
  for (const player of s.players)
    for (const chip of player.chips)
      if (`${chip.round}-${chip.number}` === key) return chip;
}

// ── Flying chip overlay (animates from old position to new) ───────────────────
interface AnimEntry { id: string; chip: Chip; from: { x: number; y: number }; to: { x: number; y: number }; }

const noopCtx: ChipAnimCtxValue = { register: () => {}, hiding: new Set() };

function FlyingChip({ entry, onDone }: { entry: AnimEntry; onDone: () => void }) {
  const [arrived, setArrived] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setArrived(true));
    const timer = setTimeout(onDone, 1100);
    return () => { cancelAnimationFrame(raf); clearTimeout(timer); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <ChipAnimContext.Provider value={noopCtx}>
      <div style={{
        position: 'absolute',
        left: arrived ? entry.to.x : entry.from.x,
        top:  arrived ? entry.to.y : entry.from.y,
        transform: 'translate(-50%, -50%)',
        transition: arrived ? 'left 1s ease, top 1s ease' : 'none',
        pointerEvents: 'none',
        zIndex: 200,
      }}>
        <ChipCircle chip={entry.chip} size={32} />
      </div>
    </ChipAnimContext.Provider>
  );
}

// ── Main Table component ───────────────────────────────────────────────────────
interface Props {
  state: ClientGameState;
  sendAction: (a: ClientAction) => void;
  readOnly: boolean;
}

export default function Table({ state, sendAction, readOnly }: Props) {
  const currentRound = (state.currentRound ?? 1) as RoundNumber;
  const myIndex = state.players.findIndex(p => p.id === state.myId);
  const rotated = myIndex >= 0
    ? [...state.players.slice(myIndex), ...state.players.slice(0, myIndex)]
    : state.players;
  const myPlayer = state.players.find(p => p.id === state.myId);
  const iHaveCurrentRoundChip = !!myPlayer?.chips.some(c => c.round === currentRound);
  const n = rotated.length;

  // ── Animation bookkeeping ────────────────────────────────────────────────────
  const containerRef = useRef<HTMLDivElement>(null);
  const chipElsRef   = useRef(new Map<string, HTMLDivElement>());
  const prevPosRef   = useRef(new Map<string, { x: number; y: number }>());
  const prevLocsRef  = useRef(new Map<string, ChipLoc>());
  const [animations,  setAnimations]  = useState<AnimEntry[]>([]);
  const [hidingChips, setHidingChips] = useState(() => new Set<string>());

  const registerChip = useCallback((key: string, el: HTMLDivElement | null) => {
    if (el) chipElsRef.current.set(key, el);
    else    chipElsRef.current.delete(key);
  }, []);

  function relCenter(el: HTMLDivElement): { x: number; y: number } | null {
    const c = containerRef.current;
    if (!c) return null;
    const er = el.getBoundingClientRect(), cr = c.getBoundingClientRect();
    return { x: er.left - cr.left + er.width / 2, y: er.top - cr.top + er.height / 2 };
  }

  useLayoutEffect(() => {
    const currLocs = getChipLocations(state);
    const newAnims: AnimEntry[] = [];
    const newHiding: string[] = [];

    for (const [key, currLoc] of currLocs) {
      const prevLoc = prevLocsRef.current.get(key);
      const moved = prevLoc !== undefined && (
        prevLoc.kind !== currLoc.kind ||
        (prevLoc.kind === 'player' && currLoc.kind === 'player' && prevLoc.id !== currLoc.id)
      );
      if (moved) {
        const prevPos = prevPosRef.current.get(key);
        const currEl  = chipElsRef.current.get(key);
        if (prevPos && currEl) {
          const currPos = relCenter(currEl);
          const chip    = findChip(state, key);
          if (currPos && chip) {
            newAnims.push({ id: `${key}-${Date.now()}`, chip, from: prevPos, to: currPos });
            newHiding.push(key);
          }
        }
      }
    }

    if (newAnims.length > 0) {
      setAnimations(prev => [...prev, ...newAnims]);
      setHidingChips(prev => new Set([...prev, ...newHiding]));
    }

    // Save positions for next update
    const nextPos = new Map<string, { x: number; y: number }>();
    for (const [key, el] of chipElsRef.current) {
      const pos = relCenter(el);
      if (pos) nextPos.set(key, pos);
    }
    prevPosRef.current  = nextPos;
    prevLocsRef.current = currLocs;
  }, [state]);

  const ctxValue: ChipAnimCtxValue = { register: registerChip, hiding: hidingChips };

  return (
    <ChipAnimContext.Provider value={ctxValue}>
      <div ref={containerRef} style={{ position: 'relative', width: CONTAINER_W, height: CONTAINER_H }}>

        {/* Green oval */}
        <div style={{
          position: 'absolute', left: OVAL_LEFT, top: OVAL_TOP, width: OVAL_W, height: OVAL_H,
          borderRadius: '50%',
          background: 'radial-gradient(ellipse at center, #1e6b1e 0%, #155215 100%)',
          boxShadow: 'inset 0 0 40px rgba(0,0,0,0.4), 0 4px 24px rgba(0,0,0,0.5)',
          border: '3px solid #0d3d0d',
        }}>
          <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>

            {/* Round / Game Over badge */}
            <div style={{ background: 'rgba(0,0,0,0.45)', color: '#f0c040', borderRadius: 12, padding: '2px 12px', fontSize: 12, fontWeight: 'bold', letterSpacing: 1 }}>
              {readOnly ? 'GAME OVER' : `ROUND ${currentRound} / 4`}
            </div>

            {/* Community cards */}
            {state.communityCards.length > 0 && <CommunityCards cards={state.communityCards} />}

            {/* Middle chips */}
            {state.middleChips.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
                {[...state.middleChips].sort((a, b) => a.number - b.number).map(chip => (
                  <div key={chip.number} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <ChipCircle chip={chip} size={30} />
                    {!readOnly && !iHaveCurrentRoundChip && (
                      <button onClick={() => sendAction({ type: 'TAKE_FROM_MIDDLE', chipNumber: chip.number })}
                        style={{ padding: '2px 7px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 10, fontWeight: 'bold', background: '#166534', color: '#bbf7d0' }}>
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
          return (
            <PlayerSeat key={player.id} player={player} isMe={isMe}
              holeCards={holeCards} showFaceDown={!readOnly && !isMe}
              currentRound={currentRound} iHaveCurrentRoundChip={iHaveCurrentRoundChip}
              sendAction={sendAction} readOnly={readOnly}
              style={{ position: 'absolute', left: x, top: y, transform: 'translate(-50%, -50%)' }}
            />
          );
        })}

        {/* Animated chip overlay */}
        {animations.map(entry => (
          <FlyingChip key={entry.id} entry={entry} onDone={() => {
            setAnimations(prev => prev.filter(a => a.id !== entry.id));
            setHidingChips(prev => { const s = new Set(prev); s.delete(`${entry.chip.round}-${entry.chip.number}`); return s; });
          }} />
        ))}

      </div>
    </ChipAnimContext.Provider>
  );
}
