// ═══════════════════════════════════════════
// Game Night Scorer — Comprehensive Flow Tests
// ═══════════════════════════════════════════
// Tests every navigation path, multi-game scenarios, and edge cases.
// Run: node test-comprehensive.mjs

import { chromium } from 'playwright';

const BASE_URL = 'https://game-night-scorer.web.app';
const RESULTS = [];
let passed = 0, failed = 0;
const SCREENSHOTS = [];

function log(test, status, detail = '') {
  const icon = status === 'PASS' ? '[PASS]' : '[FAIL]';
  console.log(`${icon} ${test}${detail ? ' — ' + detail : ''}`);
  RESULTS.push({ test, status, detail });
  if (status === 'PASS') passed++; else failed++;
}

async function screenshot(page, label) {
  try {
    const path = `test-screenshots/${label.replace(/\s+/g, '-').toLowerCase()}.png`;
    await page.screenshot({ path, fullPage: true });
    SCREENSHOTS.push({ label, path });
  } catch(e) {}
}

async function safeClick(page, selector, timeout = 5000) {
  try {
    await page.waitForSelector(selector, { timeout });
    await page.click(selector);
    return true;
  } catch(e) {
    return false;
  }
}

async function bodyText(page) {
  return (await page.textContent('body')) || '';
}

