export interface AddonDef {
  id: string;
  short: string;
  long: string;
}

export const ADDONS: AddonDef[] = [
  {
    id: 'guess-highest-red-chip-hand-rank',
    short: "Guess Highest Red Chip's Hand Rank",
    long: "Before the player with the highest value red chip reveals their hand, players must collectively agree on what hand rank that player has (pair/two pairs/street/etc.).",
  },
];
