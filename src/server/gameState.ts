import type { Card, Chip, ClientGameState, GamePhase, PlayerPublicState, RoundNumber } from '../shared/types';
import {
  createShuffledDeck,
  dealHoleCards,
  createChipsForRound,
  isRoundComplete,
  drawCards,
} from './gameLogic';
import { ADDONS } from '../shared/addons';
import { randomUUID } from 'crypto';

function pickRandom<T>(arr: T[], n: number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, n);
}

interface ServerGameState {
  phase: GamePhase;
  players: PlayerPublicState[];
  holeCards: Record<string, [Card, Card]>;
  communityCards: Card[];
  currentRound: RoundNumber;
  middleChips: Chip[];
  deck: Card[];
  revealedPlayers: Set<string>;
  enabledAddons: Set<string>;
  blackXValue: number | null;
  addonPool: Set<string>;
  negativeAddonCount: number;
  positiveAddonCount: number;
  socketToPlayerId: Map<string, string>;
  playerIdToSocketId: Map<string, string>;
  prefillNames: Map<string, string>;
}

const state: ServerGameState = {
  phase: 'lobby',
  players: [],
  holeCards: {},
  communityCards: [],
  currentRound: 1,
  middleChips: [],
  deck: [],
  revealedPlayers: new Set(),
  enabledAddons: new Set(),
  blackXValue: null,
  addonPool: new Set(ADDONS.map((a) => a.id)),
  negativeAddonCount: 0,
  positiveAddonCount: 0,
  socketToPlayerId: new Map(),
  playerIdToSocketId: new Map(),
  prefillNames: new Map(),
};

function getPlayerBySocket(socketId: string): PlayerPublicState | undefined {
  const playerId = state.socketToPlayerId.get(socketId);
  if (!playerId) return undefined;
  return state.players.find((p) => p.id === playerId);
}

function advanceRound(): void {
  const communityCount = state.currentRound === 1 ? 3 : state.currentRound <= 3 ? 1 : 0;
  if (communityCount > 0) {
    const [drawn, remaining] = drawCards(state.deck, communityCount);
    state.communityCards.push(...drawn);
    state.deck = remaining;
  }

  if (state.currentRound < 4) {
    const prevRound = state.currentRound;
    const nextRound = (state.currentRound + 1) as RoundNumber;
    state.currentRound = nextRound;
    state.middleChips = createChipsForRound(nextRound, state.players.length);
    for (const player of state.players) {
      player.readyForNextRound = false;
    }
    if (state.enabledAddons.has('no-old-chips')) {
      for (const player of state.players) {
        player.chips = player.chips.filter(c => c.round !== prevRound);
      }
    }
  } else {
    state.phase = 'finished';
  }
}

function checkAndAdvance(): void {
  if (state.phase === 'game' && isRoundComplete(state.players, state.currentRound)) {
    advanceRound();
  }
}

export function registerConnection(socketId: string): void {
  // Just track the socket — no player yet
  state.socketToPlayerId.set(socketId, '');
}

export function addPlayer(socketId: string, name: string): string | null {
  if (state.phase !== 'lobby') return 'Game already in progress';
  const trimmed = name.trim();
  if (!trimmed) return 'Name cannot be empty';
  if (state.players.some((p) => p.name.toLowerCase() === trimmed.toLowerCase())) {
    return 'Name already taken';
  }
  const playerId = randomUUID();
  state.socketToPlayerId.set(socketId, playerId);
  state.playerIdToSocketId.set(playerId, socketId);
  state.prefillNames.delete(socketId);
  state.players.push({
    id: playerId,
    name: trimmed,
    chips: [],
    readyForNextRound: false,
  });
  return null;
}

export function removePlayer(socketId: string): void {
  const playerId = state.socketToPlayerId.get(socketId);
  if (!playerId) {
    state.socketToPlayerId.delete(socketId);
    return;
  }
  state.socketToPlayerId.delete(socketId);
  state.playerIdToSocketId.delete(playerId);
  if (state.phase === 'lobby') {
    state.players = state.players.filter((p) => p.id !== playerId);
  }
  // During game, keep the player to not break state; their socket is just gone
}

