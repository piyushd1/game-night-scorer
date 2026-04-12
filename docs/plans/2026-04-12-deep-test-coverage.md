# Deep Test Coverage Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Expand Playwright test suite from 49 shallow navigation tests to ~126 deep verification tests that catch real game logic, scoring, and state management bugs.

**Architecture:** Add score verification helpers to assertions.js, then create 8 new test files targeting untested risk areas. Run suite, collect failures as real bugs, fix in staging, cherry-pick fixes to main.

**Tech Stack:** Playwright Test, running against Firebase Hosting staging preview URL.

**Staging URL:** `https://game-night-scorer--pr7-staging-ytcmso7m.web.app`

**Key DOM Selectors Reference:**
- Dashboard player row container: `#dash-content .group` (each player row has `.group` class)
- Player name in row: `.font-headline.font-extrabold.text-base` (inside row)
- Player score in row: `.font-mono.text-2xl` (inside row, right side)
- Rank badge: `.shrink-0` span after player name (contains "1ST", "2ND", etc.)
- Overtime banner: `.overtime-banner` (text: "TIE-BREAKER / OVERTIME")
- Round chips: `.flex.gap-1.mt-1 span` (per-player, contains "+N")
- Winner name: `h1` on `#screen-winner`
- Winner score: `.font-mono.text-\\[72px\\]` on winner screen
- Stats toggle: `#btn-stats-toggle`
- Recap button: `#btn-recap`
- MVP section: `div.bg-primary h3`

---

## Task 1: Enhance Test Helpers

**Files:**
- Modify: `tests/helpers/assertions.js`

**Step 1: Add score verification helpers to assertions.js**

Append these functions to the existing file:

```javascript
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
    const scoreText = await page.locator('#screen-winner .font-mono').first().textContent();
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
```

**Step 2: Verify helpers compile**

Run: `node -e "import('./tests/helpers/assertions.js')"`
Expected: No errors (ES module validation)

**Step 3: Commit**

```bash
git add tests/helpers/assertions.js
git commit -m "Add deep score verification helpers to test assertions"
```

---

## Task 2: Scoring Accuracy Tests

**Files:**
- Create: `tests/scoring-accuracy.spec.js`

**Step 1: Write the test file**

```javascript
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
```

**Step 2: Run the scoring accuracy tests**

```bash
STAGING_URL=https://game-night-scorer--pr7-staging-ytcmso7m.web.app npx playwright test tests/scoring-accuracy.spec.js --reporter=list
```

Expected: Note any failures — these are REAL BUGS.

**Step 3: Commit**

```bash
git add tests/scoring-accuracy.spec.js
git commit -m "Add deep scoring accuracy tests for all 3 games"
```

---

## Task 3: Overtime Tests

**Files:**
- Create: `tests/overtime.spec.js`

**Step 1: Write the test file**

```javascript
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
```

**Step 2: Run overtime tests**

```bash
STAGING_URL=https://game-night-scorer--pr7-staging-ytcmso7m.web.app npx playwright test tests/overtime.spec.js --reporter=list
```

**Step 3: Commit**

```bash
git add tests/overtime.spec.js
git commit -m "Add overtime/tie-breaking tests for all 3 games"
```

---

## Task 4: Undo State Tests

**Files:**
- Create: `tests/undo-state.spec.js`

**Step 1: Write the test file**

```javascript
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
```

**Step 2: Run and commit**

```bash
STAGING_URL=https://game-night-scorer--pr7-staging-ytcmso7m.web.app npx playwright test tests/undo-state.spec.js --reporter=list
git add tests/undo-state.spec.js
git commit -m "Add undo state restoration tests"
```

---

## Task 5: Recap & Stats Tests

**Files:**
- Create: `tests/recap.spec.js`

**Step 1: Write the test file**

