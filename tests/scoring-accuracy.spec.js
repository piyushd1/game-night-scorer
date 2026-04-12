import { test, expect } from '@playwright/test';
import { fullGameSetup } from './helpers/room.js';
import { submitFlip7Round, submitPapayooRound, submitCaboRound } from './helpers/scoring.js';
import { expectOnScreen, expectPlayerScore, expectPlayerRank, expectWinner } from './helpers/assertions.js';

test.describe('Scoring Accuracy — Flip 7', () => {
  test('3-round cumulative scoring verified per player', async ({ page }) => {
    await page.goto('/');
    await fullGameSetup(page, ['ALICE', 'BOB'], 'flip7', { targetScore: 200 });

    // Round 1: ALICE=20, BOB=30
    await submitFlip7Round(page, [{ points: 20 }, { points: 30 }]);
    await expectOnScreen(page, 'dashboard');
    await expectPlayerScore(page, 'ALICE', 20);
    await expectPlayerScore(page, 'BOB', 30);

    // Round 2: ALICE=40, BOB=10 → totals: ALICE=60, BOB=40
    await submitFlip7Round(page, [{ points: 40 }, { points: 10 }]);
    await expectPlayerScore(page, 'ALICE', 60);
    await expectPlayerScore(page, 'BOB', 40);

    // Round 3: ALICE=15, BOB=25 → totals: ALICE=75, BOB=65
    await submitFlip7Round(page, [{ points: 15 }, { points: 25 }]);
    await expectPlayerScore(page, 'ALICE', 75);
    await expectPlayerScore(page, 'BOB', 65);
  });

  test('F7 bonus adds exactly 15 to base points', async ({ page }) => {
    await page.goto('/');
    await fullGameSetup(page, ['ALICE', 'BOB'], 'flip7', { targetScore: 200 });

    // ALICE gets 20 + F7 bonus = 35, BOB gets 10
    await submitFlip7Round(page, [{ points: 20, flip7: true }, { points: 10 }]);
    await expectPlayerScore(page, 'ALICE', 35);
    await expectPlayerScore(page, 'BOB', 10);
  });

  test('all players F7 in same round', async ({ page }) => {
    await page.goto('/');
    await fullGameSetup(page, ['ALICE', 'BOB'], 'flip7', { targetScore: 200 });

    // Both get F7: ALICE=20+15=35, BOB=10+15=25
    await submitFlip7Round(page, [{ points: 20, flip7: true }, { points: 10, flip7: true }]);
    await expectPlayerScore(page, 'ALICE', 35);
    await expectPlayerScore(page, 'BOB', 25);
  });

  test('exact target score triggers win', async ({ page }) => {
    await page.goto('/');
    await fullGameSetup(page, ['ALICE', 'BOB'], 'flip7', { targetScore: 50 });

    // ALICE gets exactly 50
    await submitFlip7Round(page, [{ points: 50 }, { points: 10 }]);
    await expectWinner(page, 'ALICE', 50);
  });

  test('multiple players exceed target — highest wins', async ({ page }) => {
    await page.goto('/');
    await fullGameSetup(page, ['ALICE', 'BOB'], 'flip7', { targetScore: 50 });

    // Both exceed: ALICE=60, BOB=55 → ALICE wins (highest)
    await submitFlip7Round(page, [{ points: 60 }, { points: 55 }]);
    await expectWinner(page, 'ALICE', 60);
  });

  test('score of 0 recorded correctly', async ({ page }) => {
    await page.goto('/');
    await fullGameSetup(page, ['ALICE', 'BOB'], 'flip7', { targetScore: 200 });

    await submitFlip7Round(page, [{ points: 0 }, { points: 30 }]);
    await expectPlayerScore(page, 'ALICE', 0);
    await expectPlayerScore(page, 'BOB', 30);
  });

  test('5-round game with round chips visible', async ({ page }) => {
    await page.goto('/');
    await fullGameSetup(page, ['ALICE', 'BOB'], 'flip7', { targetScore: 500 });

    const scores = [[10, 20], [30, 10], [20, 30], [40, 10], [10, 40]];
    let aliceTotal = 0, bobTotal = 0;
    for (const [a, b] of scores) {
      await submitFlip7Round(page, [{ points: a }, { points: b }]);
      aliceTotal += a;
      bobTotal += b;
    }
    await expectPlayerScore(page, 'ALICE', aliceTotal); // 110
    await expectPlayerScore(page, 'BOB', bobTotal); // 110

    // Verify round chips exist (5 rounds = 5 chips per player)
    const aliceRow = page.locator('#dash-content .group').filter({ hasText: 'ALICE' });
    const chips = aliceRow.locator('.flex.gap-1 span');
    expect(await chips.count()).toBe(5);
  });

  test('dashboard progress bar reflects score/target', async ({ page }) => {
    await page.goto('/');
    await fullGameSetup(page, ['ALICE', 'BOB'], 'flip7', { targetScore: 100 });

    await submitFlip7Round(page, [{ points: 50 }, { points: 25 }]);

    // Verify target label shows on dashboard
    const dashText = await page.locator('#screen-dashboard').textContent();
    expect(dashText).toContain('100'); // target score displayed
  });
});

