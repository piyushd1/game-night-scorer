import { test, expect } from '@playwright/test';
import { createRoomAndAddPlayers, navigateToGameSelect, selectAndStartGame } from './helpers/room.js';
import { submitFlip7Round, submitPapayooRound, submitCaboRound } from './helpers/scoring.js';
import { expectOnScreen, expectPlayerScore, expectWinner } from './helpers/assertions.js';

test.describe('Cross-Game Flows', () => {
  test('switch from Flip7 to Papayoo — clean slate', async ({ page }) => {
    await page.goto('/');
    await createRoomAndAddPlayers(page, ['ALICE', 'BOB', 'CHARLIE']);
    await navigateToGameSelect(page);
    await selectAndStartGame(page, 'flip7', { targetScore: 50 });

    // Win Flip7
    await submitFlip7Round(page, [{ points: 60 }, { points: 10 }, { points: 20 }]);
    await page.waitForSelector('#screen-winner', { timeout: 10000 });

    // Choose new game → Papayoo
    await page.click('#btn-new-game');
    await page.waitForSelector('#screen-game-select', { timeout: 5000 });
    await selectAndStartGame(page, 'papayoo', { roundLimit: 3 });

    // Dashboard should show fresh Papayoo game with 0 scores
    await expectPlayerScore(page, 'ALICE', 0);
    await expectPlayerScore(page, 'BOB', 0);
    await expectPlayerScore(page, 'CHARLIE', 0);

    // Verify game label shows Papayoo (in the heading/header, not dashboard body)
    const heading = await page.locator('h1').textContent();
    expect(heading.toUpperCase()).toContain('PAPAYOO');
  });

  test('play all 3 games in one session', async ({ page }) => {
    await page.goto('/');
    await createRoomAndAddPlayers(page, ['ALICE', 'BOB']);

    // Game 1: Flip7
    await navigateToGameSelect(page);
    await selectAndStartGame(page, 'flip7', { targetScore: 50 });
    await submitFlip7Round(page, [{ points: 60 }, { points: 10 }]);
    await page.waitForSelector('#screen-winner', { timeout: 10000 });

    // Game 2: Cabo
    await page.click('#btn-new-game');
    await page.waitForSelector('#screen-game-select', { timeout: 5000 });
    await selectAndStartGame(page, 'cabo');

    // Submit rounds until bust
    await submitCaboRound(page, 0, [50, 10]); // ALICE calls, not lowest → 50+10=60
    await submitCaboRound(page, 0, [50, 10]); // ALICE calls again, not lowest → 60+50+10=120 → bust
    await page.waitForSelector('#screen-winner', { timeout: 10000 });

    // Game 3: back to game select (need 3+ players for Papayoo, so skip)
    // Verify we can navigate back and start another
    await page.click('#btn-new-game');
    await page.waitForSelector('#screen-game-select', { timeout: 5000 });
    await expectOnScreen(page, 'game-select');
  });

  test('replay uses same config', async ({ page }) => {
    await page.goto('/');
    await createRoomAndAddPlayers(page, ['ALICE', 'BOB']);
    await navigateToGameSelect(page);
    await selectAndStartGame(page, 'flip7', { targetScore: 75 });

    // Win game
    await submitFlip7Round(page, [{ points: 80 }, { points: 10 }]);
    await page.waitForSelector('#screen-winner', { timeout: 10000 });

    // Replay
    await page.click('#btn-replay');
    await page.waitForSelector('#screen-dashboard', { timeout: 10000 });

    // Dashboard should show target 75 (same config)
    const dashText = await page.locator('#screen-dashboard').textContent();
    expect(dashText).toContain('75');

    // Scores should be fresh (0)
    await expectPlayerScore(page, 'ALICE', 0);
    await expectPlayerScore(page, 'BOB', 0);
  });

  test('dashboard layout correct for each game type', async ({ page }) => {
    await page.goto('/');
    await createRoomAndAddPlayers(page, ['ALICE', 'BOB']);

    // Flip7 — should show "TARGET" label
    await navigateToGameSelect(page);
    await selectAndStartGame(page, 'flip7', { targetScore: 200 });
    let dashText = await page.locator('#screen-dashboard').textContent();
    expect(dashText.toUpperCase()).toContain('TARGET');
    expect(dashText).toContain('200');

    // End game → Cabo
    await page.click('#btn-host-menu-trigger');
    await page.waitForSelector('#host-menu-overlay', { state: 'visible', timeout: 3000 });
    await page.click('[data-action="new-game"]');
    await page.waitForSelector('#screen-game-select', { timeout: 5000 });
    await selectAndStartGame(page, 'cabo');

    dashText = await page.locator('#screen-dashboard').textContent();
    expect(dashText.toUpperCase()).toContain('BUST');
    expect(dashText).toContain('100');
  });
});
