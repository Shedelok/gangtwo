import { expect, test } from '@playwright/test';
import { completelyResetGameState, getActionCards, getCommonCards, getOwnPocketCards, joinLobby, pressReadyForNextRound, pressStartGameInLobby, getRankPluralLabel, setEnabledPositiveAddons, takeAnyChip } from '../helpers';

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

      const actionCards = await getActionCards(checkerPage);
      expect(actionCards).toHaveLength(1);
      const cnrCard = actionCards[0];
      await cnrCard.click();
      await checkerPage.getByRole('button', { name: 'Choose rank' }).click();
      await checkerPage.getByRole('button', { name: cardToCheck.rank, exact: true }).click();
      await checkerPage.getByRole('button', { name: `Check number of ${getRankPluralLabel(cardToCheck.rank)}` }).click();

      await checkerPage.getByText('in the game right now').waitFor();
      const cloudCount = parseInt(
        (await checkerPage.getByText(/There (is|are) \d+ .+ in the game right now/).textContent())!.match(/\d+/)![0],
        10,
      );

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

      const actionCards = await getActionCards(checkerPage);
      expect(actionCards).toHaveLength(1);
      const cnrCard = actionCards[0];
      await cnrCard.click();
      await checkerPage.getByRole('button', { name: 'Choose rank' }).click();
      await checkerPage.getByRole('button', { name: cardToCheck.rank, exact: true }).click();
      await checkerPage.getByRole('button', { name: `Check number of ${getRankPluralLabel(cardToCheck.rank)}` }).click();

      await checkerPage.getByText('in the game right now').waitFor();
      const cloudCount = parseInt(
        (await checkerPage.getByText(/There (is|are) \d+ .+ in the game right now/).textContent())!.match(/\d+/)![0],
        10,
      );

      expect(cloudCount).toBe(checkerCount + afkCount + commonCount);
    } finally {
      await afkPage.close();
    }
  });
}
