import { expect, test } from '@playwright/test';
import {
  clickTestModeCheckbox,
  completelyResetGameState,
  joinLobby,
  pressReadyForNextRound,
  pressRevealCards,
  pressStartGameInLobby,
  setEnabledNegativeAddons,
  setTestModeCommonCards,
  setTestModePlayerCards,
  submitHandGuess,
  takeAnyChip,
  takeChip,
} from './helpers';

test.beforeEach(async ({ page }) => {
  await completelyResetGameState(page);
});

test('shows WIN when two equal-combination hands are in right order', async ({ page: highCardPage, browser }) => {
  const pairFivesPage = await browser.newPage();
  const pairEightsPage = await browser.newPage();
  const twoPairPage = await browser.newPage();
  try {
    await joinLobby(highCardPage, 'HighCard');
    await joinLobby(pairFivesPage, 'PairFives');
    await joinLobby(pairEightsPage, 'PairEights');
    await joinLobby(twoPairPage, 'TwoPair');

    await clickTestModeCheckbox(highCardPage);
    await setTestModeCommonCards(highCardPage, '2c, 5d, 8h, Js, Kc');
    await setTestModePlayerCards(highCardPage, 'HighCard', '3d, 4s');
    await setTestModePlayerCards(highCardPage, 'PairFives', '5h, 9c');
    await setTestModePlayerCards(highCardPage, 'PairEights', '8c, 10d');
    await setTestModePlayerCards(highCardPage, 'TwoPair', 'Kh, Jd');

    await pressStartGameInLobby([highCardPage, pairFivesPage, pairEightsPage, twoPairPage]);

    for (let round = 1; round <= 3; round++) {
      await takeAnyChip(highCardPage);
      await takeAnyChip(pairFivesPage);
      await takeAnyChip(pairEightsPage);
      await takeAnyChip(twoPairPage);
      await pressReadyForNextRound([highCardPage, pairFivesPage, pairEightsPage, twoPairPage]);
    }
    await takeChip(highCardPage, 1);
    await takeChip(pairFivesPage, 2);
    await takeChip(pairEightsPage, 3);
    await takeChip(twoPairPage, 4);
    await pressReadyForNextRound([highCardPage, pairFivesPage, pairEightsPage, twoPairPage]);

    await pressRevealCards(highCardPage);
    await pressRevealCards(pairFivesPage);
    await pressRevealCards(pairEightsPage);
    await pressRevealCards(twoPairPage);

    await expect(highCardPage.getByText('WIN', { exact: true })).toBeVisible();
  } finally {
    await pairFivesPage.close();
    await pairEightsPage.close();
    await twoPairPage.close();
  }
});

test('shows LOSS when two equal-combination hands are in wrong order', async ({ page: highCardPage, browser }) => {
  const pairFivesPage = await browser.newPage();
  const pairEightsPage = await browser.newPage();
  const twoPairPage = await browser.newPage();
  try {
    await joinLobby(highCardPage, 'HighCard');
    await joinLobby(pairFivesPage, 'PairFives');
    await joinLobby(pairEightsPage, 'PairEights');
    await joinLobby(twoPairPage, 'TwoPair');

    await clickTestModeCheckbox(highCardPage);
    await setTestModeCommonCards(highCardPage, '2c, 5d, 8h, Js, Kc');
    await setTestModePlayerCards(highCardPage, 'HighCard', '3d, 4s');
    await setTestModePlayerCards(highCardPage, 'PairFives', '5h, 9c');
    await setTestModePlayerCards(highCardPage, 'PairEights', '8c, 10d');
    await setTestModePlayerCards(highCardPage, 'TwoPair', 'Kh, Jd');

    await pressStartGameInLobby([highCardPage, pairFivesPage, pairEightsPage, twoPairPage]);

    for (let round = 1; round <= 3; round++) {
      await takeAnyChip(highCardPage);
      await takeAnyChip(pairFivesPage);
      await takeAnyChip(pairEightsPage);
      await takeAnyChip(twoPairPage);
      await pressReadyForNextRound([highCardPage, pairFivesPage, pairEightsPage, twoPairPage]);
    }

    await takeChip(highCardPage, 1);
    await takeChip(pairEightsPage, 2);
    await takeChip(pairFivesPage, 3);
    await takeChip(twoPairPage, 4);
    await pressReadyForNextRound([highCardPage, pairEightsPage, pairFivesPage, twoPairPage]);

    await pressRevealCards(highCardPage);
    await pressRevealCards(pairEightsPage);
    await pressRevealCards(pairFivesPage);
    await pressRevealCards(twoPairPage);

    await expect(highCardPage.getByText('LOSS', { exact: true })).toBeVisible();
  } finally {
    await pairFivesPage.close();
    await pairEightsPage.close();
    await twoPairPage.close();
  }
});

