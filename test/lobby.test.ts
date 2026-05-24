import { test, expect } from '@playwright/test';
import { completelyResetGameState, getAddonLists, getRequestedPositiveAddonCount, joinLobby, pressStartGameInLobby, setRequestedPositiveAddonCount } from './helpers';

test.beforeEach(async ({ page }) => {
  await completelyResetGameState(page);
});

test('start game button is disabled when positive addon count exceeds enabled pool size', async ({ page: readyPage, browser }) => {
  const changerPage = await browser.newPage();

  try {
    await joinLobby(readyPage, 'Ready player');
    await joinLobby(changerPage, 'Configuration changer player');

    await pressStartGameInLobby(readyPage);
    await expect(readyPage.getByRole('button', { name: /Waiting/ })).toBeVisible();

    const { positive } = await getAddonLists(changerPage);
    for (const addon of positive.addons.slice(1)) {
      if (await addon.checkbox.isChecked()) {
        await addon.checkbox.click();
        await expect(addon.checkbox).not.toBeChecked();
      }
    }

    await setRequestedPositiveAddonCount(changerPage, 2);

    const checkedCount = (await Promise.all(positive.addons.map(a => a.checkbox.isChecked()))).filter(Boolean).length;
    expect(checkedCount).toBe(1);
    expect(await getRequestedPositiveAddonCount(changerPage)).toBe(2);
    await expect(changerPage.getByRole('button', { name: /Start Game/ })).toBeDisabled();
  } finally {
    await changerPage.close();
  }
});
