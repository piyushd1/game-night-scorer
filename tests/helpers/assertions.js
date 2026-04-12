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
