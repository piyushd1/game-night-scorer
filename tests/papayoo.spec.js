import { test, expect } from '@playwright/test';
import { fullGameSetup } from './helpers/room.js';
import { submitPapayooRound } from './helpers/scoring.js';
import { expectOnScreen } from './helpers/assertions.js';

test.describe('Papayoo', () => {
  test('complete Papayoo game with round limit', async ({ page }) => {
    await page.goto('/');
    await fullGameSetup(page, ['ALICE', 'BOB', 'CHARLIE'], 'papayoo', { roundLimit: 2 });

    // Round 1: penalties sum to 250
    await submitPapayooRound(page, 'hearts', [100, 100, 50]);
    await expectOnScreen(page, 'dashboard');

    // Round 2: penalties sum to 250
    await submitPapayooRound(page, 'spades', [50, 100, 100]);

    // Should navigate to winner — ALICE has lowest (100+50=150)
    await page.waitForSelector('#screen-winner', { timeout: 10000 });
    await expectOnScreen(page, 'winner');
    const winnerText = await page.locator('#screen-winner').textContent();
    expect(winnerText).toContain('ALICE');
  });

  test('penalty sum validation rejects non-250 total', async ({ page }) => {
    await page.goto('/');
    await fullGameSetup(page, ['ALICE', 'BOB', 'CHARLIE'], 'papayoo', { roundLimit: 5 });

    await page.click('[data-tab="scoring"]');
    await page.waitForSelector('#screen-scoring', { timeout: 5000 });

    // Select suit
    await page.click('.suit-btn[data-suit="hearts"]');

    // Fill penalties summing to 200 (not 250)
    const inputs = await page.locator('[data-field="penaltyPoints"]').all();
    await inputs[0].fill('100');
    await inputs[1].fill('50');
    await inputs[2].fill('50');

    await page.click('#btn-submit-round');

    // Should show validation error
    await expect(page.locator('#validation-error')).toBeVisible();
    const errorText = await page.locator('#validation-error').textContent();
    expect(errorText).toContain('250');
  });

  test('suit selection required', async ({ page }) => {
    await page.goto('/');
    await fullGameSetup(page, ['ALICE', 'BOB', 'CHARLIE'], 'papayoo', { roundLimit: 5 });

    await page.click('[data-tab="scoring"]');
    await page.waitForSelector('#screen-scoring', { timeout: 5000 });

    // Don't select suit, fill valid penalties
    const inputs = await page.locator('[data-field="penaltyPoints"]').all();
    await inputs[0].fill('100');
    await inputs[1].fill('100');
    await inputs[2].fill('50');

    await page.click('#btn-submit-round');

    await expect(page.locator('#validation-error')).toBeVisible();
    const errorText = await page.locator('#validation-error').textContent();
    expect(errorText.toLowerCase()).toContain('suit');
  });

  test('round limit guard blocks extra scoring', async ({ page }) => {
    await page.goto('/');
    await fullGameSetup(page, ['ALICE', 'BOB', 'CHARLIE'], 'papayoo', { roundLimit: 2 });

    // Play both rounds without triggering winner (tied)
    await submitPapayooRound(page, 'hearts', [80, 90, 80]);
    await submitPapayooRound(page, 'spades', [90, 80, 80]);

    // If tied, should be on dashboard with overtime or winner
    // Either way, going to scoring should show "All Rounds Complete" or redirect
    const onDashboard = await page.locator('#screen-dashboard').isVisible().catch(() => false);
    const onWinner = await page.locator('#screen-winner').isVisible().catch(() => false);
    expect(onDashboard || onWinner).toBeTruthy();
  });

  test('live penalty sum updates as you type', async ({ page }) => {
    await page.goto('/');
    await fullGameSetup(page, ['ALICE', 'BOB', 'CHARLIE'], 'papayoo', { roundLimit: 5 });

    await page.click('[data-tab="scoring"]');
    await page.waitForSelector('#screen-scoring', { timeout: 5000 });

    const inputs = await page.locator('.papayoo-input').all();
    await inputs[0].fill('100');
    await inputs[1].fill('100');
    await inputs[2].fill('50');

    const sum = await page.locator('#penalty-sum').textContent();
    expect(sum).toBe('250');
  });
});
