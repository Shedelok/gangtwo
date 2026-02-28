import type { Card, Chip, ClientGameState, GamePhase, PlayerPublicState, RoundNumber } from '../shared/types';
import {
  createShuffledDeck,
  dealHoleCards,
  createChipsForRound,
  isRoundComplete,
  drawCards,
} from './gameLogic';
import { randomUUID } from 'crypto';

interface ServerGameState {
  phase: GamePhase;
  players: PlayerPublicState[];
  holeCards: Record<string, [Card, Card]>;
  communityCards: Card[];
  currentRound: RoundNumber;
  middleChips: Chip[];
  deck: Card[];
  socketToPlayerId: Map<string, string>;
  playerIdToSocketId: Map<string, string>;
}

const state: ServerGameState = {
  phase: 'lobby',
  players: [],
  holeCards: {},
  communityCards: [],
  currentRound: 1,
  middleChips: [],
  deck: [],
  socketToPlayerId: new Map(),
  playerIdToSocketId: new Map(),
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
    const nextRound = (state.currentRound + 1) as RoundNumber;
    state.currentRound = nextRound;
    state.middleChips = createChipsForRound(nextRound, state.players.length);
    for (const player of state.players) {
      player.readyForNextRound = false;
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
  // No round-complete check after discard
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

  const idx = victim.chips.findIndex(
    (c) => c.round === state.currentRound && c.number === chipNumber
  );
  if (idx === -1) return 'Target does not hold that chip for this round';

  const [chip] = victim.chips.splice(idx, 1);
  // Victim's readyForNextRound is NOT reset (per spec)
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

export function finishGame(): void {
  state.phase = 'lobby';
  state.players = [];
  state.holeCards = {};
  state.communityCards = [];
  state.currentRound = 1;
  state.middleChips = [];
  state.deck = [];
  // Keep socket mappings but clear player associations
  for (const [socketId] of state.socketToPlayerId) {
    state.socketToPlayerId.set(socketId, '');
  }
  state.playerIdToSocketId.clear();
}

export function buildClientState(socketId: string): ClientGameState {
  const playerId = state.socketToPlayerId.get(socketId) ?? '';
  const myHoleCards = playerId && state.holeCards[playerId] ? state.holeCards[playerId] : null;
  const revealedHoleCards: Record<string, [Card, Card]> =
    state.phase === 'finished' ? { ...state.holeCards } : {};

  return {
    phase: state.phase,
    players: state.players.map((p) => ({ ...p, chips: [...p.chips] })),
    myId: playerId,
    myHoleCards,
    revealedHoleCards,
    communityCards: [...state.communityCards],
    currentRound: state.phase === 'lobby' ? null : state.currentRound,
    middleChips: [...state.middleChips],
  };
}
