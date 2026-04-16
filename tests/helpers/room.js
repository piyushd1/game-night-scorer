// ═══════════════════════════════════════════
// Test Helper — Room & Player Management
// ═══════════════════════════════════════════

import { expect } from '@playwright/test';

/**
 * Create a room and add players.
 * Returns { roomCode }.
 */
export async function createRoomAndAddPlayers(page, playerNames = ['ALICE', 'BOB']) {
  // Click CREATE SESSION
  await page.click('#btn-create');
  // Wait for lobby screen
  await page.waitForSelector('#screen-lobby', { timeout: 15000 });

  const roomCode = await getRoomCode(page);

  // Wait for the add-player input to be ready before interacting
  await page.waitForSelector('#input-player-name', { state: 'visible', timeout: 5000 });

  // Add each player
  for (let i = 0; i < playerNames.length; i++) {
    // Ensure input is clear and ready
    await page.locator('#input-player-name').click();
    await page.fill('#input-player-name', playerNames[i]);
    await page.click('#btn-confirm-add');
    // Wait for the player row count to reach i+1 (robust, no text matching issues)
    await page.waitForFunction(
      (expected) => document.querySelectorAll('#player-list .bg-surface-container-lowest').length >= expected,
      i + 1,
      { timeout: 15000 }
    );
    // Brief pause for Firebase sync between rapid adds
    if (i < playerNames.length - 1) {
      await page.waitForTimeout(300);
    }
  }

  return { roomCode };
}

/**
 * Read the room code from the lobby screen.
 */
export async function getRoomCode(page) {
  const el = await page.waitForSelector('.font-mono.text-3xl', { timeout: 5000 });
  return (await el.textContent()).trim();
}

/**
 * Set a player as the host player by clicking the person icon.
 */
export async function setHostPlayer(page, playerName) {
  // Find the player row containing the name, then click the person icon
  const row = page.locator('#player-list .bg-surface-container-lowest', {
    has: page.locator(`text=${playerName.toUpperCase()}`),
  });
  await row.locator('.player-set-host').click();
  // Wait for HOST badge
  await page.waitForFunction(
    (n) => {
      const rows = document.querySelectorAll('#player-list .bg-surface-container-lowest');
      for (const r of rows) {
        if (r.textContent.includes(n) && r.textContent.includes('HOST')) return true;
      }
      return false;
    },
    playerName.toUpperCase(),
    { timeout: 5000 }
  );
}

/**
 * Enable stats tracking toggle in lobby.
 */
export async function enableStatsTracking(page) {
  const toggle = page.locator('#btn-stats-toggle');
  if (await toggle.isVisible()) {
    await toggle.click();
  }
}

/**
 * Click CHOOSE GAME button from lobby.
 */
export async function navigateToGameSelect(page) {
  await page.click('#btn-start-game');
  await page.waitForSelector('#screen-game-select', { timeout: 5000 });
}

/**
 * Select a game and start it.
 * @param {string} gameId - 'flip7', 'papayoo', or 'cabo'
 * @param {Object} config - e.g. { targetScore: 50 } or { roundLimit: 2 }
 */
export async function selectAndStartGame(page, gameId, config = {}) {
  // Click the game card
  await page.click(`.game-card[data-id="${gameId}"]`);

  // Fill config fields if any
  for (const [key, value] of Object.entries(config)) {
    const input = page.locator(`#config-${key}`);
    if (await input.isVisible()) {
      await input.fill(String(value));
    }
  }

  // Click start button
  await page.click('#btn-start');
  // Wait for dashboard
  await page.waitForSelector('#screen-dashboard', { timeout: 15000 });
}

/**
 * Full setup: create room, add players, select game, start.
 * Returns { roomCode }.
 */
export async function fullGameSetup(page, playerNames, gameId, config = {}) {
  const { roomCode } = await createRoomAndAddPlayers(page, playerNames);
  await navigateToGameSelect(page);
  await selectAndStartGame(page, gameId, config);
  return { roomCode };
}
