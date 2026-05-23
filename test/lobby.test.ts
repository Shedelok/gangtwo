import { test, expect } from '@playwright/test';
import { completelyResetGameState, getAddonLists, getRequestedPositiveAddonCount, joinLobby, pressStartGameInLobby, setRequestedPositiveAddonCount } from './helpers';

test.beforeEach(async ({ page }) => {
  await completelyResetGameState(page);
});

test('start game button is disabled when positive addon count exceeds enabled pool size', async ({ page: rPage, browser }) => {
  const ccPage = await browser.newPage();

  try {
    await joinLobby(rPage, 'Ready player');
    await joinLobby(ccPage, 'Configuration changer player');

    await pressStartGameInLobby(rPage);
    await expect(rPage.getByRole('button', { name: /Waiting/ })).toBeVisible();

    const { positive } = await getAddonLists(ccPage);
    for (const addon of positive.addons.slice(1)) {
      if (await addon.checkbox.isChecked()) {
        await addon.checkbox.click();
        await expect(addon.checkbox).not.toBeChecked();
      }
    }

    await setRequestedPositiveAddonCount(ccPage, 2);

    const checkedCount = (await Promise.all(positive.addons.map(a => a.checkbox.isChecked()))).filter(Boolean).length;
    expect(checkedCount).toBe(1);
    expect(await getRequestedPositiveAddonCount(ccPage)).toBe(2);
    await expect(ccPage.getByRole('button', { name: /Start Game/ })).toBeDisabled();
  } finally {
    await ccPage.close();
  }
});