test('shows WIN when the majority correctly guesses the highest-chip hand rank', async ({ page: highCardPage, browser }) => {
  const pairFivesPage = await browser.newPage();
  const pairEightsPage = await browser.newPage();
  const twoPairPage = await browser.newPage();
  try {
    await joinLobby(highCardPage, 'HighCard');
    await joinLobby(pairFivesPage, 'PairFives');
    await joinLobby(pairEightsPage, 'PairEights');
    await joinLobby(twoPairPage, 'TwoPair');

    await setEnabledNegativeAddons(highCardPage, ['Guess Hand Highest']);

    await clickTestModeCheckbox(highCardPage);
    await setTestModeCommonCards(highCardPage, '2c, 5d, 8h, Js, Kc');
    await setTestModePlayerCards(highCardPage, 'HighCard', '3d, 4s');
    await setTestModePlayerCards(highCardPage, 'PairFives', '5h, 9c');
    await setTestModePlayerCards(highCardPage, 'PairEights', '8c, 10d');
    await setTestModePlayerCards(highCardPage, 'TwoPair', 'Kh, Jd');

    await pressStartGameInLobby([highCardPage, pairFivesPage, pairEightsPage, twoPairPage]);

    for (let round = 1; round <= 3; round++) {
      await takeAnyChip(highCardPage);
      await takeAnyChip(pairFivesPage);
      await takeAnyChip(pairEightsPage);
      await takeAnyChip(twoPairPage);
      await pressReadyForNextRound([highCardPage, pairFivesPage, pairEightsPage, twoPairPage]);
    }
    await takeChip(highCardPage, 1);
    await takeChip(pairFivesPage, 2);
    await takeChip(pairEightsPage, 3);
    await takeChip(twoPairPage, 4);
    await pressReadyForNextRound([highCardPage, pairFivesPage, pairEightsPage, twoPairPage]);

    await pressRevealCards(highCardPage);
    await pressRevealCards(pairFivesPage);
    await pressRevealCards(pairEightsPage);

    await submitHandGuess(highCardPage, 'Two Pair');
    await submitHandGuess(pairFivesPage, 'Two Pair');
    await submitHandGuess(pairEightsPage, 'Full House');

    await pressRevealCards(twoPairPage);

    await expect(highCardPage.getByText('WIN', { exact: true })).toBeVisible();
  } finally {
    await pairFivesPage.close();
    await pairEightsPage.close();
    await twoPairPage.close();
  }
});

test('shows LOSS when the majority wrongly guesses the highest-chip hand rank', async ({ page: highCardPage, browser }) => {
  const pairFivesPage = await browser.newPage();
  const pairEightsPage = await browser.newPage();
  const twoPairPage = await browser.newPage();
  try {
    await joinLobby(highCardPage, 'HighCard');
    await joinLobby(pairFivesPage, 'PairFives');
    await joinLobby(pairEightsPage, 'PairEights');
    await joinLobby(twoPairPage, 'TwoPair');

    await setEnabledNegativeAddons(highCardPage, ['Guess Hand Highest']);

    await clickTestModeCheckbox(highCardPage);
    await setTestModeCommonCards(highCardPage, '2c, 5d, 8h, Js, Kc');
    await setTestModePlayerCards(highCardPage, 'HighCard', '3d, 4s');
    await setTestModePlayerCards(highCardPage, 'PairFives', '5h, 9c');
    await setTestModePlayerCards(highCardPage, 'PairEights', '8c, 10d');
    await setTestModePlayerCards(highCardPage, 'TwoPair', 'Kh, Jd');

    await pressStartGameInLobby([highCardPage, pairFivesPage, pairEightsPage, twoPairPage]);

    for (let round = 1; round <= 3; round++) {
      await takeAnyChip(highCardPage);
      await takeAnyChip(pairFivesPage);
      await takeAnyChip(pairEightsPage);
      await takeAnyChip(twoPairPage);
      await pressReadyForNextRound([highCardPage, pairFivesPage, pairEightsPage, twoPairPage]);
    }
    await takeChip(highCardPage, 1);
    await takeChip(pairFivesPage, 2);
    await takeChip(pairEightsPage, 3);
    await takeChip(twoPairPage, 4);
    await pressReadyForNextRound([highCardPage, pairFivesPage, pairEightsPage, twoPairPage]);

    await pressRevealCards(highCardPage);
    await pressRevealCards(pairFivesPage);
    await pressRevealCards(pairEightsPage);

    await submitHandGuess(highCardPage, 'Full House');
    await submitHandGuess(pairFivesPage, 'Full House');
    await submitHandGuess(pairEightsPage, 'Two Pair');

    await pressRevealCards(twoPairPage);

    await expect(highCardPage.getByText('LOSS', { exact: true })).toBeVisible();
  } finally {
    await pairFivesPage.close();
    await pairEightsPage.close();
    await twoPairPage.close();
  }
});

