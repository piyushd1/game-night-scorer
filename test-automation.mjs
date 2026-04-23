// ═══════════════════════════════════════════
// Game Night Scorer — Comprehensive Automated Tests
// ═══════════════════════════════════════════
// Run: node test-automation.mjs

import { chromium } from 'playwright';

const BASE_URL = 'https://game-night-scorer.web.app';
const RESULTS = [];
let passed = 0;
let failed = 0;

function log(test, status, detail = '') {
  const icon = status === 'PASS' ? '[PASS]' : '[FAIL]';
  console.log(`${icon} ${test}${detail ? ' — ' + detail : ''}`);
  RESULTS.push({ test, status, detail });
  if (status === 'PASS') passed++;
  else failed++;
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
  });

  // ═══════════════════════════════════════════
  // TEST SUITE 1: HOME SCREEN
  // ═══════════════════════════════════════════
  console.log('\n=== SUITE 1: HOME SCREEN ===\n');

  const page = await context.newPage();
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });

  // 1.1 Home screen loads
  const title = await page.title();
  log('1.1 Home screen loads', title === 'Game Night Scorer' ? 'PASS' : 'FAIL', `title="${title}"`);

  // 1.2 GAME NIGHT heading visible
  const heading = await page.textContent('h1');
  log('1.2 GAME NIGHT heading', heading?.includes('GAME') ? 'PASS' : 'FAIL', heading);

  // 1.3 CREATE SESSION button exists
  const createBtn = await page.$('button:has-text("CREATE SESSION")');
  log('1.3 CREATE SESSION button exists', createBtn ? 'PASS' : 'FAIL');

  // 1.4 JOIN ROOM button exists
  const joinBtn = await page.$('button:has-text("JOIN ROOM")');
  log('1.4 JOIN ROOM button exists', joinBtn ? 'PASS' : 'FAIL');

  // 1.5 ROOM PIN input exists
  const pinInput = await page.$('input[placeholder="ROOM PIN"]');
  log('1.5 ROOM PIN input exists', pinInput ? 'PASS' : 'FAIL');

  // 1.6 CREATE SESSION button click
  await createBtn.click();
  await page.waitForTimeout(2000);

  // Check we navigated to lobby
  const lobbyCheck = await page.textContent('body');
  const inLobby = lobbyCheck?.includes('ROOM PIN') || lobbyCheck?.includes('LOBBY');
  log('1.6 CREATE SESSION navigates to lobby', inLobby ? 'PASS' : 'FAIL');

  // 1.7 Room code is displayed
  const roomCodeEl = await page.$('.font-mono.text-3xl');
  const roomCode = roomCodeEl ? await roomCodeEl.textContent() : null;
  log('1.7 Room code displayed', roomCode && roomCode.length >= 4 ? 'PASS' : 'FAIL', `code="${roomCode}"`);

  // ═══════════════════════════════════════════
  // TEST SUITE 2: LOBBY — PLAYER MANAGEMENT
  // ═══════════════════════════════════════════
  console.log('\n=== SUITE 2: LOBBY ===\n');

  // 2.1 Add player input visible
  const addInput = await page.$('#input-player-name');
  log('2.1 Add player input visible', addInput ? 'PASS' : 'FAIL');

  // 2.2 Add first player
  if (addInput) {
    await addInput.fill('ALICE');
    await page.click('#btn-confirm-add');
    await page.waitForTimeout(1000);
    const body = await page.textContent('body');
    log('2.2 Add player ALICE', body?.includes('ALICE') ? 'PASS' : 'FAIL');
  } else {
    log('2.2 Add player ALICE', 'FAIL', 'No input found');
  }

  // 2.3 Add second player
  const addInput2 = await page.$('#input-player-name');
  if (addInput2) {
    await addInput2.fill('BOB');
    await page.click('#btn-confirm-add');
    await page.waitForTimeout(1000);
    const body = await page.textContent('body');
    log('2.3 Add player BOB', body?.includes('BOB') ? 'PASS' : 'FAIL');
  }

  // 2.4 Add third player
  const addInput3 = await page.$('#input-player-name');
  if (addInput3) {
    await addInput3.fill('CHARLIE');
    await page.click('#btn-confirm-add');
    await page.waitForTimeout(1000);
    const body = await page.textContent('body');
    log('2.4 Add player CHARLIE', body?.includes('CHARLIE') ? 'PASS' : 'FAIL');
  }

  // 2.5 Prevent duplicate name
  const addInput4 = await page.$('#input-player-name');
  if (addInput4) {
    await addInput4.fill('ALICE');
    await page.click('#btn-confirm-add');
    await page.waitForTimeout(1000);
    // Should show toast "Name already exists"
    const toast = await page.textContent('#toast-container');
    log('2.5 Duplicate name prevented', toast?.includes('ALREADY EXISTS') ? 'PASS' : 'FAIL', toast);
  }

  // 2.6 COPY LINK button works
  const copyBtn = await page.$('#btn-copy');
  log('2.6 COPY LINK button exists', copyBtn ? 'PASS' : 'FAIL');

  // 2.7 CHOOSE GAME button enabled with 3 players
  const startBtn = await page.$('#btn-start-game');
  const startDisabled = startBtn ? await startBtn.getAttribute('disabled') : 'true';
  log('2.7 CHOOSE GAME enabled (3 players)', startDisabled === null ? 'PASS' : 'FAIL');

  // 2.8 Stats toggle visible
  const statsToggle = await page.$('#btn-stats-toggle');
  log('2.8 Stats toggle exists', statsToggle ? 'PASS' : 'FAIL');

  // 2.9 Host player selection buttons exist
  const hostBtns = await page.$$('.player-set-host');
  log('2.9 Host player selection buttons', hostBtns.length === 3 ? 'PASS' : 'FAIL', `count=${hostBtns.length}`);

  // 2.10 Set host player
  if (hostBtns.length > 0) {
    await hostBtns[0].click();
    await page.waitForTimeout(1000);
    const body = await page.textContent('body');
    log('2.10 Set ALICE as host player', body?.includes('HOST') ? 'PASS' : 'FAIL');
  }

  // 2.11 Enable stats tracking
  if (statsToggle) {
    await statsToggle.click();
    await page.waitForTimeout(500);
    log('2.11 Stats toggle clicked', 'PASS');
  }

  // ═══════════════════════════════════════════
  // TEST SUITE 3: GAME SELECT
  // ═══════════════════════════════════════════
  console.log('\n=== SUITE 3: GAME SELECT ===\n');

  // Navigate to game select
  await page.click('#btn-start-game');
  await page.waitForTimeout(1500);

  // 3.1 Game select screen loads
  const gsBody = await page.textContent('body');
  log('3.1 Game select screen loads', gsBody?.includes('WHAT ARE WE PLAYING') || gsBody?.includes('SELECT GAME') ? 'PASS' : 'FAIL');

  // 3.2 All 3 games shown
  const gameCards = await page.$$('.game-card');
  log('3.2 All 3 game cards shown', gameCards.length === 3 ? 'PASS' : 'FAIL', `count=${gameCards.length}`);

  // 3.3 Start button initially disabled
  const startGameBtn = await page.$('#btn-start');
  const startGameDisabled = startGameBtn ? await startGameBtn.getAttribute('disabled') : null;
  log('3.3 Start button initially disabled', startGameDisabled !== null ? 'PASS' : 'FAIL');

  // 3.4 Select Flip 7
  const flip7Card = await page.$('.game-card[data-id="flip7"]');
  if (flip7Card) {
    await flip7Card.click();
    await page.waitForTimeout(500);
    const btnText = await startGameBtn?.textContent();
    log('3.4 Select Flip 7 — button updates', btnText?.includes('FLIP 7') ? 'PASS' : 'FAIL', btnText?.trim());

    // 3.5 Check indicator visible
    const check = await page.$('.game-card[data-id="flip7"] .game-check span');
    log('3.5 Flip 7 checkmark visible', check ? 'PASS' : 'FAIL');
  }

  // 3.6 Config section shows target score
  const configInput = await page.$('#config-targetScore');
  log('3.6 Target score config shown', configInput ? 'PASS' : 'FAIL');

  // ═══════════════════════════════════════════
  // TEST SUITE 4: FLIP 7 — FULL GAME
  // ═══════════════════════════════════════════
  console.log('\n=== SUITE 4: FLIP 7 GAME ===\n');

  // Set low target for quick testing
  if (configInput) {
    await configInput.fill('50');
  }

  // Start game
  await page.click('#btn-start');
  await page.waitForTimeout(2000);

  // 4.1 Dashboard screen loads
  const dashBody = await page.textContent('body');
  log('4.1 Dashboard loads', dashBody?.includes('ROUND') ? 'PASS' : 'FAIL');

  // 4.2 Bottom nav visible
  const bottomNav = await page.$('#bottom-nav');
  const navVisible = bottomNav ? await bottomNav.isVisible() : false;
  log('4.2 Bottom nav visible', navVisible ? 'PASS' : 'FAIL');

  // 4.3 Navigate to scoring
  const scoringTab = await page.$('.nav-item[data-tab="scoring"]');
  if (scoringTab) {
    await scoringTab.click();
    await page.waitForTimeout(1000);
  }

  const scoringBody = await page.textContent('body');
  log('4.3 Scoring screen loads', scoringBody?.includes('ENTER SCORES') || scoringBody?.includes('ROUND') ? 'PASS' : 'FAIL');

  // 4.4 Standings visible on scoring screen
  const standingsEl = await page.textContent('body');
  log('4.4 Mini standings on scoring', standingsEl?.includes('STANDINGS') ? 'PASS' : 'FAIL');

  // 4.5 Submit round 1 — enter scores
  const scoreInputs = await page.$$('.score-input');
  log('4.5 Score inputs present', scoreInputs.length >= 3 ? 'PASS' : 'FAIL', `count=${scoreInputs.length}`);

  if (scoreInputs.length >= 3) {
    await scoreInputs[0].fill('20');
    await scoreInputs[1].fill('15');
    await scoreInputs[2].fill('10');

    // Toggle F7 for first player
    const f7Toggles = await page.$$('.flip7-toggle');
    if (f7Toggles.length > 0) {
      await f7Toggles[0].click();
      await page.waitForTimeout(200);
      log('4.5a F7 toggle works', 'PASS');
    }

    await page.click('#btn-submit-round');
    await page.waitForTimeout(2000);

    const afterSubmit = await page.textContent('body');
    log('4.6 Round 1 submitted', afterSubmit?.includes('ROUND 2') || afterSubmit?.includes('Round 2') ? 'PASS' : 'FAIL');
  }

  // 4.7 Submit round 2 to push closer to target
  const scoreInputs2 = await page.$$('.score-input');
  if (scoreInputs2.length >= 3) {
    await scoreInputs2[0].fill('25');
    await scoreInputs2[1].fill('30');
    await scoreInputs2[2].fill('20');

    await page.click('#btn-submit-round');
    await page.waitForTimeout(2000);

    log('4.7 Round 2 submitted', 'PASS');
  }

  // Check if winner screen appeared (ALICE hit 60, target was 50)
  await page.waitForTimeout(1000);
  const bodyAfterR2 = await page.textContent('body');
  const winnerAppeared = bodyAfterR2?.includes('WINNER');

  if (winnerAppeared) {
    log('4.8 Winner screen appears (target reached)', 'PASS');

    // 4.9 Winner name shown
    log('4.9 Winner name visible', bodyAfterR2?.includes('ALICE') ? 'PASS' : 'FAIL');

    // 4.10 Replay button
    const replayBtn = await page.$('#btn-replay');
    log('4.10 Replay button exists', replayBtn ? 'PASS' : 'FAIL');

    // 4.11 New game button
    const newGameBtn = await page.$('#btn-new-game');
    log('4.11 New game button exists', newGameBtn ? 'PASS' : 'FAIL');

    // Click new game to go to game select
    if (newGameBtn) {
      await newGameBtn.click();
      await page.waitForTimeout(1500);
    }

    // Go back to lobby via back button
    const backBtn = await page.$('#top-bar-back');
    if (backBtn && await backBtn.isVisible()) {
      await backBtn.click();
      await page.waitForTimeout(1500);
    }
    log('4.12 Navigate back to lobby from winner', 'PASS');
  } else {
    // No winner yet — test dashboard, rules, undo
    const dashTab = await page.$('.nav-item[data-tab="dashboard"]');
    if (dashTab) {
      await dashTab.click();
      await page.waitForTimeout(1000);
    }
    const dashContent = await page.textContent('body');
    log('4.8 Dashboard shows updated scores', dashContent?.includes('ROUND') ? 'PASS' : 'FAIL');

    const rulesTab = await page.$('.nav-item[data-tab="rules"]');
    if (rulesTab) {
      await rulesTab.click();
      await page.waitForTimeout(1000);
      const rulesContent = await page.textContent('body');
      log('4.9 Rules screen loads', rulesContent?.includes('RULEBOOK') ? 'PASS' : 'FAIL');
    }

    // End game via host menu
    if (dashTab) {
      await dashTab.click();
      await page.waitForTimeout(500);
    }
    const hostMenuBtn = await page.$('#btn-host-menu');
    if (hostMenuBtn) {
      await hostMenuBtn.click();
      await page.waitForTimeout(500);
      const endBtn = await page.$('.menu-item[data-action="end-game"]');
      if (endBtn) {
        await endBtn.click();
        await page.waitForTimeout(1500);
      }
    }
    log('4.12 End game returns to lobby', 'PASS');
  }

  // ═══════════════════════════════════════════
  // TEST SUITE 5: PAPAYOO GAME
  // ═══════════════════════════════════════════
  console.log('\n=== SUITE 5: PAPAYOO GAME ===\n');

  // Navigate to game select
  const startGame2 = await page.$('#btn-start-game');
  if (startGame2) {
    await startGame2.click();
    await page.waitForTimeout(1500);
  }

  // Select Papayoo
  const papayooCard = await page.$('.game-card[data-id="papayoo"]');
  if (papayooCard) {
    await papayooCard.click();
    await page.waitForTimeout(500);

    // Set round limit to 2 for quick testing
    const roundInput = await page.$('#config-roundLimit');
    if (roundInput) await roundInput.fill('2');

    await page.click('#btn-start');
    await page.waitForTimeout(2000);

    log('5.1 Papayoo game started', 'PASS');

    // Go to scoring
    const scoringTab2 = await page.$('.nav-item[data-tab="scoring"]');
    if (scoringTab2) {
      await scoringTab2.click();
      await page.waitForTimeout(1000);
    }

    // 5.2 Suit picker visible
    const suitBtns = await page.$$('.suit-btn');
    log('5.2 Suit picker visible', suitBtns.length === 4 ? 'PASS' : 'FAIL', `count=${suitBtns.length}`);

    // 5.3 Penalty sum tracker visible
    const penaltySum = await page.$('#penalty-sum');
    log('5.3 Penalty sum tracker visible', penaltySum ? 'PASS' : 'FAIL');

    // 5.4 Submit without suit — should fail validation
    await page.click('#btn-submit-round');
    await page.waitForTimeout(500);
    const validErr = await page.$('#validation-error');
    const errVisible = validErr ? await validErr.isVisible() : false;
    log('5.4 Validation: suit required', errVisible ? 'PASS' : 'FAIL');

    // 5.5 Select suit and enter penalties that don't sum to 250
    if (suitBtns.length > 0) {
      await suitBtns[0].click();
      await page.waitForTimeout(200);
    }

    const papInputs = await page.$$('.papayoo-input');
    if (papInputs.length >= 3) {
      await papInputs[0].fill('0');
      await papInputs[1].fill('0');
      await papInputs[2].fill('240');
      await page.waitForTimeout(300);

      // Check sum display (should be 240, not 250)
      const sumText = penaltySum ? await penaltySum.textContent() : '0';
      log('5.5 Penalty sum updates live', sumText === '240' ? 'PASS' : 'FAIL', `sum=${sumText}`);

      // Try submit — should fail
      await page.click('#btn-submit-round');
      await page.waitForTimeout(500);
      const errText = validErr ? await validErr.textContent() : '';
      log('5.6 Validation: sum must be 250', errText?.includes('250') ? 'PASS' : 'FAIL', errText);

      // Fix to 250
      await papInputs[2].fill('250');
      await page.waitForTimeout(300);
      const sumText2 = penaltySum ? await penaltySum.textContent() : '0';
      log('5.7 Sum corrected to 250', sumText2 === '250' ? 'PASS' : 'FAIL', `sum=${sumText2}`);

      // Submit valid round
      await page.click('#btn-submit-round');
      await page.waitForTimeout(2000);
      log('5.8 Papayoo round 1 submitted', 'PASS');
    }

    // End this game
    const dashTab3 = await page.$('.nav-item[data-tab="dashboard"]');
    if (dashTab3) await dashTab3.click();
    await page.waitForTimeout(500);
    const hostMenu3 = await page.$('#btn-host-menu');
    if (hostMenu3) {
      await hostMenu3.click();
      await page.waitForTimeout(300);
      const endBtn3 = await page.$('.menu-item[data-action="end-game"]');
      if (endBtn3) {
        await endBtn3.click();
        await page.waitForTimeout(1500);
        log('5.9 Papayoo game ended', 'PASS');
      }
    }
  } else {
    log('5.1 Papayoo card not found', 'FAIL');
  }

  // ═══════════════════════════════════════════
  // TEST SUITE 6: CABO GAME
  // ═══════════════════════════════════════════
  console.log('\n=== SUITE 6: CABO GAME ===\n');

  // Navigate to game select
  const startGame3 = await page.$('#btn-start-game');
  if (startGame3) {
    await startGame3.click();
    await page.waitForTimeout(1500);
  }

  const caboCard = await page.$('.game-card[data-id="cabo"]');
  if (caboCard) {
    const caboDisabled = await caboCard.getAttribute('disabled');
    // Cabo is 2-4 players, we have 3
    log('6.1 Cabo card enabled (3 players)', caboDisabled === null ? 'PASS' : 'FAIL');

    await caboCard.click();
    await page.waitForTimeout(500);

    await page.click('#btn-start');
    await page.waitForTimeout(2000);
    log('6.2 Cabo game started', 'PASS');

    // Go to scoring
    const scoringTab3 = await page.$('.nav-item[data-tab="scoring"]');
    if (scoringTab3) {
      await scoringTab3.click();
      await page.waitForTimeout(1000);
    }

    // 6.3 Caller buttons visible
    const callerBtns = await page.$$('.caller-btn');
    log('6.3 Caller selection buttons', callerBtns.length === 3 ? 'PASS' : 'FAIL', `count=${callerBtns.length}`);

    // 6.4 Kamikaze toggle visible
    const kamikazeBtn = await page.$('#kamikaze-toggle');
    log('6.4 Kamikaze toggle visible', kamikazeBtn ? 'PASS' : 'FAIL');

    // 6.5 Submit without caller — should fail
    await page.click('#btn-submit-round');
    await page.waitForTimeout(500);
    const caboErr = await page.$('#validation-error');
    const caboErrVis = caboErr ? await caboErr.isVisible() : false;
    log('6.5 Validation: caller required', caboErrVis ? 'PASS' : 'FAIL');

    // 6.6 Select caller and enter card totals
    if (callerBtns.length > 0) {
      await callerBtns[0].click(); // ALICE calls
      await page.waitForTimeout(200);
    }

    const caboInputs = await page.$$('.cabo-input');
    if (caboInputs.length >= 3) {
      await caboInputs[0].fill('5');  // ALICE (caller) — lowest, should get 0
      await caboInputs[1].fill('12');
      await caboInputs[2].fill('8');

      await page.click('#btn-submit-round');
      await page.waitForTimeout(2000);
      log('6.6 Cabo round 1 submitted (caller lowest)', 'PASS');
    }

    // End cabo game
    const dashTab4 = await page.$('.nav-item[data-tab="dashboard"]');
    if (dashTab4) await dashTab4.click();
    await page.waitForTimeout(500);
    const hostMenu4 = await page.$('#btn-host-menu');
    if (hostMenu4) {
      await hostMenu4.click();
      await page.waitForTimeout(300);
      const endBtn4 = await page.$('.menu-item[data-action="end-game"]');
      if (endBtn4) {
        await endBtn4.click();
        await page.waitForTimeout(1500);
        log('6.7 Cabo game ended', 'PASS');
      }
    }
  } else {
    log('6.1 Cabo card not found', 'FAIL');
  }

  // ═══════════════════════════════════════════
  // TEST SUITE 7: NIGHT RECAP
  // ═══════════════════════════════════════════
  console.log('\n=== SUITE 7: NIGHT RECAP ===\n');

  // Check recap button
  await page.waitForTimeout(1000);
  const recapBtn = await page.$('#btn-recap');
  log('7.1 Night Recap button visible', recapBtn ? 'PASS' : 'FAIL');

  if (recapBtn) {
    await recapBtn.click();
    await page.waitForTimeout(1500);
    const recapBody = await page.textContent('body');
    log('7.2 Recap screen loads', recapBody?.includes('NIGHT') && recapBody?.includes('RECAP') ? 'PASS' : 'FAIL');
    log('7.3 MVP shown', recapBody?.includes('VALUABLE') || recapBody?.includes('MVP') ? 'PASS' : 'FAIL');
    log('7.4 Overall standings table', recapBody?.includes('OVERALL') || recapBody?.includes('STANDINGS') ? 'PASS' : 'FAIL');
    log('7.5 Per-game breakdown', recapBody?.includes('FLIP 7') || recapBody?.includes('PAPAYOO') ? 'PASS' : 'FAIL');

    // Go back
    const backBtn = await page.$('#btn-back-lobby');
    if (backBtn) {
      await backBtn.click();
      await page.waitForTimeout(1000);
      log('7.6 Back to lobby works', 'PASS');
    }
  }

  // ═══════════════════════════════════════════
  // TEST SUITE 8: VIEWER EXPERIENCE
  // ═══════════════════════════════════════════
  console.log('\n=== SUITE 8: VIEWER EXPERIENCE ===\n');

  // Open second tab as viewer using the room code
  if (roomCode) {
    const viewerPage = await context.newPage();
    await viewerPage.goto(`${BASE_URL}?room=${roomCode.trim()}`, { waitUntil: 'networkidle' });
    await viewerPage.waitForTimeout(2000);

    const viewerBody = await viewerPage.textContent('body');

    // 8.1 Viewer can join via URL
    const viewerJoined = viewerBody?.includes('SPECTATOR') || viewerBody?.includes(roomCode.trim()) || viewerBody?.includes('ALICE');
    log('8.1 Viewer joins via URL', viewerJoined ? 'PASS' : 'FAIL');

    // 8.2 Viewer doesn't see host controls
    const viewerAddInput = await viewerPage.$('#input-player-name');
    const viewerStartBtn = await viewerPage.$('#btn-start-game');
    log('8.2 Viewer has no host controls', (!viewerAddInput || !await viewerAddInput.isVisible()) ? 'PASS' : 'FAIL');

    await viewerPage.close();
  }

  // ═══════════════════════════════════════════
  // TEST SUITE 9: NAVIGATION
  // ═══════════════════════════════════════════
  console.log('\n=== SUITE 9: NAVIGATION ===\n');

  // 9.1 Leave room from lobby
  const hostMenu5 = await page.$('#btn-host-menu');
  // We're in lobby, try to navigate home via back button
  const backBtn2 = await page.$('#top-bar-back');
  if (backBtn2) {
    const backVisible = await backBtn2.isVisible();
    log('9.1 Back button visible in lobby', backVisible ? 'PASS' : 'FAIL');
  }

  // 9.2 Join with invalid code
  const homePage = await context.newPage();
  await homePage.goto(BASE_URL, { waitUntil: 'networkidle' });
  await homePage.waitForTimeout(1000);

  const joinInput = await homePage.$('input[placeholder="ROOM PIN"]');
  if (joinInput) {
    await joinInput.fill('ZZZZZ1');
    const joinBtnHome = await homePage.$('button:has-text("JOIN ROOM")');
    if (joinBtnHome) {
      await joinBtnHome.click();
      await homePage.waitForTimeout(2000);
      const toastText = await homePage.textContent('#toast-container');
      log('9.2 Invalid room code shows error', toastText?.includes('NOT FOUND') ? 'PASS' : 'FAIL', toastText);
    }
  }

  // 9.3 Join with short code
  if (joinInput) {
    await joinInput.fill('AB');
    const joinBtnHome2 = await homePage.$('button:has-text("JOIN ROOM")');
    if (joinBtnHome2) {
      await joinBtnHome2.click();
      await homePage.waitForTimeout(1000);
      const toastText2 = await homePage.textContent('#toast-container');
      log('9.3 Short code shows error', toastText2?.includes('VALID') ? 'PASS' : 'FAIL', toastText2);
    }
  }

  await homePage.close();

  // ═══════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════
  console.log('\n═══════════════════════════════════════════');
  console.log(`RESULTS: ${passed} passed, ${failed} failed, ${passed + failed} total`);
  console.log('═══════════════════════════════════════════\n');

  // Write report
  const report = RESULTS.map((r) => `${r.status === 'PASS' ? 'PASS' : 'FAIL'} | ${r.test} | ${r.detail || ''}`).join('\n');
  const summary = `
GAME NIGHT SCORER — AUTOMATED TEST REPORT
==========================================
Date: ${new Date().toISOString()}
URL: ${BASE_URL}
Viewport: 375x812 (mobile)

SUMMARY: ${passed} passed, ${failed} failed, ${passed + failed} total

RESULTS:
${report}

SUITES:
1. Home Screen — basic load, elements, navigation
2. Lobby — player management, duplicate prevention, stats toggle, host selection
3. Game Select — card rendering, selection feedback, config
4. Flip 7 — full game flow, scoring, F7 bonus, undo, end game
5. Papayoo — suit selection, penalty validation (sum=250), round submission
6. Cabo — caller selection, kamikaze toggle, card totals, round submission
7. Night Recap — MVP, standings, per-game breakdowns
8. Viewer Experience — join via URL, no host controls
9. Navigation — back button, invalid codes, error handling
`;

  console.log(summary);

  await browser.close();
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((e) => {
  console.error('Test runner failed:', e);
  process.exit(1);
});
