export interface AddonDef {
  id: string;
  short: string;
  long: string;
  type: 'negative' | 'positive';
  hasAction?: boolean;
}

/**
 * A node in the addon grouping tree. Leaf nodes have `addonId`, branch nodes have `children`.
 * The tree structure determines how random addon selection works: at each level a uniform
 * random child is chosen until a leaf is reached.
 */
export type AddonGroupNode =
  | { addonId: string }
  | { children: AddonGroupNode[] };

/** Negative addons grouping tree as defined in the spec's "Addon Groupings" section. */
export const NEGATIVE_ADDON_TREE: AddonGroupNode[] = [
  { children: [
    { addonId: 'guess-highest-red-chip-hand-rank' },
    { addonId: 'guess-2nd-highest-red-chip-hand-rank' },
    { addonId: 'guess-lowest-red-chip-hand-rank' },
  ]},
  { addonId: 'only-neighbors-steal' },
  { addonId: 'clubs-spades-diamonds-hearth' },
  { children: [
    { addonId: 'additional-card-flop' },
    { addonId: 'additional-card-turn' },
    { addonId: 'additional-card-river' },
  ]},
  { children: [
    { addonId: 'ones-are-black' },
    { addonId: 'ns-are-black' },
    { addonId: 'xs-are-black' },
  ]},
  { children: [
    { addonId: 'no-white-chips' },
    { addonId: 'no-yellow-chips' },
    { addonId: 'no-orange-chips' },
  ]},
  { addonId: 'no-old-chips' },
];

/** Positive addons grouping tree as defined in the spec's "Addon Groupings" section. */
export const POSITIVE_ADDON_TREE: AddonGroupNode[] = [
  { addonId: 'see-1-neighbor-cards' },
  { children: [
    { addonId: 'share-blackjack-sum' },
    { addonId: 'share-number-of-faces' },
  ]},
  { addonId: 'show-1-card-to-1-player' },
  { children: [
    { addonId: 'action-unsuited-jack' },
    { addonId: 'action-unsuited-x' },
  ]},
  { addonId: 'action-reroll-common' },
];

/** Collect all leaf addon IDs from a tree node. */
function collectLeafIds(node: AddonGroupNode): string[] {
  if ('addonId' in node) return [node.addonId];
  return node.children.flatMap(collectLeafIds);
}

/**
 * Prune a tree node, removing any leaves whose addonId is not in the allowed set.
 * Returns null if the entire subtree is pruned.
 */
function pruneNode(node: AddonGroupNode, allowed: Set<string>): AddonGroupNode | null {
  if ('addonId' in node) {
    return allowed.has(node.addonId) ? node : null;
  }
  const prunedChildren = node.children
    .map(c => pruneNode(c, allowed))
    .filter((c): c is AddonGroupNode => c !== null);
  if (prunedChildren.length === 0) return null;
  return { children: prunedChildren };
}

/**
 * Select a random addon by descending the tree, choosing a uniformly random child at each
 * branch level until a leaf is reached. Returns the leaf's addonId, or null if the tree is empty.
 */
function selectFromTree(roots: AddonGroupNode[]): string | null {
  if (roots.length === 0) return null;
  let node: AddonGroupNode = { children: roots };
  while ('children' in node) {
    if (node.children.length === 0) return null;
    node = node.children[Math.floor(Math.random() * node.children.length)];
  }
  return node.addonId;
}

/**
 * Pick `count` random addons from the given grouping tree, respecting the pool of allowed addon IDs.
 * Uses the tree-descent algorithm defined in the spec: each selection walks from the root,
 * uniformly choosing a random child at each level until a leaf addon is reached.
 * Already-selected addons are pruned before each subsequent pick.
 */
export function pickAddonsFromTree(
  tree: AddonGroupNode[],
  pool: Set<string>,
  count: number,
): string[] {
  const selected: string[] = [];
  let allowed = new Set(pool);
  for (let i = 0; i < count; i++) {
    const pruned = tree
      .map(n => pruneNode(n, allowed))
      .filter((n): n is AddonGroupNode => n !== null);
    const id = selectFromTree(pruned);
    if (id === null) break; // no more addons available
    selected.push(id);
    allowed = new Set(allowed);
    allowed.delete(id);
  }
  return selected;
}

/**
 * Count how many distinct leaf addons are reachable in the tree given an allowed pool.
 */
export function countAvailableInTree(tree: AddonGroupNode[], pool: Set<string>): number {
  const allLeaves = tree.flatMap(n => collectLeafIds(n));
  return allLeaves.filter(id => pool.has(id)).length;
}

