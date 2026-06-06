import type { Card, Suit, Rank, RoundNumber, Chip, PlayerPublicState } from '../shared/types';

const SUITS: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'];
const RANKS: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

const SHORT_DECK_RANKS: Rank[] = ['10', 'J', 'Q', 'K', 'A'];

export function createShuffledDeck(shortDeck: boolean = false): Card[] {
  const deck: Card[] = [];
  const ranks = shortDeck ? SHORT_DECK_RANKS : RANKS;
  for (const suit of SUITS) {
    for (const rank of ranks) {
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

export function isRoundComplete(players: PlayerPublicState[], currentRound: RoundNumber, excludePlayerIds?: Set<string>): boolean {
  return players.every(
    (p) =>
      (excludePlayerIds?.has(p.id)) ||
      (p.chips.some((c) => c.round === currentRound) &&
      p.readyForNextRound === true)
  );
}

export function drawCards(deck: Card[], count: number): [Card[], Card[]] {
  const drawn = deck.slice(0, count);
  const remaining = deck.slice(count);
  return [drawn, remaining];
}

const RANK_BY_TOKEN: Record<string, Rank> = {
  '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7', '8': '8', '9': '9',
  '10': '10', 'J': 'J', 'Q': 'Q', 'K': 'K', 'A': 'A',
};
const SUIT_BY_LETTER: Record<string, Suit> = {
  's': 'spades', 'h': 'hearts', 'd': 'diamonds', 'c': 'clubs',
};

/**
 * Parse a single card token like "As", "10d", "7h" into a Card. The rank is case-insensitive
 * (e.g. "as" or "AS" both parse), the suit letter is case-insensitive. Returns null if the
 * token cannot be parsed.
 */
export function parseCardToken(token: string): Card | null {
  const t = token.trim();
  if (t.length < 2) return null;
  const suitLetter = t.slice(-1).toLowerCase();
  const suit = SUIT_BY_LETTER[suitLetter];
  if (!suit) return null;
  const rankPart = t.slice(0, -1).toUpperCase();
  const rank = RANK_BY_TOKEN[rankPart];
  if (!rank) return null;
  return { suit, rank };
}

/**
 * Parse a comma-separated card list like "As, 10d, 7h" into an array of Cards. Empty/whitespace
 * input yields an empty array. Returns null if any non-empty token fails to parse.
 */
export function parseCardList(text: string): Card[] | null {
  const trimmed = text.trim();
  if (trimmed === '') return [];
  const tokens = trimmed.split(',').map((s) => s.trim()).filter((s) => s.length > 0);
  const cards: Card[] = [];
  for (const tok of tokens) {
    const card = parseCardToken(tok);
    if (!card) return null;
    cards.push(card);
  }
  return cards;
}

export function cardKey(card: Card): string {
  return `${card.rank}-${card.suit}`;
}
