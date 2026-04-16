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