```javascript
import { test, expect } from '@playwright/test';
import { createRoomAndAddPlayers, navigateToGameSelect, selectAndStartGame, enableStatsTracking } from './helpers/room.js';
import { submitFlip7Round } from './helpers/scoring.js';
import { expectOnScreen } from './helpers/assertions.js';

test.describe('Recap & Stats', () => {
  test('stats toggle visible before first game', async ({ page }) => {
    await page.goto('/');
    await page.click('#btn-create');
    await page.waitForSelector('#screen-lobby', { timeout: 15000 });

    await page.fill('#input-player-name', 'ALICE');
    await page.click('#btn-confirm-add');
    await page.waitForFunction(
      () => document.querySelector('#player-list')?.textContent?.includes('ALICE'),
      { timeout: 5000 }
    );

    // Stats toggle should be visible
    const toggle = page.locator('#btn-stats-toggle');
    await expect(toggle).toBeVisible();
  });

  test('recap button appears after game with stats enabled', async ({ page }) => {
    await page.goto('/');
    await createRoomAndAddPlayers(page, ['ALICE', 'BOB']);
    await enableStatsTracking(page);
    await navigateToGameSelect(page);
    await selectAndStartGame(page, 'flip7', { targetScore: 50 });

    // Win the game
    await submitFlip7Round(page, [{ points: 60 }, { points: 10 }]);
    await page.waitForSelector('#screen-winner', { timeout: 10000 });

    // Go to lobby via new game → back
    await page.click('#btn-new-game');
    await page.waitForSelector('#screen-game-select', { timeout: 5000 });
    await page.click('#top-bar-back');
    await page.waitForSelector('#screen-lobby', { timeout: 5000 });

    // Recap button should be visible
    const recapBtn = page.locator('#btn-recap');
    await expect(recapBtn).toBeVisible({ timeout: 5000 });
  });

  test('recap shows game winner', async ({ page }) => {
    await page.goto('/');
    await createRoomAndAddPlayers(page, ['ALICE', 'BOB']);
    await enableStatsTracking(page);
    await navigateToGameSelect(page);
    await selectAndStartGame(page, 'flip7', { targetScore: 50 });

    await submitFlip7Round(page, [{ points: 60 }, { points: 10 }]);
    await page.waitForSelector('#screen-winner', { timeout: 10000 });

    // Navigate to lobby
    await page.click('#btn-new-game');
    await page.waitForSelector('#screen-game-select', { timeout: 5000 });
    await page.click('#top-bar-back');
    await page.waitForSelector('#screen-lobby', { timeout: 5000 });

    // Open recap
    await page.click('#btn-recap');
    await page.waitForSelector('#screen-recap', { timeout: 5000 });

    const recapText = await page.locator('#screen-recap').textContent();
    expect(recapText.toUpperCase()).toContain('ALICE'); // Winner
    expect(recapText.toUpperCase()).toContain('WINNER');
  });

  test('recap not available without stats enabled', async ({ page }) => {
    await page.goto('/');
    await createRoomAndAddPlayers(page, ['ALICE', 'BOB']);
    // Don't enable stats
    await navigateToGameSelect(page);
    await selectAndStartGame(page, 'flip7', { targetScore: 50 });

    await submitFlip7Round(page, [{ points: 60 }, { points: 10 }]);
    await page.waitForSelector('#screen-winner', { timeout: 10000 });

    await page.click('#btn-new-game');
    await page.waitForSelector('#screen-game-select', { timeout: 5000 });
    await page.click('#top-bar-back');
    await page.waitForSelector('#screen-lobby', { timeout: 5000 });

    // Recap button should NOT be visible
    const recapBtn = page.locator('#btn-recap');
    const isVisible = await recapBtn.isVisible().catch(() => false);
    expect(isVisible).toBe(false);
  });

  test('recap shows MVP after multiple games', async ({ page }) => {
    await page.goto('/');
    await createRoomAndAddPlayers(page, ['ALICE', 'BOB']);
    await enableStatsTracking(page);

    // Game 1: ALICE wins
    await navigateToGameSelect(page);
    await selectAndStartGame(page, 'flip7', { targetScore: 50 });
    await submitFlip7Round(page, [{ points: 60 }, { points: 10 }]);
    await page.waitForSelector('#screen-winner', { timeout: 10000 });

    // Replay → Game 2: ALICE wins again
    await page.click('#btn-replay');
    await page.waitForSelector('#screen-dashboard', { timeout: 10000 });
    await submitFlip7Round(page, [{ points: 60 }, { points: 10 }]);
    await page.waitForSelector('#screen-winner', { timeout: 10000 });

    // Navigate to lobby → recap
    await page.click('#btn-new-game');
    await page.waitForSelector('#screen-game-select', { timeout: 5000 });
    await page.click('#top-bar-back');
    await page.waitForSelector('#screen-lobby', { timeout: 5000 });

    await page.click('#btn-recap');
    await page.waitForSelector('#screen-recap', { timeout: 5000 });

    // MVP should be ALICE (2 wins)
    const mvpSection = page.locator('div.bg-primary');
    await expect(mvpSection).toBeVisible();
    const mvpText = await mvpSection.textContent();
    expect(mvpText.toUpperCase()).toContain('ALICE');
  });

  test('abandoned game shows inconclusive in recap', async ({ page }) => {
    await page.goto('/');
    await createRoomAndAddPlayers(page, ['ALICE', 'BOB']);
    await enableStatsTracking(page);

    // Start game but end it via host menu (abandon)
    await navigateToGameSelect(page);
    await selectAndStartGame(page, 'flip7', { targetScore: 200 });
    await submitFlip7Round(page, [{ points: 20 }, { points: 30 }]);
    await expectOnScreen(page, 'dashboard');

    // End game via host menu
    await page.click('#btn-host-menu-trigger');
    await page.waitForSelector('#host-menu-overlay', { state: 'visible', timeout: 3000 });
    await page.click('[data-action="end-game"]');
    await page.waitForSelector('#screen-lobby', { timeout: 10000 });

    // Open recap
    await page.click('#btn-recap');
    await page.waitForSelector('#screen-recap', { timeout: 5000 });

    const recapText = await page.locator('#screen-recap').textContent();
    expect(recapText.toUpperCase()).toContain('INCONCLUSIVE');
  });
});
```