export function startGame(): string | null {
  if (state.phase !== 'lobby') return 'Game already running';
  if (state.players.length < 2) return 'Need at least 2 players';

  const negativePool = ADDONS
    .filter((a) => a.type === 'negative' && state.addonPool.has(a.id))
    .map((a) => a.id);
  const positivePool = ADDONS
    .filter((a) => a.type === 'positive' && state.addonPool.has(a.id))
    .map((a) => a.id);

  if (state.negativeAddonCount > negativePool.length)
    return 'Not enough negative addons in pool';
  if (state.positiveAddonCount > positivePool.length)
    return 'Not enough positive addons in pool';

  state.enabledAddons = new Set([
    ...pickRandom(negativePool, state.negativeAddonCount),
    ...pickRandom(positivePool, state.positiveAddonCount),
  ]);
  if (state.enabledAddons.has('xs-are-black')) {
    state.blackXValue = Math.floor(Math.random() * state.players.length) + 1;
  } else {
    state.blackXValue = null;
  }

  const deck = createShuffledDeck();
  const playerIds = state.players.map((p) => p.id);
  const { assignments, remainingDeck } = dealHoleCards(deck, playerIds);

  state.holeCards = assignments;
  state.deck = remainingDeck;
  state.communityCards = [];
  state.currentRound = 1;
  state.middleChips = createChipsForRound(1, state.players.length);
  for (const player of state.players) {
    player.chips = [];
    player.readyForNextRound = false;
  }
  state.phase = 'game';
  return null;
}

export function discardChip(socketId: string, chipNumber: number): string | null {
  if (state.phase !== 'game') return 'Not in game';
  const player = getPlayerBySocket(socketId);
  if (!player) return 'Player not found';

  const idx = player.chips.findIndex(
    (c) => c.round === state.currentRound && c.number === chipNumber
  );
  if (idx === -1) return 'You do not hold that chip for the current round';

  const [chip] = player.chips.splice(idx, 1);
  state.middleChips.push(chip);
  player.readyForNextRound = false;
  return null;
}

export function takeFromMiddle(socketId: string, chipNumber: number): string | null {
  if (state.phase !== 'game') return 'Not in game';
  const player = getPlayerBySocket(socketId);
  if (!player) return 'Player not found';

  if (player.chips.some((c) => c.round === state.currentRound)) {
    return 'You already hold a chip for this round';
  }

  const idx = state.middleChips.findIndex(
    (c) => c.round === state.currentRound && c.number === chipNumber
  );
  if (idx === -1) return 'Chip not in middle';

  const [chip] = state.middleChips.splice(idx, 1);
  player.chips.push(chip);

  checkAndAdvance();
  return null;
}

export function stealChip(
  socketId: string,
  fromPlayerId: string,
  chipNumber: number
): string | null {
  if (state.phase !== 'game') return 'Not in game';
  const player = getPlayerBySocket(socketId);
  if (!player) return 'Player not found';

  if (player.chips.some((c) => c.round === state.currentRound)) {
    return 'You already hold a chip for this round';
  }

  const victim = state.players.find((p) => p.id === fromPlayerId);
  if (!victim) return 'Target player not found';
  if (victim.id === player.id) return 'Cannot steal from yourself';

  if (state.enabledAddons.has('only-neighbors-steal')) {
    const myIdx = state.players.findIndex((p) => p.id === player.id);
    const n = state.players.length;
    const leftId  = state.players[(myIdx - 1 + n) % n].id;
    const rightId = state.players[(myIdx + 1) % n].id;
    if (victim.id !== leftId && victim.id !== rightId) {
      return 'Can only steal from neighbors with this addon';
    }
  }

  const idx = victim.chips.findIndex(
    (c) => c.round === state.currentRound && c.number === chipNumber
  );
  if (idx === -1) return 'Target does not hold that chip for this round';

  const [chip] = victim.chips.splice(idx, 1);
  victim.readyForNextRound = false;
  player.chips.push(chip);

  // No round-complete check after steal (victim just lost their chip)
  return null;
}

export function setReady(socketId: string, ready: boolean): string | null {
  if (state.phase !== 'game') return 'Not in game';
  const player = getPlayerBySocket(socketId);
  if (!player) return 'Player not found';

  player.readyForNextRound = ready;
  checkAndAdvance();
  return null;
}

export function revealCards(socketId: string): string | null {
  if (state.phase !== 'finished') return 'Not in finished phase';
  const playerId = state.socketToPlayerId.get(socketId);
  if (!playerId) return 'Player not found';
  state.revealedPlayers.add(playerId);
  return null;
}

