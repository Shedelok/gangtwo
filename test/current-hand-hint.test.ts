import { expect, test } from '@playwright/test';
import {
  clickTestModeCheckbox,
  completelyResetGameState,
  getActionCards,
  getCurrentHandHintText,
  getOwnPocketCards,
  joinLobby,
  pressReadyForNextRound,
  pressStartGameInLobby,
  setEnabledNegativeAddons,
  setEnabledPositiveAddons,
  setTestModeCommonCards,
  setTestModePlayerCards,
  setTestModeAddonInput,
  takeAnyChip,
  useDestroyAllRsActionCard,
  waitForNthCommonCardToAppear,
} from './helpers';

test.beforeEach(async ({ page }) => {
  await completelyResetGameState(page);
});

for (const {
  name,
  negativeAddons = [] as string[],
  checkerCards,
  commonCards,
  roundsToReveal,
  expectedHand,
} of [
  {
    name: 'high card pre-flop with no matching cards',
    checkerCards: 'As, 7d',
    commonCards: '',
    roundsToReveal: 0,
    expectedHand: 'High Card',
  },
  {
    name: 'one pair from matching pocket cards',
    checkerCards: 'Ks, Kd',
    commonCards: '',
    roundsToReveal: 0,
    expectedHand: 'One Pair',
  },
  {
    name: 'two pair with community cards',
    checkerCards: 'As, Ah',
    commonCards: 'Ks, Kd, 2c, 3h, 4d',
    roundsToReveal: 3,
    expectedHand: 'Two Pair',
  },
  {
    name: 'set',
    checkerCards: 'As, Ah',
    commonCards: 'Ac, 2d, 3s, 4h, 7d',
    roundsToReveal: 3,
    expectedHand: 'Three of a Kind',
  },
  {
    name: 'trips',
    checkerCards: 'As, Kh',
    commonCards: 'Ac, Ad, 2d, 3s, 4h',
    roundsToReveal: 3,
    expectedHand: 'Three of a Kind',
  },
  {
    name: 'straight',
    checkerCards: 'As, Kh',
    commonCards: 'Qd, Jc, 10s, 2h, 3d',
    roundsToReveal: 3,
    expectedHand: 'Straight',
  },
  {
    name: 'ace-low straight',
    checkerCards: 'As, 2d',
    commonCards: '3h, 4c, 5s, 9h, Kd',
    roundsToReveal: 3,
    expectedHand: 'Straight',
  },
  {
    name: 'flush',
    checkerCards: 'As, 2s',
    commonCards: '5s, 8s, Qs, Kh, 2d',
    roundsToReveal: 3,
    expectedHand: 'Flush',
  },
  {
    name: 'flush beats straight when no straight flush',
    checkerCards: 'As, Ks',
    commonCards: 'Qs, Jh, 10d, 3s, 7s',
    roundsToReveal: 3,
    expectedHand: 'Flush',
  },
  {
    name: 'full house',
    checkerCards: 'As, Ah',
    commonCards: 'Ac, Ks, Kd, 2h, 3c',
    roundsToReveal: 3,
    expectedHand: 'Full House',
  },
  {
    name: 'four of a kind',
    checkerCards: 'As, Ah',
    commonCards: 'Ac, Ad, 2s, 3h, 4c',
    roundsToReveal: 3,
    expectedHand: 'Four of a Kind',
  },
  {
    name: 'straight flush',
    checkerCards: '9s, 8s',
    commonCards: '7s, 6s, 5s, Ah, Kd',
    roundsToReveal: 3,
    expectedHand: 'Straight Flush',
  },
  {
    name: 'royal flush',
    checkerCards: 'As, Ks',
    commonCards: 'Qs, Js, 10s, 4h, 5c',
    roundsToReveal: 3,
    expectedHand: 'Royal Flush',
  },
  {
    name: 'Black & Red enables flush from mixed black suits',
    negativeAddons: ['Black & Red'],
    checkerCards: 'As, Kc',
    commonCards: 'Jc, 10c, 9c, 4h, 5d',
    roundsToReveal: 3,
    expectedHand: 'Flush',
  },
  {
    name: 'Black & Red enables straight flush from mixed black suits',
    negativeAddons: ['Black & Red'],
    checkerCards: '9c, 8s',
    commonCards: '7c, 6s, 5c, 2d, 3h',
    roundsToReveal: 3,
    expectedHand: 'Straight Flush',
  },
]) {
  test(name, async ({ page: checkerPage, browser }) => {
    const afkPage = await browser.newPage();
    try {
      if (negativeAddons.length > 0) {
        await setEnabledNegativeAddons(checkerPage, negativeAddons);
      }

      await joinLobby(checkerPage, 'Checker');
      await joinLobby(afkPage, 'Afk');

      await clickTestModeCheckbox(checkerPage);
      await setTestModePlayerCards(checkerPage, 'Checker', checkerCards);
      await setTestModeCommonCards(checkerPage, commonCards);

      await pressStartGameInLobby([checkerPage, afkPage]);

      for (let round = 1; round <= roundsToReveal; round++) {
        await takeAnyChip(checkerPage);
        await takeAnyChip(afkPage);
        await pressReadyForNextRound([checkerPage, afkPage]);
      }

      expect(await getCurrentHandHintText(checkerPage)).toBe(expectedHand);
    } finally {
      await afkPage.close();
    }
  });
}