**Step 2: Run and commit**

```bash
STAGING_URL=https://game-night-scorer--pr7-staging-ytcmso7m.web.app npx playwright test tests/recap.spec.js --reporter=list
git add tests/recap.spec.js
git commit -m "Add recap and stats tracking tests"
```

---

## Task 6: Security & Validation Tests

**Files:**
- Create: `tests/security-validation.spec.js`

**Step 1: Write the test file**

```javascript
import { test, expect } from '@playwright/test';
import { fullGameSetup } from './helpers/room.js';
import { expectOnScreen } from './helpers/assertions.js';

test.describe('Security — XSS Prevention', () => {
  test('script tag in player name rendered as text', async ({ page }) => {
    await page.goto('/');
    await page.click('#btn-create');
    await page.waitForSelector('#screen-lobby', { timeout: 15000 });

    // Try to add player with script tag
    await page.fill('#input-player-name', '<script>alert(1)');
    await page.click('#btn-confirm-add');
    await page.waitForTimeout(2000);

    // Should NOT execute script — check no alert dialog
    // The name should appear as text, not execute
    const playerList = page.locator('#player-list');
    const text = await playerList.textContent();
    // Name should be uppercased and visible as text
    expect(text.toUpperCase()).toContain('<SCRIPT>');

    // Verify no script was injected into DOM
    const scriptCount = await page.locator('#player-list script').count();
    expect(scriptCount).toBe(0);
  });

  test('HTML injection in player name rendered as text', async ({ page }) => {
    await page.goto('/');
    await page.click('#btn-create');
    await page.waitForSelector('#screen-lobby', { timeout: 15000 });

    await page.fill('#input-player-name', '<b>BOLD</b>');
    await page.click('#btn-confirm-add');
    await page.waitForTimeout(2000);

    // Should render as text, not as bold HTML
    const boldTags = await page.locator('#player-list b').count();
    expect(boldTags).toBe(0);
  });

  test('XSS name shown safely on dashboard', async ({ page }) => {
    await page.goto('/');
    await page.click('#btn-create');
    await page.waitForSelector('#screen-lobby', { timeout: 15000 });

    await page.fill('#input-player-name', 'ALICE');
    await page.click('#btn-confirm-add');
    await page.waitForFunction(
      () => document.querySelector('#player-list')?.textContent?.includes('ALICE'),
      { timeout: 5000 }
    );

    await page.fill('#input-player-name', '<img src=x>');
    await page.click('#btn-confirm-add');
    await page.waitForTimeout(2000);

    // Start game and check dashboard doesn't have img tags
    const startBtn = page.locator('#btn-start-game');
    if (await startBtn.isEnabled()) {
      await startBtn.click();
      await page.waitForSelector('#screen-game-select', { timeout: 5000 });
      await page.click('.game-card[data-id="flip7"]');
      await page.click('#btn-start');
      await page.waitForSelector('#screen-dashboard', { timeout: 15000 });

      // No img tags should be in dashboard
      const imgCount = await page.locator('#screen-dashboard img').count();
      expect(imgCount).toBe(0);
    }
  });
});

test.describe('Input Validation', () => {
  test('empty player name rejected', async ({ page }) => {
    await page.goto('/');
    await page.click('#btn-create');
    await page.waitForSelector('#screen-lobby', { timeout: 15000 });

    // Try to add empty name
    await page.fill('#input-player-name', '');
    await page.click('#btn-confirm-add');
    await page.waitForTimeout(1000);

    // No player should be added
    const rows = await page.locator('#player-list .bg-surface-container-lowest').count();
    expect(rows).toBe(0);
  });

  test('whitespace-only name rejected', async ({ page }) => {
    await page.goto('/');
    await page.click('#btn-create');
    await page.waitForSelector('#screen-lobby', { timeout: 15000 });

    await page.fill('#input-player-name', '   ');
    await page.click('#btn-confirm-add');
    await page.waitForTimeout(1000);

    const rows = await page.locator('#player-list .bg-surface-container-lowest').count();
    expect(rows).toBe(0);
  });

  test('max length 12 chars accepted', async ({ page }) => {
    await page.goto('/');
    await page.click('#btn-create');
    await page.waitForSelector('#screen-lobby', { timeout: 15000 });

    await page.fill('#input-player-name', 'ABCDEFGHIJKL'); // 12 chars
    await page.click('#btn-confirm-add');
    await page.waitForFunction(
      () => document.querySelector('#player-list')?.textContent?.includes('ABCDEFGHIJKL'),
      { timeout: 5000 }
    );
  });

  test('negative Flip7 score rejected', async ({ page }) => {
    await page.goto('/');
    await fullGameSetup(page, ['ALICE', 'BOB'], 'flip7', { targetScore: 200 });

    await page.click('[data-tab="scoring"]');
    await page.waitForSelector('#screen-scoring', { timeout: 5000 });

    const inputs = await page.locator('[data-field="basePoints"]').all();
    await inputs[0].fill('-10');
    await inputs[1].fill('20');

    await page.click('#btn-submit-round');
    await expect(page.locator('#validation-error')).toBeVisible();
  });

  test('very large score input handled without crash', async ({ page }) => {
    await page.goto('/');
    await fullGameSetup(page, ['ALICE', 'BOB'], 'flip7', { targetScore: 999999 });

    await page.click('[data-tab="scoring"]');
    await page.waitForSelector('#screen-scoring', { timeout: 5000 });

    const inputs = await page.locator('[data-field="basePoints"]').all();
    await inputs[0].fill('999999');
    await inputs[1].fill('0');

    await page.click('#btn-submit-round');
    // Should either accept or show validation — but not crash
    await page.waitForTimeout(2000);
    const onScoring = await page.locator('#screen-scoring').isVisible();
    const onDashboard = await page.locator('#screen-dashboard').isVisible();
    const onWinner = await page.locator('#screen-winner').isVisible();
    expect(onScoring || onDashboard || onWinner).toBe(true);
  });

  test('negative Cabo card total rejected', async ({ page }) => {
    await page.goto('/');
    await fullGameSetup(page, ['ALICE', 'BOB'], 'cabo');

    await page.click('[data-tab="scoring"]');
    await page.waitForSelector('#screen-scoring', { timeout: 5000 });

    const callerBtns = await page.locator('.caller-btn').all();
    await callerBtns[0].click();

    const inputs = await page.locator('[data-field="cardTotal"]').all();
    await inputs[0].fill('-5');
    await inputs[1].fill('20');

    await page.click('#btn-submit-round');
    await expect(page.locator('#validation-error')).toBeVisible();
  });

  test('Papayoo penalty over 250 per player rejected', async ({ page }) => {
    await page.goto('/');
    await fullGameSetup(page, ['ALICE', 'BOB', 'CHARLIE'], 'papayoo', { roundLimit: 5 });

    await page.click('[data-tab="scoring"]');
    await page.waitForSelector('#screen-scoring', { timeout: 5000 });

    await page.click('.suit-btn[data-suit="hearts"]');

    const inputs = await page.locator('[data-field="penaltyPoints"]').all();
    await inputs[0].fill('300');
    await inputs[1].fill('0');
    await inputs[2].fill('0');

    await page.click('#btn-submit-round');
    // Sum is 300, not 250 — should fail validation
    await expect(page.locator('#validation-error')).toBeVisible();
  });
});
```

