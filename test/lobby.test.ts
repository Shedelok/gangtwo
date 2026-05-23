import { test, expect } from '@playwright/test';
import { completelyResetGameState, getAddonLists } from './helpers';

test.beforeEach(async ({ page }) => {
  await completelyResetGameState(page);
});

test('start game button is disabled when positive addon count exceeds enabled pool size', async ({ page, browser }) => {
  const page2 = await browser.newPage();

  try {
    await page.getByPlaceholder('Your name...').fill('Ready player');
    await page.getByRole('button', { name: /Join Lobby/ }).click();
    await page.getByRole('button', { name: /Start Game/ }).waitFor();

    await page2.goto('/');
    await page2.getByPlaceholder('Your name...').fill('Configuration changer player');
    await page2.getByRole('button', { name: /Join Lobby/ }).click();
    await page2.getByRole('button', { name: /Start Game/ }).waitFor();

    await page.getByRole('button', { name: /Start Game/ }).click();
    await expect(page.getByRole('button', { name: /Waiting/ })).toBeVisible();

    const { positive } = getAddonLists(page2);
    const checkboxCount = await positive.checkboxes.count();
    for (let i = 1; i < checkboxCount; i++) {
      if (await positive.checkboxes.nth(i).isChecked()) {
        await positive.checkboxes.nth(i).click();
      }
    }

    await positive.panel.getByRole('button', { name: '+' }).click();
    await positive.panel.getByRole('button', { name: '+' }).click();

    await expect(positive.checkboxes.and(page2.locator(':checked'))).toHaveCount(1);
    await expect(positive.panel.locator('span').filter({ hasText: /^\d+$/ })).toHaveText('2', { exact: true });
    await expect(page2.getByRole('button', { name: /Start Game/ })).toBeDisabled();
  } finally {
    await page2.close();
  }
});
