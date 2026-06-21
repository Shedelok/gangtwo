export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';
export interface Card { suit: Suit; rank: Rank; }

export type RoundNumber = 1 | 2 | 3 | 4;
export interface Chip { round: RoundNumber; number: number; }

export interface PlayerPublicState {
  id: string;
  name: string;
  chips: Chip[];              // all chips held (all rounds)
  readyForNextRound: boolean;
}

export type GamePhase = 'lobby' | 'game' | 'finished';

// Server sends a personalized snapshot to each client
export interface ClientGameState {
  phase: GamePhase;
  players: PlayerPublicState[];
  myId: string;               // '' if not yet joined
  myHoleCards: [Card, Card] | null;
  revealedHoleCards: Record<string, [Card, Card]>; // populated per player after they press "reveal cards"
  communityCards: Card[];
  currentRound: RoundNumber | null;
  middleChips: Chip[];        // current-round chips in the middle only
  gameId: string;             // changes every time a new game starts
  enabledAddons: string[];
  blackXValue: number | null; // value of X for 'xs-are-black' addon, null otherwise
  addonPool: string[];        // addon IDs in the random selection pool (lobby only)
  negativeAddonCount: number; // how many negative addons to pick randomly
  positiveAddonCount: number; // how many positive addons to pick randomly
  startGameVotes: number;     // how many players have pressed Start Game
  startGameVoterIds: string[]; // IDs of players who have pressed Start Game
  myStartGameVote: boolean;   // whether the current player has pressed Start Game
  // Test Mode (lobby only): when enabled, players can set specific cards to be dealt to each
  // player and to the common-card slots instead of random deck cards.
  testMode: boolean;                        // whether the 'Test Mode' checkbox is checked
  testModePlayerCards: Record<string, string>; // playerId → raw card-list text for that player
  testModeCommonCards: string;              // raw card-list text for the common cards
  // Raw rank-token text for the [A] Unsuited X addon. When Test Mode is enabled, a single rank
  // token (2–9, 10, J, Q, K, A) can be specified to force X; empty means X is chosen randomly.
  testModeUnsuitedXRank: string;
  // Raw number text for the Green X addon. When Test Mode is enabled, a single number can be
  // specified to force the green chip number X; empty means X is chosen randomly as usual.
  testModeGreenX: string;
  restartVotes: number;       // how many players have voted to restart
  restartVoterIds: string[];  // IDs of players who have voted to restart
  myRestartVote: boolean;     // whether the current player has voted to restart
  rankGuesses: Record<string, Record<string, string>>; // addonId → (voterId → rank); populated during guess-rank addons
  winningGuessRanks: Record<string, string>; // addonId → winning rank (set when voting locks)
  showCardUsed: boolean;         // whether the show-1-card action has been used this game
  myShownCard: Card | null;           // card that another player showed to me (null if none)
  myShownCardFrom: string | null;     // id of the player who showed me a card
  myShownCardIndex: 0 | 1 | null;    // which card index (0 or 1) of the source player was shown
  myShownCardOutIndex: 0 | 1 | null; // index of my card I am currently showing to someone else (null if not showing)
  actionCardLock: { addonId: string; playerId: string } | null; // which player is currently using which action card
  unsuitedJacks: Record<string, number>; // playerId → pocket card index (0 or 1) of unsuited jack
  unsuitedJackUsed: boolean;     // whether the unsuited jack action has been used this game
  // When the unsuited Jack has been moved to a common card slot (e.g., via swap-with-common),
  // this is its index in `communityCards`. The Jack is rendered as orange (unsuited) at that
  // common-card slot. Null when the Jack is in a player's hand or not in play.
  unsuitedJackCommonIndex: number | null;
  unsuitedXs: Record<string, number>;    // playerId → pocket card index (0 or 1) of unsuited X card
  unsuitedXUsed: boolean;        // whether the unsuited-x action has been used this game
  // Same as `unsuitedJackCommonIndex` but for the [A] Unsuited X card.
  unsuitedXCommonIndex: number | null;
  unsuitedXRank: string | null;  // the random rank for the unsuited-x addon, null if not active
  rerollCommonUsed: boolean;     // whether the reroll-common action has been used this game
  swapWithCommonUsed: boolean;   // whether the swap-with-common action has been used this game
  // Active swap-with-common animation: while populated, clients render a flying pocket card
  // (face down) and a flying common card (face up) traveling between the player's slot and the
  // community card slot for ~2 seconds. The slots involved are hidden in place during the animation.
  // Cleared by the server 2 seconds after the swap.
  // `pocketUnsuitedRank` / `commonUnsuitedRank` are non-null when the corresponding flying
  // card is the unsuited Jack / unsuited X — in which case clients render that flying card
  // as orange and face up (per spec: "This Jack is always unsuited (orange) even if it
  // becomes a common card.").
  swapWithCommonAnimation: {
    playerId: string;
    pocketIndex: 0 | 1;
    commonIndex: number;
    pocketCard: Card;
    commonCard: Card;
    pocketUnsuitedRank: string | null;
    commonUnsuitedRank: string | null;
  } | null;
  tryAnotherCardUsed: boolean;   // whether the try-another-card action has been used this game
  tryAnotherCardPlayerId: string | null; // player currently in the try-another-card flow (game paused)
  myTryAnotherCards: Card[] | null; // the 3-card hand visible only to the acting player during try-another-card flow
  otherPlayerCardCount: Record<string, number>; // playerId → card count (only populated when someone has 3 cards)
  vacationUsed: boolean;             // whether the vacation action card has been used this game
  vacationPlayerId: string | null;   // player currently holding the vacation card (null if none)
  // [A] Destroy all Xs addon: once-per-game flag and the set of ranks that have been destroyed.
  // Any card (deck/community/pocket) whose rank is in this set is treated as discarded — the
  // client renders such slots as blank (other cards do not move to fill the space).
  destroyAllXsUsed: boolean;
  destroyedRanks: string[];
  // Per-player destroyed pocket slot indices. Allows the client to render face-down pocket
  // slots as blank when the underlying card's rank is destroyed (otherwise the viewer can't
  // know which face-down slots to blank). Always populated for every player whenever any
  // destroyed ranks exist.
  destroyedPocketSlots: Record<string, number[]>;
  // While non-null, every slot whose card has this rank is rendered with a 5-second
  // top→bottom wipe animation (spec: "The card disappears top to bottom with constant speed.
  // The animation takes 5 seconds. All cards disappear at the same time."). Once the server
  // clears this field, the slots transition to their final blank state.
  destroyAllXsAnimatingRank: string | null;
  // [A] Destroy all Xs dialogue cloud: spec — "as soon as the action card is played, there's
  // a dialogue cloud displayed above the player who played the card with text like
  // 'Destroyed Queens' or 'Destroyed 6s' depending on the actual choice. This cloud disappears
  // after 10 seconds. This cloud has the same background color as the action card." Cleared by
  // the server 10 seconds after the destroy action.
  destroyAllXsCloud: { playerId: string; rank: string } | null;
  // [A] Check Number of Ranks addon: once-per-game flag.
  checkNumberOfRanksUsed: boolean;
  // [A] Check Number of Ranks dialogue cloud: spec — "the player sees a dialogue cloud. The
  // cloud has text like 'There are 3 Queens in the game right now (Only visible to you)'
  // depending on the actual number and the rank the player chosen. The cloud is only visible
  // to the player who played the card." The server only populates this for the acting player
  // (i.e. when the recipient is the one who used the action). Cleared by the server 10
  // seconds after the action is committed.
  checkNumberOfRanksCloud: { playerId: string; rank: string; count: number } | null;
  blackjackPhase: boolean;       // true during any share-info pre-game round
  blackjackSums: Record<string, string>; // playerId → share-info display text (only populated during blackjackPhase)
  shareInfoLabel: string;        // label shown on the table during the share-info phase
  prisonPlayerId: string | null; // player currently imprisoned (null if not prison round)
  prisonRound: number | null;    // the round number where prison takes effect (null if addon not active)
  // [A] Green X addon: the round-4 chip number that is currently green (rendered with a green
  // background instead of red). Null when the addon is inactive, it is not the last round, or the
  // green chip was taken by a "wrong" player and reverted to a normal red chip.
  greenChipNumber: number | null;
  // True when the green chip is locked to its holder (taken by the "correct" player): it cannot be
  // stolen or dropped. The chip stays green while locked.
  greenChipLocked: boolean;
  showCardCone: { sourceId: string; targetId: string } | null; // cone of light from source to target during show-card animation
  passCardPhase: boolean;        // true during the pass-1-card pre-game phase (after dealing pocket cards, before share info / chip distribution)
  passCardChoices: Record<string, number>; // playerId → index of card chosen to pass (0 or 1); only populated during passCardPhase
  // Active pass-1-card flying animations (one entry per card moved during the simultaneous pass).
  // When populated, clients render flying cards from the source seat/slot to the destination
  // seat/slot for ~2 seconds, and the destination slot is hidden in place during the animation.
  // Cleared by the server 2 seconds after the swap.
  passCardAnimations: Array<{ fromPlayerId: string; fromSlot: 0 | 1; toPlayerId: string; toSlot: 0 | 1 }>;
  // Win/loss outcome of the game, computed once every player has revealed their cards
  // (spec/base/logic.md win condition + spec/addons/logic.md "Win Condition" / guess addons).
  // 'win' or 'loss' when the game is completely over, null otherwise.
  gameResult: 'win' | 'loss' | null;
}

