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
  sessionIdToPlayerId: Map<string, string>;
  socketToSessionId: Map<string, string>;
  startGameVoters: Set<string>;
  restartVoters: Set<string>;
  noOldChipsHidden: Map<string, Chip[]>; // playerId → chips hidden by no-old-chips addon
  rankGuesses: Map<string, Map<string, string>>; // addonId → (voterId → rank)
  winningGuessRanks: Map<string, string>; // addonId → winning rank (set when voting locks)
  showCardUsed: boolean;
  showCardData: { sourceId: string; targetId: string; card: Card; cardIndex: 0 | 1 } | null;
  actionCardLock: { addonId: string; playerId: string } | null;
  unsuitedJacks: Map<string, number>; // playerId → card index
  unsuitedXs: Map<string, number>;    // playerId → card index
  unsuitedXRank: string | null;
  rerollCommonUsed: boolean;
  blackjackPhase: boolean;
  gameId: string;
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
  sessionIdToPlayerId: new Map(),
  socketToSessionId: new Map(),
  startGameVoters: new Set(),
  restartVoters: new Set(),
  noOldChipsHidden: new Map(),
  rankGuesses: new Map(),
  winningGuessRanks: new Map(),
  showCardUsed: false,
  showCardData: null,
  actionCardLock: null,
  unsuitedJacks: new Map(),
  unsuitedXs: new Map(),
  unsuitedXRank: null,
  rerollCommonUsed: false,
  blackjackPhase: false,
  gameId: '',
};

const GUESS_RANK_ADDON_IDS = [
  'guess-highest-red-chip-hand-rank',
  'guess-2nd-highest-red-chip-hand-rank',
  'guess-lowest-red-chip-hand-rank',
] as const;

function findGuessRankTargetId(addonId: string, players: PlayerPublicState[]): string | null {
  const sorted = [...players]
    .map(p => ({ id: p.id, num: p.chips.find(c => c.round === 4)?.number ?? -1 }))
    .filter(x => x.num >= 0)
    .sort((a, b) => a.num - b.num);
  if (addonId === 'guess-lowest-red-chip-hand-rank') return sorted[0]?.id ?? null;
  if (addonId === 'guess-highest-red-chip-hand-rank') return sorted[sorted.length - 1]?.id ?? null;
  if (addonId === 'guess-2nd-highest-red-chip-hand-rank') return sorted[sorted.length - 2]?.id ?? null;
  return null;
}

const VALID_RANKS = new Set([
  'Royal Flush', 'Straight Flush', 'Four of a Kind', 'Full House',
  'Flush', 'Straight', 'Three of a Kind', 'Two Pair', 'One Pair', 'High Card',
]);

function getPlayerBySocket(socketId: string): PlayerPublicState | undefined {
  const playerId = state.socketToPlayerId.get(socketId);
  if (!playerId) return undefined;
  return state.players.find((p) => p.id === playerId);
}

function isRoundSkipped(round: number): boolean {
  return (round === 1 && state.enabledAddons.has('no-white-chips')) ||
         (round === 2 && state.enabledAddons.has('no-yellow-chips')) ||
         (round === 3 && state.enabledAddons.has('no-orange-chips'));
}

function roundCommunityCardCount(round: number): number {
  let base = round === 1 ? 3 : round <= 3 ? 1 : 0;
  if (round === 1 && state.enabledAddons.has('additional-card-flop')) base += 1;
  if (round === 2 && state.enabledAddons.has('additional-card-turn')) base += 1;
  if (round === 3 && state.enabledAddons.has('additional-card-river')) base += 1;
  return base;
}