export const ADDONS: AddonDef[] = [
  {
    id: 'guess-highest-red-chip-hand-rank',
    short: "Guess Rank Highest",
    long: "Before the player with the highest value red chip reveals their hand, other players must collectively agree on what hand rank that player has (pair/two pairs/straight/etc.).",
    type: 'negative',
  },
  {
    id: 'guess-2nd-highest-red-chip-hand-rank',
    short: "Guess Rank 2nd Highest",
    long: "Before the player with the 2nd-highest value red chip reveals their hand, other players must collectively agree on what hand rank that player has (pair/two pairs/straight/etc.).",
    type: 'negative',
  },
  {
    id: 'guess-lowest-red-chip-hand-rank',
    short: "Guess Rank Lowest",
    long: "Before the player with the lowest value red chip reveals their hand, other players must collectively agree on what hand rank that player has (pair/two pairs/straight/etc.).",
    type: 'negative',
  },
  {
    id: 'only-neighbors-steal',
    short: "Only Neighbors Steal",
    long: "You can only steal chips from players sitting next to your left and right (neighbors).",
    type: 'negative',
  },
  {
    id: 'clubs-spades-diamonds-hearth',
    short: "Black & Red",
    long: "Instead of 4 logical suits, there are only 2: black (represented by clubs and spades) and red (represented by diamonds and hearths).",
    type: 'negative',
  },
  {
    id: 'additional-card-flop',
    short: "Additional Card Flop",
    long: "When the 2nd round begins, 4 community cards are placed on the table instead of usual 3.",
    type: 'negative',
  },
  {
    id: 'additional-card-turn',
    short: "Additional Card Turn",
    long: "When the 3rd round begins, 2 community cards are placed on the table instead of usual 1.",
    type: 'negative',
  },
  {
    id: 'additional-card-river',
    short: "Additional Card River",
    long: "When the 4th round begins, 2 community cards are placed on the table instead of usual 1.",
    type: 'negative',
  },
  {
    id: 'ones-are-black',
    short: "Black 1s",
    long: "All chips of value 1 become black. A black chip can't be stolen or dropped after it's taken from the middle of the table for the first time.",
    type: 'negative',
  },
  {
    id: 'ns-are-black',
    short: "Black Ns",
    long: "The highest value chips (value equal to the number of players) become black. A black chip can't be stolen or dropped after it's taken from the middle of the table for the first time.",
    type: 'negative',
  },
  {
    id: 'xs-are-black',
    short: "Black Xs",
    long: "A random number X from 1 to N is determined at the start of the game. Chips with value X become black. A black chip can't be stolen or dropped after it's taken from the middle of the table for the first time. X stays the same through all rounds.",
    type: 'negative',
  },
  {
    id: 'no-white-chips',
    short: "No White Chips",
    long: "There is no distribution of white chips. The game starts from the 2nd round.",
    type: 'negative',
  },
  {
    id: 'no-yellow-chips',
    short: "No Yellow Chips",
    long: "There is no distribution of yellow chips. After the common cards of the 2nd round are revealed, the round is immediately over and the game moves to the 3rd round.",
    type: 'negative',
  },
  {
    id: 'no-orange-chips',
    short: "No Orange Chips",
    long: "There is no distribution of orange chips. After the common cards of the 3rd round are revealed, the round is immediately over and the game moves to the 4th round.",
    type: 'negative',
  },
  {
    id: 'no-old-chips',
    short: "No Old Chips",
    long: "At the beginning of each round (after the first one), all chips from the previous round are removed and player cannot see them.",
    type: 'negative',
  },
  {
    id: 'see-1-neighbor-cards',
    short: "See 1 Neighbor's Cards",
    long: "Besides your own cards you can also see pocket cards of the player next to your left.",
    type: 'positive',
  },
  {
    id: 'share-blackjack-sum',
    short: "Share Blackjack Sum",
    long: "Once the pocket cards have been dealt in Round 1, everyone states the sum of the value of their pocket cards. 2 to 10 have the values 2–10. J, Q, and K have the value of 10. A has the value of 11. This is done as a separate pre-game round, which ends when everyone has the ready button pressed.",
    type: 'positive',
  },
  {
    id: 'share-number-of-faces',
    short: "Share Number of Faces",
    long: "Once the pocket cards have been dealt in Round 1, each player says how many \"face cards\" (J, Q, K) they have. This is done as a separate pre-game round, which ends when everyone has the ready button pressed.",
    type: 'positive',
  },
  {
    id: 'show-1-card-to-1-player',
    short: "[A] Show 1 Card to 1 Player",
    long: "Once per game, one of the players can show one of their cards to another player for 5 seconds.",
    type: 'positive',
    hasAction: true,
  },
  {
    id: 'action-unsuited-jack',
    short: "[A] Unsuited Jack",
    long: "Once per game, one of the players can replace one of their cards with a Jack. The player must discard one of their cards to do so. The Jack has no suit (can't be used for flash).",
    type: 'positive',
    hasAction: true,
  },
  {
    id: 'action-unsuited-x',
    short: "[A] Unsuited X",
    long: "Once per game, one of the players can replace one of their cards with a random-rank unsuited card determined at the start of the game. The player must discard one of their cards to do so. The card has no suit (can't be used for flush).",
    type: 'positive',
    hasAction: true,
  },
  {
    id: 'action-reroll-common',
    short: "[A] Reroll Common",
    long: "Once per game, one of the players can replace one of the common cards with another random card.",
    type: 'positive',
    hasAction: true,
  },
];