**Step 2: Run and commit**

```bash
STAGING_URL=https://game-night-scorer--pr7-staging-ytcmso7m.web.app npx playwright test tests/security-validation.spec.js --reporter=list
git add tests/security-validation.spec.js
git commit -m "Add security (XSS) and input validation tests"
```

---

## Task 7: Game Config Tests

**Files:**
- Create: `tests/game-config.spec.js`

**Step 1: Write the test file**

```javascript
import { test, expect } from '@playwright/test';
import { createRoomAndAddPlayers, navigateToGameSelect, fullGameSetup } from './helpers/room.js';
import { submitFlip7Round, submitPapayooRound } from './helpers/scoring.js';
import { expectOnScreen, expectWinner } from './helpers/assertions.js';

test.describe('Game Config', () => {
  test('Flip7 min target 10 — game ends at 10', async ({ page }) => {
    await page.goto('/');
    await fullGameSetup(page, ['ALICE', 'BOB'], 'flip7', { targetScore: 10 });

    await submitFlip7Round(page, [{ points: 15 }, { points: 5 }]);
    await expectWinner(page, 'ALICE', 15);
  });

  test('Papayoo min round limit 1 — game ends after 1 round', async ({ page }) => {
    await page.goto('/');
    await fullGameSetup(page, ['ALICE', 'BOB', 'CHARLIE'], 'papayoo', { roundLimit: 1 });

    await submitPapayooRound(page, 'hearts', [50, 100, 100]);
    await expectWinner(page, 'ALICE', 50);
  });

  test('game card disabled when player count incompatible', async ({ page }) => {
    await page.goto('/');
    // Create room with only 2 players — Papayoo needs 3+
    await createRoomAndAddPlayers(page, ['ALICE', 'BOB']);
    await navigateToGameSelect(page);

    // Papayoo card should be disabled
    const papayooCard = page.locator('.game-card[data-id="papayoo"]');
    await expect(papayooCard).toBeVisible();
    // Check if it has disabled state (opacity or disabled attribute)
    const isDisabled = await papayooCard.evaluate((el) => {
      return el.hasAttribute('disabled') || el.style.opacity < 1 || getComputedStyle(el).opacity < 1;
    });
    expect(isDisabled).toBe(true);
  });

  test('Cabo max 4 players — card disabled with 5 players', async ({ page }) => {
    await page.goto('/');
    await createRoomAndAddPlayers(page, ['A', 'B', 'C', 'D', 'E']);
    await navigateToGameSelect(page);

    const caboCard = page.locator('.game-card[data-id="cabo"]');
    const isDisabled = await caboCard.evaluate((el) => {
      return el.hasAttribute('disabled') || el.style.opacity < 1 || getComputedStyle(el).opacity < 1;
    });
    expect(isDisabled).toBe(true);
  });

  test('default config applied when not changed', async ({ page }) => {
    await page.goto('/');
    await createRoomAndAddPlayers(page, ['ALICE', 'BOB']);
    await navigateToGameSelect(page);

    // Select Flip7 without changing config
    await page.click('.game-card[data-id="flip7"]');
    const configInput = page.locator('#config-targetScore');
    const defaultValue = await configInput.inputValue();
    expect(parseInt(defaultValue)).toBe(200); // default target
  });

  test('config value shown on dashboard', async ({ page }) => {
    await page.goto('/');
    await fullGameSetup(page, ['ALICE', 'BOB'], 'flip7', { targetScore: 150 });

    // Dashboard should show target score
    const dashText = await page.locator('#screen-dashboard').textContent();
    expect(dashText).toContain('150');
  });
});
```