function advanceRound(): void {
  // Draw community cards for the current round ending
  const communityCount = roundCommunityCardCount(state.currentRound);
  if (communityCount > 0) {
    const [drawn, remaining] = drawCards(state.deck, communityCount);
    state.communityCards.push(...drawn);
    state.deck = remaining;
  }

  if (state.currentRound < 4) {
    const prevRound = state.currentRound;
    // Advance to next round; for each skipped round, immediately reveal its community cards
    let nextRound = state.currentRound + 1;
    while (nextRound < 4 && isRoundSkipped(nextRound)) {
      const count = roundCommunityCardCount(nextRound);
      if (count > 0) {
        const [drawn, remaining] = drawCards(state.deck, count);
        state.communityCards.push(...drawn);
        state.deck = remaining;
      }
      nextRound++;
    }
    state.currentRound = nextRound as RoundNumber;
    state.middleChips = createChipsForRound(nextRound as RoundNumber, state.players.length);
    for (const player of state.players) {
      player.readyForNextRound = false;
    }
    if (state.enabledAddons.has('no-old-chips')) {
      for (const player of state.players) {
        const removed = player.chips.filter(c => c.round === prevRound);
        if (removed.length > 0) {
          const existing = state.noOldChipsHidden.get(player.id) ?? [];
          state.noOldChipsHidden.set(player.id, [...existing, ...removed]);
        }
        player.chips = player.chips.filter(c => c.round !== prevRound);
      }
    }
  } else {
    state.phase = 'finished';
  }
}

function checkAndAdvance(): void {
  if (state.blackjackPhase) return;
  if (state.phase === 'game' && isRoundComplete(state.players, state.currentRound)) {
    advanceRound();
  }
}

export function registerConnection(socketId: string): void {
  // Just track the socket — no player yet
  state.socketToPlayerId.set(socketId, '');
}

// Returns true if successfully reconnected to an existing seat
export function resumeSession(socketId: string, sessionId: string): boolean {
  state.socketToSessionId.set(socketId, sessionId);
  const playerId = state.sessionIdToPlayerId.get(sessionId);
  if (!playerId) return false;
  if (!state.players.find((p) => p.id === playerId)) return false;
  if (state.phase === 'lobby') return false;
  // Re-associate new socket with the existing player
  const oldSocketId = state.playerIdToSocketId.get(playerId);
  if (oldSocketId) state.socketToPlayerId.set(oldSocketId, '');
  state.socketToPlayerId.set(socketId, playerId);
  state.playerIdToSocketId.set(playerId, socketId);
  return true;
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
  const sessionId = state.socketToSessionId.get(socketId);
  if (sessionId) state.sessionIdToPlayerId.set(sessionId, playerId);
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
  state.socketToSessionId.delete(socketId);
  state.startGameVoters.delete(playerId);
  state.restartVoters.delete(playerId);
  if (state.actionCardLock?.playerId === playerId) state.actionCardLock = null;
  if (state.phase === 'lobby') {
    state.players = state.players.filter((p) => p.id !== playerId);
    // Auto-start if all remaining players have voted and conditions are met
    if (state.players.length >= 2 && state.players.every((p) => state.startGameVoters.has(p.id))) {
      startGame();
    }
  }
  // During game, keep the player to not break state; their socket is just gone
  if (state.phase !== 'lobby') {
    const player = state.players.find((p) => p.id === playerId);
    if (player) player.readyForNextRound = false;
  }
}

