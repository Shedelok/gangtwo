import { test, expect } from '@playwright/test';
import { completelyResetGameState } from './helpers';

test.beforeEach(async ({ page }) => {
  await completelyResetGameState(page);
});

test('name input and join button are visible on the home page', async ({ page }) => {
  await expect(page.getByPlaceholder('Your name...')).toBeVisible();
  await expect(page.getByRole('button', { name: /Join Lobby/ })).toBeVisible();
});
