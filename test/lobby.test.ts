import { test, expect } from '@playwright/test';
import { CLUBS_SYMBOL, DIAMONDS_SYMBOL, HEARTS_SYMBOL, SPADES_SYMBOL, clickTestModeCheckbox, completelyResetGameState, getAddonLists, getCommonCards, getOwnPocketCards, getRequestedPositiveAddonCount, joinLobby, pressReadyForNextRound, pressStartGameInLobby, setEnabledNegativeAddons, setRequestedPositiveAddonCount, setTestModeCommonCards, setTestModePlayerCards, takeAnyChip } from './helpers';

test.beforeEach(async ({ page }) => {
  await completelyResetGameState(page);
});

test('test mode deals specified pocket cards and all 5 common cards correctly', async ({ page: zeroCardsSpecifiedPage, browser }) => {
  const oneCardSpecifiedPage = await browser.newPage();
  const twoCardsSpecifiedPage = await browser.newPage();
  try {
    await joinLobby(zeroCardsSpecifiedPage, 'ZeroCardsSpecified');
    await joinLobby(oneCardSpecifiedPage, 'OneCardSpecified');
    await joinLobby(twoCardsSpecifiedPage, 'TwoCardsSpecified');

    await clickTestModeCheckbox(zeroCardsSpecifiedPage);
    await setTestModePlayerCards(zeroCardsSpecifiedPage, 'OneCardSpecified', 'Kd');
    await setTestModePlayerCards(zeroCardsSpecifiedPage, 'TwoCardsSpecified', '7d, 7h');
    await setTestModeCommonCards(zeroCardsSpecifiedPage, '5c, 9s, Jh, 4d, 6c');

    await pressStartGameInLobby(zeroCardsSpecifiedPage);
    await pressStartGameInLobby(oneCardSpecifiedPage);
    await pressStartGameInLobby(twoCardsSpecifiedPage);

    // Reveal all 5 common cards
    for (let round = 1; round <= 3; round++) {
      await takeAnyChip(zeroCardsSpecifiedPage);
      await takeAnyChip(oneCardSpecifiedPage);
      await takeAnyChip(twoCardsSpecifiedPage);
      await pressReadyForNextRound(zeroCardsSpecifiedPage);
      await pressReadyForNextRound(oneCardSpecifiedPage);
      await pressReadyForNextRound(twoCardsSpecifiedPage);
    }

    const commonCards = await getCommonCards(zeroCardsSpecifiedPage);
    expect(commonCards).toHaveLength(5);
    expect(commonCards[0]).toMatchObject({ rank: '5', suit: CLUBS_SYMBOL });
    expect(commonCards[1]).toMatchObject({ rank: '9', suit: SPADES_SYMBOL });
    expect(commonCards[2]).toMatchObject({ rank: 'J', suit: HEARTS_SYMBOL });
    expect(commonCards[3]).toMatchObject({ rank: '4', suit: DIAMONDS_SYMBOL });
    expect(commonCards[4]).toMatchObject({ rank: '6', suit: CLUBS_SYMBOL });

    const oneCardSpecifiedCards = await getOwnPocketCards(oneCardSpecifiedPage);
    expect(oneCardSpecifiedCards[0]).toMatchObject({ rank: 'K', suit: DIAMONDS_SYMBOL });

    const twoCardsSpecifiedCards = await getOwnPocketCards(twoCardsSpecifiedPage);
    expect(twoCardsSpecifiedCards[0]).toMatchObject({ rank: '7', suit: DIAMONDS_SYMBOL });
    expect(twoCardsSpecifiedCards[1]).toMatchObject({ rank: '7', suit: HEARTS_SYMBOL });
  } finally {
    await oneCardSpecifiedPage.close();
    await twoCardsSpecifiedPage.close();
  }
});

test('test mode specified common cards appear first with all additional card addons active', async ({ page: player1Page, browser }) => {
  const player2Page = await browser.newPage();
  try {
    await joinLobby(player1Page, 'Player1');
    await joinLobby(player2Page, 'Player2');

    await setEnabledNegativeAddons(player1Page, ['Additional Card Flop', 'Additional Card Turn', 'Additional Card River']);
    await clickTestModeCheckbox(player1Page);
    await setTestModeCommonCards(player1Page, '2c, 3d, 4h, 5s, 6c, 7d');

    await pressStartGameInLobby(player1Page);
    await pressStartGameInLobby(player2Page);

    // Reveal all 8 common cards (4 flop + 2 turn + 2 river)
    for (let round = 1; round <= 3; round++) {
      await takeAnyChip(player1Page);
      await takeAnyChip(player2Page);
      await pressReadyForNextRound(player1Page);
      await pressReadyForNextRound(player2Page);
    }

    const commonCards = await getCommonCards(player1Page);
    expect(commonCards).toHaveLength(8);
    expect(commonCards[0]).toMatchObject({ rank: '2', suit: CLUBS_SYMBOL });
    expect(commonCards[1]).toMatchObject({ rank: '3', suit: DIAMONDS_SYMBOL });
    expect(commonCards[2]).toMatchObject({ rank: '4', suit: HEARTS_SYMBOL });
    expect(commonCards[3]).toMatchObject({ rank: '5', suit: SPADES_SYMBOL });
    expect(commonCards[4]).toMatchObject({ rank: '6', suit: CLUBS_SYMBOL });
    expect(commonCards[5]).toMatchObject({ rank: '7', suit: DIAMONDS_SYMBOL });
  } finally {
    await player2Page.close();
  }
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
