import { expect, test } from '@playwright/test';
import {
  clickTestModeCheckbox,
  completelyResetGameState,
  getOwnChips,
  GREEN_CHIP_COLOR,
  joinLobby,
  pressStartGameInLobby,
  setEnabledNegativeAddons,
  setEnabledPositiveAddons,
  setTestModeAddonInput,
  setTestModeCommonCards,
  setTestModePlayerCards,
  takeChip,
} from '../helpers';

test.beforeEach(async ({ page }) => {
  await completelyResetGameState(page);
});

test('green chip locks to its taker when starting the game in the last round', async ({ page: greenTakerPage, browser }) => {
  const otherPage = await browser.newPage();
  try {
    await setEnabledNegativeAddons(greenTakerPage, ['No White Chips', 'No Yellow Chips', 'No Orange Chips']);
    await setEnabledPositiveAddons(greenTakerPage, ['Green X']);

    await joinLobby(greenTakerPage, 'Taker');
    await joinLobby(otherPage, 'Other');

    await clickTestModeCheckbox(greenTakerPage);
    await setTestModeAddonInput(greenTakerPage, 'Green X', '1');
    await setTestModeCommonCards(greenTakerPage, 'As, Ah, Ad, Ac, Ks');
    await setTestModePlayerCards(greenTakerPage, 'Taker', '2s, 3d');
    await setTestModePlayerCards(greenTakerPage, 'Other', '4h, 5c');

    await pressStartGameInLobby([greenTakerPage, otherPage]);

    await takeChip(otherPage, 2);

    await expect(greenTakerPage.getByRole('button', { name: 'Steal' })).toHaveCount(1);
    await expect(otherPage.getByRole('button', { name: 'Return' })).toHaveCount(1);

    await takeChip(greenTakerPage, 1);

    await expect(greenTakerPage.getByRole('button', { name: 'Return' })).toHaveCount(0);
    await expect(otherPage.getByRole('button', { name: 'Steal' })).toHaveCount(0);
    await expect.poll(async () => (await getOwnChips(greenTakerPage)).filter(c => c.color === GREEN_CHIP_COLOR).length).toBe(1);
  } finally {
    await otherPage.close();
  }
});