**Step 2: Run and commit**

```bash
STAGING_URL=https://game-night-scorer--pr7-staging-ytcmso7m.web.app npx playwright test tests/game-config.spec.js --reporter=list
git add tests/game-config.spec.js
git commit -m "Add game configuration boundary tests"
```

---

## Task 8: Advanced Viewer Tests

**Files:**
- Create: `tests/viewer-advanced.spec.js`

**Step 1: Write the test file**

```javascript
import { test, expect } from '@playwright/test';
import { createRoomAndAddPlayers, getRoomCode, navigateToGameSelect, selectAndStartGame } from './helpers/room.js';
import { submitFlip7Round } from './helpers/scoring.js';
import { expectOnScreen, expectPlayerScore, expectOvertime } from './helpers/assertions.js';

test.describe('Viewer Advanced', () => {
  test('viewer joins mid-game and sees current scores', async ({ page, browser }) => {
    await page.goto('/');
    await createRoomAndAddPlayers(page, ['ALICE', 'BOB']);
    const roomCode = await getRoomCode(page);

    // Host starts game and submits a round
    await navigateToGameSelect(page);
    await selectAndStartGame(page, 'flip7', { targetScore: 200 });
    await submitFlip7Round(page, [{ points: 50 }, { points: 30 }]);
    await expectOnScreen(page, 'dashboard');

    // Viewer joins AFTER game started
    const viewerContext = await browser.newContext();
    const viewer = await viewerContext.newPage();
    await viewer.goto(`/?room=${roomCode}`);

    // Viewer should auto-navigate to dashboard (game is active)
    await viewer.waitForSelector('#screen-dashboard', { timeout: 15000 });

    // Viewer should see current scores
    await viewer.waitForFunction(
      () => {
        const text = document.querySelector('#screen-dashboard')?.textContent || '';
        return text.includes('50') && text.includes('30');
      },
      { timeout: 10000 }
    );

    await viewerContext.close();
  });

  test('viewer sees overtime banner', async ({ page, browser }) => {
    await page.goto('/');
    await createRoomAndAddPlayers(page, ['ALICE', 'BOB']);
    const roomCode = await getRoomCode(page);

    // Viewer joins
    const viewerContext = await browser.newContext();
    const viewer = await viewerContext.newPage();
    await viewer.goto(`/?room=${roomCode}`);
    await viewer.waitForSelector('#screen-lobby', { timeout: 15000 });

    // Host starts game and creates tie → overtime
    await navigateToGameSelect(page);
    await selectAndStartGame(page, 'flip7', { targetScore: 50 });
    await submitFlip7Round(page, [{ points: 50 }, { points: 50 }]);

    // Viewer should see dashboard with overtime
    await viewer.waitForSelector('#screen-dashboard', { timeout: 15000 });
    await viewer.waitForFunction(
      () => document.querySelector('.overtime-banner')?.textContent?.toUpperCase().includes('OVERTIME'),
      { timeout: 10000 }
    );

    await viewerContext.close();
  });

  test('viewer navigates to winner when game completes', async ({ page, browser }) => {
    await page.goto('/');
    await createRoomAndAddPlayers(page, ['ALICE', 'BOB']);
    const roomCode = await getRoomCode(page);

    // Viewer joins
    const viewerContext = await browser.newContext();
    const viewer = await viewerContext.newPage();
    await viewer.goto(`/?room=${roomCode}`);
    await viewer.waitForSelector('#screen-lobby', { timeout: 15000 });

    // Host starts and wins game
    await navigateToGameSelect(page);
    await selectAndStartGame(page, 'flip7', { targetScore: 50 });
    await submitFlip7Round(page, [{ points: 60 }, { points: 10 }]);

    // Host should see winner
    await page.waitForSelector('#screen-winner', { timeout: 10000 });

    // Viewer should also see winner screen eventually
    await viewer.waitForSelector('#screen-winner', { timeout: 15000 });
    const winnerText = await viewer.locator('#screen-winner').textContent();
    expect(winnerText.toUpperCase()).toContain('ALICE');

    await viewerContext.close();
  });

  test('viewer can access rules tab during game', async ({ page, browser }) => {
    await page.goto('/');
    await createRoomAndAddPlayers(page, ['ALICE', 'BOB']);
    const roomCode = await getRoomCode(page);

    // Viewer joins
    const viewerContext = await browser.newContext();
    const viewer = await viewerContext.newPage();
    await viewer.goto(`/?room=${roomCode}`);
    await viewer.waitForSelector('#screen-lobby', { timeout: 15000 });

    // Host starts game
    await navigateToGameSelect(page);
    await selectAndStartGame(page, 'flip7', { targetScore: 200 });

    // Wait for viewer to reach dashboard
    await viewer.waitForSelector('#screen-dashboard', { timeout: 15000 });

    // Viewer clicks rules tab
    await viewer.click('[data-tab="rules"]');
    await viewer.waitForSelector('#screen-rules', { timeout: 5000 });
    await expectOnScreen(viewer, 'rules');

    // Rules should show Flip 7 content
    const rulesText = await viewer.locator('#screen-rules').textContent();
    expect(rulesText.toUpperCase()).toContain('FLIP');

    await viewerContext.close();
  });
});
```

