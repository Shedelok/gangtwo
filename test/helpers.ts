import type { Locator, Page } from '@playwright/test';

export interface AddonList {
  panel: Locator;
  checkboxes: Locator;
}

export function getAddonLists(page: Page): { negative: AddonList; positive: AddonList } {
  const make = (label: string, otherLabel: string): AddonList => {
    const panel = page.locator('div').filter({
      has: page.locator('span', { hasText: label }),
    }).filter({
      hasNot: page.locator('span', { hasText: otherLabel }),
    });
    return { panel, checkboxes: panel.locator('input[type="checkbox"]') };
  };
  return {
    negative: make('Negative', 'Positive'),
    positive: make('Positive', 'Negative'),
  };
}

async function setAddonCountToZero(page: Page, minusBtnIndex: number): Promise<void> {
  const initialCount = await page.getByRole('button', { name: '−' }).nth(minusBtnIndex).evaluate(
    el => parseInt((el.nextElementSibling as HTMLElement)?.textContent?.trim() || '0', 10)
  );
  for (let target = initialCount - 1; target >= 0; target--) {
    await page.getByRole('button', { name: '−' }).nth(minusBtnIndex).click();
    await page.waitForFunction(
      ([idx, expected]: number[]) => {
        const btns = Array.from(document.querySelectorAll('button')).filter(b => b.textContent?.trim() === '−');
        const span = btns[idx]?.nextElementSibling;
        return span ? parseInt(span.textContent?.trim() || '0', 10) === expected : false;
      },
      [minusBtnIndex, target]
    );
  }
}

async function setNegativeAddonCountToZero(page: Page): Promise<void> {
  await setAddonCountToZero(page, 0);
}

async function setPositiveAddonCountToZero(page: Page): Promise<void> {
  await setAddonCountToZero(page, 1);
}

export async function completelyResetGameState(page: Page): Promise<void> {
  await page.goto('/');

  const stopButton = page.getByRole('button', { name: 'Stop the game' });
  await stopButton.waitFor({ timeout: 10000 });
  await stopButton.click();

  const nameInput = page.getByPlaceholder('Your name...');
  await nameInput.waitFor({ timeout: 10000 });
  await nameInput.fill('');

  await setNegativeAddonCountToZero(page);
  await setPositiveAddonCountToZero(page);

  const { negative, positive } = getAddonLists(page);
  for (const list of [negative, positive]) {
    const unchecked = list.checkboxes.and(page.locator(':not(:checked)'));
    while ((await unchecked.count()) > 0) {
      await unchecked.first().click();
    }
  }
}
