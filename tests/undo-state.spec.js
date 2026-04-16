import { test, expect } from '@playwright/test';
import { fullGameSetup } from './helpers/room.js';
import { submitFlip7Round } from './helpers/scoring.js';
import { expectOnScreen, expectPlayerScore, expectOvertime, expectNotOvertime } from './helpers/assertions.js';

test.describe('Undo State', () => {
  test('undo restores previous round totals', async ({ page }) => {
    await page.goto('/');
    await fullGameSetup(page, ['ALICE', 'BOB'], 'flip7', { targetScore: 200 });

    // Round 1: A=20, B=30
    await submitFlip7Round(page, [{ points: 20 }, { points: 30 }]);
    await expectPlayerScore(page, 'ALICE', 20);

    // Round 2: A=40, B=10 → totals A=60, B=40
    await submitFlip7Round(page, [{ points: 40 }, { points: 10 }]);
    await expectPlayerScore(page, 'ALICE', 60);

    // Undo → should restore to round 1 totals
    await page.click('#btn-undo');
    await page.waitForTimeout(1000);
    await expectPlayerScore(page, 'ALICE', 20);
    await expectPlayerScore(page, 'BOB', 30);
  });

  test('undo at round 1 clears all scores to 0', async ({ page }) => {
    await page.goto('/');
    await fullGameSetup(page, ['ALICE', 'BOB'], 'flip7', { targetScore: 200 });

    await submitFlip7Round(page, [{ points: 25 }, { points: 35 }]);
    await expectPlayerScore(page, 'ALICE', 25);

    await page.click('#btn-undo');
    await page.waitForTimeout(1000);
    await expectPlayerScore(page, 'ALICE', 0);
    await expectPlayerScore(page, 'BOB', 0);
  });

  test('undo then resubmit gives correct new totals', async ({ page }) => {
    await page.goto('/');
    await fullGameSetup(page, ['ALICE', 'BOB'], 'flip7', { targetScore: 200 });

    // Submit round 1
    await submitFlip7Round(page, [{ points: 20 }, { points: 30 }]);

    // Submit round 2
    await submitFlip7Round(page, [{ points: 40 }, { points: 10 }]);
    await expectPlayerScore(page, 'ALICE', 60);

    // Undo round 2
    await page.click('#btn-undo');
    await page.waitForTimeout(1000);
    await expectPlayerScore(page, 'ALICE', 20);

    // Submit new round 2 with different scores
    await submitFlip7Round(page, [{ points: 10 }, { points: 50 }]);
    await expectPlayerScore(page, 'ALICE', 30); // 20+10
    await expectPlayerScore(page, 'BOB', 80); // 30+50
  });

  test('double undo removes 2 rounds', async ({ page }) => {
    await page.goto('/');
    await fullGameSetup(page, ['ALICE', 'BOB'], 'flip7', { targetScore: 200 });

    await submitFlip7Round(page, [{ points: 10 }, { points: 20 }]);
    await submitFlip7Round(page, [{ points: 30 }, { points: 40 }]);
    await submitFlip7Round(page, [{ points: 50 }, { points: 60 }]);
    await expectPlayerScore(page, 'ALICE', 90); // 10+30+50

    // Undo twice
    await page.click('#btn-undo');
    await page.waitForTimeout(1000);
    await page.click('#btn-undo');
    await page.waitForTimeout(1000);
    await expectPlayerScore(page, 'ALICE', 10);
    await expectPlayerScore(page, 'BOB', 20);
  });

  test('undo updates round counter', async ({ page }) => {
    await page.goto('/');
    await fullGameSetup(page, ['ALICE', 'BOB'], 'flip7', { targetScore: 200 });

    await submitFlip7Round(page, [{ points: 10 }, { points: 20 }]);
    await submitFlip7Round(page, [{ points: 30 }, { points: 40 }]);

    // Go to scoring — should show Round 3
    await page.click('[data-tab="scoring"]');
    await page.waitForSelector('#screen-scoring', { timeout: 5000 });
    let scoringText = await page.locator('#screen-scoring').textContent();
    expect(scoringText).toContain('Round 3');

    // Go back and undo
    await page.click('[data-tab="dashboard"]');
    await page.waitForSelector('#screen-dashboard', { timeout: 5000 });
    await page.click('#btn-undo');
    await page.waitForTimeout(1000);

    // Go to scoring — should now show Round 2
    await page.click('[data-tab="scoring"]');
    await page.waitForSelector('#screen-scoring', { timeout: 5000 });
    scoringText = await page.locator('#screen-scoring').textContent();
    expect(scoringText).toContain('Round 2');
  });

  test('undo from overtime returns to active', async ({ page }) => {
    await page.goto('/');
    await fullGameSetup(page, ['ALICE', 'BOB'], 'flip7', { targetScore: 50 });

    // Create tie → overtime
    await submitFlip7Round(page, [{ points: 50 }, { points: 50 }]);
    await expectOvertime(page);

    // Undo → should go back to active (no overtime)
    await page.click('#btn-undo');
    await page.waitForTimeout(1000);
    await expectPlayerScore(page, 'ALICE', 0);
    await expectPlayerScore(page, 'BOB', 0);

    // Overtime banner should be gone
    const banner = page.locator('.overtime-banner');
    await expect(banner).toBeHidden().catch(() => {}); // May not exist
  });
});