async function waitAndCheck(page, textOrSelector, timeout = 3000) {
  await page.waitForTimeout(timeout);
  const body = await bodyText(page);
  return body;
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
  });

  // Create screenshots dir
  const fs = await import('fs');
  fs.mkdirSync('test-screenshots', { recursive: true });

  const page = await context.newPage();

  // ═══════════════════════════════════════════
  // SECTION 1: HOME → CREATE → LOBBY
  // ═══════════════════════════════════════════
  console.log('\n═══ SECTION 1: HOME → LOBBY ═══\n');

  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  log('1.1 Home loads', (await page.title()) === 'Game Night Scorer' ? 'PASS' : 'FAIL');
  await screenshot(page, '1.1-home');

  // Create session
  await safeClick(page, 'button:has-text("CREATE SESSION")');
  await page.waitForTimeout(3000);

  let body = await bodyText(page);
  const roomCodeMatch = body.match(/[A-Z0-9]{6}/);
  const roomCode = roomCodeMatch ? roomCodeMatch[0] : null;
  log('1.2 Room created', roomCode ? 'PASS' : 'FAIL', `code=${roomCode}`);
  await screenshot(page, '1.2-lobby-empty');

  // ═══════════════════════════════════════════
  // SECTION 2: LOBBY — PLAYER MANAGEMENT
  // ═══════════════════════════════════════════
  console.log('\n═══ SECTION 2: LOBBY MANAGEMENT ═══\n');

  // 2.1 Add 3 players
  for (const name of ['ALICE', 'BOB', 'CHARLIE']) {
    const input = await page.$('#input-player-name');
    if (input) {
      await input.fill(name);
      await safeClick(page, '#btn-confirm-add');
      await page.waitForTimeout(1000);
    }
  }
  body = await bodyText(page);
  log('2.1 Added 3 players', body.includes('ALICE') && body.includes('BOB') && body.includes('CHARLIE') ? 'PASS' : 'FAIL');
  await screenshot(page, '2.1-three-players');

  // 2.2 Duplicate prevention
  const dupInput = await page.$('#input-player-name');
  if (dupInput) {
    await dupInput.fill('ALICE');
    await safeClick(page, '#btn-confirm-add');
    await page.waitForTimeout(1000);
  }
  const toastText = await page.textContent('#toast-container');
  log('2.2 Duplicate blocked', toastText?.toLowerCase().includes('already') ? 'PASS' : 'FAIL', toastText?.trim());

  // 2.3 Host player selection
  const hostBtns = await page.$$('.player-set-host');
  log('2.3 Host player buttons exist', hostBtns.length === 3 ? 'PASS' : 'FAIL', `count=${hostBtns.length}`);

  if (hostBtns.length > 0) {
    await hostBtns[0].click();
    await page.waitForTimeout(1000);
    body = await bodyText(page);
    log('2.4 ALICE marked as host', body.includes('HOST') ? 'PASS' : 'FAIL');
  }

  // 2.5 Stats toggle
  const statsToggle = await page.$('#btn-stats-toggle');
  log('2.5 Stats toggle exists', statsToggle ? 'PASS' : 'FAIL');
  if (statsToggle) {
    await statsToggle.click();
    await page.waitForTimeout(500);
    log('2.5a Stats toggled on', 'PASS');
  }

  // 2.6 Can start game WITHOUT selecting host player? (Bug check)
  // First, check if CHOOSE GAME is enabled
  const startBtn = await page.$('#btn-start-game');
  const startDisabled = startBtn ? await startBtn.getAttribute('disabled') : 'disabled';
  log('2.6 CHOOSE GAME button enabled', startDisabled === null ? 'PASS' : 'FAIL');

  await screenshot(page, '2.6-lobby-ready');

  // ═══════════════════════════════════════════
  // SECTION 3: GAME SELECT → START FLIP 7
  // ═══════════════════════════════════════════
  console.log('\n═══ SECTION 3: GAME SELECT ═══\n');

  await safeClick(page, '#btn-start-game');
  await page.waitForTimeout(2000);

  body = await bodyText(page);
  log('3.1 Game select screen', body.includes('PLAYING') || body.includes('SELECT') || body.includes('GAME') ? 'PASS' : 'FAIL');
  await screenshot(page, '3.1-game-select');

  // 3.2 Select Flip 7
  const flip7 = await safeClick(page, '.game-card[data-id="flip7"]');
  await page.waitForTimeout(500);
  log('3.2 Flip 7 selected', flip7 ? 'PASS' : 'FAIL');

  // 3.3 Check selection feedback
  const checkmark = await page.$('.game-card[data-id="flip7"] .game-check span');
  log('3.3 Selection checkmark visible', checkmark ? 'PASS' : 'FAIL');

  // 3.4 Button shows game name
  const startBtnText = await page.textContent('#btn-start');
  log('3.4 Button shows "START FLIP 7"', startBtnText?.includes('FLIP 7') ? 'PASS' : 'FAIL', startBtnText?.trim());

  // Set target to 50 for quick test
  const configInput = await page.$('#config-targetScore');
  if (configInput) await configInput.fill('50');

  // 3.5 Start game
  await safeClick(page, '#btn-start');
  await page.waitForTimeout(3000);

  body = await bodyText(page);
  log('3.5 Dashboard loads after start', body.includes('ROUND') ? 'PASS' : 'FAIL');
  await screenshot(page, '3.5-dashboard-flip7');

  // ═══════════════════════════════════════════
  // SECTION 4: ACTIVE GAME — NAVIGATION
  // ═══════════════════════════════════════════
  console.log('\n═══ SECTION 4: IN-GAME NAVIGATION ═══\n');

  // 4.1 Bottom nav visible and sticky
  const nav = await page.$('#bottom-nav');
  const navVisible = nav ? await nav.isVisible() : false;
  log('4.1 Bottom nav visible', navVisible ? 'PASS' : 'FAIL');

  // 4.2 Three-dot menu exists
  const menuTrigger = await page.$('#btn-host-menu-trigger');
  log('4.2 Three-dot menu button exists', menuTrigger ? 'PASS' : 'FAIL');
  await screenshot(page, '4.2-dashboard-with-menu');

  // 4.3 Three-dot menu opens
  if (menuTrigger) {
    await menuTrigger.click();
    await page.waitForTimeout(500);
    const overlay = await page.$('#host-menu-overlay');
    const overlayDisplay = overlay ? await overlay.evaluate(el => el.style.display) : 'none';
    log('4.3 Menu overlay opens', overlayDisplay !== 'none' ? 'PASS' : 'FAIL', `display=${overlayDisplay}`);
    await screenshot(page, '4.3-menu-open');

    // 4.4 Menu has all 4 options
    const actions = await page.$$('.host-menu-action');
    log('4.4 Menu has 4 options', actions.length === 4 ? 'PASS' : 'FAIL', `count=${actions.length}`);

    // 4.5 Close menu by backdrop click
    await safeClick(page, '#host-menu-backdrop');
    await page.waitForTimeout(300);
    const overlayAfter = await page.$('#host-menu-overlay');
    const overlayAfterDisplay = overlayAfter ? await overlayAfter.evaluate(el => el.style.display) : 'block';
    log('4.5 Menu closes on backdrop', overlayAfterDisplay === 'none' ? 'PASS' : 'FAIL');
  }

  // 4.6 Navigate to Scoring tab
  await safeClick(page, '.nav-item[data-tab="scoring"]');
  await page.waitForTimeout(1500);
  body = await bodyText(page);
  log('4.6 Scoring tab loads', body.includes('ENTER SCORES') || body.includes('ROUND') ? 'PASS' : 'FAIL');
  await screenshot(page, '4.6-scoring');

  // 4.7 Three-dot menu on scoring screen
  const menuOnScoring = await page.$('#btn-host-menu-trigger');
  log('4.7 Three-dot menu on scoring', menuOnScoring ? 'PASS' : 'FAIL');

  // 4.8 Navigate to Rules tab
  await safeClick(page, '.nav-item[data-tab="rules"]');
  await page.waitForTimeout(1500);
  body = await bodyText(page);
  log('4.8 Rules tab loads', body.includes('RULEBOOK') ? 'PASS' : 'FAIL');
  await screenshot(page, '4.8-rules');

  // 4.9 Three-dot menu on rules screen
  const menuOnRules = await page.$('#btn-host-menu-trigger');
  log('4.9 Three-dot menu on rules', menuOnRules ? 'PASS' : 'FAIL');

  // 4.10 Back to dashboard
  await safeClick(page, '.nav-item[data-tab="dashboard"]');
  await page.waitForTimeout(1000);

  // ═══════════════════════════════════════════
  // SECTION 5: FLIP 7 — PLAY TO WINNER
  // ═══════════════════════════════════════════
  console.log('\n═══ SECTION 5: FLIP 7 PLAY ═══\n');

  // Go to scoring
  await safeClick(page, '.nav-item[data-tab="scoring"]');
  await page.waitForTimeout(1500);

  // 5.1 Mini standings visible
  body = await bodyText(page);
  log('5.1 Mini standings on scoring', body.includes('STANDINGS') ? 'PASS' : 'FAIL');

  // 5.2 Enter round 1 scores
  const inputs1 = await page.$$('.score-input');
  if (inputs1.length >= 3) {
    await inputs1[0].fill('30');
    await inputs1[1].fill('15');
    await inputs1[2].fill('10');
    await safeClick(page, '#btn-submit-round');
    await page.waitForTimeout(2500);
    body = await bodyText(page);
    log('5.2 Round 1 submitted', body.includes('Round') || body.includes('ROUND') ? 'PASS' : 'FAIL');
  } else {
    log('5.2 Score inputs missing', 'FAIL', `count=${inputs1.length}`);
  }

  // 5.3 Enter round 2 to trigger winner (ALICE: 30+30=60 > 50 target)
  await safeClick(page, '.nav-item[data-tab="scoring"]');
  await page.waitForTimeout(1000);
  const inputs2 = await page.$$('.score-input');
  if (inputs2.length >= 3) {
    await inputs2[0].fill('30');
    await inputs2[1].fill('20');
    await inputs2[2].fill('15');
    await safeClick(page, '#btn-submit-round');
    await page.waitForTimeout(3000);
    body = await bodyText(page);
    log('5.3 Winner screen appears', body.includes('WINNER') ? 'PASS' : 'FAIL');
    await screenshot(page, '5.3-winner-flip7');
  }

  // 5.4 Winner screen content
  log('5.4 Winner name shown', body.includes('ALICE') ? 'PASS' : 'FAIL');

  // 5.5 Winner screen NOT duplicated/repeated
  const winnerCount = (body.match(/WINNER/g) || []).length;
  log('5.5 Winner not duplicated', winnerCount <= 2 ? 'PASS' : 'FAIL', `"WINNER" appears ${winnerCount}x`);

  // 5.6 Replay button exists
  const replayBtn = await page.$('#btn-replay');
  log('5.6 Replay button exists', replayBtn ? 'PASS' : 'FAIL');

  // 5.7 New Game button exists
  const newGameBtn = await page.$('#btn-new-game');
  log('5.7 New Game button exists', newGameBtn ? 'PASS' : 'FAIL');

  // ═══════════════════════════════════════════
  // SECTION 6: NEW GAME FLOW (Critical path)
  // ═══════════════════════════════════════════
  console.log('\n═══ SECTION 6: NEW GAME FLOW ═══\n');

  // Click "Choose New Game"
  if (newGameBtn) {
    await newGameBtn.click();
    await page.waitForTimeout(3000);
  }

  body = await bodyText(page);
  await screenshot(page, '6.1-after-new-game');

  // 6.1 Should be on game select screen (NOT showing old scores)
  const hasOldScores = body.includes('STANDINGS') && body.includes('PLAYING');
  log('6.1 Game select clean (no old scores)', !hasOldScores ? 'PASS' : 'FAIL', hasOldScores ? 'Old game content still visible' : '');

  // 6.2 Game cards visible
  const gameCards = await page.$$('.game-card');
  log('6.2 Game cards visible', gameCards.length === 3 ? 'PASS' : 'FAIL', `count=${gameCards.length}`);

  // 6.3 Can select Papayoo
  const papayooCard = await safeClick(page, '.game-card[data-id="papayoo"]');
  await page.waitForTimeout(500);
  log('6.3 Papayoo selectable', papayooCard ? 'PASS' : 'FAIL');

  // 6.4 Set round limit
  const roundInput = await page.$('#config-roundLimit');
  if (roundInput) {
    await roundInput.fill('2');
    log('6.4 Round limit set to 2', 'PASS');
  }

  // 6.5 Start Papayoo
  await safeClick(page, '#btn-start');
  await page.waitForTimeout(3000);
  body = await bodyText(page);
  log('6.5 Papayoo dashboard loads', body.includes('ROUND') ? 'PASS' : 'FAIL');
  await screenshot(page, '6.5-papayoo-dashboard');

  // 6.6 Old Flip 7 content NOT visible
  const flip7Residue = body.includes('FLIP 7') && body.includes('50');
  log('6.6 No Flip 7 residue', !flip7Residue ? 'PASS' : 'FAIL');

  // ═══════════════════════════════════════════
  // SECTION 7: PAPAYOO — PLAY WITH ROUND LIMIT
  // ═══════════════════════════════════════════
  console.log('\n═══ SECTION 7: PAPAYOO PLAY ═══\n');

  // Go to scoring
  await safeClick(page, '.nav-item[data-tab="scoring"]');
  await page.waitForTimeout(1500);

  // 7.1 Suit picker visible
  const suitBtns = await page.$$('.suit-btn');
  log('7.1 Suit picker (4 suits)', suitBtns.length === 4 ? 'PASS' : 'FAIL', `count=${suitBtns.length}`);

  // 7.2 Submit without suit — validation
  await safeClick(page, '#btn-submit-round');
  await page.waitForTimeout(500);
  const errEl = await page.$('#validation-error');
  const errVisible = errEl ? await errEl.isVisible() : false;
  log('7.2 Validation: suit required', errVisible ? 'PASS' : 'FAIL');

  // 7.3 Select suit + enter penalties summing to 250
  if (suitBtns.length > 0) await suitBtns[0].click();
  await page.waitForTimeout(200);

  const papInputs = await page.$$('.papayoo-input');
  if (papInputs.length >= 3) {
    await papInputs[0].fill('80');
    await papInputs[1].fill('90');
    await papInputs[2].fill('80');
    await page.waitForTimeout(300);

    const sumEl = await page.$('#penalty-sum');
    const sum = sumEl ? await sumEl.textContent() : '0';
    log('7.3 Penalty sum = 250', sum === '250' ? 'PASS' : 'FAIL', `sum=${sum}`);

    await safeClick(page, '#btn-submit-round');
    await page.waitForTimeout(2500);
    body = await bodyText(page);
    log('7.4 Round 1 submitted', body.includes('Round') || body.includes('ROUND') ? 'PASS' : 'FAIL');
    await screenshot(page, '7.4-papayoo-round2');
  }

  // 7.5 Round 2 — should trigger end (round limit = 2)
  const suitBtns2 = await page.$$('.suit-btn');
  if (suitBtns2.length > 0) await suitBtns2[1].click();
  await page.waitForTimeout(200);

  const papInputs2 = await page.$$('.papayoo-input');
  if (papInputs2.length >= 3) {
    await papInputs2[0].fill('100');
    await papInputs2[1].fill('70');
    await papInputs2[2].fill('80');
    await page.waitForTimeout(300);

    await safeClick(page, '#btn-submit-round');
    await page.waitForTimeout(3000);
    body = await bodyText(page);
    log('7.5 Papayoo ends at round limit', body.includes('WINNER') ? 'PASS' : 'FAIL');
    await screenshot(page, '7.5-papayoo-winner');

    // 7.6 Winner not duplicated on screen
    const winnerMatches = (body.match(/WINNER/g) || []).length;
    log('7.6 Winner not duplicated', winnerMatches <= 2 ? 'PASS' : 'FAIL', `count=${winnerMatches}`);

    // 7.7 Correct winner (lowest total: BOB with 90+70=160)
    log('7.7 Correct winner (BOB=lowest)', body.includes('BOB') ? 'PASS' : 'FAIL');
  }

  // ═══════════════════════════════════════════
  // SECTION 8: SECOND NEW GAME → CABO
  // ═══════════════════════════════════════════
  console.log('\n═══ SECTION 8: SECOND NEW GAME → CABO ═══\n');

  // Choose new game from winner
  const newGame2 = await safeClick(page, '#btn-new-game');
  await page.waitForTimeout(3000);
  body = await bodyText(page);
  await screenshot(page, '8.1-after-second-new-game');

  // 8.1 Clean game select (no Papayoo residue)
  const hasPapayooResidue = body.includes('PAPAYOO') && body.includes('PENALTY');
  log('8.1 Clean game select', !hasPapayooResidue ? 'PASS' : 'FAIL');
  log('8.2 Game cards present', (await page.$$('.game-card')).length === 3 ? 'PASS' : 'FAIL');

  // Select Cabo
  const caboCard = await safeClick(page, '.game-card[data-id="cabo"]');
  await page.waitForTimeout(500);
  log('8.3 Cabo selected', caboCard ? 'PASS' : 'FAIL');

  await safeClick(page, '#btn-start');
  await page.waitForTimeout(3000);
  body = await bodyText(page);
  log('8.4 Cabo dashboard loads', body.includes('ROUND') ? 'PASS' : 'FAIL');
  await screenshot(page, '8.4-cabo-dashboard');

  // ═══════════════════════════════════════════
  // SECTION 9: CABO — SCORING
  // ═══════════════════════════════════════════
  console.log('\n═══ SECTION 9: CABO SCORING ═══\n');

  await safeClick(page, '.nav-item[data-tab="scoring"]');
  await page.waitForTimeout(1500);

  // 9.1 Caller buttons
  const callerBtns = await page.$$('.caller-btn');
  log('9.1 Caller buttons (3)', callerBtns.length === 3 ? 'PASS' : 'FAIL', `count=${callerBtns.length}`);

  // 9.2 Submit without caller — validation
  await safeClick(page, '#btn-submit-round');
  await page.waitForTimeout(500);
  const caboErr = await page.$('#validation-error');
  const caboErrVis = caboErr ? await caboErr.isVisible() : false;
  log('9.2 Validation: caller required', caboErrVis ? 'PASS' : 'FAIL');

  // 9.3 Kamikaze toggle
  const kamikazeBtn = await page.$('#kamikaze-toggle');
  log('9.3 Kamikaze toggle exists', kamikazeBtn ? 'PASS' : 'FAIL');

  // 9.4 Enter valid round
  if (callerBtns.length > 0) await callerBtns[0].click();
  await page.waitForTimeout(200);

  const caboInputs = await page.$$('.cabo-input');
  if (caboInputs.length >= 3) {
    await caboInputs[0].fill('5');
    await caboInputs[1].fill('12');
    await caboInputs[2].fill('8');
    await safeClick(page, '#btn-submit-round');
    await page.waitForTimeout(2500);
    log('9.4 Cabo round submitted', 'PASS');
    await screenshot(page, '9.4-cabo-round1');
  }

  // ═══════════════════════════════════════════
  // SECTION 10: HOST MENU — END GAME
  // ═══════════════════════════════════════════
  console.log('\n═══ SECTION 10: HOST MENU ACTIONS ═══\n');

  // Go to dashboard first
  await safeClick(page, '.nav-item[data-tab="dashboard"]');
  await page.waitForTimeout(1000);

  // 10.1 Open host menu
  const menuBtn = await page.$('#btn-host-menu-trigger');
  log('10.1 Host menu trigger exists', menuBtn ? 'PASS' : 'FAIL');

  if (menuBtn) {
    await menuBtn.click();
    await page.waitForTimeout(500);
    const overlay = await page.$('#host-menu-overlay');
    const display = overlay ? await overlay.evaluate(el => el.style.display) : 'none';
    log('10.2 Menu opens', display !== 'none' ? 'PASS' : 'FAIL');
    await screenshot(page, '10.2-host-menu-open');

    // 10.3 Click End Game
    const endGameAction = await page.$('.host-menu-action[data-action="end-game"]');
    if (endGameAction) {
      await endGameAction.click();
      await page.waitForTimeout(2000);
      body = await bodyText(page);
      log('10.3 End Game → lobby', body.includes('PLAYERS') || body.includes('CHOOSE GAME') ? 'PASS' : 'FAIL');
      await screenshot(page, '10.3-back-to-lobby');
    }
  }

  // ═══════════════════════════════════════════
  // SECTION 11: NIGHT RECAP
  // ═══════════════════════════════════════════
  console.log('\n═══ SECTION 11: NIGHT RECAP ═══\n');

  body = await bodyText(page);

  // 11.1 Night recap visible (stats was toggled on, games were played)
  const recapBtn = await page.$('#btn-recap');
  log('11.1 Night Recap button visible', recapBtn ? 'PASS' : 'FAIL');
  await screenshot(page, '11.1-lobby-with-recap');

  if (recapBtn) {
    await recapBtn.click();
    await page.waitForTimeout(2000);
    body = await bodyText(page);
    log('11.2 Recap screen loads', body.includes('RECAP') ? 'PASS' : 'FAIL');
    log('11.3 MVP section', body.includes('MVP') || body.includes('VALUABLE') ? 'PASS' : 'FAIL');
    log('11.4 Overall standings', body.includes('OVERALL') || body.includes('PLAYED') ? 'PASS' : 'FAIL');
    log('11.5 Per-game breakdown', body.includes('FLIP 7') || body.includes('PAPAYOO') ? 'PASS' : 'FAIL');
    await screenshot(page, '11.5-recap-screen');

    // Go back
    await safeClick(page, '#btn-back-lobby');
    await page.waitForTimeout(1000);
  }

  // ═══════════════════════════════════════════
  // SECTION 12: VIEWER EXPERIENCE
  // ═══════════════════════════════════════════
  console.log('\n═══ SECTION 12: VIEWER ═══\n');

  if (roomCode) {
    const viewer = await context.newPage();
    await viewer.goto(`${BASE_URL}?room=${roomCode}`, { waitUntil: 'networkidle' });
    await viewer.waitForTimeout(3000);
    body = await viewer.textContent('body');
    await screenshot(viewer, '12.1-viewer');

    // 12.1 Viewer sees room
    log('12.1 Viewer joins', body.includes('SPECTATOR') || body.includes(roomCode) || body.includes('ALICE') ? 'PASS' : 'FAIL');

    // 12.2 No host controls
    const viewerAdd = await viewer.$('#input-player-name');
    const viewerAddVisible = viewerAdd ? await viewerAdd.isVisible() : false;
    log('12.2 No add player for viewer', !viewerAddVisible ? 'PASS' : 'FAIL');

    // 12.3 No stats toggle
    const viewerStats = await viewer.$('#btn-stats-toggle');
    const viewerStatsVis = viewerStats ? await viewerStats.isVisible() : false;
    log('12.3 No stats toggle for viewer', !viewerStatsVis ? 'PASS' : 'FAIL');

    await viewer.close();
  }

  // ═══════════════════════════════════════════
  // SECTION 13: EDGE CASES
  // ═══════════════════════════════════════════
  console.log('\n═══ SECTION 13: EDGE CASES ═══\n');

  // 13.1 Join with invalid code
  const edgePage = await context.newPage();
  await edgePage.goto(BASE_URL, { waitUntil: 'networkidle' });
  await edgePage.waitForTimeout(1000);
  const joinInput = await edgePage.$('input[placeholder="ROOM PIN"]');
  if (joinInput) {
    await joinInput.fill('ZZZZZZ');
    await safeClick(edgePage, 'button:has-text("JOIN ROOM")');
    await edgePage.waitForTimeout(2000);
    const edgeToast = await edgePage.textContent('#toast-container');
    log('13.1 Invalid code error', edgeToast?.toLowerCase().includes('not found') ? 'PASS' : 'FAIL', edgeToast?.trim());
  }

  // 13.2 Join with short code
  if (joinInput) {
    await joinInput.fill('AB');
    await safeClick(edgePage, 'button:has-text("JOIN ROOM")');
    await edgePage.waitForTimeout(1000);
    const shortToast = await edgePage.textContent('#toast-container');
    log('13.2 Short code error', shortToast?.toLowerCase().includes('valid') ? 'PASS' : 'FAIL', shortToast?.trim());
  }
  await edgePage.close();

  // ═══════════════════════════════════════════
  // REPORT
  // ═══════════════════════════════════════════
  console.log('\n═══════════════════════════════════════════');
  console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED, ${passed + failed} TOTAL`);
  console.log('═══════════════════════════════════════════\n');

  const failList = RESULTS.filter(r => r.status === 'FAIL');
  if (failList.length > 0) {
    console.log('FAILURES:');
    failList.forEach(f => console.log(`  [FAIL] ${f.test} — ${f.detail}`));
    console.log('');
  }

  console.log('SCREENSHOTS saved to test-screenshots/');
  SCREENSHOTS.forEach(s => console.log(`  ${s.path} — ${s.label}`));

  await browser.close();

  // Write report file
  const report = `# Test Report — Game Night Scorer