export function startGame(shufflePlayers = true): string | null {
  if (state.phase !== 'lobby') return 'Game already running';
  if (state.players.length < 2) return 'Need at least 2 players';

  if (shufflePlayers) {
    for (let i = state.players.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [state.players[i], state.players[j]] = [state.players[j], state.players[i]];
    }
  }

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
    const n = state.players.length;
    const alreadyBlack = new Set<number>();
    if (state.enabledAddons.has('ones-are-black')) alreadyBlack.add(1);
    if (state.enabledAddons.has('ns-are-black')) alreadyBlack.add(n);
    const candidates = Array.from({ length: n }, (_, i) => i + 1).filter(v => !alreadyBlack.has(v));
    if (candidates.length === 0) {
      state.blackXValue = null;
    } else {
      state.blackXValue = candidates[Math.floor(Math.random() * candidates.length)];
    }
  } else {
    state.blackXValue = null;
  }

  const deck = createShuffledDeck();
  const playerIds = state.players.map((p) => p.id);
  const { assignments, remainingDeck } = dealHoleCards(deck, playerIds);

  state.holeCards = assignments;
  state.deck = remainingDeck;

  state.communityCards = [];
  const blackjackActive = state.enabledAddons.has('share-blackjack-sum') || state.enabledAddons.has('share-number-of-faces');
  let startRound = 1;
  // Skip disabled starting rounds; if blackjack phase is active, defer their community cards
  // until the phase ends (spec: "before any other aspects of the normal rounds have happened,
  // for example, dealing chips or cards")
  while (startRound <= 3 && isRoundSkipped(startRound)) {
    if (!blackjackActive) {
      const count = roundCommunityCardCount(startRound);
      if (count > 0) {
        const [drawn, remaining] = drawCards(state.deck, count);
        state.communityCards.push(...drawn);
        state.deck = remaining;
      }
    }
    startRound++;
  }
  state.currentRound = startRound as RoundNumber;
  for (const player of state.players) {
    player.chips = [];
    player.readyForNextRound = false;
  }
  state.blackjackPhase = blackjackActive;
  state.middleChips = blackjackActive ? [] : createChipsForRound(startRound as RoundNumber, state.players.length);
  const ALL_RANKS: string[] = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
  state.unsuitedXRank = state.enabledAddons.has('action-unsuited-x')
    ? ALL_RANKS[Math.floor(Math.random() * ALL_RANKS.length)]
    : null;

  state.showCardUsed = false;
  state.showCardData = null;
  state.actionCardLock = null;
  state.unsuitedJacks = new Map();
  state.unsuitedXs = new Map();
  state.rerollCommonUsed = false;
  state.gameId = randomUUID();
  state.phase = 'game';
  return null;
}

export function discardChip(socketId: string, chipNumber: number): string | null {
  if (state.phase !== 'game') return 'Not in game';
  if (state.blackjackPhase) return 'Cannot interact with chips during Blackjack Sum phase';
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
  if (state.blackjackPhase) return 'Cannot interact with chips during Blackjack Sum phase';
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
  if (state.blackjackPhase) return 'Cannot interact with chips during Blackjack Sum phase';
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

  if (state.blackjackPhase) {
    if (state.players.every(p => p.readyForNextRound)) {
      state.blackjackPhase = false;
      for (const p of state.players) p.readyForNextRound = false;
      // Draw community cards for any rounds that were skipped at game start (deferred during blackjack phase)
      for (let r = 1; r < state.currentRound; r++) {
        const count = roundCommunityCardCount(r);
        if (count > 0) {
          const [drawn, remaining] = drawCards(state.deck, count);
          state.communityCards.push(...drawn);
          state.deck = remaining;
        }
      }
      state.middleChips = createChipsForRound(state.currentRound, state.players.length);
    }
    return null;
  }

  checkAndAdvance();
  return null;
}

export function revealCards(socketId: string): string | null {
  if (state.phase !== 'finished') return 'Not in finished phase';
  const playerId = state.socketToPlayerId.get(socketId);
  if (!playerId) return 'Player not found';

  const myPlayer = state.players.find((p) => p.id === playerId);
  if (!myPlayer) return 'Player not found';
  const myChip = myPlayer.chips.find((c) => c.round === 4);
  if (myChip) {
    for (const player of state.players) {
      if (player.id === playerId) continue;
      const theirChip = player.chips.find((c) => c.round === 4);
      if (theirChip && theirChip.number < myChip.number && !state.revealedPlayers.has(player.id)) {
        return 'Wait for players with smaller chips to reveal first';
      }
    }
  }

  for (const addonId of GUESS_RANK_ADDON_IDS) {
    if (!state.enabledAddons.has(addonId)) continue;
    const targetId = findGuessRankTargetId(addonId, state.players);
    if (playerId !== targetId) continue;
    const addonVotes = state.rankGuesses.get(addonId) ?? new Map<string, string>();
    const nonTargetPlayers = state.players.filter((p) => p.id !== targetId);
    if (nonTargetPlayers.length > 0 && !nonTargetPlayers.every((p) => addonVotes.has(p.id))) {
      return 'Wait for all players to guess your hand rank first';
    }
  }

  state.revealedPlayers.add(playerId);
  return null;
}

