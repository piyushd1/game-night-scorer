import { test, expect } from '@playwright/test';
import { createRoomAndAddPlayers, getRoomCode } from './helpers/room.js';
import { expectOnScreen } from './helpers/assertions.js';

test.describe('Navigation', () => {
  test('home screen loads with create and join buttons', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#btn-create')).toBeVisible();
    await expect(page.locator('#btn-join')).toBeVisible();
    await expect(page.locator('#input-pin')).toBeVisible();
  });

  test('create room navigates to lobby', async ({ page }) => {
    await page.goto('/');
    await page.click('#btn-create');
    await page.waitForSelector('#screen-lobby', { timeout: 15000 });
    await expectOnScreen(page, 'lobby');
    // Room code should be displayed
    const code = await getRoomCode(page);
    expect(code.length).toBe(6);
  });

  test('join via PIN navigates to lobby', async ({ page, context }) => {
    // Host creates room
    await page.goto('/');
    await page.click('#btn-create');
    await page.waitForSelector('#screen-lobby', { timeout: 15000 });
    const roomCode = await getRoomCode(page);

    // Viewer joins via PIN in a new page
    const viewerPage = await context.newPage();
    await viewerPage.goto('/');
    await viewerPage.fill('#input-pin', roomCode);
    await viewerPage.click('#btn-join');
    await viewerPage.waitForSelector('#screen-lobby', { timeout: 15000 });
    await expectOnScreen(viewerPage, 'lobby');
  });

  test('join via URL param navigates to lobby', async ({ page, context }) => {
    // Host creates room
    await page.goto('/');
    await page.click('#btn-create');
    await page.waitForSelector('#screen-lobby', { timeout: 15000 });
    const roomCode = await getRoomCode(page);

    // Viewer joins via URL
    const viewerPage = await context.newPage();
    await viewerPage.goto(`/?room=${roomCode}`);
    await viewerPage.waitForSelector('#screen-lobby', { timeout: 15000 });
    await expectOnScreen(viewerPage, 'lobby');
  });

  test('back navigation returns to previous screen', async ({ page }) => {
    await page.goto('/');
    const { roomCode } = await createRoomAndAddPlayers(page, ['ALICE', 'BOB']);
    await expectOnScreen(page, 'lobby');

    // Navigate to game select
    await page.click('#btn-start-game');
    await page.waitForSelector('#screen-game-select', { timeout: 5000 });
    await expectOnScreen(page, 'game-select');

    // Click back
    await page.click('#top-bar-back');
    await page.waitForSelector('#screen-lobby', { timeout: 5000 });
    await expectOnScreen(page, 'lobby');
  });

  test('invalid room code shows error toast', async ({ page }) => {
    await page.goto('/');
    await page.fill('#input-pin', 'ZZZZZZ');
    await page.click('#btn-join');
    // Should show "Room not found" toast
    await page.waitForFunction(
      () => document.getElementById('toast-container')?.textContent?.includes('Room not found'),
      { timeout: 5000 }
    );
  });

  test('short PIN shows validation error', async ({ page }) => {
    await page.goto('/');
    await page.fill('#input-pin', 'AB');
    await page.click('#btn-join');
    await page.waitForFunction(
      () => document.getElementById('toast-container')?.textContent?.includes('valid room PIN'),
      { timeout: 5000 }
    );
  });

  test('hash-based routing resolves correct screen', async ({ page }) => {
    await page.goto('/');
    // Navigate to home via hash
    await page.evaluate(() => { window.location.hash = '#home'; });
    await page.waitForSelector('#screen-home', { timeout: 5000 });
    await expectOnScreen(page, 'home');
  });
});
