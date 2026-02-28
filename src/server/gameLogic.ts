import type { Card, Suit, Rank, RoundNumber, Chip, PlayerPublicState } from '../shared/types';

const SUITS: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'];
const RANKS: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

export function createShuffledDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank });
    }
  }
  // Fisher-Yates shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

export function dealHoleCards(
  deck: Card[],
  playerIds: string[]
): { assignments: Record<string, [Card, Card]>; remainingDeck: Card[] } {
  const remaining = [...deck];
  const assignments: Record<string, [Card, Card]> = {};
  for (const id of playerIds) {
    const c1 = remaining.shift()!;
    const c2 = remaining.shift()!;
    assignments[id] = [c1, c2];
  }
  return { assignments, remainingDeck: remaining };
}

export function createChipsForRound(round: RoundNumber, N: number): Chip[] {
  const chips: Chip[] = [];
  for (let i = 1; i <= N; i++) {
    chips.push({ round, number: i });
  }
  return chips;
}

export function isRoundComplete(players: PlayerPublicState[], currentRound: RoundNumber): boolean {
  return players.every(
    (p) =>
      p.chips.some((c) => c.round === currentRound) &&
      p.readyForNextRound === true
  );
}

export function drawCards(deck: Card[], count: number): [Card[], Card[]] {
  const drawn = deck.slice(0, count);
  const remaining = deck.slice(count);
  return [drawn, remaining];
}
