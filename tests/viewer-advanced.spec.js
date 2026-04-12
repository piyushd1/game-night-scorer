import { test, expect } from '@playwright/test';
import { createRoomAndAddPlayers, getRoomCode, navigateToGameSelect, selectAndStartGame } from './helpers/room.js';
import { submitFlip7Round } from './helpers/scoring.js';
import { expectOnScreen, expectPlayerScore, expectOvertime } from './helpers/assertions.js';

test.describe('Viewer Advanced', () => {
  test('viewer joins mid-game and sees current scores', async ({ page, browser }) => {
    await page.goto('/');
    await createRoomAndAddPlayers(page, ['ALICE', 'BOB']);
    const roomCode = await getRoomCode(page);

    // Host starts game and submits a round
    await navigateToGameSelect(page);
    await selectAndStartGame(page, 'flip7', { targetScore: 200 });
    await submitFlip7Round(page, [{ points: 50 }, { points: 30 }]);
    await expectOnScreen(page, 'dashboard');

    // Viewer joins AFTER game started
    const viewerContext = await browser.newContext();
    const viewer = await viewerContext.newPage();
    await viewer.goto(`/?room=${roomCode}`);

    // Viewer should auto-navigate to dashboard (game is active)
    await viewer.waitForSelector('#screen-dashboard', { timeout: 15000 });

    // Viewer should see current scores
    await viewer.waitForFunction(
      () => {
        const text = document.querySelector('#screen-dashboard')?.textContent || '';
        return text.includes('50') && text.includes('30');
      },
      { timeout: 10000 }
    );

    await viewerContext.close();
  });

  test('viewer sees overtime banner', async ({ page, browser }) => {
    await page.goto('/');
    await createRoomAndAddPlayers(page, ['ALICE', 'BOB']);
    const roomCode = await getRoomCode(page);

    // Viewer joins
    const viewerContext = await browser.newContext();
    const viewer = await viewerContext.newPage();
    await viewer.goto(`/?room=${roomCode}`);
    await viewer.waitForSelector('#screen-lobby', { timeout: 15000 });

    // Host starts game and creates tie → overtime
    await navigateToGameSelect(page);
    await selectAndStartGame(page, 'flip7', { targetScore: 50 });
    await submitFlip7Round(page, [{ points: 50 }, { points: 50 }]);

    // Viewer should see dashboard with overtime
    await viewer.waitForSelector('#screen-dashboard', { timeout: 15000 });
    await viewer.waitForFunction(
      () => document.querySelector('.overtime-banner')?.textContent?.toUpperCase().includes('OVERTIME'),
      { timeout: 10000 }
    );

    await viewerContext.close();
  });

  test('viewer navigates to winner when game completes', async ({ page, browser }) => {
    await page.goto('/');
    await createRoomAndAddPlayers(page, ['ALICE', 'BOB']);
    const roomCode = await getRoomCode(page);

    // Viewer joins
    const viewerContext = await browser.newContext();
    const viewer = await viewerContext.newPage();
    await viewer.goto(`/?room=${roomCode}`);
    await viewer.waitForSelector('#screen-lobby', { timeout: 15000 });

    // Host starts and wins game
    await navigateToGameSelect(page);
    await selectAndStartGame(page, 'flip7', { targetScore: 50 });
    await submitFlip7Round(page, [{ points: 60 }, { points: 10 }]);

    // Host should see winner
    await page.waitForSelector('#screen-winner', { timeout: 10000 });

    // Viewer should also see winner screen eventually
    await viewer.waitForSelector('#screen-winner', { timeout: 15000 });
    const winnerText = await viewer.locator('#screen-winner').textContent();
    expect(winnerText.toUpperCase()).toContain('ALICE');

    await viewerContext.close();
  });

  test('viewer can access rules tab during game', async ({ page, browser }) => {
    await page.goto('/');
    await createRoomAndAddPlayers(page, ['ALICE', 'BOB']);
    const roomCode = await getRoomCode(page);

    // Viewer joins
    const viewerContext = await browser.newContext();
    const viewer = await viewerContext.newPage();
    await viewer.goto(`/?room=${roomCode}`);
    await viewer.waitForSelector('#screen-lobby', { timeout: 15000 });

    // Host starts game
    await navigateToGameSelect(page);
    await selectAndStartGame(page, 'flip7', { targetScore: 200 });

    // Wait for viewer to reach dashboard
    await viewer.waitForSelector('#screen-dashboard', { timeout: 15000 });

    // Viewer clicks rules tab
    await viewer.click('[data-tab="rules"]');
    await viewer.waitForSelector('#screen-rules', { timeout: 5000 });
    await expectOnScreen(viewer, 'rules');

    // Rules should show Flip 7 content
    const rulesText = await viewer.locator('#screen-rules').textContent();
    expect(rulesText.toUpperCase()).toContain('FLIP');

    await viewerContext.close();
  });
});
