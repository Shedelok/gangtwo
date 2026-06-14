import { expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

export const SPADES_SYMBOL   = '♠';
export const HEARTS_SYMBOL   = '♥';
export const DIAMONDS_SYMBOL = '♦';
export const CLUBS_SYMBOL    = '♣';

export function getRankPluralLabel(rank: string): string {
  return ({ A: 'Aces', K: 'Kings', Q: 'Queens', J: 'Jacks' } as Record<string, string>)[rank] ?? `${rank}s`;
}

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
  locator: Locator;
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
      return { name, locator, click: () => locator.click() };
    })
  );
}

export interface PocketCard {
  rank: string;
  suit: string;
  click: () => Promise<void>;
}

export async function getOwnPocketCards(page: Page): Promise<PocketCard[]> {
  const container = page
    .locator('div')
    .filter({ has: page.getByText('(you)') })
    .filter({ hasNot: page.locator('.cc-flip-container') })
    .first();
  await container.getByText(/^(A|K|Q|J|10|[2-9])$/).first().waitFor();
  const rawCards = await container.evaluate((el: HTMLElement) => {
    const rankRe = /^(A|K|Q|J|10|[2-9])$/;
    const suitSymbols = new Set(['♠', '♥', '♦', '♣']);
    const result: { rank: string; suit: string }[] = [];
    const seenUnsuitedCards = new Set<Element>();
    for (const span of el.querySelectorAll('span')) {
      const text = span.textContent?.trim() ?? '';
      if (!rankRe.test(text)) continue;
      // Require an adjacent suit symbol to distinguish card ranks from chip numbers
      let sym = (span.nextElementSibling as HTMLElement | null)?.textContent?.trim() ?? '';
      if (!suitSymbols.has(sym)) {
        sym = (span.parentElement?.nextElementSibling?.querySelector('span') as HTMLElement | null)?.textContent?.trim() ?? '';
      }
      if (suitSymbols.has(sym)) {
        result.push({ rank: text, suit: sym });
      } else {
        // Unsuited cards have orange background (#B87333) and no suit symbol
        let ancestor: Element | null = span.parentElement;
        let cardEl: Element | null = null;
        while (ancestor && ancestor !== el) {
          const bg = getComputedStyle(ancestor).backgroundColor;
          if (bg === 'rgb(184, 115, 51)' || bg === 'rgba(184, 115, 51, 1)') {
            cardEl = ancestor;
            break;
          }
          ancestor = ancestor.parentElement;
        }
        if (cardEl && !cardEl.hasAttribute('title') && !seenUnsuitedCards.has(cardEl)) {
          seenUnsuitedCards.add(cardEl);
          result.push({ rank: text, suit: '' });
        }
      }
    }
    return result;
  });
  return rawCards.map(({ rank, suit }) => {
    const clickable = container.locator('[style*="cursor: pointer"]')
      .filter({ has: page.locator('span', { hasText: new RegExp(`^${rank}$`) }) });
    const locator = suit !== ''
      ? clickable.filter({ has: page.locator('span', { hasText: suit }) }).first()
      : clickable.first();
    return { rank, suit, click: () => locator.click() };
  });
}

export async function takeAnyChip(page: Page): Promise<void> {
  const takeButtons = page.locator('button:visible', { hasText: 'Take' });
  await expect(async () => {
    await takeButtons.first().click();
    await expect(takeButtons).toHaveCount(0, { timeout: 2000 });
  }).toPass({ timeout: 15000 });
}

export async function takeChip(page: Page, value: number): Promise<void> {
  const takeButtons = page.locator('button:visible', { hasText: 'Take' });
  await takeButtons.first().waitFor();
  const count = await takeButtons.count();
  for (let i = 0; i < count; i++) {
    const button = takeButtons.nth(i);
    const stars = await button.evaluate(
      (el: HTMLElement) => el.parentElement?.querySelectorAll('svg polygon').length ?? 0
    );
    if (stars === value) {
      await button.click();
      return;
    }
  }
  throw new Error(`No takeable chip with value ${value} found`);
}

export const GREEN_CHIP_COLOR = 'rgb(46, 204, 113)';

export interface SeatChip {
  // The chip's value, i.e. its number of stars.
  value: number;
  // The chip's background color, as the browser's computed rgb() string.
  color: string;
}

// Returns the chips held by the page's own player ("(you)" seat). Each chip is rendered as a
// circle (ChipCircle) containing one star <svg> whose <polygon> count is the chip's value.
export async function getOwnChips(page: Page): Promise<SeatChip[]> {
  const seat = page
    .locator('div')
    .filter({ has: page.getByText('(you)') })
    .filter({ hasNot: page.locator('.cc-flip-container') })
    .first();
  return seat.evaluate((el: HTMLElement) => {
    const chips: { value: number; color: string }[] = [];
    for (const svg of Array.from(el.querySelectorAll('svg'))) {
      const stars = svg.querySelectorAll('polygon').length;
      if (stars === 0) continue; // not a chip's star svg
      const circle = svg.parentElement;
      if (!circle) continue;
      chips.push({
        value: stars,
        color: getComputedStyle(circle).backgroundColor,
      });
    }
    return chips;
  });
}

export async function pressReadyForNextRound(pages: Page[]): Promise<void> {
  for (const page of pages) {
    await page.getByRole('button', { name: 'Move to next round' }).click();
  }
}

export async function pressRevealCards(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Reveal cards' }).click();
}

