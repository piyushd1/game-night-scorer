// ═══════════════════════════════════════════
// Test Helper — Game Scoring
// ═══════════════════════════════════════════

/**
 * Navigate to scoring screen via bottom nav tab.
 */
export async function goToScoring(page) {
  await page.click('[data-tab="scoring"]');
  await page.waitForSelector('#screen-scoring', { timeout: 5000 });
}

/**
 * Submit a Flip 7 round.
 * @param {Object[]} scores - Array of { points: number, flip7?: boolean } in player order
 */
export async function submitFlip7Round(page, scores) {
  await goToScoring(page);

  const inputs = await page.locator('[data-field="basePoints"]').all();
  const toggles = await page.locator('.flip7-toggle').all();

  for (let i = 0; i < scores.length; i++) {
    await inputs[i].fill(String(scores[i].points));
    if (scores[i].flip7) {
      await toggles[i].click();
    }
  }

  await page.click('#btn-submit-round');
  // Wait for navigation away from scoring (to dashboard or winner)
  await page.waitForFunction(
    () => !document.querySelector('#screen-scoring') || document.querySelector('#screen-dashboard') || document.querySelector('#screen-winner'),
    { timeout: 10000 }
  );
}

/**
 * Submit a Papayoo round.
 * @param {string} suit - 'spades', 'hearts', 'diamonds', or 'clubs'
 * @param {number[]} penalties - Array of penalty points in player order (must sum to 250)
 */
export async function submitPapayooRound(page, suit, penalties) {
  await goToScoring(page);

  // Select suit
  await page.click(`.suit-btn[data-suit="${suit}"]`);

  // Fill penalties
  const inputs = await page.locator('[data-field="penaltyPoints"]').all();
  for (let i = 0; i < penalties.length; i++) {
    await inputs[i].fill(String(penalties[i]));
  }

  await page.click('#btn-submit-round');
  await page.waitForFunction(
    () => !document.querySelector('#screen-scoring') || document.querySelector('#screen-dashboard') || document.querySelector('#screen-winner'),
    { timeout: 10000 }
  );
}

/**
 * Submit a Cabo round.
 * @param {number} callerIndex - Index of the caller player (0-based)
 * @param {number[]} cardTotals - Array of card totals in player order
 * @param {boolean} kamikaze - Whether kamikaze is active
 */
export async function submitCaboRound(page, callerIndex, cardTotals, kamikaze = false) {
  await goToScoring(page);

  // Select caller
  const callerBtns = await page.locator('.caller-btn').all();
  await callerBtns[callerIndex].click();

  // Toggle kamikaze if needed
  if (kamikaze) {
    await page.click('#kamikaze-toggle');
  }

  // Fill card totals
  if (!kamikaze) {
    const inputs = await page.locator('[data-field="cardTotal"]').all();
    for (let i = 0; i < cardTotals.length; i++) {
      await inputs[i].fill(String(cardTotals[i]));
    }
  }

  await page.click('#btn-submit-round');
  await page.waitForFunction(
    () => !document.querySelector('#screen-scoring') || document.querySelector('#screen-dashboard') || document.querySelector('#screen-winner'),
    { timeout: 10000 }
  );
}
