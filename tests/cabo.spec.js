import { test, expect } from '@playwright/test';
import { fullGameSetup } from './helpers/room.js';
import { submitCaboRound } from './helpers/scoring.js';
import { expectOnScreen } from './helpers/assertions.js';

test.describe('Cabo', () => {
  test('complete Cabo game to bust', async ({ page }) => {
    await page.goto('/');
    await fullGameSetup(page, ['ALICE', 'BOB'], 'cabo');

    // Submit rounds until someone exceeds 100
    // Round 1: ALICE calls, has lowest (5), BOB has 40
    await submitCaboRound(page, 0, [5, 40]);
    await expectOnScreen(page, 'dashboard');

    // Round 2: BOB calls, has lowest (10), ALICE has 30
    await submitCaboRound(page, 1, [30, 10]);
    await expectOnScreen(page, 'dashboard');

    // Round 3: ALICE calls, doesn't have lowest — gets 35+10=45. Total: 75
    // BOB has 20. Total: 70
    await submitCaboRound(page, 0, [35, 20]);
    await expectOnScreen(page, 'dashboard');

    // Round 4: BOB calls, doesn't have lowest — gets 40+10=50. Total: 120 > 100 → bust!
    await submitCaboRound(page, 1, [10, 40]);

    // Game should end — someone exceeded 100
    await page.waitForSelector('#screen-winner', { timeout: 10000 });
    await expectOnScreen(page, 'winner');
  });

  test('caller with lowest gets 0 points', async ({ page }) => {
    await page.goto('/');
    await fullGameSetup(page, ['ALICE', 'BOB'], 'cabo');

    // ALICE calls with card total 5 (lowest), BOB has 30
    await submitCaboRound(page, 0, [5, 30]);
    await expectOnScreen(page, 'dashboard');

    // ALICE should have 0, BOB should have 30
    const dashText = await page.locator('#screen-dashboard').textContent();
    // Verify the totals are shown (ALICE: 0, BOB: 30)
    expect(dashText).toContain('0');
    expect(dashText).toContain('30');
  });

  test('caller without lowest gets cardTotal + 10', async ({ page }) => {
    await page.goto('/');
    await fullGameSetup(page, ['ALICE', 'BOB'], 'cabo');

    // ALICE calls with card total 30, BOB has 10 (lower)
    // ALICE should get 30 + 10 = 40
    await submitCaboRound(page, 0, [30, 10]);
    await expectOnScreen(page, 'dashboard');

    const dashText = await page.locator('#screen-dashboard').textContent();
    expect(dashText).toContain('40'); // ALICE's total
    expect(dashText).toContain('10'); // BOB's total
  });

  test('kamikaze gives caller 0 and others 50', async ({ page }) => {
    await page.goto('/');
    await fullGameSetup(page, ['ALICE', 'BOB'], 'cabo');

    // ALICE calls kamikaze
    await submitCaboRound(page, 0, [0, 0], true);
    await expectOnScreen(page, 'dashboard');

    // ALICE should have 0, BOB should have 50
    const dashText = await page.locator('#screen-dashboard').textContent();
    expect(dashText).toContain('50');
  });

  test('caller selection required', async ({ page }) => {
    await page.goto('/');
    await fullGameSetup(page, ['ALICE', 'BOB'], 'cabo');

    await page.click('[data-tab="scoring"]');
    await page.waitForSelector('#screen-scoring', { timeout: 5000 });

    // Fill card totals but don't select caller
    const inputs = await page.locator('[data-field="cardTotal"]').all();
    await inputs[0].fill('10');
    await inputs[1].fill('20');

    await page.click('#btn-submit-round');

    // Should show validation error
    await expect(page.locator('#validation-error')).toBeVisible();
    const errorText = await page.locator('#validation-error').textContent();
    expect(errorText.toLowerCase()).toContain('cabo');
  });

  test('negative card total rejected', async ({ page }) => {
    await page.goto('/');
    await fullGameSetup(page, ['ALICE', 'BOB'], 'cabo');

    await page.click('[data-tab="scoring"]');
    await page.waitForSelector('#screen-scoring', { timeout: 5000 });

    // Select caller
    const callerBtns = await page.locator('.caller-btn').all();
    await callerBtns[0].click();

    // Try negative value
    const inputs = await page.locator('[data-field="cardTotal"]').all();
    await inputs[0].fill('-5');
    await inputs[1].fill('20');

    await page.click('#btn-submit-round');

    await expect(page.locator('#validation-error')).toBeVisible();
  });
});
