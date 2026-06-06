import { expect, test } from '@playwright/test';
import { clickTestModeCheckbox, completelyResetGameState, getActionCards, getOwnPocketCards, getUnsuitedXRank, joinLobby, pressReadyForNextRound, pressStartGameInLobby, setEnabledPositiveAddons, setTestModeCommonCards, setTestModePlayerCards, takeAnyChip, useCheckNumberOfRanksActionCard } from '../helpers';

test.beforeEach(async ({ page }) => {
  await completelyResetGameState(page);
});

for (const { name, checkerCards, afkCards, commonCards, roundsToReveal, checkRank, expectedCount } of [
  {
    name: 'count is 0 for rank not present in any cards in play',
    checkerCards: 'As, Qd',
    afkCards: 'Jh, 10c',
    commonCards: '3s, 5d, 7c, 8h, 2s',
    roundsToReveal: 3,
    checkRank: 'K',
    expectedCount: 0,
  },
  {
    name: 'counts pocket cards only when common cards not yet dealt',
    checkerCards: 'Ks, Kd',
    afkCards: 'Qh, Jc',
    commonCards: '',
    roundsToReveal: 0,
    checkRank: 'K',
    expectedCount: 2,
  },
  {
    name: 'counts common cards only when rank absent from all hands',
    checkerCards: 'As, Qd',
    afkCards: 'Jh, 10c',
    commonCards: 'Ks, Kd, Kh, 2c, 3s',
    roundsToReveal: 3,
    checkRank: 'K',
    expectedCount: 3,
  },
  {
    name: 'counts cards spread across both hands and common',
    checkerCards: 'Ks, Ad',
    afkCards: 'Kd, 3h',
    commonCards: 'Kh, 2c, 5s, 7d, 4c',
    roundsToReveal: 3,
    checkRank: 'K',
    expectedCount: 3,
  },
  {
    name: 'counts all 4 when full rank is in play',
    checkerCards: 'Ks, Kd',
    afkCards: 'Kh, Kc',
    commonCards: 'As, 2h, 3d, 4s, 5c',
    roundsToReveal: 3,
    checkRank: 'K',
    expectedCount: 4,
  },
]) {
  test(name, async ({ page: checkerPage, browser }) => {
    const afkPage = await browser.newPage();
    try {
      await setEnabledPositiveAddons(checkerPage, ['[A] Check Number of Ranks']);

      await joinLobby(checkerPage, 'Checker');
      await joinLobby(afkPage, 'Afk');

      await clickTestModeCheckbox(checkerPage);
      await setTestModePlayerCards(checkerPage, 'Checker', checkerCards);
      await setTestModePlayerCards(checkerPage, 'Afk', afkCards);
      await setTestModeCommonCards(checkerPage, commonCards);

      await pressStartGameInLobby(checkerPage);
      await pressStartGameInLobby(afkPage);

      for (let round = 1; round <= roundsToReveal; round++) {
        await takeAnyChip(checkerPage);
        await takeAnyChip(afkPage);
        await pressReadyForNextRound(checkerPage);
        await pressReadyForNextRound(afkPage);
      }

      expect(await useCheckNumberOfRanksActionCard(checkerPage, checkRank)).toBe(expectedCount);
    } finally {
      await afkPage.close();
    }
  });
}

