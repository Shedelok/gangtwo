import { expect, test } from '@playwright/test';
import { clickTestModeCheckbox, completelyResetGameState, getActionCards, getOwnPocketCards, getSuitedOffsuitClouds, joinLobby, pressStartGameInLobby, setEnabledPositiveAddons, setTestModePlayerCards } from '../helpers';

test.beforeEach(async ({ page }) => {
  await completelyResetGameState(page);
});

test('suited player who takes unsuited cards becomes and stays offsuit', async ({ page: checkerPage, browser }) => {
  const afkPage = await browser.newPage();
  try {
    await setEnabledPositiveAddons(checkerPage, ['Share Suited/Offsuit', '[A] Unsuited X', '[A] Unsuited Jack']);

    await joinLobby(checkerPage, 'Checker');
    await joinLobby(afkPage, 'Afk');

    await clickTestModeCheckbox(checkerPage);
    await setTestModePlayerCards(checkerPage, 'Checker', 'As, Ks');
    await setTestModePlayerCards(checkerPage, 'Afk', 'Ah, Kh');

    await pressStartGameInLobby([checkerPage, afkPage]);

    await expect(async () => {
      const clouds = await getSuitedOffsuitClouds(checkerPage);
      expect(clouds.get('Checker')).toBe('Suited');
    }).toPass({ timeout: 5000 });

    const unsuitedXCard = (await getActionCards(checkerPage)).find(c => c.name === '[A] Unsuited X')!;
    await unsuitedXCard.click();
    await (await getOwnPocketCards(checkerPage))[0].click();
    await expect(async () => {
      expect((await getOwnPocketCards(checkerPage))[0].suit).toBe('');
    }).toPass({ timeout: 5000 });

    await expect(async () => {
      const clouds = await getSuitedOffsuitClouds(checkerPage);
      expect(clouds.get('Checker')).toBe('Offsuit');
    }).toPass({ timeout: 5000 });

    const unsuitedJackCard = (await getActionCards(checkerPage)).find(c => c.name === '[A] Unsuited Jack')!;
    await unsuitedJackCard.click();
    await (await getOwnPocketCards(checkerPage))[1].click();
    await expect(async () => {
      expect((await getOwnPocketCards(checkerPage)).every(c => c.suit === '')).toBe(true);
    }).toPass({ timeout: 5000 });

    await expect(async () => {
      const clouds = await getSuitedOffsuitClouds(checkerPage);
      expect(clouds.get('Checker')).toBe('Offsuit');
    }).toPass({ timeout: 5000 });
  } finally {
    await afkPage.close();
  }
});
