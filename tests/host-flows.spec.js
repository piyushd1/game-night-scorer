import { test, expect } from '@playwright/test';
import { createRoomAndAddPlayers, setHostPlayer } from './helpers/room.js';
import { expectOnScreen, waitForToast } from './helpers/assertions.js';

test.describe('Host Flows', () => {
  test('add players in lobby', async ({ page }) => {
    await page.goto('/');
    await createRoomAndAddPlayers(page, ['ALICE', 'BOB', 'CHARLIE']);

    // Verify all 3 players appear
    const playerList = page.locator('#player-list');
    await expect(playerList.locator('text=ALICE')).toBeVisible();
    await expect(playerList.locator('text=BOB')).toBeVisible();
    await expect(playerList.locator('text=CHARLIE')).toBeVisible();
  });

  test('duplicate name prevented', async ({ page }) => {
    await page.goto('/');
    await createRoomAndAddPlayers(page, ['ALICE']);

    // Try adding ALICE again
    await page.fill('#input-player-name', 'ALICE');
    await page.click('#btn-confirm-add');

    await waitForToast(page, 'Name already exists');
  });

  test('set host player shows HOST badge', async ({ page }) => {
    await page.goto('/');
    await createRoomAndAddPlayers(page, ['ALICE', 'BOB']);
    await setHostPlayer(page, 'ALICE');

    // Verify HOST badge on ALICE
    const aliceRow = page.locator('#player-list .bg-surface-container-lowest', {
      has: page.locator('text=ALICE'),
    });
    await expect(aliceRow.locator('text=HOST')).toBeVisible();
  });

  test('toggle player active/inactive', async ({ page }) => {
    await page.goto('/');
    await createRoomAndAddPlayers(page, ['ALICE', 'BOB']);

    // Toggle BOB inactive
    const bobRow = page.locator('#player-list .bg-surface-container-lowest', {
      has: page.locator('text=BOB'),
    });
    await bobRow.locator('.player-toggle').click();

    // Wait for INACTIVE label
    await page.waitForFunction(
      () => {
        const rows = document.querySelectorAll('#player-list .bg-surface-container-lowest');
        for (const r of rows) {
          if (r.textContent.includes('BOB') && r.textContent.includes('INACTIVE')) return true;
        }
        return false;
      },
      { timeout: 5000 }
    );
  });

  test('cannot deactivate host player', async ({ page }) => {
    await page.goto('/');
    await createRoomAndAddPlayers(page, ['ALICE', 'BOB']);
    await setHostPlayer(page, 'ALICE');

    // Try to deactivate ALICE
    const aliceRow = page.locator('#player-list .bg-surface-container-lowest', {
      has: page.locator('text=ALICE'),
    });
    await aliceRow.locator('.player-toggle').click();

    await waitForToast(page, 'Cannot deactivate host player');
  });

  test('remove player', async ({ page }) => {
    await page.goto('/');
    await createRoomAndAddPlayers(page, ['ALICE', 'BOB', 'CHARLIE']);

    // Remove CHARLIE
    const charlieRow = page.locator('#player-list .bg-surface-container-lowest', {
      has: page.locator('text=CHARLIE'),
    });
    await charlieRow.locator('.player-remove').click();

    // Wait for CHARLIE to disappear
    await page.waitForFunction(
      () => !document.querySelector('#player-list')?.textContent?.includes('CHARLIE'),
      { timeout: 5000 }
    );

    // Verify only 2 players remain
    const rows = await page.locator('#player-list .bg-surface-container-lowest').count();
    expect(rows).toBe(2);
  });

  test('cannot remove host player', async ({ page }) => {
    await page.goto('/');
    await createRoomAndAddPlayers(page, ['ALICE', 'BOB']);
    await setHostPlayer(page, 'ALICE');

    // Try to remove ALICE
    const aliceRow = page.locator('#player-list .bg-surface-container-lowest', {
      has: page.locator('text=ALICE'),
    });
    await aliceRow.locator('.player-remove').click();

    await waitForToast(page, 'Cannot remove host player');
  });
});
