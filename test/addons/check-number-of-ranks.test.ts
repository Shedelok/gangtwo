import { expect, test } from '@playwright/test';
import { completelyResetGameState, getActionCards, getOwnPocketCards, joinLobby, pressStartGameInLobby, setEnabledPositiveAddons } from '../helpers';

test.beforeEach(async ({ page }) => {
  await completelyResetGameState(page);
});

const repeat = process.env.TEST_FULL === 'true' ? 10 : 1;
for (let i = 0; i < repeat; i++) {
  const title = repeat > 1
    ? `shows correct count for 2 players and 0 common cards (run ${i + 1})`
    : 'shows correct count for 2 players and 0 common cards';
  test(title, async ({ page, browser }) => {
    const page2 = await browser.newPage();
    try {
      await setEnabledPositiveAddons(page, ['[A] Check Number of Ranks']);

      await joinLobby(page, 'Checking player');
      await joinLobby(page2, 'Afk player');

      await pressStartGameInLobby(page);
      await pressStartGameInLobby(page2);

      const cardToCheck = (await getOwnPocketCards(page2))[0];
      const pluralLabel = { A: 'Aces', K: 'Kings', Q: 'Queens', J: 'Jacks' }[cardToCheck.rank] ?? `${cardToCheck.rank}s`;

      const actionCards = await getActionCards(page);
      expect(actionCards).toHaveLength(1);
      const cnrCard = actionCards[0];
      await cnrCard.click();
      await page.getByRole('button', { name: 'Choose rank' }).click();
      await page.getByRole('button', { name: cardToCheck.rank, exact: true }).click();
      await page.getByRole('button', { name: `Check number of ${pluralLabel}` }).click();

      await page.getByText('in the game right now').waitFor();
      const cloudCount = parseInt(
        (await page.getByText(/There (is|are) \d+ .+ in the game right now/).textContent())!.match(/\d+/)![0],
        10,
      );

      const p1Count = (await getOwnPocketCards(page)).filter(c => c.rank === cardToCheck.rank).length;
      const p2Count = (await getOwnPocketCards(page2)).filter(c => c.rank === cardToCheck.rank).length;

      expect(cloudCount).toBe(p1Count + p2Count);
    } finally {
      await page2.close();
    }
  });
}
