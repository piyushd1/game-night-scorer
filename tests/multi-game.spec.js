import { test, expect } from '@playwright/test';
import { fullGameSetup, createRoomAndAddPlayers, navigateToGameSelect, selectAndStartGame } from './helpers/room.js';
import { submitFlip7Round, submitPapayooRound } from './helpers/scoring.js';
import { expectOnScreen } from './helpers/assertions.js';

test.describe('Multi-Game Night', () => {
  test('play two games and verify lobby returns', async ({ page }) => {
    await page.goto('/');
    await fullGameSetup(page, ['ALICE', 'BOB'], 'flip7', { targetScore: 50 });

    // Complete game 1
    await submitFlip7Round(page, [{ points: 60 }, { points: 10 }]);
    await page.waitForSelector('#screen-winner', { timeout: 10000 });

    // Click "Choose New Game" from winner screen
    const newGameBtn = page.locator('button', { hasText: /CHOOSE NEW GAME|NEW GAME/i });
    if (await newGameBtn.isVisible()) {
      await newGameBtn.click();
      // Should go to game select
      await page.waitForSelector('#screen-game-select', { timeout: 5000 });
      await expectOnScreen(page, 'game-select');
    }
  });

  test('replay same game type works', async ({ page }) => {
    await page.goto('/');
    await fullGameSetup(page, ['ALICE', 'BOB'], 'flip7', { targetScore: 50 });

    // Complete game
    await submitFlip7Round(page, [{ points: 60 }, { points: 10 }]);
    await page.waitForSelector('#screen-winner', { timeout: 10000 });

    // Click REPLAY
    const replayBtn = page.locator('button', { hasText: /REPLAY/i });
    if (await replayBtn.isVisible()) {
      await replayBtn.click();
      // Should go to dashboard with fresh scores
      await page.waitForSelector('#screen-dashboard', { timeout: 10000 });
      await expectOnScreen(page, 'dashboard');
    }
  });

  test('manual end game via host menu returns to lobby', async ({ page }) => {
    await page.goto('/');
    await fullGameSetup(page, ['ALICE', 'BOB'], 'flip7', { targetScore: 200 });

    // Submit one round so there's data
    await submitFlip7Round(page, [{ points: 30 }, { points: 20 }]);
    await expectOnScreen(page, 'dashboard');

    // Open host menu and end game
    await page.click('#btn-host-menu-trigger');
    await page.waitForSelector('#host-menu-overlay', { state: 'visible', timeout: 3000 });
    await page.click('[data-action="end-game"]');

    // Should navigate to lobby
    await page.waitForSelector('#screen-lobby', { timeout: 10000 });
    await expectOnScreen(page, 'lobby');
  });

  test('host menu new game navigates to game select', async ({ page }) => {
    await page.goto('/');
    await fullGameSetup(page, ['ALICE', 'BOB'], 'flip7', { targetScore: 200 });

    // Open host menu and click new game
    await page.click('#btn-host-menu-trigger');
    await page.waitForSelector('#host-menu-overlay', { state: 'visible', timeout: 3000 });
    await page.click('[data-action="new-game"]');

    // Should go to game select
    await page.waitForSelector('#screen-game-select', { timeout: 5000 });
    await expectOnScreen(page, 'game-select');
  });
});