test('hand hint updates each round & includes additional cards', async ({ page: checkerPage, browser }) => {
  const afkPage = await browser.newPage();
  try {
    await setEnabledNegativeAddons(checkerPage, ['Additional Card Flop', 'Additional Card Turn', 'Additional Card River']);

    await joinLobby(checkerPage, 'Checker');
    await joinLobby(afkPage, 'Afk');

    await clickTestModeCheckbox(checkerPage);
    await setTestModePlayerCards(checkerPage, 'Checker', '2h, 7d');
    await setTestModeCommonCards(checkerPage, '5c, 9s, Kh, 2s, 3d, 7s, 2c, 4d');

    await pressStartGameInLobby([checkerPage, afkPage]);

    expect(await getCurrentHandHintText(checkerPage)).toBe('High Card');

    await takeAnyChip(checkerPage);
    await takeAnyChip(afkPage);
    await pressReadyForNextRound([checkerPage, afkPage]);
    await waitForNthCommonCardToAppear(checkerPage, 4);
    expect(await getCurrentHandHintText(checkerPage)).toBe('One Pair');

    await takeAnyChip(checkerPage);
    await takeAnyChip(afkPage);
    await pressReadyForNextRound([checkerPage, afkPage]);
    await waitForNthCommonCardToAppear(checkerPage, 6);
    expect(await getCurrentHandHintText(checkerPage)).toBe('Two Pair');

    await takeAnyChip(checkerPage);
    await takeAnyChip(afkPage);
    await pressReadyForNextRound([checkerPage, afkPage]);
    await waitForNthCommonCardToAppear(checkerPage, 8);
    expect(await getCurrentHandHintText(checkerPage)).toBe('Full House');
  } finally {
    await afkPage.close();
  }
});

