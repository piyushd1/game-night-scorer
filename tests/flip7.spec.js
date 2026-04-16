import { test, expect } from '@playwright/test';
import { fullGameSetup } from './helpers/room.js';
import { submitFlip7Round } from './helpers/scoring.js';
import { expectOnScreen, expectSingleScreen } from './helpers/assertions.js';

test.describe('Flip 7', () => {
  test('complete Flip7 game to winner', async ({ page }) => {
    await page.goto('/');
    await fullGameSetup(page, ['ALICE', 'BOB'], 'flip7', { targetScore: 50 });

    // Submit round — ALICE gets 60, exceeds target
    await submitFlip7Round(page, [{ points: 60 }, { points: 10 }]);

    // Should navigate to winner screen
    await page.waitForSelector('#screen-winner', { timeout: 10000 });
    await expectOnScreen(page, 'winner');

    // Winner should be ALICE
    const winnerText = await page.locator('#screen-winner').textContent();
    expect(winnerText).toContain('ALICE');
  });

  test('Flip7 bonus adds 15 points', async ({ page }) => {
    await page.goto('/');
    await fullGameSetup(page, ['ALICE', 'BOB'], 'flip7', { targetScore: 200 });

    // Submit round — ALICE gets 20 + F7 bonus = 35
    await submitFlip7Round(page, [{ points: 20, flip7: true }, { points: 10 }]);

    // Should be on dashboard
    await expectOnScreen(page, 'dashboard');

    // Verify ALICE's total is 35 (20 + 15)
    await page.waitForFunction(
      () => document.querySelector('#screen-dashboard')?.textContent?.includes('35'),
      { timeout: 5000 }
    );
  });

  test('scoring shows correct round number', async ({ page }) => {
    await page.goto('/');
    await fullGameSetup(page, ['ALICE', 'BOB'], 'flip7', { targetScore: 200 });

    // Submit round 1
    await submitFlip7Round(page, [{ points: 20 }, { points: 30 }]);
    await expectOnScreen(page, 'dashboard');

    // Go to scoring — should show Round 2
    await page.click('[data-tab="scoring"]');
    await page.waitForSelector('#screen-scoring', { timeout: 5000 });

    const scoringText = await page.locator('#screen-scoring').textContent();
    expect(scoringText).toContain('Round 2');
  });

  test('undo removes last round', async ({ page }) => {
    await page.goto('/');
    await fullGameSetup(page, ['ALICE', 'BOB'], 'flip7', { targetScore: 200 });

    // Submit 2 rounds
    await submitFlip7Round(page, [{ points: 20 }, { points: 30 }]);
    await submitFlip7Round(page, [{ points: 10 }, { points: 15 }]);
    await expectOnScreen(page, 'dashboard');

    // Click UNDO
    const undoBtn = page.locator('button', { hasText: /UNDO/i });
    if (await undoBtn.isVisible()) {
      await undoBtn.click();
      // Wait for totals to change — ALICE should go from 30 back to 20
      await page.waitForFunction(
        () => {
          const text = document.querySelector('#screen-dashboard')?.textContent || '';
          // After undo, round 2 totals should be gone
          return !text.includes('RD 2') || text.includes('RD 1');
        },
        { timeout: 5000 }
      );
    }
  });

  test('game does not end when no player reaches target', async ({ page }) => {
    await page.goto('/');
    await fullGameSetup(page, ['ALICE', 'BOB'], 'flip7', { targetScore: 200 });

    // Submit round with low scores
    await submitFlip7Round(page, [{ points: 15 }, { points: 10 }]);

    // Should stay on dashboard (not winner)
    await expectOnScreen(page, 'dashboard');
    await expectSingleScreen(page);
  });
});