// Client → Server actions
export type ClientAction =
  | { type: 'RESUME_SESSION'; sessionId: string }
  | { type: 'JOIN_LOBBY'; name: string }
  | { type: 'START_GAME' }
  | { type: 'TOGGLE_ADDON'; addonId: string }
  | { type: 'SET_ADDON_COUNT'; addonType: 'negative' | 'positive'; count: number }
  | { type: 'SET_TEST_MODE'; enabled: boolean }
  | { type: 'SET_TEST_MODE_PLAYER_CARDS'; playerId: string; cards: string }
  | { type: 'SET_TEST_MODE_COMMON_CARDS'; cards: string }
  | { type: 'SET_TEST_MODE_UNSUITED_X_RANK'; rank: string }
  | { type: 'SET_TEST_MODE_GREEN_X'; value: string }
  | { type: 'DISCARD_CHIP'; chipNumber: number }
  | { type: 'TAKE_FROM_MIDDLE'; chipNumber: number }
  | { type: 'STEAL_CHIP'; fromPlayerId: string; chipNumber: number }
  | { type: 'SET_READY'; ready: boolean }
  | { type: 'REVEAL_CARDS' }
  | { type: 'SUBMIT_RANK_GUESS'; addonId: string; rank: string }
  | { type: 'TOGGLE_RESTART_VOTE' }
  | { type: 'FINISH_GAME' }
  | { type: 'USE_SHOW_CARD'; targetPlayerId: string; cardIndex: 0 | 1 }
  | { type: 'USE_UNSUITED_JACK'; cardIndex: 0 | 1 }
  | { type: 'USE_UNSUITED_X'; cardIndex: 0 | 1 }
  | { type: 'USE_REROLL_COMMON'; cardIndex: number }
  | { type: 'USE_SWAP_WITH_COMMON'; pocketIndex: 0 | 1; commonIndex: number }
  | { type: 'USE_TRY_ANOTHER_CARD' }
  | { type: 'USE_VACATION' }
  | { type: 'USE_DESTROY_ALL_XS'; rank: string }
  | { type: 'USE_CHECK_NUMBER_OF_RANKS'; rank: string }
  | { type: 'DROP_CARD'; cardIndex: number }
  | { type: 'LOCK_ACTION_CARD'; addonId: string }
  | { type: 'UNLOCK_ACTION_CARD'; addonId: string }
  | { type: 'SET_PASS_CARD_CHOICE'; cardIndex: 0 | 1 | null };

// Server → Client messages
export type ServerMessage =
  | { type: 'STATE_UPDATE'; state: ClientGameState }
  | { type: 'ERROR'; code: string; message: string };
