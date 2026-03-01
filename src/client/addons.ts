export interface AddonDef {
  id: string;
  short: string;
  long: string;
}

export const ADDONS: AddonDef[] = [
  {
    id: 'guess-highest-red-chip-hand-rank',
    short: "Guess Highest Red Chip's Hand Rank",
    long: "Before the player with the highest value red chip reveals their hand, other players must collectively agree on what hand rank that player has (pair/two pairs/street/etc.).",
  },
  {
    id: 'guess-2nd-highest-red-chip-hand-rank',
    short: "Guess 2nd Highest Red Chip's Hand Rank",
    long: "Before the player with the second highest value red chip reveals their hand, other players must collectively agree on what hand rank that player has (pair/two pairs/street/etc.).",
  },
  {
    id: 'guess-lowest-red-chip-hand-rank',
    short: "Guess Lowest Red Chip's Hand Rank",
    long: "Before the player with the lowest value red chip reveals their hand, other players must collectively agree on what hand rank that player has (pair/two pairs/street/etc.).",
  },
  {
    id: 'clubs-spades-diamonds-hearth',
    short: "Clubs=Spades, Diamonds=Hearth",
    long: "Instead of 4 logical suits, there are only 2: black (represented by clubs and spades) and red (represented by diamonds and hearths).",
  },
];
