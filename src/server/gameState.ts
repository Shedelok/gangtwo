import type { Card, Chip, ClientGameState, GamePhase, PlayerPublicState, RoundNumber } from '../shared/types';
import {
  createShuffledDeck,
  dealHoleCards,
  createChipsForRound,
  isRoundComplete,
  drawCards,
} from './gameLogic';
import { ADDONS, NEGATIVE_ADDON_TREE, POSITIVE_ADDON_TREE, pickAddonsFromTree, countAvailableInTree } from '../shared/addons';
import { randomUUID } from 'crypto';

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
  shareInfoQueue: string[];  // ordered list of share-info addon IDs to process
  shareInfoIndex: number;    // index into shareInfoQueue of the current addon
  prisonRound: number | null;    // the round where prison takes effect
  prisonPlayerId: string | null; // the player who is imprisoned
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
  shareInfoQueue: [],
  shareInfoIndex: 0,
  prisonRound: null,
  prisonPlayerId: null,
  gameId: '',
};

const GUESS_ADDON_IDS = [
  'guess-highest-red-chip-hand-rank',
  'guess-2nd-highest-red-chip-hand-rank',
  'guess-lowest-red-chip-hand-rank',
  'guess-highest-red-chip-card-value',
] as const;

/** Returns the "feature" that a guess addon is guessing: 'hand-rank' or 'card-value'. */
function guessAddonFeature(addonId: string): 'hand-rank' | 'card-value' {
  if (addonId === 'guess-highest-red-chip-card-value') return 'card-value';
  return 'hand-rank';
}

function findGuessTargetId(addonId: string, players: PlayerPublicState[]): string | null {
  const sorted = [...players]
    .map(p => ({ id: p.id, num: p.chips.find(c => c.round === 4)?.number ?? -1 }))
    .filter(x => x.num >= 0)
    .sort((a, b) => a.num - b.num);
  if (addonId === 'guess-lowest-red-chip-hand-rank') return sorted[0]?.id ?? null;
  if (addonId === 'guess-highest-red-chip-hand-rank' || addonId === 'guess-highest-red-chip-card-value') return sorted[sorted.length - 1]?.id ?? null;
  if (addonId === 'guess-2nd-highest-red-chip-hand-rank') return sorted[sorted.length - 2]?.id ?? null;
  return null;
}

const VALID_HAND_RANKS = new Set([
  'Royal Flush', 'Straight Flush', 'Four of a Kind', 'Full House',
  'Flush', 'Straight', 'Three of a Kind', 'Two Pair', 'One Pair', 'High Card',
]);

