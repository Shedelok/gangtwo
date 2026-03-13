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
  neighborHoleCards: Record<string, [Card, Card]>; // populated when 'see-neighbors-cards' addon is active
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
  unsuitedJacks: Record<string, number>; // playerId → card index (0 or 1) of unsuited jack
  unsuitedJackUsed: boolean;     // whether the unsuited jack action has been used this game
  unsuitedXs: Record<string, number>;    // playerId → card index (0 or 1) of unsuited X card
  unsuitedXUsed: boolean;        // whether the unsuited-x action has been used this game
  unsuitedXRank: string | null;  // the random rank for the unsuited-x addon, null if not active
  rerollCommonUsed: boolean;     // whether the reroll-common action has been used this game
  blackjackPhase: boolean;       // true during any share-info pre-game round
  blackjackSums: Record<string, number>; // playerId → share-info value (only populated during blackjackPhase)
  shareInfoLabel: string;        // label shown on the table during the share-info phase
}

// Client → Server actions
export type ClientAction =
  | { type: 'RESUME_SESSION'; sessionId: string }
  | { type: 'JOIN_LOBBY'; name: string }
  | { type: 'START_GAME' }
  | { type: 'TOGGLE_ADDON'; addonId: string }
  | { type: 'SET_ADDON_COUNT'; addonType: 'negative' | 'positive'; count: number }
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
  | { type: 'LOCK_ACTION_CARD'; addonId: string }
  | { type: 'UNLOCK_ACTION_CARD'; addonId: string };

// Server → Client messages
export type ServerMessage =
  | { type: 'STATE_UPDATE'; state: ClientGameState }
  | { type: 'ERROR'; code: string; message: string };