export async function submitHandGuess(page: Page, rank: string): Promise<void> {
  await page.getByRole('button', { name: 'Guess Hand' }).click();
  await page.getByRole('button', { name: rank, exact: true }).click();
}

export async function waitForNthCommonCardToAppear(page: Page, count: number): Promise<void> {
  await page.locator('.cc-flip-container').nth(count - 1).waitFor();
}

export async function getCommonCards(page: Page): Promise<PocketCard[]> {
  const cards = page.locator('.cc-flip-container');
  await cards.first().waitFor();
  const count = await cards.count();
  return Promise.all(
    Array.from({ length: count }, async (_, i) => {
      const card = cards.nth(i);
      const { rank, suit } = await card.evaluate((el: HTMLElement) => {
        const rankRe = /^(A|K|Q|J|10|[2-9])$/;
        const suitSymbols = new Set(['♠', '♥', '♦', '♣']);
        let rank = '';
        let suit = '';
        for (const span of el.querySelectorAll('span')) {
          const text = span.textContent?.trim() ?? '';
          if (!rank && rankRe.test(text)) rank = text;
          else if (!suit && suitSymbols.has(text)) suit = text;
        }
        return { rank, suit };
      });
      return { rank, suit, click: () => card.click() };
    })
  );
}

export async function setTestModeCommonCards(page: Page, cards: string): Promise<void> {
  await page.getByPlaceholder('e.g. 2h, Ah, Ks, 8d').fill(cards);
}

export async function setTestModePlayerCards(page: Page, playerName: string, cards: string): Promise<void> {
  await page.locator('li').filter({ hasText: playerName }).locator('input[placeholder="e.g. As, 10d"]').fill(cards);
}

export async function clickTestModeCheckbox(page: Page): Promise<void> {
  await page.getByLabel('Test Mode').click();
}

export async function setTestModeAddonInput(page: Page, addonName: string, value: string): Promise<void> {
  const { positive } = await getAddonLists(page);
  const addon = positive.addons.find(a => a.name === addonName);
  if (!addon) throw new Error(`Addon "${addonName}" not found`);
  await addon.checkbox.locator('xpath=following-sibling::input[@type="text"]').fill(value);
}

export async function pressStartGameInLobby(pages: Page[]): Promise<void> {
  for (const page of pages) {
    await page.getByRole('button', { name: /Start Game/ }).click();
  }
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

export async function getCurrentHandHintText(page: Page): Promise<string> {
  const trigger = page.getByText('My Current Hand', { exact: true });
  await trigger.hover();
  let result = '';
  await expect(async () => {
    result = await trigger.evaluate((el: HTMLElement) => {
      return el.parentElement?.querySelector('div')?.textContent?.trim() ?? '';
    });
    expect(result).toBeTruthy();
  }).toPass({ timeout: 3000 });
  return result;
}

export async function getUnsuitedXRank(card: ActionCard): Promise<string> {
  return (await card.locator.locator('span').first().textContent())!.trim();
}


export async function useCheckNumberOfRanksActionCard(page: Page, rank: string): Promise<number> {
  const actionCards = await getActionCards(page);
  const cnrCard = actionCards.find(c => c.name === '[A] Check Number of Ranks')!;
  await cnrCard.click();
  await page.getByRole('button', { name: 'Choose rank' }).click();
  await page.getByRole('button', { name: rank, exact: true }).click();
  await page.getByRole('button', { name: `Check number of ${getRankPluralLabel(rank)}` }).click();
  return page.evaluate((): Promise<number> => new Promise((resolve, reject) => {
    const scan = (): number | null => {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let node: Node | null;
      while ((node = walker.nextNode())) {
        const text = node.textContent ?? '';
        if (text.includes('in the game right now')) {
          const m = text.match(/\d+/);
          if (m) return parseInt(m[0], 10);
        }
      }
      return null;
    };
    const count = scan();
    if (count !== null) { resolve(count); return; }
    let tid: ReturnType<typeof setTimeout>;
    const mo = new MutationObserver(() => {
      const c = scan();
      if (c === null) return;
      clearTimeout(tid);
      mo.disconnect();
      resolve(c);
    });
    mo.observe(document.body, { childList: true, subtree: true, characterData: true });
    tid = setTimeout(() => { mo.disconnect(); reject(new Error('Cloud never appeared')); }, 25000);
  }));
}

export async function useDestroyAllRsActionCard(page: Page, rank: string): Promise<void> {
  const destroyCard = (await getActionCards(page)).find(c => c.name === '[A] Destroy All Rs')!;
  await destroyCard.click();
  await page.getByRole('button', { name: 'Choose rank' }).click();
  await page.getByRole('button', { name: rank, exact: true }).click();
  await page.getByRole('button', { name: `Destroy ${getRankPluralLabel(rank)}` }).click();
}

export async function completelyResetGameState(page: Page): Promise<void> {
  await page.goto('/');

  const stopButton = page.getByRole('button', { name: 'Stop the game' });
  await stopButton.waitFor({ timeout: 10000 });
  await stopButton.click();

  const nameInput = page.getByPlaceholder('Your name...');
  await nameInput.waitFor({ timeout: 10000 });
  await nameInput.fill('');

  const testModeCheckbox = page.getByLabel('Test Mode');
  if (await testModeCheckbox.isChecked()) {
    await testModeCheckbox.click();
    await expect(testModeCheckbox).not.toBeChecked();
  }

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
