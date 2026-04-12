import { test, expect } from '@playwright/test';
import { createRoomAndAddPlayers, getRoomCode, navigateToGameSelect, selectAndStartGame } from './helpers/room.js';
import { submitFlip7Round } from './helpers/scoring.js';
import { expectOnScreen } from './helpers/assertions.js';

test.describe('Viewer', () => {
  test('viewer joins room and sees spectator mode', async ({ page, context }) => {
    // Host creates room
    await page.goto('/');
    await createRoomAndAddPlayers(page, ['ALICE', 'BOB']);
    const roomCode = await getRoomCode(page);

    // Viewer joins
    const viewer = await context.newPage();
    await viewer.goto(`/?room=${roomCode}`);
    await viewer.waitForSelector('#screen-lobby', { timeout: 15000 });

    // Should see spectator label
    await expect(viewer.locator('#viewer-label')).toBeVisible();
    const viewerText = await viewer.locator('#viewer-label').textContent();
    expect(viewerText.toUpperCase()).toContain('SPECTATOR');
  });

  test('viewer does not see host controls', async ({ page, context }) => {
    await page.goto('/');
    await createRoomAndAddPlayers(page, ['ALICE', 'BOB']);
    const roomCode = await getRoomCode(page);

    const viewer = await context.newPage();
    await viewer.goto(`/?room=${roomCode}`);
    await viewer.waitForSelector('#screen-lobby', { timeout: 15000 });

    // Host controls should be hidden
    await expect(viewer.locator('#host-controls')).toBeHidden();
    await expect(viewer.locator('#start-section')).toBeHidden();
  });

  test('viewer auto-navigated to dashboard when game starts', async ({ page, context }) => {
    await page.goto('/');
    await createRoomAndAddPlayers(page, ['ALICE', 'BOB']);
    const roomCode = await getRoomCode(page);

    // Viewer joins lobby
    const viewer = await context.newPage();
    await viewer.goto(`/?room=${roomCode}`);
    await viewer.waitForSelector('#screen-lobby', { timeout: 15000 });

    // Host starts a game
    await navigateToGameSelect(page);
    await selectAndStartGame(page, 'flip7', { targetScore: 200 });

    // Viewer should auto-navigate to dashboard
    await viewer.waitForSelector('#screen-dashboard', { timeout: 15000 });
    await expectOnScreen(viewer, 'dashboard');
  });

  test('viewer sees live score updates', async ({ page, context }) => {
    await page.goto('/');
    await createRoomAndAddPlayers(page, ['ALICE', 'BOB']);
    const roomCode = await getRoomCode(page);

    // Viewer joins
    const viewer = await context.newPage();
    await viewer.goto(`/?room=${roomCode}`);
    await viewer.waitForSelector('#screen-lobby', { timeout: 15000 });

    // Host starts game
    await navigateToGameSelect(page);
    await selectAndStartGame(page, 'flip7', { targetScore: 200 });

    // Wait for viewer to reach dashboard
    await viewer.waitForSelector('#screen-dashboard', { timeout: 15000 });

    // Host submits a round
    await submitFlip7Round(page, [{ points: 50 }, { points: 30 }]);

    // Viewer should see updated scores
    await viewer.waitForFunction(
      () => {
        const text = document.querySelector('#screen-dashboard')?.textContent || '';
        return text.includes('50') && text.includes('30');
      },
      { timeout: 10000 }
    );
  });
});
