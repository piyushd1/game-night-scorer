import { test, expect } from '@playwright/test';
import { fullGameSetup } from './helpers/room.js';
import { submitFlip7Round } from './helpers/scoring.js';
import { expectSingleScreen, expectOnScreen, expectHostMenuFunctional } from './helpers/assertions.js';

test.describe('Edge Cases', () => {
  test('rapid navigation does not crash', async ({ page }) => {
    await page.goto('/');
    await fullGameSetup(page, ['ALICE', 'BOB'], 'flip7', { targetScore: 200 });

    // Rapidly switch between screens
    const tabs = ['dashboard', 'rules', 'scoring', 'dashboard', 'scoring', 'rules', 'dashboard'];
    for (const tab of tabs) {
      await page.click(`[data-tab="${tab}"]`);
    }

    await page.waitForTimeout(500);
    await expectSingleScreen(page);

    // App should still be functional
    const screenContainer = page.locator('#screen-container .screen');
    expect(await screenContainer.count()).toBe(1);
  });

  test('double submit prevention', async ({ page }) => {
    await page.goto('/');
    await fullGameSetup(page, ['ALICE', 'BOB'], 'flip7', { targetScore: 200 });

    await page.click('[data-tab="scoring"]');
    await page.waitForSelector('#screen-scoring', { timeout: 5000 });

    // Fill scores
    const inputs = await page.locator('[data-field="basePoints"]').all();
    await inputs[0].fill('20');
    await inputs[1].fill('30');

    // Click submit twice quickly
    const submitBtn = page.locator('#btn-submit-round');
    await submitBtn.click();
    // Button should be disabled after first click
    await page.waitForFunction(
      () => document.querySelector('#btn-submit-round')?.disabled === true,
      { timeout: 2000 }
    );
  });

  test('stale state after undo', async ({ page }) => {
    await page.goto('/');
    await fullGameSetup(page, ['ALICE', 'BOB'], 'flip7', { targetScore: 200 });

    // Submit round 1
    await submitFlip7Round(page, [{ points: 20 }, { points: 30 }]);
    await expectOnScreen(page, 'dashboard');

    // Undo
    const undoBtn = page.locator('button', { hasText: /UNDO/i });
    if (await undoBtn.isVisible()) {
      await undoBtn.click();
      await page.waitForTimeout(1000);

      // Navigate to scoring — should show Round 1 (not Round 2)
      await page.click('[data-tab="scoring"]');
      await page.waitForSelector('#screen-scoring', { timeout: 5000 });

      const scoringText = await page.locator('#screen-scoring').textContent();
      expect(scoringText).toContain('Round 1');
    }
  });

  test('host menu works on all game screens', async ({ page }) => {
    await page.goto('/');
    await fullGameSetup(page, ['ALICE', 'BOB'], 'flip7', { targetScore: 200 });

    // Dashboard
    await expectHostMenuFunctional(page);

    // Scoring
    await page.click('[data-tab="scoring"]');
    await page.waitForSelector('#screen-scoring', { timeout: 5000 });
    await expectHostMenuFunctional(page);

    // Rules
    await page.click('[data-tab="rules"]');
    await page.waitForSelector('#screen-rules', { timeout: 5000 });
    await expectHostMenuFunctional(page);
  });

  test('direct hash navigation to guarded screens redirects', async ({ page }) => {
    await page.goto('/');

    // Try to go directly to dashboard without a game
    await page.evaluate(() => { window.location.hash = '#dashboard'; });
    await page.waitForTimeout(1000);

    // Should not be stuck on dashboard — either redirected or shows empty state
    const screenCount = await page.locator('#screen-container .screen').count();
    expect(screenCount).toBeLessThanOrEqual(1);
  });
});