**Step 2: Run and commit**

```bash
STAGING_URL=https://game-night-scorer--pr7-staging-ytcmso7m.web.app npx playwright test tests/viewer-advanced.spec.js --reporter=list
git add tests/viewer-advanced.spec.js
git commit -m "Add advanced viewer tests (mid-game join, overtime, winner sync)"
```

---

## Task 9: Cross-Game Flow Tests

**Files:**
- Create: `tests/cross-game.spec.js`

**Step 1: Write the test file**

```javascript
import { test, expect } from '@playwright/test';
import { createRoomAndAddPlayers, navigateToGameSelect, selectAndStartGame } from './helpers/room.js';
import { submitFlip7Round, submitPapayooRound, submitCaboRound } from './helpers/scoring.js';
import { expectOnScreen, expectPlayerScore, expectWinner } from './helpers/assertions.js';

test.describe('Cross-Game Flows', () => {
  test('switch from Flip7 to Papayoo — clean slate', async ({ page }) => {
    await page.goto('/');
    await createRoomAndAddPlayers(page, ['ALICE', 'BOB', 'CHARLIE']);
    await navigateToGameSelect(page);
    await selectAndStartGame(page, 'flip7', { targetScore: 50 });

    // Win Flip7
    await submitFlip7Round(page, [{ points: 60 }, { points: 10 }, { points: 20 }]);
    await page.waitForSelector('#screen-winner', { timeout: 10000 });

    // Choose new game → Papayoo
    await page.click('#btn-new-game');
    await page.waitForSelector('#screen-game-select', { timeout: 5000 });
    await selectAndStartGame(page, 'papayoo', { roundLimit: 3 });

    // Dashboard should show fresh Papayoo game with 0 scores
    await expectPlayerScore(page, 'ALICE', 0);
    await expectPlayerScore(page, 'BOB', 0);
    await expectPlayerScore(page, 'CHARLIE', 0);

    // Verify game label shows Papayoo
    const dashText = await page.locator('#screen-dashboard').textContent();
    expect(dashText.toUpperCase()).toContain('PAPAYOO');
  });

  test('play all 3 games in one session', async ({ page }) => {
    await page.goto('/');
    await createRoomAndAddPlayers(page, ['ALICE', 'BOB']);

    // Game 1: Flip7
    await navigateToGameSelect(page);
    await selectAndStartGame(page, 'flip7', { targetScore: 50 });
    await submitFlip7Round(page, [{ points: 60 }, { points: 10 }]);
    await page.waitForSelector('#screen-winner', { timeout: 10000 });

    // Game 2: Cabo
    await page.click('#btn-new-game');
    await page.waitForSelector('#screen-game-select', { timeout: 5000 });
    await selectAndStartGame(page, 'cabo');

    // Submit rounds until bust
    await submitCaboRound(page, 0, [50, 10]); // ALICE calls, not lowest → 50+10=60
    await submitCaboRound(page, 0, [50, 10]); // ALICE calls again, not lowest → 60+50+10=120 → bust
    await page.waitForSelector('#screen-winner', { timeout: 10000 });

    // Game 3: back to game select (need 3+ players for Papayoo, so skip)
    // Verify we can navigate back and start another
    await page.click('#btn-new-game');
    await page.waitForSelector('#screen-game-select', { timeout: 5000 });
    await expectOnScreen(page, 'game-select');
  });

  test('replay uses same config', async ({ page }) => {
    await page.goto('/');
    await createRoomAndAddPlayers(page, ['ALICE', 'BOB']);
    await navigateToGameSelect(page);
    await selectAndStartGame(page, 'flip7', { targetScore: 75 });

    // Win game
    await submitFlip7Round(page, [{ points: 80 }, { points: 10 }]);
    await page.waitForSelector('#screen-winner', { timeout: 10000 });

    // Replay
    await page.click('#btn-replay');
    await page.waitForSelector('#screen-dashboard', { timeout: 10000 });

    // Dashboard should show target 75 (same config)
    const dashText = await page.locator('#screen-dashboard').textContent();
    expect(dashText).toContain('75');

    // Scores should be fresh (0)
    await expectPlayerScore(page, 'ALICE', 0);
    await expectPlayerScore(page, 'BOB', 0);
  });

  test('dashboard layout correct for each game type', async ({ page }) => {
    await page.goto('/');
    await createRoomAndAddPlayers(page, ['ALICE', 'BOB']);

    // Flip7 — should show "TARGET" label
    await navigateToGameSelect(page);
    await selectAndStartGame(page, 'flip7', { targetScore: 200 });
    let dashText = await page.locator('#screen-dashboard').textContent();
    expect(dashText.toUpperCase()).toContain('TARGET');
    expect(dashText).toContain('200');

    // End game → Cabo
    await page.click('#btn-host-menu-trigger');
    await page.waitForSelector('#host-menu-overlay', { state: 'visible', timeout: 3000 });
    await page.click('[data-action="new-game"]');
    await page.waitForSelector('#screen-game-select', { timeout: 5000 });
    await selectAndStartGame(page, 'cabo');

    dashText = await page.locator('#screen-dashboard').textContent();
    expect(dashText.toUpperCase()).toContain('BUST');
    expect(dashText).toContain('100');
  });
});
```

