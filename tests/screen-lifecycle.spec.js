import { test, expect } from '@playwright/test';
import { fullGameSetup } from './helpers/room.js';
import { expectSingleScreen, expectOnScreen, expectHostMenuFunctional } from './helpers/assertions.js';

test.describe('Screen Lifecycle', () => {
  test('only one .screen element exists after every navigation', async ({ page }) => {
    await page.goto('/');
    await expectSingleScreen(page);

    // Create room + add players
    const { roomCode } = await fullGameSetup(page, ['ALICE', 'BOB'], 'flip7', { targetScore: 200 });
    await expectSingleScreen(page);

    // Navigate through game screens via bottom nav
    await page.click('[data-tab="scoring"]');
    await page.waitForSelector('#screen-scoring', { timeout: 5000 });
    await expectSingleScreen(page);

    await page.click('[data-tab="rules"]');
    await page.waitForSelector('#screen-rules', { timeout: 5000 });
    await expectSingleScreen(page);

    await page.click('[data-tab="dashboard"]');
    await page.waitForSelector('#screen-dashboard', { timeout: 5000 });
    await expectSingleScreen(page);
  });

  test('rapid tab switching does not stack screens', async ({ page }) => {
    await page.goto('/');
    await fullGameSetup(page, ['ALICE', 'BOB'], 'flip7', { targetScore: 200 });

    // Rapidly switch tabs 10 times
    for (let i = 0; i < 10; i++) {
      const tabs = ['dashboard', 'rules', 'scoring'];
      const tab = tabs[i % 3];
      await page.click(`[data-tab="${tab}"]`);
    }

    // Wait a moment for everything to settle
    await page.waitForTimeout(500);
    await expectSingleScreen(page);
  });

  test('router debounce prevents double render', async ({ page }) => {
    await page.goto('/');
    await fullGameSetup(page, ['ALICE', 'BOB'], 'flip7', { targetScore: 200 });

    // Trigger double navigation via JS
    await page.evaluate(() => {
      window.location.hash = '#dashboard';
      window.location.hash = '#dashboard';
    });

    await page.waitForTimeout(200);
    await expectSingleScreen(page);
  });

  test('host menu overlay survives screen transitions', async ({ page }) => {
    await page.goto('/');
    await fullGameSetup(page, ['ALICE', 'BOB'], 'flip7', { targetScore: 200 });

    // Verify host menu works on dashboard
    await expectHostMenuFunctional(page);

    // Navigate to scoring
    await page.click('[data-tab="scoring"]');
    await page.waitForSelector('#screen-scoring', { timeout: 5000 });

    // Verify host menu still works
    await expectHostMenuFunctional(page);

    // Navigate to rules
    await page.click('[data-tab="rules"]');
    await page.waitForSelector('#screen-rules', { timeout: 5000 });

    // Verify host menu still works
    await expectHostMenuFunctional(page);
  });

  test('finished game redirects scoring to winner/dashboard', async ({ page }) => {
    await page.goto('/');
    await fullGameSetup(page, ['ALICE', 'BOB'], 'flip7', { targetScore: 50 });

    // Submit a round that ends the game (one player hits 50+)
    await page.click('[data-tab="scoring"]');
    await page.waitForSelector('#screen-scoring', { timeout: 5000 });

    const inputs = await page.locator('[data-field="basePoints"]').all();
    await inputs[0].fill('60');
    await inputs[1].fill('10');
    await page.click('#btn-submit-round');

    // Should navigate to winner
    await page.waitForSelector('#screen-winner', { timeout: 10000 });
    await expectOnScreen(page, 'winner');

    // Now try to go to scoring via hash — should redirect
    await page.evaluate(() => { window.location.hash = '#scoring'; });
    await page.waitForTimeout(1000);

    // Should NOT be on scoring (game is finished)
    const scoringVisible = await page.locator('#screen-scoring').isVisible().catch(() => false);
    expect(scoringVisible).toBeFalsy();
  });
});