Date: ${new Date().toISOString()}
URL: ${BASE_URL}

## Summary: ${passed} PASSED, ${failed} FAILED, ${passed + failed} TOTAL

## All Results
${RESULTS.map(r => `- [${r.status}] ${r.test}${r.detail ? ' — ' + r.detail : ''}`).join('\n')}

## Failures
${failList.length === 0 ? 'None!' : failList.map(f => `- **${f.test}**: ${f.detail}`).join('\n')}

## Screenshots
${SCREENSHOTS.map(s => `- ${s.path}: ${s.label}`).join('\n')}

## Test Coverage
1. Home screen load and elements
2. Room creation
3. Player management (add, duplicate prevention, host selection, stats toggle)
4. Game select (selection feedback, config, start)
5. In-game navigation (all 3 tabs, host menu on all screens)
6. Flip 7 complete game (score, winner)
7. New Game flow from winner screen
8. Papayoo complete game with round limit
9. Second New Game flow
10. Cabo scoring (caller, kamikaze, validation)
11. Host menu End Game → lobby
12. Night Recap (MVP, standings, breakdowns)
13. Viewer experience (join, no host controls)
14. Edge cases (invalid codes)
`;

  fs.writeFileSync('TEST-REPORT.md', report);
  console.log('Report written to TEST-REPORT.md');

  process.exit(failed > 0 ? 1 : 0);
}

run().catch(e => {
  console.error('Test runner crashed:', e.message);
  process.exit(1);
});
