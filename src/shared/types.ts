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
  revealedHoleCards: Record<string, [Card, Card]>; // populated for all players in 'finished' phase
  communityCards: Card[];
  currentRound: RoundNumber | null;
  middleChips: Chip[];        // current-round chips in the middle only
}

// Client → Server actions
export type ClientAction =
  | { type: 'JOIN_LOBBY'; name: string }
  | { type: 'START_GAME' }
  | { type: 'DISCARD_CHIP'; chipNumber: number }
  | { type: 'TAKE_FROM_MIDDLE'; chipNumber: number }
  | { type: 'STEAL_CHIP'; fromPlayerId: string; chipNumber: number }
  | { type: 'SET_READY'; ready: boolean }
  | { type: 'FINISH_GAME' };

// Server → Client messages
export type ServerMessage =
  | { type: 'STATE_UPDATE'; state: ClientGameState }
  | { type: 'ERROR'; code: string; message: string };