test('shows WIN when two tied-strength hands hold the 2nd and 3rd chips in order', async ({ page: highCardPage, browser }) => {
  const twoPairAPage = await browser.newPage();
  const twoPairBPage = await browser.newPage();
  const tripsPage = await browser.newPage();
  try {
    await joinLobby(highCardPage, 'HighCard');
    await joinLobby(twoPairAPage, 'TwoPairA');
    await joinLobby(twoPairBPage, 'TwoPairB');
    await joinLobby(tripsPage, 'Trips');

    await clickTestModeCheckbox(highCardPage);
    await setTestModeCommonCards(highCardPage, 'Kd, Qc, 7h, 3s, 2d');
    await setTestModePlayerCards(highCardPage, 'HighCard', '9h, 4c');
    await setTestModePlayerCards(highCardPage, 'TwoPairA', 'Kh, Qs');
    await setTestModePlayerCards(highCardPage, 'TwoPairB', 'Kc, Qd');
    await setTestModePlayerCards(highCardPage, 'Trips', '7s, 7d');

    await pressStartGameInLobby([highCardPage, twoPairAPage, twoPairBPage, tripsPage]);

    for (let round = 1; round <= 3; round++) {
      await takeAnyChip(highCardPage);
      await takeAnyChip(twoPairAPage);
      await takeAnyChip(twoPairBPage);
      await takeAnyChip(tripsPage);
      await pressReadyForNextRound([highCardPage, twoPairAPage, twoPairBPage, tripsPage]);
    }
    await takeChip(highCardPage, 1);
    await takeChip(twoPairAPage, 2);
    await takeChip(twoPairBPage, 3);
    await takeChip(tripsPage, 4);
    await pressReadyForNextRound([highCardPage, twoPairAPage, twoPairBPage, tripsPage]);

    await pressRevealCards(highCardPage);
    await pressRevealCards(twoPairAPage);
    await pressRevealCards(twoPairBPage);
    await pressRevealCards(tripsPage);

    await expect(highCardPage.getByText('WIN', { exact: true })).toBeVisible();
  } finally {
    await twoPairAPage.close();
    await twoPairBPage.close();
    await tripsPage.close();
  }
});

test('shows WIN when two tied-strength hands hold the 2nd and 3rd chips in reverse order', async ({ page: highCardPage, browser }) => {
  const twoPairAPage = await browser.newPage();
  const twoPairBPage = await browser.newPage();
  const tripsPage = await browser.newPage();
  try {
    await joinLobby(highCardPage, 'HighCard');
    await joinLobby(twoPairAPage, 'TwoPairA');
    await joinLobby(twoPairBPage, 'TwoPairB');
    await joinLobby(tripsPage, 'Trips');

    await clickTestModeCheckbox(highCardPage);
    await setTestModeCommonCards(highCardPage, 'Kd, Qc, 7h, 3s, 2d');
    await setTestModePlayerCards(highCardPage, 'HighCard', '9h, 4c');
    await setTestModePlayerCards(highCardPage, 'TwoPairA', 'Kh, Qs');
    await setTestModePlayerCards(highCardPage, 'TwoPairB', 'Kc, Qd');
    await setTestModePlayerCards(highCardPage, 'Trips', '7s, 7d');

    await pressStartGameInLobby([highCardPage, twoPairAPage, twoPairBPage, tripsPage]);

    for (let round = 1; round <= 3; round++) {
      await takeAnyChip(highCardPage);
      await takeAnyChip(twoPairAPage);
      await takeAnyChip(twoPairBPage);
      await takeAnyChip(tripsPage);
      await pressReadyForNextRound([highCardPage, twoPairAPage, twoPairBPage, tripsPage]);
    }
    await takeChip(highCardPage, 1);
    await takeChip(twoPairBPage, 2);
    await takeChip(twoPairAPage, 3);
    await takeChip(tripsPage, 4);
    await pressReadyForNextRound([highCardPage, twoPairBPage, twoPairAPage, tripsPage]);

    await pressRevealCards(highCardPage);
    await pressRevealCards(twoPairBPage);
    await pressRevealCards(twoPairAPage);
    await pressRevealCards(tripsPage);

    await expect(highCardPage.getByText('WIN', { exact: true })).toBeVisible();
  } finally {
    await twoPairAPage.close();
    await twoPairBPage.close();
    await tripsPage.close();
  }
});
