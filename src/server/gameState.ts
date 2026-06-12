import type { Card, Chip, ClientGameState, GamePhase, PlayerPublicState, RoundNumber } from '../shared/types';
import {
  createShuffledDeck,
  dealHoleCards,
  createChipsForRound,
  isRoundComplete,
  drawCards,
  parseCardList,
  cardKey,
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
  // Test Mode (lobby only). When enabled, players can set specific cards for each player and
  // for the common cards. Stored as raw text; parsed/validated lazily.
  testMode: boolean;
  testModePlayerCards: Map<string, string>; // playerId → raw card-list text
  testModeCommonCards: string;              // raw card-list text for common cards
  // Raw rank-token text for the [A] Unsuited X addon (Test Mode only). A single rank token
  // (2–9, 10, J, Q, K, A) forces X; empty means X is chosen randomly at game start.
  testModeUnsuitedXRank: string;
  noOldChipsHidden: Map<string, Chip[]>; // playerId → chips hidden by no-old-chips addon
  rankGuesses: Map<string, Map<string, string>>; // addonId → (voterId → rank)
  winningGuessRanks: Map<string, string>; // addonId → winning rank (set when voting locks)
  showCardUsed: boolean;
  showCardData: { sourceId: string; targetId: string; card: Card; cardIndex: 0 | 1 } | null;
  actionCardLock: { addonId: string; playerId: string } | null;
  unsuitedJacks: Map<string, number>; // playerId → pocket card index (when held in a player's hand)
  unsuitedXs: Map<string, number>;    // playerId → pocket card index (when held in a player's hand)
  // When the unsuited Jack/X has been moved to the common cards (e.g., via swap-with-common),
  // it sits in this common-card slot index instead of in any player's hand. The spec for
  // [A] Unsuited Jack states: "This Jack is always unsuited (orange) even if it becomes a
  // common card." Same applies to [A] Unsuited X.
  unsuitedJackCommonIndex: number | null;
  unsuitedXCommonIndex: number | null;
  // Persistent "used this game" flags for the unsuited Jack/X action cards. Spec: "If unsuited
  // Jack is discarded at any point of the game, it's just normally discarded, the action card
  // doesn't return to the table." Once these are set, the action card stays unavailable for the
  // remainder of the game even if the unsuited card itself is later discarded (e.g., dropped
  // via try-another-card or rerolled out of a common slot).
  unsuitedJackUsed: boolean;
  unsuitedXUsed: boolean;
  unsuitedXRank: string | null;
  rerollCommonUsed: boolean;
  swapWithCommonUsed: boolean;
  // Active swap-with-common animation. `pocketUnsuitedRank` / `commonUnsuitedRank` carry
  // the rank ('J' or X's random rank) when the corresponding flying card is the unsuited
  // Jack / Unsuited X (in which case clients render it as orange and face up, per spec).
  swapWithCommonAnimation: {
    playerId: string;
    pocketIndex: 0 | 1;
    commonIndex: number;
    pocketCard: Card;
    commonCard: Card;
    pocketUnsuitedRank: string | null;
    commonUnsuitedRank: string | null;
  } | null;
  tryAnotherCardUsed: boolean;
  tryAnotherCardPlayerId: string | null; // player currently in the try-another-card flow
  tryAnotherCardExtraCard: Card | null;  // the extra card drawn from the deck
  // Vacation addon: once a player takes the vacation card, they hold it until the end of
  // the game; during the last round (round 4) they are excluded from chip distribution and
  // cannot take/steal chips or use action cards (similar to Prison). They are also excluded
  // from win/lose determination after the last round, and during the reveal-cards phase
  // they reveal after all red-chip holders have revealed.
  vacationUsed: boolean;
  vacationPlayerId: string | null;
  // [A] Destroy all Xs addon: once a player uses the action card, the chosen rank's cards
  // are treated as discarded everywhere — they're removed from the deck and any card slot
  // (community/pocket) whose card has the destroyed rank renders as blank for clients.
  destroyAllXsUsed: boolean;
  destroyedRanks: Set<string>;
  // Per spec: "The cards that are being destroyed by this addon are not disappearing instantly,
  // instead an animation is played. The card disappears top to bottom with constant speed. The
  // animation takes 5 seconds. All cards disappear at the same time."
  // While populated, clients render every slot whose card has this rank with a 5-second wipe
  // animation (top→bottom). Cleared by the server 5 seconds after the destroy action.
  destroyAllXsAnimatingRank: string | null;
  // Per spec: "as soon as the action card is played, there's a dialogue cloud displayed above
  // the player who played the card with text like 'Destroyed Queens' or 'Destroyed 6s'
  // depending on the actual choice. This cloud disappears after 10 seconds." Holds the
  // player who played the destroy card and the chosen rank; cleared by the server 10 seconds
  // after the destroy action.
  destroyAllXsCloud: { playerId: string; rank: string } | null;
  // [A] Check Number of Ranks addon: once-per-game flag. Spec: "Once per game, one of the
  // players can check how many cards of chosen rank R are in play."
  checkNumberOfRanksUsed: boolean;
  // Per spec: "the player sees a dialogue cloud. The cloud has text like 'There are 3 Queens
  // in the game right now (Only visible to you)' depending on the actual number and the rank
  // the player chosen. The cloud is only visible to the player who played the card." Holds
  // the player who played the action card, the chosen rank, and the computed count. The
  // server only emits this cloud to that player in `buildClientState`. Cleared 10 seconds
  // after the action is committed.
  checkNumberOfRanksCloud: { playerId: string; rank: string; count: number } | null;
  blackjackPhase: boolean;
  shareInfoQueue: string[];  // ordered list of share-info addon IDs to process
  shareInfoIndex: number;    // index into shareInfoQueue of the current addon
  passCardPhase: boolean;
  passCardChoices: Map<string, number>; // playerId → chosen card index for pass-1-card
  // Active pass-1-card animations: each entry describes a card movement that is currently
  // being animated (source player/slot → destination player/slot). Populated when the
  // simultaneous pass swap is performed; cleared 2 seconds later (animation duration).
  passCardAnimations: Array<{ fromPlayerId: string; fromSlot: 0 | 1; toPlayerId: string; toSlot: 0 | 1 }>;
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
  testMode: false,
  testModePlayerCards: new Map(),
  testModeCommonCards: '',
  testModeUnsuitedXRank: '',
  noOldChipsHidden: new Map(),
  rankGuesses: new Map(),
  winningGuessRanks: new Map(),
  showCardUsed: false,
  showCardData: null,
  actionCardLock: null,
  unsuitedJacks: new Map(),
  unsuitedXs: new Map(),
  unsuitedJackCommonIndex: null,
  unsuitedXCommonIndex: null,
  unsuitedJackUsed: false,
  unsuitedXUsed: false,
  unsuitedXRank: null,
  rerollCommonUsed: false,
  swapWithCommonUsed: false,
  swapWithCommonAnimation: null,
  tryAnotherCardUsed: false,
  tryAnotherCardPlayerId: null,
  tryAnotherCardExtraCard: null,
  vacationUsed: false,
  vacationPlayerId: null,
  destroyAllXsUsed: false,
  destroyedRanks: new Set(),
  destroyAllXsAnimatingRank: null,
  destroyAllXsCloud: null,
  checkNumberOfRanksUsed: false,
  checkNumberOfRanksCloud: null,
  blackjackPhase: false,
  shareInfoQueue: [],
  shareInfoIndex: 0,
  passCardPhase: false,
  passCardChoices: new Map(),
  passCardAnimations: [],
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

/** Card values excluded from the deck when Short Deck addon is active (values 2-9). */
const SHORT_DECK_EXCLUDED_CARD_VALUES = new Set([
  '(9) Nine', '(8) Eight', '(7) Seven', '(6) Six', '(5) Five', '(4) Four', '(3) Three', '(2) Two',
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
         state.prisonPlayerId === playerId &&
         !state.blackjackPhase && // Prison does not apply during pre-round phases (e.g. share info)
         !state.passCardPhase;     // Prison does not apply during pass-1-card pre-round phase either
}

/**
 * Returns true if the given player is currently on vacation during the last round
 * (round 4). Vacation players are excluded from chip distribution, cannot take/steal chips,
 * cannot use action cards during round 4, and are auto-treated as ready.
 */
function isPlayerOnVacationThisRound(playerId: string): boolean {
  return state.enabledAddons.has('action-vacation') &&
         state.vacationPlayerId === playerId &&
         state.currentRound === 4 &&
         !state.blackjackPhase &&
         !state.passCardPhase;
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
    // Vacation: during the last round (round 4), if any player holds the vacation card,
    // one fewer chip is placed on the table and the vacation player is auto-ready.
    const isLastRoundWithVacation =
      nextRound === 4 && state.enabledAddons.has('action-vacation') && state.vacationPlayerId !== null;
    let chipCount = state.players.length;
    if (isPrisonRound) chipCount -= 1;
    if (isLastRoundWithVacation) chipCount -= 1;
    state.middleChips = createChipsForRound(nextRound as RoundNumber, chipCount);
    for (const player of state.players) {
      // Imprisoned player is automatically ready during their prison round
      if (isPrisonRound && player.id === state.prisonPlayerId) {
        player.readyForNextRound = true;
      } else if (isLastRoundWithVacation && player.id === state.vacationPlayerId) {
        // Vacation player is automatically ready during the last round
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
  if (state.tryAnotherCardPlayerId) return;
  const excludeIds = new Set<string>();
  if (state.enabledAddons.has('prison') && state.prisonRound === state.currentRound && state.prisonPlayerId) {
    excludeIds.add(state.prisonPlayerId);
  }
  // Vacation: during the last round, the vacation player is excluded from round-completion check.
  if (state.enabledAddons.has('action-vacation') && state.currentRound === 4 && state.vacationPlayerId) {
    excludeIds.add(state.vacationPlayerId);
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

  const testModeError = validateTestModeConfig();
  if (testModeError) return testModeError;

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

  if (state.testMode) {
    const dealt = applyTestModeDeal(deck, playerIds);
    if (typeof dealt === 'string') {
      // Phase is still 'lobby' at this point — the game simply does not start.
      return dealt;
    }
    state.holeCards = dealt.holeCards;
    state.deck = dealt.deck;
  } else {
    const { assignments, remainingDeck } = dealHoleCards(deck, playerIds);
    state.holeCards = assignments;
    state.deck = remainingDeck;
  }

  state.communityCards = [];
  const SHARE_INFO_ADDON_IDS = ['share-blackjack-sum', 'share-number-of-faces'];
  state.shareInfoQueue = SHARE_INFO_ADDON_IDS.filter(id => state.enabledAddons.has(id));
  state.shareInfoIndex = 0;
  const passCardActive = state.enabledAddons.has('pass-1-card');
  const blackjackActive = state.shareInfoQueue.length > 0;
  // Pre-round phases (pass-1-card, share-info) defer community-card dealing
  // and chip distribution until the phase ends.
  const preRoundActive = passCardActive || blackjackActive;
  let startRound = 1;
  // Skip disabled starting rounds; if any pre-round phase is active, defer their
  // community cards until the phase ends (spec: "before any other aspects of the
  // normal rounds have happened, for example, dealing chips or cards")
  while (startRound <= 3 && isRoundSkipped(startRound)) {
    if (!preRoundActive) {
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
  state.passCardPhase = passCardActive;
  state.passCardChoices = new Map();
  state.blackjackPhase = !passCardActive && blackjackActive;
  state.middleChips = preRoundActive ? [] : createChipsForRound(startRound as RoundNumber, state.players.length);
  const ALL_RANKS: string[] = isShortDeck
    ? ['10','J','Q','K','A']
    : ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
  if (state.enabledAddons.has('action-unsuited-x')) {
    // Test Mode may force X to a specific rank; otherwise it is chosen randomly. An empty input
    // (or Test Mode disabled) falls back to a random rank.
    const specified = state.testMode ? state.testModeUnsuitedXRank.trim().toUpperCase() : '';
    if (specified !== '') {
      // Spec: "If the specified rank is invalid or conflicts with the current game configuration
      // the game cannot start." A rank not present in ALL_RANKS (e.g. 2-9 under Short Deck, or an
      // unparseable token) is rejected. Phase is still 'lobby', so the game simply does not start.
      if (!ALL_RANKS.includes(specified)) {
        return `Unsuited X rank "${state.testModeUnsuitedXRank.trim()}" is invalid for the current configuration`;
      }
      state.unsuitedXRank = specified;
    } else {
      state.unsuitedXRank = ALL_RANKS[Math.floor(Math.random() * ALL_RANKS.length)];
    }
  } else {
    state.unsuitedXRank = null;
  }

  state.showCardUsed = false;
  state.showCardData = null;
  state.actionCardLock = null;
  state.unsuitedJacks = new Map();
  state.unsuitedXs = new Map();
  state.unsuitedJackCommonIndex = null;
  state.unsuitedXCommonIndex = null;
  state.unsuitedJackUsed = false;
  state.unsuitedXUsed = false;
  state.rerollCommonUsed = false;
  state.swapWithCommonUsed = false;
  state.swapWithCommonAnimation = null;
  state.tryAnotherCardUsed = false;
  state.tryAnotherCardPlayerId = null;
  state.tryAnotherCardExtraCard = null;
  state.vacationUsed = false;
  state.vacationPlayerId = null;
  state.destroyAllXsUsed = false;
  state.destroyedRanks = new Set();
  state.destroyAllXsAnimatingRank = null;
  state.destroyAllXsCloud = null;
  state.checkNumberOfRanksUsed = false;
  state.checkNumberOfRanksCloud = null;

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

  // If prison round is the starting round, set up accordingly.
  // Pre-round phases (pass-1-card, share-info) defer chip distribution, so we only
  // adjust chip count / auto-ready when no pre-round phase is active.
  // Vacation never matters at game start: it requires the vacation card to be taken
  // (an action played by a player), which cannot happen on startGame.
  const isPrisonStartRound = state.enabledAddons.has('prison') && state.prisonRound === state.currentRound;
  if (isPrisonStartRound && !state.blackjackPhase && !state.passCardPhase) {
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
  if (state.passCardPhase) return 'Cannot interact with chips during Pass 1 Card phase';
  if (state.tryAnotherCardPlayerId) return 'Game is paused while a player is choosing a card to drop';
  const player = getPlayerBySocket(socketId);
  if (!player) return 'Player not found';
  if (isPlayerImprisoned(player.id)) return 'You are imprisoned this round';
  if (isPlayerOnVacationThisRound(player.id)) return 'You are on vacation this round';

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
  if (state.passCardPhase) return 'Cannot interact with chips during Pass 1 Card phase';
  if (state.tryAnotherCardPlayerId) return 'Game is paused while a player is choosing a card to drop';
  const player = getPlayerBySocket(socketId);
  if (!player) return 'Player not found';
  if (isPlayerImprisoned(player.id)) return 'You are imprisoned this round';
  if (isPlayerOnVacationThisRound(player.id)) return 'You are on vacation this round';

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
  if (state.passCardPhase) return 'Cannot interact with chips during Pass 1 Card phase';
  if (state.tryAnotherCardPlayerId) return 'Game is paused while a player is choosing a card to drop';
  const player = getPlayerBySocket(socketId);
  if (!player) return 'Player not found';
  if (isPlayerImprisoned(player.id)) return 'You are imprisoned this round';
  if (isPlayerOnVacationThisRound(player.id)) return 'You are on vacation this round';

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
  if (state.tryAnotherCardPlayerId) return 'Game is paused while a player is choosing a card to drop';
  const player = getPlayerBySocket(socketId);
  if (!player) return 'Player not found';
  if (isPlayerImprisoned(player.id)) return 'You are imprisoned this round';
  if (isPlayerOnVacationThisRound(player.id)) return 'You are on vacation this round';

  if (state.passCardPhase) {
    // During pass-1-card phase, players can only become ready if they have chosen a card.
    if (ready && !state.passCardChoices.has(player.id)) return 'Choose a card to pass first';
    player.readyForNextRound = ready;
    maybeFinishPassCardPhase();
    return null;
  }

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
        const isLastRoundWithVacationBJ =
          state.currentRound === 4 && state.enabledAddons.has('action-vacation') && state.vacationPlayerId !== null;
        let chipCountAfterBJ = state.players.length;
        if (isPrisonRoundAfterBJ) chipCountAfterBJ -= 1;
        if (isLastRoundWithVacationBJ) chipCountAfterBJ -= 1;
        state.middleChips = createChipsForRound(state.currentRound, chipCountAfterBJ);
        // Auto-ready imprisoned player after blackjack phase ends
        if (isPrisonRoundAfterBJ && state.prisonPlayerId) {
          const prisonPlayer = state.players.find(p => p.id === state.prisonPlayerId);
          if (prisonPlayer) prisonPlayer.readyForNextRound = true;
        }
        // Auto-ready vacation player when blackjack phase ends on the last round
        if (isLastRoundWithVacationBJ && state.vacationPlayerId) {
          const vacationPlayer = state.players.find(p => p.id === state.vacationPlayerId);
          if (vacationPlayer) vacationPlayer.readyForNextRound = true;
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
  // Spec (Vacation): "During the reveal cards phase, the vacation player reveals (can press
  // the reveal button) after all players holding a red chip have revealed their cards."
  if (state.enabledAddons.has('action-vacation') && state.vacationPlayerId === playerId) {
    for (const player of state.players) {
      if (player.id === playerId) continue;
      const theirChip = player.chips.find((c) => c.round === 4);
      if (theirChip && !state.revealedPlayers.has(player.id)) {
        return 'Wait for all red-chip holders to reveal first';
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
  if (feature === 'card-value') {
    if (!VALID_CARD_VALUES.has(rank)) return 'Invalid card value';
    // When Short Deck is active, card values 2-9 are excluded from the deck
    // and therefore cannot be guessed
    if (state.enabledAddons.has('short-deck') && SHORT_DECK_EXCLUDED_CARD_VALUES.has(rank)) {
      return 'Invalid card value for short deck';
    }
  }
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

/**
 * Validate the current Test Mode configuration. Returns an error string if the configuration
 * is invalid (cannot be parsed, too many cards for a player, or duplicate cards across all
 * inputs), or null if it is valid or Test Mode is disabled.
 *
 * Note: short-deck conflicts (cards 2-9 when Short Deck is randomly selected) cannot be
 * validated in the lobby because addon selection happens at game start; such conflicts are
 * validated when the game actually starts (see `applyTestModeDeal`).
 */
/**
 * Apply the Test Mode configuration to produce hole cards and a deck ordering for the given
 * shuffled deck. Specified cards are removed from the random pool: each player receives their
 * specified cards (in order) followed by random cards from the remaining deck, and the remaining
 * deck is ordered so that the specified common cards come out first (in order), with random
 * cards drawn after them.
 *
 * Returns an error string if a specified card is not present in the deck for the current
 * configuration (e.g. duplicate, or a 2-9 card while Short Deck is active), or if a player has
 * more than 2 specified cards.
 */
function applyTestModeDeal(
  deck: Card[],
  playerIds: string[]
): { holeCards: Record<string, [Card, Card]>; deck: Card[] } | string {
  // Pool of available cards keyed by card identity; we remove cards as they are claimed.
  const available = new Map<string, Card>();
  for (const c of deck) available.set(cardKey(c), c);

  const claim = (card: Card): string | null => {
    const key = cardKey(card);
    if (!available.has(key)) {
      // Either the card doesn't exist in the current deck (e.g. Short Deck excludes 2-9) or
      // it was already claimed by another input (duplicate).
      return `Card ${card.rank}${card.suit[0]} cannot be dealt with the current configuration`;
    }
    available.delete(key);
    return null;
  };

  // Parse and claim player-specified cards first.
  const playerSpecified: Record<string, Card[]> = {};
  for (const pid of playerIds) {
    const raw = state.testModePlayerCards.get(pid) ?? '';
    const cards = parseCardList(raw);
    if (cards === null) return 'Invalid cards in Test Mode configuration';
    if (cards.length > 2) return 'A player cannot have more than 2 cards';
    for (const c of cards) {
      const err = claim(c);
      if (err) return err;
    }
    playerSpecified[pid] = cards;
  }

  // Parse and claim common-specified cards.
  const commonSpecified = parseCardList(state.testModeCommonCards);
  if (commonSpecified === null) return 'Invalid common cards in Test Mode configuration';
  for (const c of commonSpecified) {
    const err = claim(c);
    if (err) return err;
  }

  // Remaining (unclaimed) cards, preserving the original shuffled order.
  const remaining = deck.filter((c) => available.has(cardKey(c)));
  let cursor = 0;
  const takeRandom = (): Card => remaining[cursor++];

  // Build hole cards: specified cards first (in order), random fill for the rest.
  const holeCards: Record<string, [Card, Card]> = {};
  for (const pid of playerIds) {
    const spec = playerSpecified[pid];
    const c0 = spec[0] ?? takeRandom();
    const c1 = spec[1] ?? takeRandom();
    holeCards[pid] = [c0, c1];
  }

  // Order the deck so specified common cards come out first (in order), then the rest of the
  // remaining random cards.
  const finalDeck: Card[] = [...commonSpecified, ...remaining.slice(cursor)];
  return { holeCards, deck: finalDeck };
}

/**
 * Validate the current Test Mode configuration. Returns an error string if the configuration
 * is invalid (cannot be parsed, too many cards for a player, or duplicate cards across all
 * inputs), or null if it is valid or Test Mode is disabled.
 *
 * Note: short-deck conflicts (cards 2-9 when Short Deck is randomly selected) cannot be
 * validated in the lobby because addon selection happens at game start; such conflicts are
 * validated when the game actually starts (see `applyTestModeDeal`).
 */
export function validateTestModeConfig(): string | null {
  if (!state.testMode) return null;
  const seen = new Map<string, true>();
  const checkAndCollect = (cards: ReturnType<typeof parseCardList>, label: string): string | null => {
    if (cards === null) return `Invalid cards for ${label}`;
    for (const card of cards) {
      const key = cardKey(card);
      if (seen.has(key)) return 'Duplicate card in Test Mode configuration';
      seen.set(key, true);
    }
    return null;
  };
  for (const player of state.players) {
    const raw = state.testModePlayerCards.get(player.id) ?? '';
    const cards = parseCardList(raw);
    if (cards !== null && cards.length > 2) return `Too many cards for ${player.name}`;
    const err = checkAndCollect(cards, player.name);
    if (err) return err;
  }
  const commonCards = parseCardList(state.testModeCommonCards);
  const err = checkAndCollect(commonCards, 'common cards');
  if (err) return err;
  return null;
}

export function setTestMode(enabled: boolean): string | null {
  if (state.phase !== 'lobby') return 'Cannot change test mode after game started';
  state.testMode = enabled;
  return null;
}

export function setTestModePlayerCards(socketId: string, playerId: string, cards: string): string | null {
  if (state.phase !== 'lobby') return 'Cannot change test mode after game started';
  if (!state.players.some((p) => p.id === playerId)) return 'Player not found';
  state.testModePlayerCards.set(playerId, cards);
  return null;
}

export function setTestModeCommonCards(cards: string): string | null {
  if (state.phase !== 'lobby') return 'Cannot change test mode after game started';
  state.testModeCommonCards = cards;
  return null;
}

export function setTestModeUnsuitedXRank(rank: string): string | null {
  if (state.phase !== 'lobby') return 'Cannot change test mode after game started';
  state.testModeUnsuitedXRank = rank;
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
  state.unsuitedJackCommonIndex = null;
  state.unsuitedXCommonIndex = null;
  state.unsuitedJackUsed = false;
  state.unsuitedXUsed = false;
  state.unsuitedXRank = null;
  state.rerollCommonUsed = false;
  state.swapWithCommonUsed = false;
  state.swapWithCommonAnimation = null;
  state.tryAnotherCardUsed = false;
  state.tryAnotherCardPlayerId = null;
  state.tryAnotherCardExtraCard = null;
  state.vacationUsed = false;
  state.vacationPlayerId = null;
  state.destroyAllXsUsed = false;
  state.destroyedRanks = new Set();
  state.destroyAllXsAnimatingRank = null;
  state.destroyAllXsCloud = null;
  state.checkNumberOfRanksUsed = false;
  state.checkNumberOfRanksCloud = null;
  state.blackjackPhase = false;
  state.shareInfoQueue = [];
  state.shareInfoIndex = 0;
  state.passCardPhase = false;
  state.passCardChoices = new Map();
  state.passCardAnimations = [];
  state.prisonRound = null;
  state.prisonPlayerId = null;
  state.enabledAddons = new Set();
  state.blackXValue = null;
  state.addonPool = savedAddonPool ?? new Set(ADDONS.map((a) => a.id));
  state.negativeAddonCount = savedNegativeCount;
  state.positiveAddonCount = savedPositiveCount;
  state.startGameVoters = new Set();
  state.restartVoters = new Set();
  state.testMode = false;
  state.testModePlayerCards = new Map();
  state.testModeCommonCards = '';
  state.testModeUnsuitedXRank = '';
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
  if (state.unsuitedJackUsed) return 'Action already used this game';
  const playerId = state.socketToPlayerId.get(socketId);
  if (!playerId) return 'Player not found';
  state.unsuitedJacks.set(playerId, cardIndex);
  state.unsuitedJackUsed = true;
  state.actionCardLock = null;
  return null;
}

export function useUnsuitedX(socketId: string, cardIndex: 0 | 1): string | null {
  if (state.phase !== 'game') return 'Not in game';
  if (!state.enabledAddons.has('action-unsuited-x')) return 'Addon not active';
  if (state.unsuitedXUsed) return 'Action already used this game';
  const playerId = state.socketToPlayerId.get(socketId);
  if (!playerId) return 'Player not found';
  state.unsuitedXs.set(playerId, cardIndex);
  state.unsuitedXUsed = true;
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
  // Spec: "This works for any common card (even if it's unsuited)." — if the rerolled common
  // slot was holding the unsuited Jack/X, the unsuited identity is discarded together with the
  // old card; the new card from the deck is a normal (suited) card.
  if (state.unsuitedJackCommonIndex === cardIndex) state.unsuitedJackCommonIndex = null;
  if (state.unsuitedXCommonIndex === cardIndex) state.unsuitedXCommonIndex = null;
  state.rerollCommonUsed = true;
  state.actionCardLock = null;
  return null;
}

export function useSwapWithCommon(socketId: string, pocketIndex: 0 | 1, commonIndex: number): string | null {
  if (state.phase !== 'game') return 'Not in game';
  if (!state.enabledAddons.has('action-swap-with-common')) return 'Addon not active';
  if (state.swapWithCommonUsed) return 'Action already used this game';
  if (pocketIndex !== 0 && pocketIndex !== 1) return 'Invalid pocket index';
  if (commonIndex < 0 || commonIndex >= state.communityCards.length) return 'Invalid common card index';
  const playerId = state.socketToPlayerId.get(socketId);
  if (!playerId) return 'Player not found';
  const holeCards = state.holeCards[playerId];
  if (!holeCards) return 'No hole cards';
  // Spec: "The selected cards swap places: the player's pocket card replaces the common card and
  // the common card replaces player's card in their hand."
  const pocketCard = holeCards[pocketIndex];
  const commonCard = state.communityCards[commonIndex];
  state.holeCards[playerId] = pocketIndex === 0
    ? [commonCard, holeCards[1]]
    : [holeCards[0], commonCard];
  state.communityCards[commonIndex] = pocketCard;
  // Spec ([A] Unsuited Jack): "This Jack is always unsuited (orange) even if it becomes a
  // common card." Same applies to [A] Unsuited X. Move the unsuited tracking with the card:
  // pocket → common when the unsuited card was selected from the hand, common → pocket when
  // the selected common card was the unsuited one.
  const pocketWasUnsuitedJack = state.unsuitedJacks.get(playerId) === pocketIndex;
  const pocketWasUnsuitedX = state.unsuitedXs.get(playerId) === pocketIndex;
  const commonWasUnsuitedJack = state.unsuitedJackCommonIndex === commonIndex;
  const commonWasUnsuitedX = state.unsuitedXCommonIndex === commonIndex;
  if (pocketWasUnsuitedJack) {
    state.unsuitedJacks.delete(playerId);
    state.unsuitedJackCommonIndex = commonIndex;
  }
  if (pocketWasUnsuitedX) {
    state.unsuitedXs.delete(playerId);
    state.unsuitedXCommonIndex = commonIndex;
  }
  if (commonWasUnsuitedJack) {
    state.unsuitedJackCommonIndex = null;
    state.unsuitedJacks.set(playerId, pocketIndex);
  }
  if (commonWasUnsuitedX) {
    state.unsuitedXCommonIndex = null;
    state.unsuitedXs.set(playerId, pocketIndex);
  }
  // Compute unsuited rank for each flying side based on the original (pre-swap) state, so
  // that the client renders the Jack/X as orange while it's flying between slots.
  const pocketUnsuitedRank = pocketWasUnsuitedJack ? 'J' : (pocketWasUnsuitedX ? state.unsuitedXRank : null);
  const commonUnsuitedRank = commonWasUnsuitedJack ? 'J' : (commonWasUnsuitedX ? state.unsuitedXRank : null);
  state.swapWithCommonUsed = true;
  state.swapWithCommonAnimation = {
    playerId, pocketIndex, commonIndex, pocketCard, commonCard,
    pocketUnsuitedRank, commonUnsuitedRank,
  };
  state.actionCardLock = null;
  return null;
}

/** Clear swap-with-common animation after the 2-second flying-card animation completes. */
export function clearSwapWithCommonAnimation(): void {
  state.swapWithCommonAnimation = null;
}

/** Set of all ranks that participate in the game given the current configuration (active addons).
 *  Per spec ([A] Destroy all Xs): "the player sees a list of all ranks of cards that participate
 *  in the game, given the current game configuration like active addons, regardless of whether
 *  any card of such rank is still in the game." */
export function getParticipatingRanks(): string[] {
  const isShortDeck = state.enabledAddons.has('short-deck');
  return isShortDeck
    ? ['A', 'K', 'Q', 'J', '10']
    : ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2'];
}

export function useDestroyAllXs(socketId: string, rank: string): string | null {
  if (state.phase !== 'game') return 'Not in game';
  if (!state.enabledAddons.has('action-destroy-all-xs')) return 'Addon not active';
  if (state.destroyAllXsUsed) return 'Action already used this game';
  const playerId = state.socketToPlayerId.get(socketId);
  if (!playerId) return 'Player not found';
  if (!getParticipatingRanks().includes(rank)) return 'Invalid rank';

  // Mark the rank as destroyed (the client renders any card with this rank as a blank slot).
  state.destroyedRanks.add(rank);
  // Remove all cards of this rank from the deck so future draws can't produce one.
  state.deck = state.deck.filter(c => c.rank !== rank);
  // If the destroyed rank matches the unsuited Jack's rank (i.e. 'J'), clear its tracking
  // (unsuited Jacks are Jacks, so they are also destroyed).
  if (rank === 'J') {
    state.unsuitedJacks = new Map();
    state.unsuitedJackCommonIndex = null;
  }
  // Same for the unsuited X card if its rank is the one being destroyed.
  if (state.unsuitedXRank === rank) {
    state.unsuitedXs = new Map();
    state.unsuitedXCommonIndex = null;
  }
  state.destroyAllXsUsed = true;
  // Mark this rank as currently animating — clients will render the 5-second wipe animation
  // on every slot whose card has this rank. Cleared by the server 5 seconds after this call.
  state.destroyAllXsAnimatingRank = rank;
  // Spec: "as soon as the action card is played, there's a dialogue cloud displayed above
  // the player who played the card with text like 'Destroyed Queens' or 'Destroyed 6s'
  // depending on the actual choice. This cloud disappears after 10 seconds."
  state.destroyAllXsCloud = { playerId, rank };
  state.actionCardLock = null;
  return null;
}

/** Clear the destroy-all-Xs animation flag after the 5-second wipe completes. */
export function clearDestroyAllXsAnimation(): void {
  state.destroyAllXsAnimatingRank = null;
}

/** Clear the destroy-all-Xs dialogue cloud 10 seconds after the action card is played. */
export function clearDestroyAllXsCloud(): void {
  state.destroyAllXsCloud = null;
}

/** [A] Check Number of Ranks: count how many cards of the chosen rank are currently in play,
 *  considering player hands and the community/table cards. Per spec: "When computing the
 *  number of cards, cards in player hands (any player) are counted and common cards are
 *  counted." Unused action cards (e.g. [A] Unsuited Jack still on the action table) are not
 *  counted. Cards already destroyed by [A] Destroy All Xs are not counted (they are no
 *  longer in play). Unsuited Jack / X in hand or in a common slot is counted by its effective
 *  (overlay) rank, not by the original card's rank — the player sees the visible identity. */
function countCardsOfRank(rank: string): number {
  let count = 0;
  // Community cards: count by effective rank — apply unsuited overlays, skip if destroyed.
  for (let i = 0; i < state.communityCards.length; i++) {
    const isJackOverlay = state.unsuitedJackCommonIndex === i;
    const isXOverlay = state.unsuitedXCommonIndex === i;
    let effRank: string;
    if (isJackOverlay) effRank = 'J';
    else if (isXOverlay && state.unsuitedXRank) effRank = state.unsuitedXRank;
    else effRank = state.communityCards[i].rank;
    if (state.destroyedRanks.has(effRank)) continue;
    if (effRank === rank) count++;
  }
  // Pocket cards for every player.
  for (const p of state.players) {
    const cards = state.holeCards[p.id];
    if (!cards) continue;
    const jackIdx = state.unsuitedJacks.get(p.id);
    const xIdx = state.unsuitedXs.get(p.id);
    for (const idx of [0, 1] as const) {
      let effRank: string;
      if (jackIdx === idx) effRank = 'J';
      else if (xIdx === idx && state.unsuitedXRank) effRank = state.unsuitedXRank;
      else effRank = cards[idx].rank;
      if (state.destroyedRanks.has(effRank)) continue;
      if (effRank === rank) count++;
    }
  }
  return count;
}

export function useCheckNumberOfRanks(socketId: string, rank: string): string | null {
  if (state.phase !== 'game') return 'Not in game';
  if (!state.enabledAddons.has('action-check-number-of-ranks')) return 'Addon not active';
  if (state.checkNumberOfRanksUsed) return 'Action already used this game';
  const playerId = state.socketToPlayerId.get(socketId);
  if (!playerId) return 'Player not found';
  if (!getParticipatingRanks().includes(rank)) return 'Invalid rank';

  const count = countCardsOfRank(rank);
  state.checkNumberOfRanksUsed = true;
  state.checkNumberOfRanksCloud = { playerId, rank, count };
  state.actionCardLock = null;
  return null;
}

/** Clear the check-number-of-ranks dialogue cloud 10 seconds after the action card is played. */
export function clearCheckNumberOfRanksCloud(): void {
  state.checkNumberOfRanksCloud = null;
}

export function useVacation(socketId: string): string | null {
  if (state.phase !== 'game') return 'Not in game';
  if (!state.enabledAddons.has('action-vacation')) return 'Addon not active';
  if (state.vacationUsed) return 'Action already used this game';
  // Spec: "The vacation card can't be taken during the last round."
  if (state.currentRound === 4) return 'Cannot take vacation during the last round';
  const playerId = state.socketToPlayerId.get(socketId);
  if (!playerId) return 'Player not found';
  state.vacationUsed = true;
  state.vacationPlayerId = playerId;
  state.actionCardLock = null;
  return null;
}

export function useTryAnotherCard(socketId: string): string | null {
  if (state.phase !== 'game') return 'Not in game';
  if (!state.enabledAddons.has('action-try-another-card')) return 'Addon not active';
  if (state.tryAnotherCardUsed) return 'Action already used this game';
  if (state.deck.length === 0) return 'No cards left in deck';
  const playerId = state.socketToPlayerId.get(socketId);
  if (!playerId) return 'Player not found';
  const [[extraCard], remaining] = [state.deck.slice(0, 1), state.deck.slice(1)];
  state.deck = remaining;
  state.tryAnotherCardUsed = true;
  state.tryAnotherCardPlayerId = playerId;
  state.tryAnotherCardExtraCard = extraCard;
  state.actionCardLock = null;
  return null;
}

export function dropCard(socketId: string, cardIndex: number): string | null {
  if (state.phase !== 'game') return 'Not in game';
  const playerId = state.socketToPlayerId.get(socketId);
  if (!playerId) return 'Player not found';
  if (state.tryAnotherCardPlayerId !== playerId) return 'You are not in the try-another-card flow';
  const holeCards = state.holeCards[playerId];
  if (!holeCards) return 'No hole cards';
  const extraCard = state.tryAnotherCardExtraCard;
  if (!extraCard) return 'No extra card';
  // The player has 3 cards: holeCards[0], holeCards[1], extraCard (index 2)
  if (cardIndex < 0 || cardIndex > 2) return 'Invalid card index';
  const allCards: Card[] = [holeCards[0], holeCards[1], extraCard];
  // Remove the chosen card, keep the other two as new hole cards
  allCards.splice(cardIndex, 1);
  state.holeCards[playerId] = [allCards[0], allCards[1]];

  // Update unsuited jack/X index mappings if the dropped card shifts indices
  const jackIdx = state.unsuitedJacks.get(playerId);
  if (jackIdx !== undefined) {
    if (cardIndex === jackIdx) {
      // The unsuited card itself was dropped
      state.unsuitedJacks.delete(playerId);
    } else if (cardIndex < jackIdx) {
      // A card before the unsuited card was dropped, shift index down
      state.unsuitedJacks.set(playerId, jackIdx - 1);
    }
    // If cardIndex > jackIdx, no change needed
  }
  const xIdx = state.unsuitedXs.get(playerId);
  if (xIdx !== undefined) {
    if (cardIndex === xIdx) {
      state.unsuitedXs.delete(playerId);
    } else if (cardIndex < xIdx) {
      state.unsuitedXs.set(playerId, xIdx - 1);
    }
  }

  state.tryAnotherCardPlayerId = null;
  state.tryAnotherCardExtraCard = null;
  return null;
}

export function lockActionCard(socketId: string, addonId: string): string | null {
  if (state.phase !== 'game') return 'Not in game';
  if (state.tryAnotherCardPlayerId) return 'Game is paused while a player is choosing a card to drop';
  const playerId = state.socketToPlayerId.get(socketId);
  if (!playerId) return 'Player not found';
  if (isPlayerImprisoned(playerId)) return 'You are imprisoned this round';
  if (isPlayerOnVacationThisRound(playerId)) return 'You are on vacation this round';
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
  // Spec: "If the card chosen to be shown is already face-up for all players, the flipping
  // animation is not played." — unsuited jack/X cards are always face-up for everyone.
  const isAlreadyFaceUpForAll =
    (state.unsuitedJacks.get(playerId) === cardIndex) ||
    (state.unsuitedXs.get(playerId) === cardIndex);
  state.showCardUsed = true;
  if (!isAlreadyFaceUpForAll) {
    state.showCardData = { sourceId: playerId, targetId: targetPlayerId, card, cardIndex };
  }
  state.actionCardLock = null;
  return null;
}

export function clearShowCardData(): void {
  state.showCardData = null;
}

/**
 * Set or clear the current player's chosen card index for the pass-1-card phase.
 * This only updates the choice — readiness is controlled separately via SET_READY.
 * If the player un-selects their choice (cardIndex = null) while ready, they are
 * also un-readied (since "each player must choose one of their cards and press the
 * ready button" — readiness without a choice is not allowed).
 */
export function setPassCardChoice(socketId: string, cardIndex: 0 | 1 | null): string | null {
  if (state.phase !== 'game') return 'Not in game';
  if (!state.passCardPhase) return 'Not in pass-card phase';
  const playerId = state.socketToPlayerId.get(socketId);
  if (!playerId) return 'Player not found';
  const player = state.players.find((p) => p.id === playerId);
  if (!player) return 'Player not found';
  if (cardIndex === null) {
    state.passCardChoices.delete(playerId);
    player.readyForNextRound = false;
    return null;
  }
  if (cardIndex !== 0 && cardIndex !== 1) return 'Invalid card index';
  // Changing the chosen card unsets readiness (player must press the button again to confirm).
  if (state.passCardChoices.get(playerId) !== cardIndex) {
    state.passCardChoices.set(playerId, cardIndex);
    player.readyForNextRound = false;
  }
  return null;
}

/**
 * Perform the simultaneous pass-1-card swap if all players are ready and have a choice,
 * then transition to the next phase (share-info or normal round). No-op otherwise.
 * Returns true if the swap was performed (caller should schedule animation cleanup).
 */
function maybeFinishPassCardPhase(): boolean {
  if (!state.passCardPhase) return false;
  const everyoneReady = state.players.every(
    (p) => p.readyForNextRound && state.passCardChoices.has(p.id)
  );
  if (!everyoneReady) return false;
  // Compute the swap: each player at index i passes their chosen card to the player
  // at index (i - 1 + n) % n (the player to their left). The new card takes the
  // same slot index that the passed-away card was in.
  const n = state.players.length;
  const newHoleCards: Record<string, [Card, Card]> = {};
  for (let i = 0; i < n; i++) {
    const me = state.players[i];
    const myCards = state.holeCards[me.id];
    if (!myCards) continue;
    newHoleCards[me.id] = [myCards[0], myCards[1]];
  }
  // Build animation entries: each card moving from its giver's slot to its recipient's slot.
  const animations: Array<{ fromPlayerId: string; fromSlot: 0 | 1; toPlayerId: string; toSlot: 0 | 1 }> = [];
  // Spec ([A] Unsuited Jack/X): "If unsuited Jack moves to table or to another player, it
  // moves normally as any other card." Transfer the unsuited tracking with the card when it
  // gets passed to another player.
  const newUnsuitedJacks = new Map<string, number>();
  const newUnsuitedXs = new Map<string, number>();
  for (let i = 0; i < n; i++) {
    const me = state.players[i];
    const giverIdx = (i + 1) % n; // the player to my right gives me their chosen card
    const giver = state.players[giverIdx];
    const giverCards = state.holeCards[giver.id];
    const giverChoice = state.passCardChoices.get(giver.id);
    if (!giverCards || giverChoice === undefined) continue;
    const myChoice = state.passCardChoices.get(me.id);
    if (myChoice === undefined) continue;
    // The card I give away leaves slot `myChoice`; the new card from my right neighbor
    // takes that same slot, preserving position.
    const incomingCard = giverCards[giverChoice];
    newHoleCards[me.id][myChoice] = incomingCard;
    // Transfer unsuited tracking: if the giver's chosen card was the unsuited Jack/X, it
    // becomes mine at the slot the new card now occupies. (My card that I gave away takes
    // care of itself: the giver of that card sees it transferred via the same loop iteration
    // for the recipient.)
    if (state.unsuitedJacks.get(giver.id) === giverChoice) {
      newUnsuitedJacks.set(me.id, myChoice);
    }
    if (state.unsuitedXs.get(giver.id) === giverChoice) {
      newUnsuitedXs.set(me.id, myChoice);
    }
    animations.push({
      fromPlayerId: giver.id,
      fromSlot: (giverChoice as 0 | 1),
      toPlayerId: me.id,
      toSlot: (myChoice as 0 | 1),
    });
  }
  for (const p of state.players) {
    if (newHoleCards[p.id]) state.holeCards[p.id] = newHoleCards[p.id];
    // For each player, the unsuited identity tracking is replaced by the result of the swap.
    // If a player's old unsuited card was kept (not the one they passed), preserve it.
    const oldJackIdx = state.unsuitedJacks.get(p.id);
    if (oldJackIdx !== undefined && state.passCardChoices.get(p.id) !== oldJackIdx) {
      newUnsuitedJacks.set(p.id, oldJackIdx);
    }
    const oldXIdx = state.unsuitedXs.get(p.id);
    if (oldXIdx !== undefined && state.passCardChoices.get(p.id) !== oldXIdx) {
      newUnsuitedXs.set(p.id, oldXIdx);
    }
  }
  state.unsuitedJacks = newUnsuitedJacks;
  state.unsuitedXs = newUnsuitedXs;
  // End the pass-card phase. Reset readiness; advance to share-info phase or normal
  // round chip distribution as appropriate.
  state.passCardPhase = false;
  state.passCardChoices = new Map();
  state.passCardAnimations = animations;
  for (const p of state.players) p.readyForNextRound = false;
  if (state.shareInfoQueue.length > 0) {
    state.blackjackPhase = true;
  } else {
    // No share-info phase — start the normal round (deal community cards for any
    // skipped starting rounds, then chips for the current round, and auto-ready
    // any prison-round prisoner).
    for (let r = 1; r < state.currentRound; r++) {
      const count = roundCommunityCardCount(r);
      if (count > 0) {
        const [drawn, remaining] = drawCards(state.deck, count);
        state.communityCards.push(...drawn);
        state.deck = remaining;
      }
    }
    const isPrisonRound = state.enabledAddons.has('prison') && state.prisonRound === state.currentRound;
    const isLastRoundWithVacation =
      state.currentRound === 4 && state.enabledAddons.has('action-vacation') && state.vacationPlayerId !== null;
    let chipCount = state.players.length;
    if (isPrisonRound) chipCount -= 1;
    if (isLastRoundWithVacation) chipCount -= 1;
    state.middleChips = createChipsForRound(state.currentRound, chipCount);
    if (isPrisonRound && state.prisonPlayerId) {
      const prisonPlayer = state.players.find((p) => p.id === state.prisonPlayerId);
      if (prisonPlayer) prisonPlayer.readyForNextRound = true;
    }
    if (isLastRoundWithVacation && state.vacationPlayerId) {
      const vacationPlayer = state.players.find((p) => p.id === state.vacationPlayerId);
      if (vacationPlayer) vacationPlayer.readyForNextRound = true;
    }
  }
  return true;
}

/** Clear pass-card animations after the 2-second flying card animation completes. */
export function clearPassCardAnimations(): void {
  state.passCardAnimations = [];
}

/** Returns true if pass-card animations are currently active (used by server/index.ts to know
 *  whether to schedule the 2s cleanup after a SET_READY action that triggered the swap). */
export function hasActivePassCardAnimations(): boolean {
  return state.passCardAnimations.length > 0;
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
    testMode: state.testMode,
    testModePlayerCards: Object.fromEntries(state.testModePlayerCards),
    testModeCommonCards: state.testModeCommonCards,
    testModeUnsuitedXRank: state.testModeUnsuitedXRank,
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
    unsuitedJackUsed: state.unsuitedJackUsed,
    unsuitedJackCommonIndex: state.unsuitedJackCommonIndex,
    unsuitedXs: Object.fromEntries(state.unsuitedXs),
    unsuitedXUsed: state.unsuitedXUsed,
    unsuitedXCommonIndex: state.unsuitedXCommonIndex,
    unsuitedXRank: state.unsuitedXRank,
    rerollCommonUsed: state.rerollCommonUsed,
    swapWithCommonUsed: state.swapWithCommonUsed,
    swapWithCommonAnimation: state.swapWithCommonAnimation,
    tryAnotherCardUsed: state.tryAnotherCardUsed,
    tryAnotherCardPlayerId: state.tryAnotherCardPlayerId,
    vacationUsed: state.vacationUsed,
    vacationPlayerId: state.vacationPlayerId,
    destroyAllXsUsed: state.destroyAllXsUsed,
    destroyedRanks: [...state.destroyedRanks],
    destroyAllXsAnimatingRank: state.destroyAllXsAnimatingRank,
    destroyAllXsCloud: state.destroyAllXsCloud,
    checkNumberOfRanksUsed: state.checkNumberOfRanksUsed,
    // Spec: "The cloud is only visible to the player who played the card." — only include
    // the cloud in the snapshot for that player; everyone else sees null.
    checkNumberOfRanksCloud: (state.checkNumberOfRanksCloud && playerId === state.checkNumberOfRanksCloud.playerId)
      ? state.checkNumberOfRanksCloud
      : null,
    destroyedPocketSlots: (() => {
      const result: Record<string, number[]> = {};
      for (const p of state.players) {
        const cards = state.holeCards[p.id];
        if (!cards) { result[p.id] = []; continue; }
        const slots: number[] = [];
        // The unsuited Jack/X tracking is cleared by `useDestroyAllXs` when the destroyed rank
        // matches, so checking the underlying card rank here is sufficient for normal cards.
        // For the unsuited Jack/X that remain in a hand, their actual rank is 'J' or
        // unsuitedXRank — those would only have been destroyed if `useDestroyAllXs` already
        // cleared them, so we don't need a special check here.
        for (const idx of [0, 1] as const) {
          if (state.destroyedRanks.has(cards[idx].rank)) {
            // But the card might be an unsuited card overlay (different effective rank). If the
            // unsuited overlay still claims this slot, the slot's effective rank is the unsuited
            // rank — which is also destroyed (server clears unsuited tracking only when the
            // destroyed rank matches the unsuited rank). So if there's still an unsuited overlay
            // and the destroyed rank doesn't match the unsuited rank, the slot is NOT destroyed
            // by virtue of the unsuited overlay (the original card is hidden).
            const isJackOverlay = state.unsuitedJacks.get(p.id) === idx;
            const isXOverlay = state.unsuitedXs.get(p.id) === idx;
            if (isJackOverlay) {
              if (state.destroyedRanks.has('J')) slots.push(idx);
            } else if (isXOverlay) {
              if (state.unsuitedXRank && state.destroyedRanks.has(state.unsuitedXRank)) slots.push(idx);
            } else {
              slots.push(idx);
            }
          }
        }
        result[p.id] = slots;
      }
      return result;
    })(),
    myTryAnotherCards: (playerId && state.tryAnotherCardPlayerId === playerId && state.holeCards[playerId] && state.tryAnotherCardExtraCard)
      ? [state.holeCards[playerId][0], state.holeCards[playerId][1], state.tryAnotherCardExtraCard]
      : null,
    otherPlayerCardCount: (() => {
      const counts: Record<string, number> = {};
      if (state.tryAnotherCardPlayerId && state.tryAnotherCardExtraCard) {
        counts[state.tryAnotherCardPlayerId] = 3;
      }
      return counts;
    })(),
    blackjackPhase: state.blackjackPhase,
    blackjackSums: (() => {
      if (!state.blackjackPhase) return {};
      const currentAddon = state.shareInfoQueue[state.shareInfoIndex];
      const sums: Record<string, number> = {};
      const isFaces = currentAddon === 'share-number-of-faces';
      for (const p of state.players) {
        const cards = state.holeCards[p.id];
        if (cards) {
          // Spec: "If the information that the shared value depends on changes for any
          // reason (for example, player takes unsuited card instead of one of their cards
          // and the addon value depended on their pocket cards), the shared value is
          // updated accordingly." Apply unsuited jack / unsuited X overrides to the
          // effective rank used in the calculation. Destroyed cards (rank in
          // destroyedRanks) are not counted at all (the slot is blank).
          const jackIdx = state.unsuitedJacks.get(p.id);
          const xIdx = state.unsuitedXs.get(p.id);
          const effRank = (idx: 0 | 1): string | null => {
            if (jackIdx === idx) return state.destroyedRanks.has('J') ? null : 'J';
            if (xIdx === idx && state.unsuitedXRank) {
              return state.destroyedRanks.has(state.unsuitedXRank) ? null : state.unsuitedXRank;
            }
            if (state.destroyedRanks.has(cards[idx].rank)) return null;
            return cards[idx].rank;
          };
          const r0 = effRank(0);
          const r1 = effRank(1);
          if (isFaces) {
            const isFace = (r: string | null) => r !== null && (r === 'J' || r === 'Q' || r === 'K');
            sums[p.id] = (isFace(r0) ? 1 : 0) + (isFace(r1) ? 1 : 0);
          } else {
            sums[p.id] = (r0 !== null ? bjValue(r0) : 0) + (r1 !== null ? bjValue(r1) : 0);
          }
        }
      }
      return sums;
    })(),
    shareInfoLabel: state.blackjackPhase
      ? (state.shareInfoQueue[state.shareInfoIndex] === 'share-number-of-faces' ? 'Number of Faces' : 'Blackjack Sum')
      : '',
    prisonPlayerId: (state.enabledAddons.has('prison') && state.prisonRound === state.currentRound && state.prisonPlayerId && !state.blackjackPhase && !state.passCardPhase)
      ? state.prisonPlayerId
      : null,
    prisonRound: state.enabledAddons.has('prison') ? state.prisonRound : null,
    showCardCone: state.showCardData ? { sourceId: state.showCardData.sourceId, targetId: state.showCardData.targetId } : null,
    passCardPhase: state.passCardPhase,
    passCardChoices: state.passCardPhase ? Object.fromEntries(state.passCardChoices) : {},
    passCardAnimations: [...state.passCardAnimations],
  };
}