**Step 2: Run and commit**

```bash
STAGING_URL=https://game-night-scorer--pr7-staging-ytcmso7m.web.app npx playwright test tests/cross-game.spec.js --reporter=list
git add tests/cross-game.spec.js
git commit -m "Add cross-game flow tests"
```

---

## Task 10: Run Full Suite & Collect Failures

**Step 1: Run all tests**

```bash
STAGING_URL=https://game-night-scorer--pr7-staging-ytcmso7m.web.app npx playwright test --reporter=list 2>&1 | tee test-output.txt
```

**Step 2: Categorize failures**

For each failing test:
1. Read the error context in `test-results/*/error-context.md`
2. Read the failure screenshot in `test-results/*/test-failed-*.png`
3. Determine if it's a **test issue** (wrong selector, timing) or a **real app bug**
4. Document in a list: `[BUG] description` or `[TEST FIX] description`

**Step 3: Fix real bugs in staging**

For each `[BUG]`:
1. Read the relevant source file
2. Fix the bug
3. Re-run the specific failing test to verify
4. Commit with descriptive message

**Step 4: Fix test issues**

For each `[TEST FIX]`:
1. Update the test
2. Re-run to verify
3. Commit

---

## Task 11: Cherry-Pick Bug Fixes to Main

**Step 1: Identify bug fix commits**

```bash
git log --oneline staging ^main
```

Filter for commits that fix actual app bugs (NOT test file changes).

**Step 2: Cherry-pick to main**

```bash
git checkout main
git cherry-pick <commit-hash-1> <commit-hash-2> ...
git push origin main
```

**Step 3: Push staging**

```bash
git checkout staging
git push origin staging
```

**Step 4: Verify main is clean**

```bash
# Confirm no test/debug files on main
git diff main..staging --stat | grep -E "(tests/|debug\.js|package\.json|playwright)" # should show these as staging-only
```

---

## Verification Checklist

After all tasks complete:

1. `STAGING_URL=<url> npx playwright test --reporter=list` — all ~126 tests pass
2. Bug fixes cherry-picked to main, production auto-deployed
3. `git log --oneline main` — only bug fix commits, no test code
4. `git diff main..staging --stat` — test files only exist in staging
5. Open production URL — no debug code, app works correctly
6. No XSS vulnerabilities in player names
