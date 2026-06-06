import { expect, test } from '@playwright/test';
import { completelyResetGameState, getActionCards, getCommonCards, getOwnPocketCards, getUnsuitedXRank, joinLobby, pressReadyForNextRound, pressStartGameInLobby, setEnabledPositiveAddons, takeAnyChip, useCheckNumberOfRanksActionCard } from '../helpers';

test.beforeEach(async ({ page }) => {
  await completelyResetGameState(page);
});

for (let i = 0; i < (process.env.TEST_FULL === 'true' ? 10 : 1); i++) {
  test(`shows correct count for 2 players and 0 common cards (run ${i + 1})`, async ({ page: checkerPage, browser }) => {
    const afkPage = await browser.newPage();
    try {
      await setEnabledPositiveAddons(checkerPage, ['[A] Check Number of Ranks']);

      await joinLobby(checkerPage, 'Checking player');
      await joinLobby(afkPage, 'Afk player');
      await pressStartGameInLobby(checkerPage);
      await pressStartGameInLobby(afkPage);

      const cardToCheck = (await getOwnPocketCards(afkPage))[0];
      const checkerCount = (await getOwnPocketCards(checkerPage)).filter(c => c.rank === cardToCheck.rank).length;
      const afkCount = (await getOwnPocketCards(afkPage)).filter(c => c.rank === cardToCheck.rank).length;

      expect(await getActionCards(checkerPage)).toHaveLength(1);
      const cloudCount = await useCheckNumberOfRanksActionCard(checkerPage, cardToCheck.rank);

      expect(cloudCount).toBe(checkerCount + afkCount);
    } finally {
      await afkPage.close();
    }
  });
}

for (let i = 0; i < (process.env.TEST_FULL === 'true' ? 10 : 1); i++) {
  test(`shows correct count for 2 players and 5 common cards (run ${i + 1})`, async ({ page: checkerPage, browser }) => {
    const afkPage = await browser.newPage();
    try {
      await setEnabledPositiveAddons(checkerPage, ['[A] Check Number of Ranks']);

      await joinLobby(checkerPage, 'Checking player');
      await joinLobby(afkPage, 'Afk player');
      await pressStartGameInLobby(checkerPage);
      await pressStartGameInLobby(afkPage);

      for (let round = 1; round <= 3; round++) {
        await takeAnyChip(checkerPage);
        await takeAnyChip(afkPage);
        await pressReadyForNextRound(checkerPage);
        await pressReadyForNextRound(afkPage);
        await checkerPage.getByText(`ROUND ${round + 1} / 4`).waitFor();
      }

      const cardToCheck = (await getOwnPocketCards(afkPage))[0];
      const commonCount = (await getCommonCards(checkerPage)).filter(c => c.rank === cardToCheck.rank).length;
      const checkerCount = (await getOwnPocketCards(checkerPage)).filter(c => c.rank === cardToCheck.rank).length;
      const afkCount = (await getOwnPocketCards(afkPage)).filter(c => c.rank === cardToCheck.rank).length;

      expect(await getActionCards(checkerPage)).toHaveLength(1);
      const cloudCount = await useCheckNumberOfRanksActionCard(checkerPage, cardToCheck.rank);

      expect(cloudCount).toBe(checkerCount + afkCount + commonCount);
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
      await pressStartGameInLobby(checkerPage);
      await pressStartGameInLobby(afkPage);

      const rankX = await getUnsuitedXRank((await getActionCards(checkerPage)).find(c => c.name === '[A] Unsuited X')!);
      const checkerCount = (await getOwnPocketCards(checkerPage)).filter(c => c.rank === rankX).length;
      const afkCount = (await getOwnPocketCards(afkPage)).filter(c => c.rank === rankX).length;

      const cloudCount = await useCheckNumberOfRanksActionCard(checkerPage, rankX);

      expect(cloudCount).toBe(checkerCount + afkCount);
    } finally {
      await afkPage.close();
    }
  });
}

for (let i = 0; i < (process.env.TEST_FULL === 'true' ? 3 : 1); i++) {
  test(`unsuited X taken by checker is counted (run ${i + 1})`, async ({ page: checkerPage, browser }) => {
    const afkPage = await browser.newPage();
    try {
      await setEnabledPositiveAddons(checkerPage, ['[A] Check Number of Ranks', '[A] Unsuited X']);

      await joinLobby(checkerPage, 'Checking player');
      await joinLobby(afkPage, 'Afk player');
      await pressStartGameInLobby(checkerPage);
      await pressStartGameInLobby(afkPage);

      const unsuitedXCard = (await getActionCards(checkerPage)).find(c => c.name === '[A] Unsuited X')!;
      const rankX = await getUnsuitedXRank(unsuitedXCard);
      const checkerCardsBefore = await getOwnPocketCards(checkerPage);
      const checkerCountBefore = checkerCardsBefore.filter(c => c.rank === rankX).length;
      const afkCount = (await getOwnPocketCards(afkPage)).filter(c => c.rank === rankX).length;

      await unsuitedXCard.click();
      const replacedRank = checkerCardsBefore[0].rank;
      await checkerCardsBefore[0].click();
      await expect(async () => {
        expect((await getOwnPocketCards(checkerPage)).some(c => c.suit === '')).toBe(true);
      }).toPass({ timeout: 5000 });

      const checkerCount = checkerCountBefore + (replacedRank === rankX ? 0 : 1);

      const cloudCount = await useCheckNumberOfRanksActionCard(checkerPage, rankX);

      expect(cloudCount).toBe(checkerCount + afkCount);
      expect(cloudCount).toBeGreaterThan(0);
    } finally {
      await afkPage.close();
    }
  });
}

for (let i = 0; i < (process.env.TEST_FULL === 'true' ? 3 : 1); i++) {
  test(`unsuited X taken by other player is counted (run ${i + 1})`, async ({ page: checkerPage, browser }) => {
    const afkPage = await browser.newPage();
    try {
      await setEnabledPositiveAddons(checkerPage, ['[A] Check Number of Ranks', '[A] Unsuited X']);

      await joinLobby(checkerPage, 'Checking player');
      await joinLobby(afkPage, 'Afk player');
      await pressStartGameInLobby(checkerPage);
      await pressStartGameInLobby(afkPage);

      const unsuitedXCard = (await getActionCards(afkPage)).find(c => c.name === '[A] Unsuited X')!;
      const rankX = await getUnsuitedXRank(unsuitedXCard);
      const checkerCount = (await getOwnPocketCards(checkerPage)).filter(c => c.rank === rankX).length;
      const afkCardsBefore = await getOwnPocketCards(afkPage);
      const afkCountBefore = afkCardsBefore.filter(c => c.rank === rankX).length;

      await unsuitedXCard.click();
      const replacedRank = afkCardsBefore[0].rank;
      await afkCardsBefore[0].click();
      await expect(async () => {
        expect((await getOwnPocketCards(afkPage)).some(c => c.suit === '')).toBe(true);
      }).toPass({ timeout: 5000 });

      const afkCount = afkCountBefore + (replacedRank === rankX ? 0 : 1);

      const cloudCount = await useCheckNumberOfRanksActionCard(checkerPage, rankX);

      expect(cloudCount).toBe(checkerCount + afkCount);
      expect(cloudCount).toBeGreaterThan(0);
    } finally {
      await afkPage.close();
    }
  });
}