export function submitRankGuess(socketId: string, addonId: string, rank: string): string | null {
  if (state.phase !== 'finished') return 'Not in finished phase';
  if (!(GUESS_RANK_ADDON_IDS as readonly string[]).includes(addonId)) return 'Invalid addon';
  if (!state.enabledAddons.has(addonId)) return 'Addon not active';
  if (!VALID_RANKS.has(rank)) return 'Invalid rank';
  const playerId = state.socketToPlayerId.get(socketId);
  if (!playerId) return 'Player not found';
  const targetId = findGuessRankTargetId(addonId, state.players);
  if (playerId === targetId) return 'Target player cannot vote for themselves';
  const addonVotes = state.rankGuesses.get(addonId) ?? new Map<string, string>();
  const nonTargetPlayers = state.players.filter((p) => p.id !== targetId);
  if (nonTargetPlayers.every((p) => addonVotes.has(p.id))) return 'Voting is locked';
  // Apply vote to this addon and all other enabled guess-rank addons targeting the same player
  for (const aid of GUESS_RANK_ADDON_IDS) {
    if (!state.enabledAddons.has(aid)) continue;
    if (findGuessRankTargetId(aid, state.players) !== targetId) continue;
    const votes = state.rankGuesses.get(aid) ?? new Map<string, string>();
    votes.set(playerId, rank);
    state.rankGuesses.set(aid, votes);
    if (!state.winningGuessRanks.has(aid) && nonTargetPlayers.every((p) => votes.has(p.id))) {
      const counts = new Map<string, number>();
      for (const r of votes.values()) counts.set(r, (counts.get(r) ?? 0) + 1);
      const maxCount = Math.max(...counts.values());
      const topRanks = [...counts.entries()].filter(([, c]) => c === maxCount).map(([r]) => r);
      state.winningGuessRanks.set(aid, topRanks[Math.floor(Math.random() * topRanks.length)]);
    }
  }
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
  return startGame(false);
}