for (const {
  name,
  negativeAddons = [] as string[],
  checkerCards,
  commonCards,
  unsuitedXRank,
  roundsToReveal,
  expectedHand,
} of [
  {
    name: 'unsuited card rank contributes to a straight',
    checkerCards: 'As, 9s',
    commonCards: 'Kd, Qh, Jc, 2d, 3h',
    unsuitedXRank: '10',
    roundsToReveal: 3,
    expectedHand: 'Straight',
  },
  {
    name: 'unsuited card rank contributes to four of a kind',
    checkerCards: '6s, 2h',
    commonCards: 'Kd, Kh, Kc, 5s, 6d',
    unsuitedXRank: 'K',
    roundsToReveal: 3,
    expectedHand: 'Four of a Kind',
  },
  {
    name: 'unsuited card has no suit, blocking a flush',
    checkerCards: 'As, 2s',
    commonCards: '5s, 8s, Qs, 2d, 3h',
    unsuitedXRank: 'A',
    roundsToReveal: 3,
    expectedHand: 'One Pair',
  },
]) {
  test(name, async ({ page: checkerPage, browser }) => {
    const afkPage = await browser.newPage();
    try {
      if (negativeAddons.length > 0) {
        await setEnabledNegativeAddons(checkerPage, negativeAddons);
      }
      await setEnabledPositiveAddons(checkerPage, ['[A] Unsuited X']);

      await joinLobby(checkerPage, 'Checker');
      await joinLobby(afkPage, 'Afk');

      await clickTestModeCheckbox(checkerPage);
      await setTestModePlayerCards(checkerPage, 'Checker', checkerCards);
      await setTestModeAddonInput(checkerPage, '[A] Unsuited X', unsuitedXRank);
      await setTestModeCommonCards(checkerPage, commonCards);

      await pressStartGameInLobby([checkerPage, afkPage]);

      for (let round = 1; round <= roundsToReveal; round++) {
        await takeAnyChip(checkerPage);
        await takeAnyChip(afkPage);
        await pressReadyForNextRound([checkerPage, afkPage]);
      }

      const unsuitedXCard = (await getActionCards(checkerPage)).find(c => c.name === '[A] Unsuited X')!;
      await unsuitedXCard.click();
      await (await getOwnPocketCards(checkerPage))[0].click();
      await expect(async () => {
        expect((await getOwnPocketCards(checkerPage)).some(c => c.suit === '')).toBe(true);
      }).toPass({ timeout: 5000 });

      expect(await getCurrentHandHintText(checkerPage)).toBe(expectedHand);
    } finally {
      await afkPage.close();
    }
  });
}

test('five aces is four of a kind', async ({ page: checkerPage, browser }) => {
  const afkPage = await browser.newPage();
  try {
    await setEnabledPositiveAddons(checkerPage, ['[A] Unsuited X']);

    await joinLobby(checkerPage, 'Checker');
    await joinLobby(afkPage, 'Afk');

    await clickTestModeCheckbox(checkerPage);
    await setTestModePlayerCards(checkerPage, 'Checker', 'As, 2h');
    await setTestModeAddonInput(checkerPage, '[A] Unsuited X', 'A');
    await setTestModeCommonCards(checkerPage, 'Ah, Ac, Ad, 5s, 7d');

    await pressStartGameInLobby([checkerPage, afkPage]);

    for (let round = 1; round <= 3; round++) {
      await takeAnyChip(checkerPage);
      await takeAnyChip(afkPage);
      await pressReadyForNextRound([checkerPage, afkPage]);
    }

    const unsuitedXCard = (await getActionCards(checkerPage)).find(c => c.name === '[A] Unsuited X')!;
    await unsuitedXCard.click();
    await (await getOwnPocketCards(checkerPage))[1].click();
    await expect(async () => {
      expect((await getOwnPocketCards(checkerPage)).some(c => c.suit === '')).toBe(true);
    }).toPass({ timeout: 5000 });

    expect(await getCurrentHandHintText(checkerPage)).toBe('Four of a Kind');
  } finally {
    await afkPage.close();
  }
});

test('hand is determined correctly when fewer than 5 cards remain', async ({ page: checkerPage, browser }) => {
  const afkPage = await browser.newPage();
  try {
    await setEnabledPositiveAddons(checkerPage, ['[A] Destroy All Rs']);

    await joinLobby(checkerPage, 'Checker');
    await joinLobby(afkPage, 'Afk');

    await clickTestModeCheckbox(checkerPage);
    await setTestModePlayerCards(checkerPage, 'Checker', 'As, Ah');
    await setTestModeCommonCards(checkerPage, 'Ac, Kc, 2s, Kh, 3d');

    await pressStartGameInLobby([checkerPage, afkPage]);

    for (let round = 1; round <= 3; round++) {
      await takeAnyChip(checkerPage);
      await takeAnyChip(afkPage);
      await pressReadyForNextRound([checkerPage, afkPage]);
    }

    expect(await getCurrentHandHintText(checkerPage)).toBe('Full House');

    await useDestroyAllRsActionCard(checkerPage, 'A');

    await expect(async () => {
      expect(await getCurrentHandHintText(checkerPage)).toBe('One Pair');
    }).toPass({ timeout: 10000 });
  } finally {
    await afkPage.close();
  }
});
