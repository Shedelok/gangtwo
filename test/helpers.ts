import { expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

export interface AddonItem {
  name: string;
  checkbox: Locator;
}

export interface AddonList {
  increaseRequestedButton: Locator;
  decreaseRequestedButton: Locator;
  requestedCountText: Locator;
  addons: AddonItem[];
}

export async function getAddonLists(page: Page): Promise<{ negative: AddonList; positive: AddonList }> {
  const make = async (label: string, otherLabel: string): Promise<AddonList> => {
    const panel = page.locator('div').filter({
      has: page.locator('span', { hasText: label }),
    }).filter({
      hasNot: page.locator('span', { hasText: otherLabel }),
    });

    const checkboxes = panel.locator('input[type="checkbox"]');
    const count = await checkboxes.count();
    const addons = await Promise.all(
      Array.from({ length: count }, async (_, i) => {
        const checkbox = checkboxes.nth(i);
        const name = await checkbox.evaluate((el: HTMLInputElement) => {
          const nextDiv = el.nextElementSibling as HTMLElement | null;
          return nextDiv?.querySelector('span')?.textContent?.trim() ?? '';
        });
        return { name, checkbox };
      })
    );

    return {
      increaseRequestedButton: panel.getByRole('button', { name: '+' }),
      decreaseRequestedButton: panel.getByRole('button', { name: '−' }),
      requestedCountText: panel.locator('span').filter({ hasText: /^\d+$/ }),
      addons,
    };
  };

  return {
    negative: await make('Negative', 'Positive'),
    positive: await make('Positive', 'Negative'),
  };
}

async function getAddonCountForList(list: AddonList): Promise<number> {
  return parseInt((await list.requestedCountText.textContent())!, 10);
}

export async function getRequestedPositiveAddonCount(page: Page): Promise<number> {
  const { positive } = await getAddonLists(page);
  return getAddonCountForList(positive);
}

export async function getRequestedNegativeAddonCount(page: Page): Promise<number> {
  const { negative } = await getAddonLists(page);
  return getAddonCountForList(negative);
}

async function setAddonCountForList(list: AddonList, target: number): Promise<void> {
  const current = await getAddonCountForList(list);
  const delta = target - current;
  if (delta === 0) return;
  const btn = delta > 0 ? list.increaseRequestedButton : list.decreaseRequestedButton;
  for (let i = 1; i <= Math.abs(delta); i++) {
    await btn.click();
    await expect(list.requestedCountText).toHaveText(String(current + (delta > 0 ? i : -i)), { exact: true });
  }
}

export async function setRequestedPositiveAddonCount(page: Page, count: number): Promise<void> {
  const { positive } = await getAddonLists(page);
  await setAddonCountForList(positive, count);
}

export async function setRequestedNegativeAddonCount(page: Page, count: number): Promise<void> {
  const { negative } = await getAddonLists(page);
  await setAddonCountForList(negative, count);
}

async function setEnabledAddons(list: AddonList, names: string[]): Promise<void> {
  for (const addon of list.addons) {
    if (await addon.checkbox.isChecked()) {
      await addon.checkbox.click();
      await expect(addon.checkbox).not.toBeChecked();
    }
  }
  for (const name of names) {
    const addon = list.addons.find(a => a.name === name);
    if (!addon) throw new Error(`Addon "${name}" not found`);
    await addon.checkbox.click();
    await expect(addon.checkbox).toBeChecked();
  }
  await setAddonCountForList(list, names.length);
}

export interface ActionCard {
  name: string;
  click: () => Promise<void>;
}

export async function getActionCards(page: Page): Promise<ActionCard[]> {
  const panel = page.locator('div').filter({ has: page.locator('div', { hasText: /^Actions$/ }) });
  const allCards = panel.locator('div[title]');
  await allCards.first().waitFor();
  const count = await allCards.count();
  return Promise.all(
    Array.from({ length: count }, async (_, i) => {
      const name = (await allCards.nth(i).getAttribute('title'))!;
      const locator = panel.locator(`div[title="${name}"]`);
      return { name, click: () => locator.click() };
    })
  );
}

export interface PocketCard {
  rank: string;
  suit: string;
}

export async function getOwnPocketCards(page: Page): Promise<PocketCard[]> {
  const rankPattern = /^(A|K|Q|J|10|[2-9])$/;
  const rankSpans = page
    .locator('div')
    .filter({ has: page.getByText('(you)') })
    .getByText(rankPattern);
  await rankSpans.first().waitFor();
  const count = await rankSpans.count();
  return Promise.all(
    Array.from({ length: count }, async (_, i) => {
      const span = rankSpans.nth(i);
      const rank = (await span.textContent())!.trim();
      const suit = await span.evaluate((el: HTMLElement) => {
        const suitSymbols = new Set(['♠', '♥', '♦', '♣']);
        // Normal layout: next sibling span holds the small suit symbol
        let sym = (el.nextElementSibling as HTMLElement | null)?.textContent?.trim() ?? '';
        if (!suitSymbols.has(sym)) {
          // Short deck layout: suit span is in the parent div's next sibling div
          sym = (el.parentElement?.nextElementSibling?.querySelector('span') as HTMLElement | null)?.textContent?.trim() ?? '';
        }
        return suitSymbols.has(sym) ? sym : '';
      });
      return { rank, suit };
    })
  );
}

export async function pressStartGameInLobby(page: Page): Promise<void> {
  await page.getByRole('button', { name: /Start Game/ }).click();
}

export async function joinLobby(page: Page, username: string): Promise<void> {
  await page.goto('/');
  await page.getByPlaceholder('Your name...').fill(username);
  await page.getByRole('button', { name: /Join Lobby/ }).click();
  await page.getByRole('button', { name: /Start Game/ }).waitFor();
}

export async function setEnabledPositiveAddons(page: Page, names: string[]): Promise<void> {
  const { positive } = await getAddonLists(page);
  await setEnabledAddons(positive, names);
}

export async function setEnabledNegativeAddons(page: Page, names: string[]): Promise<void> {
  const { negative } = await getAddonLists(page);
  await setEnabledAddons(negative, names);
}

export async function completelyResetGameState(page: Page): Promise<void> {
  await page.goto('/');

  const stopButton = page.getByRole('button', { name: 'Stop the game' });
  await stopButton.waitFor({ timeout: 10000 });
  await stopButton.click();

  const nameInput = page.getByPlaceholder('Your name...');
  await nameInput.waitFor({ timeout: 10000 });
  await nameInput.fill('');

  await setRequestedNegativeAddonCount(page, 0);
  await setRequestedPositiveAddonCount(page, 0);

  const { negative, positive } = await getAddonLists(page);
  for (const list of [negative, positive]) {
    for (const addon of list.addons) {
      if (!(await addon.checkbox.isChecked())) {
        await addon.checkbox.click();
        await expect(addon.checkbox).toBeChecked();
      }
    }
  }
}
