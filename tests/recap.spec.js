import { test, expect } from '@playwright/test';
import { createRoomAndAddPlayers, navigateToGameSelect, selectAndStartGame, enableStatsTracking } from './helpers/room.js';
import { submitFlip7Round } from './helpers/scoring.js';
import { expectOnScreen } from './helpers/assertions.js';

test.describe('Recap & Stats', () => {
  test('stats toggle visible before first game', async ({ page }) => {
    await page.goto('/');
    await page.click('#btn-create');
    await page.waitForSelector('#screen-lobby', { timeout: 15000 });

    await page.fill('#input-player-name', 'ALICE');
    await page.click('#btn-confirm-add');
    await page.waitForFunction(
      () => document.querySelector('#player-list')?.textContent?.includes('ALICE'),
      { timeout: 5000 }
    );

    // Stats toggle should be visible
    const toggle = page.locator('#btn-stats-toggle');
    await expect(toggle).toBeVisible();
  });

  test('recap button appears after game with stats enabled', async ({ page }) => {
    await page.goto('/');
    await createRoomAndAddPlayers(page, ['ALICE', 'BOB']);
    await enableStatsTracking(page);
    await navigateToGameSelect(page);
    await selectAndStartGame(page, 'flip7', { targetScore: 50 });

    // Win the game
    await submitFlip7Round(page, [{ points: 60 }, { points: 10 }]);
    await page.waitForSelector('#screen-winner', { timeout: 10000 });

    // Go to lobby via new game -> back
    await page.click('#btn-new-game');
    await page.waitForSelector('#screen-game-select', { timeout: 5000 });
    await page.click('#top-bar-back');
    await page.waitForSelector('#screen-lobby', { timeout: 5000 });

    // Recap button should be visible
    const recapBtn = page.locator('#btn-recap');
    await expect(recapBtn).toBeVisible({ timeout: 5000 });
  });

  test('recap shows game winner', async ({ page }) => {
    await page.goto('/');
    await createRoomAndAddPlayers(page, ['ALICE', 'BOB']);
    await enableStatsTracking(page);
    await navigateToGameSelect(page);
    await selectAndStartGame(page, 'flip7', { targetScore: 50 });

    await submitFlip7Round(page, [{ points: 60 }, { points: 10 }]);
    await page.waitForSelector('#screen-winner', { timeout: 10000 });

    // Navigate to lobby
    await page.click('#btn-new-game');
    await page.waitForSelector('#screen-game-select', { timeout: 5000 });
    await page.click('#top-bar-back');
    await page.waitForSelector('#screen-lobby', { timeout: 5000 });

    // Open recap
    await page.click('#btn-recap');
    await page.waitForSelector('#screen-recap', { timeout: 5000 });

    const recapText = await page.locator('#screen-recap').textContent();
    expect(recapText.toUpperCase()).toContain('ALICE'); // Winner
    expect(recapText.toUpperCase()).toContain('WINNER');
  });

  test('recap not available without stats enabled', async ({ page }) => {
    await page.goto('/');
    await createRoomAndAddPlayers(page, ['ALICE', 'BOB']);
    // Don't enable stats
    await navigateToGameSelect(page);
    await selectAndStartGame(page, 'flip7', { targetScore: 50 });

    await submitFlip7Round(page, [{ points: 60 }, { points: 10 }]);
    await page.waitForSelector('#screen-winner', { timeout: 10000 });

    await page.click('#btn-new-game');
    await page.waitForSelector('#screen-game-select', { timeout: 5000 });
    await page.click('#top-bar-back');
    await page.waitForSelector('#screen-lobby', { timeout: 5000 });

    // Recap button should NOT be visible
    const recapBtn = page.locator('#btn-recap');
    const isVisible = await recapBtn.isVisible().catch(() => false);
    expect(isVisible).toBe(false);
  });

  test('recap shows MVP after multiple games', async ({ page }) => {
    await page.goto('/');
    await createRoomAndAddPlayers(page, ['ALICE', 'BOB']);
    await enableStatsTracking(page);

    // Game 1: ALICE wins
    await navigateToGameSelect(page);
    await selectAndStartGame(page, 'flip7', { targetScore: 50 });
    await submitFlip7Round(page, [{ points: 60 }, { points: 10 }]);
    await page.waitForSelector('#screen-winner', { timeout: 10000 });

    // Replay -> Game 2: ALICE wins again
    await page.click('#btn-replay');
    await page.waitForSelector('#screen-dashboard', { timeout: 10000 });
    await submitFlip7Round(page, [{ points: 60 }, { points: 10 }]);
    await page.waitForSelector('#screen-winner', { timeout: 10000 });

    // Navigate to lobby -> recap
    await page.click('#btn-new-game');
    await page.waitForSelector('#screen-game-select', { timeout: 5000 });
    await page.click('#top-bar-back');
    await page.waitForSelector('#screen-lobby', { timeout: 5000 });

    await page.click('#btn-recap');
    await page.waitForSelector('#screen-recap', { timeout: 5000 });

    // MVP should be ALICE (2 wins)
    const mvpSection = page.locator('div.bg-primary');
    await expect(mvpSection).toBeVisible();
    const mvpText = await mvpSection.textContent();
    expect(mvpText.toUpperCase()).toContain('ALICE');
  });

  test('abandoned game shows inconclusive in recap', async ({ page }) => {
    await page.goto('/');
    await createRoomAndAddPlayers(page, ['ALICE', 'BOB']);
    await enableStatsTracking(page);

    // Start game but end it via host menu (abandon) — use TIED scores so there's no clear winner
    await navigateToGameSelect(page);
    await selectAndStartGame(page, 'flip7', { targetScore: 200 });
    await submitFlip7Round(page, [{ points: 20 }, { points: 20 }]);
    await expectOnScreen(page, 'dashboard');

    // End game via host menu
    await page.click('#btn-host-menu-trigger');
    await page.waitForSelector('#host-menu-overlay', { state: 'visible', timeout: 3000 });
    await page.click('[data-action="end-game"]');
    await page.waitForSelector('#screen-lobby', { timeout: 10000 });

    // Open recap
    await page.click('#btn-recap');
    await page.waitForSelector('#screen-recap', { timeout: 5000 });

    const recapText = await page.locator('#screen-recap').textContent();
    expect(recapText.toUpperCase()).toContain('INCONCLUSIVE');
  });
});
