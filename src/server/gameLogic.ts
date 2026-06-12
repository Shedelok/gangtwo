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

// ---------------------------------------------------------------------------
// Hand evaluation for win/loss determination (spec/base/logic.md)
// ---------------------------------------------------------------------------
// Hands are normal poker hands. Hands are compared as normal poker hands (for example, straight
// is stronger than 2 pairs, a pair of kings is stronger than a pair of queens). The win/loss
// after the last round depends on whether the order of last-round chips matches the order of
// hand strengths, so we need a fully comparable strength, not just a category name.
//
// A `RankedCard` carries the resolved rank value (2..14) and the effective suit token according
// to active addons (spec/addons/logic.md "Hand Evaluation"): Black & Red collapses suits to
// 'red'/'black'; an unsuited card (Unsuited Jack / Unsuited X) has `effectiveSuit === null` and
// can never contribute to a flush. Destroyed cards must be excluded by the caller before passing
// the list in.
export interface RankedCard { value: number; effectiveSuit: string | null }

// Category ranks, higher is stronger.
export const HAND_CATEGORY = {
  HIGH_CARD: 0,
  ONE_PAIR: 1,
  TWO_PAIR: 2,
  THREE_OF_A_KIND: 3,
  STRAIGHT: 4,
  FLUSH: 5,
  FULL_HOUSE: 6,
  FOUR_OF_A_KIND: 7,
  STRAIGHT_FLUSH: 8,
} as const;

function bestStraightHigh(values: number[]): number {
  // values: distinct rank values present. Ace can be high (14) or low (1).
  const set = new Set(values);
  if (set.has(14)) set.add(1); // Ace low for A-2-3-4-5
  const sorted = Array.from(set).sort((a, b) => a - b);
  let best = 0;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === sorted[i - 1] + 1) {
      run++;
      if (run >= 5) best = sorted[i];
    } else {
      run = 1;
    }
  }
  return best >= 5 ? best : 0;
}

/**
 * Evaluates the best 5-card poker hand formed from the given resolved cards and returns a
 * comparable strength as an array of numbers (lexicographic comparison: larger array is the
 * stronger hand). The first element is the hand category (see HAND_CATEGORY), subsequent
 * elements are the relevant rank values (e.g. pair rank then kickers) in descending priority.
 *
 * Fewer than 5 cards yields the best partial hand among them (e.g. two same-rank cards are a
 * pair). This mirrors the client-side `evaluateHandName` categorisation while adding kickers so
 * that hands of the same category can be ordered (e.g. a pair of kings beats a pair of queens).
 */
export function evaluateHandStrength(cards: RankedCard[]): number[] {
  if (cards.length === 0) return [HAND_CATEGORY.HIGH_CARD];

  const values = cards.map((c) => c.value);

  // Count by rank.
  const rankCounts = new Map<number, number>();
  for (const v of values) rankCounts.set(v, (rankCounts.get(v) ?? 0) + 1);
  // Sort groups: primarily by count (desc), then by rank value (desc).
  const groups = Array.from(rankCounts.entries())
    .sort((a, b) => (b[1] - a[1]) || (b[0] - a[0]));
  const counts = groups.map((g) => g[1]);

  // Flush detection: a flush needs 5 cards of one effective suit. Unsuited cards never group.
  const suitGroups = new Map<string, number[]>();
  for (const c of cards) {
    if (c.effectiveSuit === null) continue;
    const arr = suitGroups.get(c.effectiveSuit) ?? [];
    arr.push(c.value);
    suitGroups.set(c.effectiveSuit, arr);
  }
  let flushSuitValues: number[] | null = null;
  for (const arr of suitGroups.values()) {
    if (arr.length >= 5 && (!flushSuitValues || arr.length > flushSuitValues.length)) {
      flushSuitValues = arr;
    }
  }

  const distinctValues = Array.from(new Set(values));
  const straightHigh = bestStraightHigh(distinctValues);

  // Straight flush / royal flush: the straight must be formed within a single flush suit.
  if (flushSuitValues) {
    const sfHigh = bestStraightHigh(Array.from(new Set(flushSuitValues)));
    if (sfHigh > 0) return [HAND_CATEGORY.STRAIGHT_FLUSH, sfHigh];
  }

  // Top kickers across all cards, descending, for tie-breaking.
  const sortedValuesDesc = [...values].sort((a, b) => b - a);

  if (counts[0] >= 4) {
    const quad = groups[0][0];
    const kicker = sortedValuesDesc.find((v) => v !== quad) ?? 0;
    return [HAND_CATEGORY.FOUR_OF_A_KIND, quad, kicker];
  }
  if (counts[0] >= 3 && counts.length >= 2 && counts[1] >= 2) {
    return [HAND_CATEGORY.FULL_HOUSE, groups[0][0], groups[1][0]];
  }
  if (flushSuitValues) {
    const top5 = [...flushSuitValues].sort((a, b) => b - a).slice(0, 5);
    return [HAND_CATEGORY.FLUSH, ...top5];
  }
  if (straightHigh > 0) return [HAND_CATEGORY.STRAIGHT, straightHigh];
  if (counts[0] >= 3) {
    const trips = groups[0][0];
    const kickers = sortedValuesDesc.filter((v) => v !== trips).slice(0, 2);
    return [HAND_CATEGORY.THREE_OF_A_KIND, trips, ...kickers];
  }
  if (counts[0] >= 2 && counts.length >= 2 && counts[1] >= 2) {
    const highPair = groups[0][0];
    const lowPair = groups[1][0];
    const kicker = sortedValuesDesc.find((v) => v !== highPair && v !== lowPair) ?? 0;
    return [HAND_CATEGORY.TWO_PAIR, highPair, lowPair, kicker];
  }
  if (counts[0] >= 2) {
    const pair = groups[0][0];
    const kickers = sortedValuesDesc.filter((v) => v !== pair).slice(0, 3);
    return [HAND_CATEGORY.ONE_PAIR, pair, ...kickers];
  }
  return [HAND_CATEGORY.HIGH_CARD, ...sortedValuesDesc.slice(0, 5)];
}

/** Compares two hand strengths. Returns >0 if a is stronger, <0 if b is stronger, 0 if equal. */
export function compareHandStrength(a: number[], b: number[]): number {
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const av = a[i] ?? 0;
    const bv = b[i] ?? 0;
    if (av !== bv) return av - bv;
  }
  return 0;
}