export function restartGame(): string | null {
  // Collect all currently connected players (socket → name)
  const socketNames: Array<{ socketId: string; name: string }> = [];
  for (const player of state.players) {
    const socketId = state.playerIdToSocketId.get(player.id);
    if (socketId) socketNames.push({ socketId, name: player.name });
  }
  if (socketNames.length < 2) return 'Need at least 2 players to restart';

  const savedAddonPool = new Set(state.addonPool);
  const savedNegativeCount = state.negativeAddonCount;
  const savedPositiveCount = state.positiveAddonCount;
  finishGame();
  state.addonPool = savedAddonPool;
  state.negativeAddonCount = savedNegativeCount;
  state.positiveAddonCount = savedPositiveCount;

  for (const { socketId, name } of socketNames) {
    addPlayer(socketId, name);
  }
  return startGame();
}

export function toggleAddon(addonId: string): string | null {
  if (state.phase !== 'lobby') return 'Cannot change addons after game started';
  if (state.addonPool.has(addonId)) {
    state.addonPool.delete(addonId);
  } else {
    state.addonPool.add(addonId);
  }
  return null;
}

export function setAddonCount(addonType: 'negative' | 'positive', count: number): string | null {
  if (state.phase !== 'lobby') return 'Cannot change addons after game started';
  if (count < 0) return 'Count cannot be negative';
  if (addonType === 'negative') {
    state.negativeAddonCount = count;
  } else {
    state.positiveAddonCount = count;
  }
  return null;
}

export function finishGame(keepNames = false, keepAddons = false): void {
  if (keepNames) {
    for (const player of state.players) {
      const socketId = state.playerIdToSocketId.get(player.id);
      if (socketId) state.prefillNames.set(socketId, player.name);
    }
  }
  const savedAddonPool = keepAddons ? new Set(state.addonPool) : null;
  const savedNegativeCount = keepAddons ? state.negativeAddonCount : 0;
  const savedPositiveCount = keepAddons ? state.positiveAddonCount : 0;
  state.phase = 'lobby';
  state.players = [];
  state.holeCards = {};
  state.communityCards = [];
  state.currentRound = 1;
  state.middleChips = [];
  state.deck = [];
  state.revealedPlayers = new Set();
  state.enabledAddons = new Set();
  state.blackXValue = null;
  state.addonPool = savedAddonPool ?? new Set(ADDONS.map((a) => a.id));
  state.negativeAddonCount = savedNegativeCount;
  state.positiveAddonCount = savedPositiveCount;
  // Keep socket mappings but clear player associations
  for (const [socketId] of state.socketToPlayerId) {
    state.socketToPlayerId.set(socketId, '');
  }
  state.playerIdToSocketId.clear();
}

export function buildClientState(socketId: string): ClientGameState {
  const playerId = state.socketToPlayerId.get(socketId) ?? '';
  const myHoleCards = playerId && state.holeCards[playerId] ? state.holeCards[playerId] : null;
  const revealedHoleCards: Record<string, [Card, Card]> = {};
  if (state.phase === 'finished') {
    for (const pid of state.revealedPlayers) {
      if (state.holeCards[pid]) revealedHoleCards[pid] = state.holeCards[pid];
    }
  }

  const neighborHoleCards: Record<string, [Card, Card]> = {};
  if (state.phase === 'game' && playerId) {
    const myIdx = state.players.findIndex((p) => p.id === playerId);
    if (myIdx >= 0) {
      const n = state.players.length;
      const leftNeighbor = state.players[(myIdx - 1 + n) % n];
      const rightNeighbor = state.players[(myIdx + 1) % n];
      if (state.enabledAddons.has('see-2-neighbors-cards')) {
        for (const neighbor of [leftNeighbor, rightNeighbor]) {
          if (state.holeCards[neighbor.id]) neighborHoleCards[neighbor.id] = state.holeCards[neighbor.id];
        }
      } else if (state.enabledAddons.has('see-1-neighbor-cards')) {
        if (state.holeCards[leftNeighbor.id]) neighborHoleCards[leftNeighbor.id] = state.holeCards[leftNeighbor.id];
      }
    }
  }

  return {
    phase: state.phase,
    players: state.players.map((p) => ({ ...p, chips: [...p.chips] })),
    myId: playerId,
    myHoleCards,
    neighborHoleCards,
    revealedHoleCards,
    communityCards: [...state.communityCards],
    currentRound: state.phase === 'lobby' ? null : state.currentRound,
    middleChips: [...state.middleChips],
    enabledAddons: [...state.enabledAddons],
    blackXValue: state.blackXValue,
    addonPool: [...state.addonPool],
    negativeAddonCount: state.negativeAddonCount,
    positiveAddonCount: state.positiveAddonCount,
    prefilledName: state.prefillNames.get(socketId) ?? null,
  };
}