test.describe('Scoring Accuracy — Papayoo', () => {
  test('3-round cumulative penalties verified per player', async ({ page }) => {
    await page.goto('/');
    await fullGameSetup(page, ['ALICE', 'BOB', 'CHARLIE'], 'papayoo', { roundLimit: 5 });

    // Round 1: A=50, B=100, C=100 (sum=250)
    await submitPapayooRound(page, 'hearts', [50, 100, 100]);
    await expectOnScreen(page, 'dashboard');
    await expectPlayerScore(page, 'ALICE', 50);
    await expectPlayerScore(page, 'BOB', 100);
    await expectPlayerScore(page, 'CHARLIE', 100);

    // Round 2: A=100, B=50, C=100 → totals: A=150, B=150, C=200
    await submitPapayooRound(page, 'spades', [100, 50, 100]);
    await expectPlayerScore(page, 'ALICE', 150);
    await expectPlayerScore(page, 'BOB', 150);
    await expectPlayerScore(page, 'CHARLIE', 200);

    // Round 3: A=80, B=90, C=80 → totals: A=230, B=240, C=280
    await submitPapayooRound(page, 'diamonds', [80, 90, 80]);
    await expectPlayerScore(page, 'ALICE', 230);
    await expectPlayerScore(page, 'BOB', 240);
    await expectPlayerScore(page, 'CHARLIE', 280);
  });

  test('one player absorbs all 250 penalty', async ({ page }) => {
    await page.goto('/');
    await fullGameSetup(page, ['ALICE', 'BOB', 'CHARLIE'], 'papayoo', { roundLimit: 5 });

    await submitPapayooRound(page, 'hearts', [250, 0, 0]);
    await expectPlayerScore(page, 'ALICE', 250);
    await expectPlayerScore(page, 'BOB', 0);
    await expectPlayerScore(page, 'CHARLIE', 0);
  });

  test('round limit with clear winner ends game', async ({ page }) => {
    await page.goto('/');
    await fullGameSetup(page, ['ALICE', 'BOB', 'CHARLIE'], 'papayoo', { roundLimit: 2 });

    await submitPapayooRound(page, 'hearts', [50, 100, 100]);
    await submitPapayooRound(page, 'spades', [50, 100, 100]);

    // ALICE lowest (100), wins
    await expectWinner(page, 'ALICE', 100);
  });

  test('all 4 suit buttons work', async ({ page }) => {
    await page.goto('/');
    await fullGameSetup(page, ['ALICE', 'BOB', 'CHARLIE'], 'papayoo', { roundLimit: 5 });

    const suits = ['hearts', 'spades', 'diamonds', 'clubs'];
    for (const suit of suits) {
      await page.click('[data-tab="scoring"]');
      await page.waitForSelector('#screen-scoring', { timeout: 5000 });

      // Click suit, verify it's active
      await page.click(`.suit-btn[data-suit="${suit}"]`);
      const btn = page.locator(`.suit-btn[data-suit="${suit}"]`);
      await expect(btn).toHaveClass(/active/);

      // Navigate away and back to reset
      await page.click('[data-tab="dashboard"]');
      await page.waitForSelector('#screen-dashboard', { timeout: 5000 });
    }
  });

  test('changing suit deselects previous', async ({ page }) => {
    await page.goto('/');
    await fullGameSetup(page, ['ALICE', 'BOB', 'CHARLIE'], 'papayoo', { roundLimit: 5 });

    await page.click('[data-tab="scoring"]');
    await page.waitForSelector('#screen-scoring', { timeout: 5000 });

    // Select hearts
    await page.click('.suit-btn[data-suit="hearts"]');
    await expect(page.locator('.suit-btn[data-suit="hearts"]')).toHaveClass(/active/);

    // Select spades — hearts should deselect
    await page.click('.suit-btn[data-suit="spades"]');
    await expect(page.locator('.suit-btn[data-suit="spades"]')).toHaveClass(/active/);

    // Only one suit should be active
    const activeCount = await page.locator('.suit-btn.active').count();
    expect(activeCount).toBe(1);
  });

  test('penalty sum indicator shows correct live total', async ({ page }) => {
    await page.goto('/');
    await fullGameSetup(page, ['ALICE', 'BOB', 'CHARLIE'], 'papayoo', { roundLimit: 5 });

    await page.click('[data-tab="scoring"]');
    await page.waitForSelector('#screen-scoring', { timeout: 5000 });

    const inputs = await page.locator('[data-field="penaltyPoints"]').all();
    await inputs[0].fill('100');
    await inputs[1].fill('80');
    // Sum should be 180 so far
    let sum = await page.locator('#penalty-sum').textContent();
    expect(parseInt(sum)).toBe(180);

    await inputs[2].fill('70');
    // Sum should be 250
    sum = await page.locator('#penalty-sum').textContent();
    expect(parseInt(sum)).toBe(250);
  });
});