export function toggleStartGameVote(socketId: string): string | null {
  if (state.phase !== 'lobby') return 'Not in lobby';
  const playerId = state.socketToPlayerId.get(socketId);
  if (!playerId) return 'Not in lobby';
  if (state.startGameVoters.has(playerId)) {
    state.startGameVoters.delete(playerId);
  } else {
    if (state.players.length < 2) return 'Need at least 2 players';
    const negativePool = ADDONS.filter((a) => a.type === 'negative' && state.addonPool.has(a.id));
    const positivePool = ADDONS.filter((a) => a.type === 'positive' && state.addonPool.has(a.id));
    if (state.negativeAddonCount > negativePool.length) return 'Not enough negative addons in pool';
    if (state.positiveAddonCount > positivePool.length) return 'Not enough positive addons in pool';
    state.startGameVoters.add(playerId);
    if (state.startGameVoters.size === state.players.length) {
      return startGame();
    }
  }
  return null;
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

export function toggleRestartVote(socketId: string): string | null {
  const playerId = state.socketToPlayerId.get(socketId);
  if (!playerId) return 'Player not found';
  if (state.restartVoters.has(playerId)) {
    state.restartVoters.delete(playerId);
  } else {
    state.restartVoters.add(playerId);
    if (state.players.length >= 2 && state.restartVoters.size === state.players.length) {
      return restartGame();
    }
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
  state.noOldChipsHidden = new Map();
  state.rankGuesses = new Map();
  state.winningGuessRanks = new Map();
  state.showCardUsed = false;
  state.showCardData = null;
  state.actionCardLock = null;
  state.unsuitedJacks = new Map();
  state.unsuitedXs = new Map();
  state.unsuitedXRank = null;
  state.rerollCommonUsed = false;
  state.blackjackPhase = false;
  state.enabledAddons = new Set();
  state.blackXValue = null;
  state.addonPool = savedAddonPool ?? new Set(ADDONS.map((a) => a.id));
  state.negativeAddonCount = savedNegativeCount;
  state.positiveAddonCount = savedPositiveCount;
  state.startGameVoters = new Set();
  state.restartVoters = new Set();
  state.sessionIdToPlayerId = new Map();
  // Keep socket mappings but clear player associations
  for (const [socketId] of state.socketToPlayerId) {
    state.socketToPlayerId.set(socketId, '');
  }
  state.playerIdToSocketId.clear();
}

export function useUnsuitedJack(socketId: string, cardIndex: 0 | 1): string | null {
  if (state.phase !== 'game') return 'Not in game';
  if (!state.enabledAddons.has('action-unsuited-jack')) return 'Addon not active';
  if (state.unsuitedJacks.size > 0) return 'Action already used this game';
  const playerId = state.socketToPlayerId.get(socketId);
  if (!playerId) return 'Player not found';
  state.unsuitedJacks.set(playerId, cardIndex);
  state.actionCardLock = null;
  return null;
}

export function useUnsuitedX(socketId: string, cardIndex: 0 | 1): string | null {
  if (state.phase !== 'game') return 'Not in game';
  if (!state.enabledAddons.has('action-unsuited-x')) return 'Addon not active';
  if (state.unsuitedXs.size > 0) return 'Action already used this game';
  const playerId = state.socketToPlayerId.get(socketId);
  if (!playerId) return 'Player not found';
  state.unsuitedXs.set(playerId, cardIndex);
  state.actionCardLock = null;
  return null;
}

export function useRerollCommon(socketId: string, cardIndex: number): string | null {
  if (state.phase !== 'game') return 'Not in game';
  if (!state.enabledAddons.has('action-reroll-common')) return 'Addon not active';
  if (state.rerollCommonUsed) return 'Action already used this game';
  if (cardIndex < 0 || cardIndex >= state.communityCards.length) return 'Invalid card index';
  if (state.deck.length === 0) return 'No cards left in deck';
  const playerId = state.socketToPlayerId.get(socketId);
  if (!playerId) return 'Player not found';
  const [[newCard], remaining] = [state.deck.slice(0, 1), state.deck.slice(1)];
  state.communityCards[cardIndex] = newCard;
  state.deck = remaining;
  state.rerollCommonUsed = true;
  state.actionCardLock = null;
  return null;
}

export function lockActionCard(socketId: string, addonId: string): string | null {
  if (state.phase !== 'game') return 'Not in game';
  const playerId = state.socketToPlayerId.get(socketId);
  if (!playerId) return 'Player not found';
  if (state.actionCardLock) return 'Action card already in use';
  state.actionCardLock = { addonId, playerId };
  return null;
}

export function unlockActionCard(socketId: string, addonId: string): string | null {
  const playerId = state.socketToPlayerId.get(socketId);
  if (!playerId) return 'Player not found';
  if (state.actionCardLock?.playerId !== playerId || state.actionCardLock?.addonId !== addonId) return null; // nothing to unlock
  state.actionCardLock = null;
  return null;
}

export function useShowCard(socketId: string, targetPlayerId: string, cardIndex: 0 | 1): string | null {
  if (state.phase !== 'game') return 'Not in game';
  if (!state.enabledAddons.has('show-1-card-to-1-player')) return 'Addon not active';
  if (state.showCardUsed) return 'Action already used this game';
  const playerId = state.socketToPlayerId.get(socketId);
  if (!playerId) return 'Player not found';
  if (playerId === targetPlayerId) return 'Cannot show card to yourself';
  const target = state.players.find((p) => p.id === targetPlayerId);
  if (!target) return 'Target player not found';
  const holeCards = state.holeCards[playerId];
  if (!holeCards) return 'No hole cards';
  const card = holeCards[cardIndex];
  state.showCardUsed = true;
  state.showCardData = { sourceId: playerId, targetId: targetPlayerId, card, cardIndex };
  state.actionCardLock = null;
  return null;
}

export function clearShowCardData(): void {
  state.showCardData = null;
}

function bjValue(rank: string): number {
  if (rank === 'A') return 11;
  if (rank === 'J' || rank === 'Q' || rank === 'K') return 10;
  return parseInt(rank, 10);
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
      if (state.enabledAddons.has('see-1-neighbor-cards')) {
        if (state.holeCards[leftNeighbor.id]) neighborHoleCards[leftNeighbor.id] = state.holeCards[leftNeighbor.id];
      }
    }
  }

  const allRevealed = state.phase === 'finished' && state.players.every((p) => state.revealedPlayers.has(p.id));

  return {
    phase: state.phase,
    gameId: state.gameId,
    players: state.players.map((p) => {
      const chips = [...p.chips];
      if (allRevealed && state.noOldChipsHidden.has(p.id)) {
        chips.push(...state.noOldChipsHidden.get(p.id)!);
      }
      return { ...p, chips };
    }),
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
    startGameVotes: state.startGameVoters.size,
    startGameVoterIds: [...state.startGameVoters],
    myStartGameVote: playerId ? state.startGameVoters.has(playerId) : false,
    restartVotes: state.restartVoters.size,
    restartVoterIds: [...state.restartVoters],
    myRestartVote: playerId ? state.restartVoters.has(playerId) : false,
    rankGuesses: state.phase === 'finished'
      ? Object.fromEntries([...state.rankGuesses].map(([aid, votes]) => [aid, Object.fromEntries(votes)]))
      : {},
    winningGuessRanks: state.phase === 'finished'
      ? Object.fromEntries(state.winningGuessRanks)
      : {},
    showCardUsed: state.showCardUsed,
    myShownCard: (playerId && state.showCardData?.targetId === playerId) ? state.showCardData.card : null,
    myShownCardFrom: (playerId && state.showCardData?.targetId === playerId) ? state.showCardData.sourceId : null,
    myShownCardIndex: (playerId && state.showCardData?.targetId === playerId) ? state.showCardData.cardIndex : null,
    myShownCardOutIndex: (playerId && state.showCardData?.sourceId === playerId) ? state.showCardData.cardIndex : null,
    actionCardLock: state.actionCardLock,
    unsuitedJacks: Object.fromEntries(state.unsuitedJacks),
    unsuitedJackUsed: state.unsuitedJacks.size > 0,
    unsuitedXs: Object.fromEntries(state.unsuitedXs),
    unsuitedXUsed: state.unsuitedXs.size > 0,
    unsuitedXRank: state.unsuitedXRank,
    rerollCommonUsed: state.rerollCommonUsed,
    blackjackPhase: state.blackjackPhase,
    blackjackSums: (() => {
      if (!state.blackjackPhase) return {};
      const sums: Record<string, number> = {};
      const isFaces = state.enabledAddons.has('share-number-of-faces');
      for (const p of state.players) {
        const cards = state.holeCards[p.id];
        if (cards) {
          if (isFaces) {
            sums[p.id] = (cards[0].rank === 'J' || cards[0].rank === 'Q' || cards[0].rank === 'K' ? 1 : 0)
                       + (cards[1].rank === 'J' || cards[1].rank === 'Q' || cards[1].rank === 'K' ? 1 : 0);
          } else {
            sums[p.id] = bjValue(cards[0].rank) + bjValue(cards[1].rank);
          }
        }
      }
      return sums;
    })(),
    shareInfoLabel: state.blackjackPhase
      ? (state.enabledAddons.has('share-number-of-faces') ? 'Number of Faces' : 'Blackjack Sum')
      : '',
  };
}