for (let i = 0; i < (process.env.TEST_FULL === 'true' ? 3 : 1); i++) {
  test(`unsuited X sitting in action cards is not counted (run ${i + 1})`, async ({ page: checkerPage, browser }) => {
    const afkPage = await browser.newPage();
    try {
      await setEnabledPositiveAddons(checkerPage, ['[A] Check Number of Ranks', '[A] Unsuited X']);

      await joinLobby(checkerPage, 'Checking player');
      await joinLobby(afkPage, 'Afk player');

      await clickTestModeCheckbox(checkerPage);
      await setTestModePlayerCards(checkerPage, 'Checking player', 'As, Qd');
      await setTestModePlayerCards(checkerPage, 'Afk player', 'Jh, 10c');

      await pressStartGameInLobby(checkerPage);
      await pressStartGameInLobby(afkPage);

      const rankX = await getUnsuitedXRank((await getActionCards(checkerPage)).find(c => c.name === '[A] Unsuited X')!);
      const naturalCount = ['A', 'Q', 'J', '10'].filter(r => r === rankX).length;

      expect(await useCheckNumberOfRanksActionCard(checkerPage, rankX)).toBe(naturalCount);
    } finally {
      await afkPage.close();
    }
  });
}

for (let i = 0; i < (process.env.TEST_FULL === 'true' ? 3 : 1); i++) {
  test(`unsuited X taken by in checker hand is counted (run ${i + 1})`, async ({ page: checkerPage, browser }) => {
    const afkPage = await browser.newPage();
    try {
      await setEnabledPositiveAddons(checkerPage, ['[A] Check Number of Ranks', '[A] Unsuited X']);

      await joinLobby(checkerPage, 'Checking player');
      await joinLobby(afkPage, 'Afk player');

      await clickTestModeCheckbox(checkerPage);
      await setTestModePlayerCards(checkerPage, 'Checking player', 'As, Qd');
      await setTestModePlayerCards(checkerPage, 'Afk player', 'Jh, 10c');

      await pressStartGameInLobby(checkerPage);
      await pressStartGameInLobby(afkPage);

      const unsuitedXCard = (await getActionCards(checkerPage)).find(c => c.name === '[A] Unsuited X')!;
      const rankX = await getUnsuitedXRank(unsuitedXCard);

      await unsuitedXCard.click();
      await (await getOwnPocketCards(checkerPage))[0].click(); // replace Ace of spades
      await expect(async () => {
        expect((await getOwnPocketCards(checkerPage)).some(c => c.suit === '')).toBe(true);
      }).toPass({ timeout: 5000 });

      const naturalCountAfterReplace = ['Q', 'J', '10'].filter(r => r === rankX).length;
      expect(await useCheckNumberOfRanksActionCard(checkerPage, rankX)).toBe(naturalCountAfterReplace + 1);
    } finally {
      await afkPage.close();
    }
  });
}

for (let i = 0; i < (process.env.TEST_FULL === 'true' ? 3 : 1); i++) {
  test(`unsuited card in other player hand is counted (run ${i + 1})`, async ({ page: checkerPage, browser }) => {
    const afkPage = await browser.newPage();
    try {
      await setEnabledPositiveAddons(checkerPage, ['[A] Check Number of Ranks', '[A] Unsuited X']);

      await joinLobby(checkerPage, 'Checking player');
      await joinLobby(afkPage, 'Afk player');

      await clickTestModeCheckbox(checkerPage);
      await setTestModePlayerCards(checkerPage, 'Checking player', 'As, Qd');
      await setTestModePlayerCards(checkerPage, 'Afk player', 'Jh, 10c');

      await pressStartGameInLobby(checkerPage);
      await pressStartGameInLobby(afkPage);

      const unsuitedXCard = (await getActionCards(afkPage)).find(c => c.name === '[A] Unsuited X')!;
      const rankX = await getUnsuitedXRank(unsuitedXCard);

      await unsuitedXCard.click();
      await (await getOwnPocketCards(afkPage))[0].click(); // replace J of hearths
      await expect(async () => {
        expect((await getOwnPocketCards(afkPage)).some(c => c.suit === '')).toBe(true);
      }).toPass({ timeout: 5000 });

      const naturalCountAfterReplace = ['A', 'Q', '10'].filter(r => r === rankX).length;
      expect(await useCheckNumberOfRanksActionCard(checkerPage, rankX)).toBe(naturalCountAfterReplace + 1);
    } finally {
      await afkPage.close();
    }
  });
}