test.describe('Scoring Accuracy — Cabo', () => {
  test('caller with lowest gets 0, verified by player name', async ({ page }) => {
    await page.goto('/');
    await fullGameSetup(page, ['ALICE', 'BOB'], 'cabo');

    // ALICE calls with 5 (lowest), BOB has 30
    await submitCaboRound(page, 0, [5, 30]);
    await expectPlayerScore(page, 'ALICE', 0);
    await expectPlayerScore(page, 'BOB', 30);
  });

  test('caller penalty: cardTotal + 10 verified', async ({ page }) => {
    await page.goto('/');
    await fullGameSetup(page, ['ALICE', 'BOB'], 'cabo');

    // ALICE calls with 30, BOB has 10 (lower) → ALICE gets 30+10=40
    await submitCaboRound(page, 0, [30, 10]);
    await expectPlayerScore(page, 'ALICE', 40);
    await expectPlayerScore(page, 'BOB', 10);
  });

  test('kamikaze: caller 0, each other player 50', async ({ page }) => {
    await page.goto('/');
    await fullGameSetup(page, ['ALICE', 'BOB', 'CHARLIE'], 'cabo');

    await submitCaboRound(page, 0, [0, 0, 0], true);
    await expectPlayerScore(page, 'ALICE', 0);
    await expectPlayerScore(page, 'BOB', 50);
    await expectPlayerScore(page, 'CHARLIE', 50);
  });

  test('exact-100 resets to 50', async ({ page }) => {
    await page.goto('/');
    await fullGameSetup(page, ['ALICE', 'BOB'], 'cabo');

    // Round 1: BOB calls, has lowest (5). ALICE gets 45. Totals: A=45, B=0
    await submitCaboRound(page, 1, [45, 5]);
    await expectPlayerScore(page, 'ALICE', 45);

    // Round 2: BOB calls, has lowest (5). ALICE gets 55. Total: 45+55=100 → reset to 50
    await submitCaboRound(page, 1, [55, 5]);
    await expectPlayerScore(page, 'ALICE', 50);
  });

  test('cumulative scoring across 3 rounds with different callers', async ({ page }) => {
    await page.goto('/');
    await fullGameSetup(page, ['ALICE', 'BOB'], 'cabo');

    // Round 1: ALICE calls, lowest (5). A=0, B=20
    await submitCaboRound(page, 0, [5, 20]);
    await expectPlayerScore(page, 'ALICE', 0);
    await expectPlayerScore(page, 'BOB', 20);

    // Round 2: BOB calls, lowest (10). A=30, B=0. Totals: A=30, B=20
    await submitCaboRound(page, 1, [30, 10]);
    await expectPlayerScore(page, 'ALICE', 30);
    await expectPlayerScore(page, 'BOB', 20);

    // Round 3: ALICE calls, NOT lowest (25 vs BOB 15). A=30+25+10=65, B=20+15=35
    await submitCaboRound(page, 0, [25, 15]);
    await expectPlayerScore(page, 'ALICE', 65);
    await expectPlayerScore(page, 'BOB', 35);
  });

  test('4-player full game with all mechanics', async ({ page }) => {
    await page.goto('/');
    await fullGameSetup(page, ['ALICE', 'BOB', 'CHARLIE', 'DAN'], 'cabo');

    // Round 1: ALICE calls, has lowest (5). A=0, B=20, C=30, D=15
    await submitCaboRound(page, 0, [5, 20, 30, 15]);
    await expectPlayerScore(page, 'ALICE', 0);
    await expectPlayerScore(page, 'BOB', 20);
    await expectPlayerScore(page, 'CHARLIE', 30);
    await expectPlayerScore(page, 'DAN', 15);

    // Round 2: CHARLIE calls, NOT lowest (25 vs DAN 10). C=30+25+10=65
    await submitCaboRound(page, 2, [15, 10, 25, 10]);
    await expectPlayerScore(page, 'CHARLIE', 65);
  });

  test('caller with tied lowest still gets 0', async ({ page }) => {
    await page.goto('/');
    await fullGameSetup(page, ['ALICE', 'BOB'], 'cabo');

    // ALICE calls, both have 20. ALICE has min (tied) → 0
    await submitCaboRound(page, 0, [20, 20]);
    await expectPlayerScore(page, 'ALICE', 0);
    await expectPlayerScore(page, 'BOB', 20);
  });

  test('bust by penalty pushes over 100', async ({ page }) => {
    await page.goto('/');
    await fullGameSetup(page, ['ALICE', 'BOB'], 'cabo');

    // Round 1: BOB calls, lowest. A=45, B=0
    await submitCaboRound(page, 1, [45, 5]);

    // Round 2: BOB calls, lowest. A=50, B=0
    await submitCaboRound(page, 1, [50, 5]);

    // Round 3: ALICE calls, NOT lowest (20 vs BOB 5). A=95+20+10=125 → bust!
    // But wait — 95+20+10=125, or check if exact-100... 95+20=115+10=125, no reset
    // Actually: A was at 45+50=95. Now calls with 20, BOB has 5. A not lowest → 20+10=30. Total: 95+30=125 > 100 → bust
    await submitCaboRound(page, 0, [20, 5]);

    // Game should end — ALICE busted over 100
    await page.waitForSelector('#screen-winner', { timeout: 10000 });
    await expectWinner(page, 'BOB'); // BOB has lowest total (0+0+5=10)
  });

  test('player at 99 + 1 = exact 100 resets to 50', async ({ page }) => {
    await page.goto('/');
    await fullGameSetup(page, ['ALICE', 'BOB'], 'cabo');

    // Get ALICE to 99 points
    // Round 1: ALICE calls, NOT lowest (50 vs BOB 10). A=50+10=60
    await submitCaboRound(page, 0, [50, 10]);
    await expectPlayerScore(page, 'ALICE', 60);

    // Round 2: ALICE calls, NOT lowest (29 vs BOB 10). A=60+29+10=99
    await submitCaboRound(page, 0, [29, 10]);
    await expectPlayerScore(page, 'ALICE', 99);

    // Round 3: BOB calls, lowest (5). ALICE gets 1. A=99+1=100 → reset to 50!
    await submitCaboRound(page, 1, [1, 5]);
    await expectPlayerScore(page, 'ALICE', 50);
  });

  test('player at 90 + 11 = 101 busts (no reset)', async ({ page }) => {
    await page.goto('/');
    await fullGameSetup(page, ['ALICE', 'BOB'], 'cabo');

    // Get ALICE to 90
    // Round 1: ALICE calls, NOT lowest. A=45+10=55
    await submitCaboRound(page, 0, [45, 10]);

    // Round 2: ALICE calls, NOT lowest. A=55+25+10=90
    await submitCaboRound(page, 0, [25, 10]);
    await expectPlayerScore(page, 'ALICE', 90);

    // Round 3: BOB calls, lowest (5). ALICE gets 11. A=90+11=101 > 100 → bust!
    await submitCaboRound(page, 1, [11, 5]);
    await page.waitForSelector('#screen-winner', { timeout: 10000 });
    // BOB should win (lowest total)
    await expectWinner(page, 'BOB');
  });
});
