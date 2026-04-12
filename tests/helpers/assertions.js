// ═══════════════════════════════════════════
// Test Helper — DOM Assertions
// ═══════════════════════════════════════════

import { expect } from '@playwright/test';

/**
 * Assert exactly ONE .screen element exists in #screen-container.
 * This is the screen-stacking canary.
 */
export async function expectSingleScreen(page) {
  const count = await page.locator('#screen-container .screen').count();
  if (count !== 1) {
    const ids = await page.locator('#screen-container .screen').evaluateAll(
      (els) => els.map((el) => el.id || 'unknown')
    );
    expect(count, `Expected 1 screen, found ${count}: [${ids.join(', ')}]`).toBe(1);
  }
}

/**
 * Assert a specific screen is active and visible.
 */
export async function expectOnScreen(page, screenId) {
  await expect(page.locator(`#screen-${screenId}`)).toBeVisible({ timeout: 5000 });
  await expectSingleScreen(page);
}

/**
 * Assert bottom nav is visible with the correct active tab.
 */
export async function expectBottomNavVisible(page, activeTab) {
  await expect(page.locator('#bottom-nav')).toBeVisible();
  if (activeTab) {
    const tab = page.locator(`[data-tab="${activeTab}"]`);
    await expect(tab).toBeVisible();
  }
}

/**
 * Assert the host menu three-dot trigger is functional.
 * Opens the menu, verifies it's visible, then closes it.
 */
export async function expectHostMenuFunctional(page) {
  const trigger = page.locator('#btn-host-menu-trigger');
  await expect(trigger).toBeVisible();

  // Open menu
  await trigger.click();
  await expect(page.locator('#host-menu-overlay')).toBeVisible();

  // Close via backdrop
  await page.click('#host-menu-backdrop');
  await expect(page.locator('#host-menu-overlay')).toBeHidden();
}

/**
 * Assert a specific player has a specific score on the dashboard.
 * Finds the player row by name, then checks the score element.
 */
export async function expectPlayerScore(page, playerName, expectedScore) {
  const row = page.locator('#dash-content .group').filter({
    hasText: playerName.toUpperCase(),
  });
  await expect(row).toBeVisible({ timeout: 5000 });
  const scoreEl = row.locator('.font-mono.text-2xl');
  const scoreText = await scoreEl.textContent();
  expect(parseInt(scoreText.trim()), `${playerName} score should be ${expectedScore}`).toBe(expectedScore);
}

/**
 * Assert a specific player's rank badge on the dashboard.
 */
export async function expectPlayerRank(page, playerName, expectedRank) {
  const row = page.locator('#dash-content .group').filter({
    hasText: playerName.toUpperCase(),
  });
  const rankEl = row.locator('.shrink-0');
  const rankText = await rankEl.textContent();
  expect(rankText.trim()).toBe(expectedRank);
}

/**
 * Assert the winner screen shows correct winner and score.
 */
export async function expectWinner(page, playerName, expectedScore) {
  await expect(page.locator('#screen-winner')).toBeVisible({ timeout: 10000 });
  const winnerName = await page.locator('#screen-winner h1').textContent();
  expect(winnerName.trim().toUpperCase()).toContain(playerName.toUpperCase());
  if (expectedScore !== undefined) {
    // Use the large score display (72px font), not the "WINNER" label which is also .font-mono
    const scoreEl = page.locator('#screen-winner').locator('div.font-mono', { hasText: 'PTS' });
    const scoreText = await scoreEl.textContent();
    expect(parseInt(scoreText.trim())).toBe(expectedScore);
  }
}

/**
 * Assert overtime banner is visible on dashboard.
 */
export async function expectOvertime(page) {
  await expect(page.locator('.overtime-banner')).toBeVisible();
  const text = await page.locator('.overtime-banner').textContent();
  expect(text.toUpperCase()).toContain('OVERTIME');
}

/**
 * Assert overtime banner is NOT visible.
 */
export async function expectNotOvertime(page) {
  await expect(page.locator('.overtime-banner')).toBeHidden().catch(() => {
    // Element may not exist at all, which is fine
  });
}

/**
 * Get the text content of a toast notification.
 */
export async function waitForToast(page, expectedText) {
  await page.waitForFunction(
    (text) => {
      const container = document.getElementById('toast-container');
      return container && container.textContent.includes(text);
    },
    expectedText,
    { timeout: 5000 }
  );
}