const VALID_CARD_VALUES = new Set([
  '(A) Ace', '(K) King', '(Q) Queen', '(J) Jack', '(10) Ten', '(9) Nine',
  '(8) Eight', '(7) Seven', '(6) Six', '(5) Five', '(4) Four', '(3) Three', '(2) Two',
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

function isPlayerImprisoned(playerId: string): boolean {
  return state.enabledAddons.has('prison') &&
         state.prisonRound === state.currentRound &&
         state.prisonPlayerId === playerId;
}

/** Returns the set of chip values that are "black" (immovable once taken from the middle). */
function getBlackChipNumbers(): Set<number> {
  const black = new Set<number>();
  if (state.enabledAddons.has('ones-are-black')) black.add(1);
  if (state.enabledAddons.has('ns-are-black')) black.add(state.players.length);
  if (state.enabledAddons.has('xs-are-black') && state.blackXValue !== null) black.add(state.blackXValue);
  return black;
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
    const isPrisonRound = state.enabledAddons.has('prison') && state.prisonRound === nextRound;
    const chipCount = isPrisonRound ? state.players.length - 1 : state.players.length;
    state.middleChips = createChipsForRound(nextRound as RoundNumber, chipCount);
    for (const player of state.players) {
      // Imprisoned player is automatically ready during their prison round
      if (isPrisonRound && player.id === state.prisonPlayerId) {
        player.readyForNextRound = true;
      } else {
        player.readyForNextRound = false;
      }
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
  const excludeIds = new Set<string>();
  if (state.enabledAddons.has('prison') && state.prisonRound === state.currentRound && state.prisonPlayerId) {
    excludeIds.add(state.prisonPlayerId);
  }
  if (state.phase === 'game' && isRoundComplete(state.players, state.currentRound, excludeIds)) {
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
    // Don't reset readiness for imprisoned players — they are always auto-ready during their prison round
    if (player && !isPlayerImprisoned(playerId)) player.readyForNextRound = false;
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

  const negativeAvailable = countAvailableInTree(NEGATIVE_ADDON_TREE, state.addonPool);
  const positiveAvailable = countAvailableInTree(POSITIVE_ADDON_TREE, state.addonPool);

  if (state.negativeAddonCount > negativeAvailable)
    return 'Not enough negative addons in pool';
  if (state.positiveAddonCount > positiveAvailable)
    return 'Not enough positive addons in pool';

  state.enabledAddons = new Set([
    ...pickAddonsFromTree(NEGATIVE_ADDON_TREE, state.addonPool, state.negativeAddonCount),
    ...pickAddonsFromTree(POSITIVE_ADDON_TREE, state.addonPool, state.positiveAddonCount),
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

  const isShortDeck = state.enabledAddons.has('short-deck');
  const deck = createShuffledDeck(isShortDeck);
  const playerIds = state.players.map((p) => p.id);
  const { assignments, remainingDeck } = dealHoleCards(deck, playerIds);

  state.holeCards = assignments;
  state.deck = remainingDeck;

  state.communityCards = [];
  const SHARE_INFO_ADDON_IDS = ['share-blackjack-sum', 'share-number-of-faces'];
  state.shareInfoQueue = SHARE_INFO_ADDON_IDS.filter(id => state.enabledAddons.has(id));
  state.shareInfoIndex = 0;
  const blackjackActive = state.shareInfoQueue.length > 0;
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
  const ALL_RANKS: string[] = isShortDeck
    ? ['10','J','Q','K','A']
    : ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
  state.unsuitedXRank = state.enabledAddons.has('action-unsuited-x')
    ? ALL_RANKS[Math.floor(Math.random() * ALL_RANKS.length)]
    : null;

  state.showCardUsed = false;
  state.showCardData = null;
  state.actionCardLock = null;
  state.unsuitedJacks = new Map();
  state.unsuitedXs = new Map();
  state.rerollCommonUsed = false;

  // Prison addon: determine random round R and random player P
  if (state.enabledAddons.has('prison')) {
    // Spec: "a random round R (from 1 to 3, excluding any rounds skipped by other addons)"
    const availableRounds = [1, 2, 3].filter(r => !isRoundSkipped(r));
    if (availableRounds.length > 0) {
      state.prisonRound = availableRounds[Math.floor(Math.random() * availableRounds.length)];
      state.prisonPlayerId = state.players[Math.floor(Math.random() * state.players.length)].id;
    } else {
      // All rounds are skipped by other addons — prison has no effect
      state.prisonRound = null;
      state.prisonPlayerId = null;
    }
  } else {
    state.prisonRound = null;
    state.prisonPlayerId = null;
  }

  state.gameId = randomUUID();
  state.phase = 'game';

  // If prison round is the starting round, set up accordingly
  const isPrisonStartRound = state.enabledAddons.has('prison') && state.prisonRound === state.currentRound;
  if (isPrisonStartRound && !state.blackjackPhase) {
    // Reduce chips by 1 for prison round
    const chipCount = state.players.length - 1;
    state.middleChips = createChipsForRound(state.currentRound, chipCount);
    // Auto-ready the imprisoned player
    const prisonPlayer = state.players.find(p => p.id === state.prisonPlayerId);
    if (prisonPlayer) prisonPlayer.readyForNextRound = true;
  }

  return null;
}

export function discardChip(socketId: string, chipNumber: number): string | null {
  if (state.phase !== 'game') return 'Not in game';
  if (state.blackjackPhase) return 'Cannot interact with chips during Blackjack Sum phase';
  const player = getPlayerBySocket(socketId);
  if (!player) return 'Player not found';
  if (isPlayerImprisoned(player.id)) return 'You are imprisoned this round';

  const idx = player.chips.findIndex(
    (c) => c.round === state.currentRound && c.number === chipNumber
  );
  if (idx === -1) return 'You do not hold that chip for the current round';

  // Black chips cannot be returned after being taken from the middle
  if (getBlackChipNumbers().has(chipNumber)) return 'Black chips cannot be returned';

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
  if (isPlayerImprisoned(player.id)) return 'You are imprisoned this round';

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
  if (isPlayerImprisoned(player.id)) return 'You are imprisoned this round';

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

  // Black chips cannot be stolen
  if (getBlackChipNumbers().has(chipNumber)) return 'Black chips cannot be stolen';

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
  if (isPlayerImprisoned(player.id)) return 'You are imprisoned this round';

  player.readyForNextRound = ready;

  if (state.blackjackPhase) {
    if (state.players.every(p => p.readyForNextRound)) {
      state.shareInfoIndex++;
      for (const p of state.players) p.readyForNextRound = false;
      if (state.shareInfoIndex >= state.shareInfoQueue.length) {
        // All share-info addons processed — end the phase
        state.blackjackPhase = false;
        // Draw community cards for any rounds that were skipped at game start (deferred during blackjack phase)
        for (let r = 1; r < state.currentRound; r++) {
          const count = roundCommunityCardCount(r);
          if (count > 0) {
            const [drawn, remaining] = drawCards(state.deck, count);
            state.communityCards.push(...drawn);
            state.deck = remaining;
          }
        }
        const isPrisonRoundAfterBJ = state.enabledAddons.has('prison') && state.prisonRound === state.currentRound;
        const chipCountAfterBJ = isPrisonRoundAfterBJ ? state.players.length - 1 : state.players.length;
        state.middleChips = createChipsForRound(state.currentRound, chipCountAfterBJ);
        // Auto-ready imprisoned player after blackjack phase ends
        if (isPrisonRoundAfterBJ && state.prisonPlayerId) {
          const prisonPlayer = state.players.find(p => p.id === state.prisonPlayerId);
          if (prisonPlayer) prisonPlayer.readyForNextRound = true;
        }
      }
      // else: stay in blackjackPhase for the next share-info addon
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

  for (const addonId of GUESS_ADDON_IDS) {
    if (!state.enabledAddons.has(addonId)) continue;
    const targetId = findGuessTargetId(addonId, state.players);
    if (playerId !== targetId) continue;
    const addonVotes = state.rankGuesses.get(addonId) ?? new Map<string, string>();
    const nonTargetPlayers = state.players.filter((p) => p.id !== targetId);
    if (nonTargetPlayers.length > 0 && !nonTargetPlayers.every((p) => addonVotes.has(p.id))) {
      return 'Wait for all players to submit their guesses first';
    }
  }

  state.revealedPlayers.add(playerId);
  return null;
}

export function submitRankGuess(socketId: string, addonId: string, rank: string): string | null {
  if (state.phase !== 'finished') return 'Not in finished phase';
  if (!(GUESS_ADDON_IDS as readonly string[]).includes(addonId)) return 'Invalid addon';
  if (!state.enabledAddons.has(addonId)) return 'Addon not active';
  const feature = guessAddonFeature(addonId);
  if (feature === 'hand-rank' && !VALID_HAND_RANKS.has(rank)) return 'Invalid rank';
  if (feature === 'card-value' && !VALID_CARD_VALUES.has(rank)) return 'Invalid card value';
  const playerId = state.socketToPlayerId.get(socketId);
  if (!playerId) return 'Player not found';
  const targetId = findGuessTargetId(addonId, state.players);
  if (playerId === targetId) return 'Target player cannot vote for themselves';
  const nonTargetPlayers = state.players.filter((p) => p.id !== targetId);
  // Spec: "All guesses are fixed together when all votes are submitted" — check if ALL
  // guess addons targeting the same player (across all features) are fully voted.
  // If so, voting is locked and no changes are allowed.
  const allAddonsForTarget = GUESS_ADDON_IDS.filter(
    (aid) => state.enabledAddons.has(aid) && findGuessTargetId(aid, state.players) === targetId
  );
  // Dedup by feature: only one addon per feature matters for lock check
  const seenFeatures = new Set<string>();
  const dedupedAddonsForTarget = allAddonsForTarget.filter((aid) => {
    const f = guessAddonFeature(aid);
    if (seenFeatures.has(f)) return false;
    seenFeatures.add(f);
    return true;
  });
  const allFeaturesVoted = dedupedAddonsForTarget.every((aid) => {
    const votes = state.rankGuesses.get(aid) ?? new Map<string, string>();
    return nonTargetPlayers.every((p) => votes.has(p.id));
  });
  if (allFeaturesVoted) return 'Voting is locked';
  // Apply vote to this addon and all other enabled guess addons targeting the same player
  // with the same feature (spec: "same feature" dedup only)
  for (const aid of GUESS_ADDON_IDS) {
    if (!state.enabledAddons.has(aid)) continue;
    if (findGuessTargetId(aid, state.players) !== targetId) continue;
    if (guessAddonFeature(aid) !== feature) continue;
    const votes = state.rankGuesses.get(aid) ?? new Map<string, string>();
    votes.set(playerId, rank);
    state.rankGuesses.set(aid, votes);
  }
  // After applying the vote, check if ALL features for this target are now fully voted.
  // If so, determine the winning guess for each addon.
  const allFeaturesNowVoted = dedupedAddonsForTarget.every((aid) => {
    const votes = state.rankGuesses.get(aid) ?? new Map<string, string>();
    return nonTargetPlayers.every((p) => votes.has(p.id));
  });
  if (allFeaturesNowVoted) {
    for (const aid of allAddonsForTarget) {
      if (state.winningGuessRanks.has(aid)) continue;
      const votes = state.rankGuesses.get(aid) ?? new Map<string, string>();
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
    const negAvail = countAvailableInTree(NEGATIVE_ADDON_TREE, state.addonPool);
    const posAvail = countAvailableInTree(POSITIVE_ADDON_TREE, state.addonPool);
    if (state.negativeAddonCount > negAvail) return 'Not enough negative addons in pool';
    if (state.positiveAddonCount > posAvail) return 'Not enough positive addons in pool';
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

export function finishGame(keepAddons = false): void {
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
  state.shareInfoQueue = [];
  state.shareInfoIndex = 0;
  state.prisonRound = null;
  state.prisonPlayerId = null;
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
  if (isPlayerImprisoned(playerId)) return 'You are imprisoned this round';
  // Race condition guard: if the lock is already held, silently ignore the attempt
  // (spec: "at most one of them enters the usage workflow; the other's attempt is silently ignored").
  // We return null (no error) so the server broadcasts state, letting the client see who holds the lock.
  if (state.actionCardLock) return null;
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
      const currentAddon = state.shareInfoQueue[state.shareInfoIndex];
      const sums: Record<string, number> = {};
      const isFaces = currentAddon === 'share-number-of-faces';
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
      ? (state.shareInfoQueue[state.shareInfoIndex] === 'share-number-of-faces' ? 'Number of Faces' : 'Blackjack Sum')
      : '',
    prisonPlayerId: (state.enabledAddons.has('prison') && state.prisonRound === state.currentRound && state.prisonPlayerId)
      ? state.prisonPlayerId
      : null,
    prisonRound: state.enabledAddons.has('prison') ? state.prisonRound : null,
  };
}
