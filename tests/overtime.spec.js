import { test, expect } from '@playwright/test';
import { fullGameSetup } from './helpers/room.js';
import { submitFlip7Round, submitPapayooRound, submitCaboRound } from './helpers/scoring.js';
import { expectOnScreen, expectPlayerScore, expectOvertime, expectNotOvertime, expectWinner } from './helpers/assertions.js';

test.describe('Overtime — Flip 7', () => {
  test('tied at target triggers overtime', async ({ page }) => {
    await page.goto('/');
    await fullGameSetup(page, ['ALICE', 'BOB'], 'flip7', { targetScore: 50 });

    // Both reach 50 → tied → overtime
    await submitFlip7Round(page, [{ points: 50 }, { points: 50 }]);
    await expectOnScreen(page, 'dashboard');
    await expectOvertime(page);
  });

  test('overtime round resolves tie → correct winner', async ({ page }) => {
    await page.goto('/');
    await fullGameSetup(page, ['ALICE', 'BOB'], 'flip7', { targetScore: 50 });

    // Tie at target
    await submitFlip7Round(page, [{ points: 50 }, { points: 50 }]);
    await expectOvertime(page);

    // Overtime round: ALICE scores more → wins
    await submitFlip7Round(page, [{ points: 20 }, { points: 10 }]);
    await expectWinner(page, 'ALICE', 70);
  });
});

test.describe('Overtime — Papayoo', () => {
  test('tied at round limit triggers overtime', async ({ page }) => {
    await page.goto('/');
    await fullGameSetup(page, ['ALICE', 'BOB', 'CHARLIE'], 'papayoo', { roundLimit: 2 });

    // Tied: ALICE=150, CHARLIE=150 after 2 rounds
    await submitPapayooRound(page, 'hearts', [100, 100, 50]);
    await submitPapayooRound(page, 'spades', [50, 100, 100]);
    // ALICE=150, BOB=200, CHARLIE=150 → tied lowest → overtime
    await expectOnScreen(page, 'dashboard');
    await expectOvertime(page);
  });

  test('overtime scoring tab still works', async ({ page }) => {
    await page.goto('/');
    await fullGameSetup(page, ['ALICE', 'BOB', 'CHARLIE'], 'papayoo', { roundLimit: 2 });

    // Create tie → overtime
    await submitPapayooRound(page, 'hearts', [100, 100, 50]);
    await submitPapayooRound(page, 'spades', [50, 100, 100]);
    await expectOvertime(page);

    // Should still be able to access scoring
    await page.click('[data-tab="scoring"]');
    await page.waitForSelector('#screen-scoring', { timeout: 5000 });
    await expectOnScreen(page, 'scoring');
  });

  test('overtime resolves when tie broken', async ({ page }) => {
    await page.goto('/');
    await fullGameSetup(page, ['ALICE', 'BOB', 'CHARLIE'], 'papayoo', { roundLimit: 2 });

    // Create tie
    await submitPapayooRound(page, 'hearts', [100, 100, 50]);
    await submitPapayooRound(page, 'spades', [50, 100, 100]);
    await expectOvertime(page);

    // Overtime round breaks tie: ALICE gets fewer penalties
    await submitPapayooRound(page, 'diamonds', [50, 100, 100]);
    // ALICE=200, BOB=300, CHARLIE=250 → ALICE wins
    await expectWinner(page, 'ALICE', 200);
  });
});

test.describe('Overtime — Cabo', () => {
  test('tied lowest when bust triggers overtime', async ({ page }) => {
    await page.goto('/');
    await fullGameSetup(page, ['ALICE', 'BOB', 'CHARLIE'], 'cabo');

    // Get CHARLIE to bust, ALICE and BOB tied
    // Round 1: CHARLIE calls, not lowest. C=50+10=60. A=20, B=20
    await submitCaboRound(page, 2, [20, 20, 50]);
    await expectPlayerScore(page, 'CHARLIE', 60);

    // Round 2: CHARLIE calls, not lowest. C=60+50+10=120 → bust!
    // A=20+10=30, B=20+10=30. Tied at 30 → overtime
    await submitCaboRound(page, 2, [10, 10, 50]);
    // Game ends because CHARLIE busted, but A and B tied → overtime
    await expectOnScreen(page, 'dashboard');
    await expectOvertime(page);
  });
});

test.describe('Overtime — Dashboard', () => {
  test('dashboard shows overtime banner text', async ({ page }) => {
    await page.goto('/');
    await fullGameSetup(page, ['ALICE', 'BOB'], 'flip7', { targetScore: 50 });

    await submitFlip7Round(page, [{ points: 50 }, { points: 50 }]);
    const banner = page.locator('.overtime-banner');
    await expect(banner).toBeVisible();
    const text = await banner.textContent();
    expect(text.toUpperCase()).toContain('TIE');
  });
});
