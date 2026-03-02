export interface AddonDef {
  id: string;
  short: string;
  long: string;
  type: 'negative' | 'positive';
}

export const ADDONS: AddonDef[] = [
  {
    id: 'guess-highest-red-chip-hand-rank',
    short: "Guess Highest Red Chip's Hand Rank",
    long: "Before the player with the highest value red chip reveals their hand, other players must collectively agree on what hand rank that player has (pair/two pairs/street/etc.).",
    type: 'negative',
  },
  {
    id: 'guess-2nd-highest-red-chip-hand-rank',
    short: "Guess 2nd Highest Red Chip's Hand Rank",
    long: "Before the player with the second highest value red chip reveals their hand, other players must collectively agree on what hand rank that player has (pair/two pairs/street/etc.).",
    type: 'negative',
  },
  {
    id: 'guess-lowest-red-chip-hand-rank',
    short: "Guess Lowest Red Chip's Hand Rank",
    long: "Before the player with the lowest value red chip reveals their hand, other players must collectively agree on what hand rank that player has (pair/two pairs/street/etc.).",
    type: 'negative',
  },
  {
    id: 'clubs-spades-diamonds-hearth',
    short: "Clubs=Spades, Diamonds=Hearth",
    long: "Instead of 4 logical suits, there are only 2: black (represented by clubs and spades) and red (represented by diamonds and hearths).",
    type: 'negative',
  },
  {
    id: 'ones-are-black',
    short: "Ones are Black",
    long: "All chips of value 1 become black. A black chip can't be stolen or dropped after it's taken from the middle of the table for the first time.",
    type: 'negative',
  },
  {
    id: 'ns-are-black',
    short: "Ns are Black",
    long: "The highest value chips (value equal to the number of players) become black. A black chip can't be stolen or dropped after it's taken from the middle of the table for the first time.",
    type: 'negative',
  },
  {
    id: 'see-neighbors-cards',
    short: "See Neighbors' Cards",
    long: "Besides your own cards you can also see pocket cards of the players next to your left and right.",
    type: 'positive',
  },
];
