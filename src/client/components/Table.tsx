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
interface AnimEntry { id: string; chip: Chip; from: { x: number; y: number }; to: { x: number; y: number }; blackInside: boolean; }

const noopCtx: ChipAnimCtxValue = { register: () => {}, hiding: new Set() };

function FlyingChip({ entry, flyingElsRef, onDone }: { entry: AnimEntry; flyingElsRef: React.MutableRefObject<Map<string, HTMLDivElement>>; onDone: () => void }) {
  const [arrived, setArrived] = useState(false);
  const elRef = useRef<HTMLDivElement>(null);
  const chipKey = `${entry.chip.round}-${entry.chip.number}`;

  useLayoutEffect(() => {
    if (elRef.current) flyingElsRef.current.set(chipKey, elRef.current);
    return () => { flyingElsRef.current.delete(chipKey); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const raf = requestAnimationFrame(() => setArrived(true));
    const timer = setTimeout(onDone, 1100);
    return () => { cancelAnimationFrame(raf); clearTimeout(timer); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <ChipAnimContext.Provider value={noopCtx}>
      <div ref={elRef} style={{
        position: 'absolute',
        left: arrived ? entry.to.x : entry.from.x,
        top:  arrived ? entry.to.y : entry.from.y,
        transform: 'translate(-50%, -50%)',
        transition: arrived ? 'left 1s ease, top 1s ease' : 'none',
        pointerEvents: 'none',
        zIndex: 200,
      }}>
        <ChipCircle chip={entry.chip} size={32} blackInside={entry.blackInside} />
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

function getScale() { return (window.innerWidth * 0.6) / CONTAINER_W; }

export default function Table({ state, sendAction, readOnly }: Props) {
  const currentRound = (state.currentRound ?? 1) as RoundNumber;
  const myIndex = state.players.findIndex(p => p.id === state.myId);
  const rotated = myIndex >= 0
    ? [...state.players.slice(myIndex), ...state.players.slice(0, myIndex)]
    : state.players;
  const myPlayer = state.players.find(p => p.id === state.myId);
  const iHaveCurrentRoundChip = !!myPlayer?.chips.some(c => c.round === currentRound);
  const n = rotated.length;
  const blackNumbers: number[] = [];
  if (state.enabledAddons.includes('ones-are-black')) blackNumbers.push(1);
  if (state.enabledAddons.includes('ns-are-black')) blackNumbers.push(n);
  if (state.enabledAddons.includes('xs-are-black') && state.blackXValue !== null) blackNumbers.push(state.blackXValue);
  const onlyNeighborsSteal = state.enabledAddons.includes('only-neighbors-steal');
  const blackAndRed = state.enabledAddons.includes('clubs-spades-diamonds-hearth');

  // ── Guess-rank addons: per-addon target/voting state ─────────────────────────
  const GUESS_RANK_ADDON_IDS = [
    'guess-highest-red-chip-hand-rank',
    'guess-2nd-highest-red-chip-hand-rank',
    'guess-lowest-red-chip-hand-rank',
  ] as const;

  function findGuessRankTarget(addonId: string, players: typeof state.players): string | null {
    const sorted = [...players]
      .map(p => ({ id: p.id, num: p.chips.find(c => c.round === 4)?.number ?? -1 }))
      .filter(x => x.num >= 0).sort((a, b) => a.num - b.num);
    if (addonId === 'guess-lowest-red-chip-hand-rank') return sorted[0]?.id ?? null;
    if (addonId === 'guess-highest-red-chip-hand-rank') return sorted[sorted.length - 1]?.id ?? null;
    if (addonId === 'guess-2nd-highest-red-chip-hand-rank') return sorted[sorted.length - 2]?.id ?? null;
    return null;
  }

  // Per-addon info: target, voting locked, target's chip-order canReveal, target revealed
  const activeGuessRankAddons = GUESS_RANK_ADDON_IDS.filter(id => state.enabledAddons.includes(id));
  type AddonInfo = { targetId: string | null; locked: boolean; targetCanReveal: boolean; targetRevealed: boolean };
  const guessRankInfo = new Map<string, AddonInfo>();
  for (const addonId of activeGuessRankAddons) {
    const targetId = readOnly ? findGuessRankTarget(addonId, state.players) : null;
    const addonVotes = state.rankGuesses[addonId] ?? {};
    const nonTargetPlayers = targetId ? state.players.filter(p => p.id !== targetId) : [];
    const locked = nonTargetPlayers.length > 0 && nonTargetPlayers.every(p => !!addonVotes[p.id]);
    const targetPlayer = targetId ? state.players.find(p => p.id === targetId) : null;
    const targetChip = targetPlayer?.chips.find(c => c.round === 4);
    const targetCanReveal = !targetChip || state.players
      .filter(p => p.id !== targetId)
      .every(p => {
        const theirChip = p.chips.find(c => c.round === 4);
        return !theirChip || theirChip.number >= (targetChip?.number ?? 0) || !!state.revealedHoleCards[p.id];
      });
    const targetRevealed = !!(targetId && state.revealedHoleCards[targetId]);
    guessRankInfo.set(addonId, { targetId, locked, targetCanReveal, targetRevealed });
  }

  // 5s per-addon timer: hide guesses after each target reveals
  const [hiddenGuessRankAddons, setHiddenGuessRankAddons] = useState<Set<string>>(new Set);
  const guessTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  useEffect(() => {
    for (const [addonId, info] of guessRankInfo) {
      if (info.targetRevealed && !guessTimersRef.current.has(addonId)) {
        const t = setTimeout(() => setHiddenGuessRankAddons(prev => new Set([...prev, addonId])), 3000);
        guessTimersRef.current.set(addonId, t);
      }
    }
  }, [state.revealedHoleCards]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    setHiddenGuessRankAddons(new Set());
    for (const t of guessTimersRef.current.values()) clearTimeout(t);
    guessTimersRef.current.clear();
  }, [state.gameId]);

  // ── Responsive scale (60vw) ──────────────────────────────────────────────────
  const [scale, setScale] = useState(getScale);
  const scaleRef = useRef(scale);
  scaleRef.current = scale;

  useEffect(() => {
    const onResize = () => setScale(getScale());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // ── Animation bookkeeping ────────────────────────────────────────────────────
  const containerRef = useRef<HTMLDivElement>(null);
  const chipElsRef   = useRef(new Map<string, HTMLDivElement>());
  const prevPosRef   = useRef(new Map<string, { x: number; y: number }>());
  const prevLocsRef  = useRef(new Map<string, ChipLoc>());
  const [animations,  setAnimations]  = useState<AnimEntry[]>([]);
  const [hidingChips, setHidingChips] = useState(() => new Set<string>());
  const hidingChipsRef = useRef(new Set<string>());
  hidingChipsRef.current = hidingChips;
  const flyingElsRef = useRef(new Map<string, HTMLDivElement>());
  const tableSlotElsRef = useRef(new Map<string, HTMLDivElement>());

  const registerChip = useCallback((key: string, el: HTMLDivElement | null) => {
    if (el) chipElsRef.current.set(key, el);
    else    chipElsRef.current.delete(key);
  }, []);

  function relCenter(el: HTMLDivElement): { x: number; y: number } | null {
    const c = containerRef.current;
    if (!c) return null;
    const er = el.getBoundingClientRect(), cr = c.getBoundingClientRect();
    const s = scaleRef.current;
    return { x: (er.left - cr.left + er.width / 2) / s, y: (er.top - cr.top + er.height / 2) / s };
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
        // Use table slot ref for middle destination (player chip ref for player destination)
        const currEl = currLoc.kind === 'middle'
          ? tableSlotElsRef.current.get(key)
          : chipElsRef.current.get(key);
        if (currEl) {
          const currPos = relCenter(currEl);
          const chip    = findChip(state, key);
          if (currPos && chip) {
            // If chip is mid-animation, use flying element's current visual position as 'from'
            let fromPos: { x: number; y: number } | undefined;
            if (hidingChipsRef.current.has(key)) {
              const flyEl = flyingElsRef.current.get(key);
              if (flyEl) {
                const c = containerRef.current;
                if (c) {
                  const er = flyEl.getBoundingClientRect(), cr = c.getBoundingClientRect();
                  const s = scaleRef.current;
                  fromPos = { x: (er.left - cr.left + er.width / 2) / s, y: (er.top - cr.top + er.height / 2) / s };
                }
              }
            }
            if (!fromPos) {
              if (prevLoc.kind === 'middle') {
                // Use table slot position directly (always trackable)
                const slotEl = tableSlotElsRef.current.get(key);
                if (slotEl) fromPos = relCenter(slotEl) ?? undefined;
              } else {
                fromPos = prevPosRef.current.get(key);
              }
            }
            if (fromPos) {
              newAnims.push({ id: `${key}-${Date.now()}`, chip, from: fromPos, to: currPos, blackInside: blackNumbers.includes(chip.number) });
              newHiding.push(key);
            }
          }
        }
      }
    }

    if (newAnims.length > 0) {
      const movedKeys = new Set(newHiding);
      // Replace any existing animations for the same chips (don't accumulate stale ones)
      setAnimations(prev => [
        ...prev.filter(a => !movedKeys.has(`${a.chip.round}-${a.chip.number}`)),
        ...newAnims,
      ]);
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
      <div style={{ width: CONTAINER_W * scale, height: CONTAINER_H * scale }}>
      <div ref={containerRef} style={{ position: 'relative', width: CONTAINER_W, height: CONTAINER_H, transform: `scale(${scale})`, transformOrigin: 'top left' }}>

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
            <CommunityCards cards={state.communityCards} blackAndRed={blackAndRed} />

            {/* Middle chips – fixed dedicated slots for every chip in the game */}
            {(() => {
              const allGameChips = currentRound === null ? [] : [
                ...state.middleChips,
                ...state.players.flatMap(p => p.chips).filter(c => c.round === currentRound),
              ].sort((a, b) => a.round !== b.round ? a.round - b.round : a.number - b.number);
              const middleSet = new Set(state.middleChips.map(c => `${c.round}-${c.number}`));
              if (allGameChips.length === 0) return null;
              return (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
                  {allGameChips.map(chip => {
                    const key = `${chip.round}-${chip.number}`;
                    const inMiddle = middleSet.has(key);
                    return (
                      <div key={key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, border: '1px solid rgba(255,255,255,0.07)', borderRadius: 4, padding: 3 }}>
                        <div
                          ref={el => { if (el) tableSlotElsRef.current.set(key, el); else tableSlotElsRef.current.delete(key); }}
                          style={{ visibility: (inMiddle && !hidingChips.has(key)) ? 'visible' : 'hidden' }}>
                          <ChipAnimContext.Provider value={noopCtx}>
                            <ChipCircle chip={chip} size={30} blackInside={blackNumbers.includes(chip.number)} />
                          </ChipAnimContext.Provider>
                        </div>
                        {!readOnly && (
                          <button
                            onClick={inMiddle && !iHaveCurrentRoundChip ? () => sendAction({ type: 'TAKE_FROM_MIDDLE', chipNumber: chip.number }) : undefined}
                            style={{ padding: '2px 7px', borderRadius: 10, border: 'none', fontSize: 10, fontWeight: 'bold', background: '#166534', color: '#bbf7d0', visibility: inMiddle && !iHaveCurrentRoundChip ? 'visible' : 'hidden', cursor: inMiddle && !iHaveCurrentRoundChip ? 'pointer' : 'default' }}>
                            Take
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>

        {/* Player seats */}
        {rotated.map((player, i) => {
          const { x, y } = getSeatPos(i, n);
          const isMe = player.id === state.myId;
          // In finished phase: show own cards to self always; others only if they revealed
          // During game with neighbor-cards addons: show neighbor cards face up
          const holeCards = isMe
            ? state.myHoleCards
            : readOnly
              ? (state.revealedHoleCards[player.id] ?? null)
              : (state.neighborHoleCards[player.id] ?? null);
          const showFaceDown = !readOnly && !isMe && !state.neighborHoleCards[player.id];
          const myCardsRevealed = !!state.revealedHoleCards[state.myId];
          const myRound4Chip = myPlayer?.chips.find((c) => c.round === 4);
          const chipOrderCanReveal = !myRound4Chip || state.players
            .filter((p) => p.id !== state.myId)
            .every((p) => {
              const theirChip = p.chips.find((c) => c.round === 4);
              return !theirChip || theirChip.number >= myRound4Chip.number || !!state.revealedHoleCards[p.id];
            });
          // Block reveal if any active guess-rank addon targets me and isn't locked yet
          const guessRankBlock = isMe && [...guessRankInfo.values()].some(
            info => info.targetId === state.myId && !info.locked
          );
          const canReveal = chipOrderCanReveal && !guessRankBlock;
          // Guess-rank UIs shown on this seat (one per unique target — dedup if multiple addons target same player)
          const guessRankUIs = activeGuessRankAddons
            .filter(addonId => {
              const info = guessRankInfo.get(addonId)!;
              return info.targetId === player.id && info.targetCanReveal && !info.targetRevealed && !isMe && !hiddenGuessRankAddons.has(addonId);
            })
            .slice(0, 1) // only one UI per target player
            .map(addonId => {
              const info = guessRankInfo.get(addonId)!;
              const addonVotes = state.rankGuesses[addonId] ?? {};
              return { addonId, myVote: addonVotes[state.myId] as string | undefined, locked: info.locked };
            });
          // Dialogue clouds: one per unique target player this voter has guessed
          const dialogueClouds = (() => {
            const seenTargets = new Set<string | null>();
            return activeGuessRankAddons
              .filter(addonId => {
                const info = guessRankInfo.get(addonId)!;
                if (info.targetId === player.id || hiddenGuessRankAddons.has(addonId)) return false;
                if (!(state.rankGuesses[addonId] ?? {})[player.id]) return false;
                if (seenTargets.has(info.targetId)) return false;
                seenTargets.add(info.targetId);
                return true;
              })
              .map(addonId => {
                const info = guessRankInfo.get(addonId)!;
                const vote = (state.rankGuesses[addonId] ?? {})[player.id];
                const winningRank = state.winningGuessRanks[addonId];
                return { text: vote, winner: info.locked && !!winningRank && vote === winningRank, locked: info.locked };
              });
          })();
          return (
            <PlayerSeat key={player.id} player={player} isMe={isMe}
              holeCards={holeCards} showFaceDown={showFaceDown}
              currentRound={currentRound} iHaveCurrentRoundChip={iHaveCurrentRoundChip}
              sendAction={sendAction} readOnly={readOnly} myCardsRevealed={myCardsRevealed}
              canReveal={canReveal}
              guessRankUIs={guessRankUIs}
              dialogueClouds={dialogueClouds}
              blackNumbers={blackNumbers}
              canStealFrom={!onlyNeighborsSteal || i === 1 || i === n - 1}
              blackAndRed={blackAndRed}
              style={{ position: 'absolute', left: x, top: y, transform: 'translate(-50%, -50%)' }}
            />
          );
        })}

        {/* Animated chip overlay */}
        {animations.map(entry => (
          <FlyingChip key={entry.id} entry={entry} flyingElsRef={flyingElsRef} onDone={() => {
            const chipKey = `${entry.chip.round}-${entry.chip.number}`;
            setAnimations(prev => {
              const next = prev.filter(a => a.id !== entry.id);
              // Only un-hide if no replacement animation for this chip is running
              if (!next.some(a => `${a.chip.round}-${a.chip.number}` === chipKey)) {
                setHidingChips(prev => { const s = new Set(prev); s.delete(chipKey); return s; });
              }
              return next;
            });
          }} />
        ))}

      </div>
      </div>
    </ChipAnimContext.Provider>
  );
}
