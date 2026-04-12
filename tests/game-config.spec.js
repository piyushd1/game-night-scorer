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
