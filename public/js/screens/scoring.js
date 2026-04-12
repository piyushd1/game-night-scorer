// ═══════════════════════════════════════════
// Scoring Screen — Host Score Entry
// ═══════════════════════════════════════════

import * as state from '../state.js';
import * as fb from '../firebase.js';
import * as router from '../router.js';
import * as toast from '../components/toast.js';
import * as bottomNav from '../components/bottom-nav.js';
import * as hostMenu from '../components/host-menu.js';
import { getGame } from '../games/registry.js';
import { ACCENT_COLORS } from '../state.js';

let _unsubTab = null;

export function mount(container, params = {}) {
  const roomCode = params.roomCode || state.get('roomCode');

  // Robust host guard: if room meta hasn't loaded yet the user shouldn't be
  // on the scoring screen at all — redirect to dashboard where the watcher
  // will sort things out.  Once meta IS loaded, check the real isHost flag.
  const meta = state.get('roomMeta');
  if (!meta || !state.isHost()) {
    router.navigate('dashboard', { roomCode });
    return;
  }

  const topBar = document.getElementById('top-bar');
  topBar.style.display = 'flex';
  document.getElementById('top-bar-title').textContent = 'SCORING';
  document.getElementById('top-bar-back').classList.add('hidden');
  hostMenu.hide();
  hostMenu.renderTopBarActions(roomCode);

  bottomNav.show('scoring');

  _unsubTab = state.on('activeTab', (tab) => {
    if (tab === 'dashboard') router.navigate('dashboard', { roomCode });
    else if (tab === 'rules') router.navigate('rules', { roomCode });
  });

  _render(container, roomCode);
}

export function unmount() {
  if (_unsubTab) _unsubTab();
  _unsubTab = null;
}

function _render(container, roomCode) {
  const game = state.currentGame();
  if (!game) {
    container.innerHTML = `<div class="p-6 text-center"><p class="text-on-surface-variant">No active game</p></div>`;
    return;
  }

  const gameModule = getGame(game.type);
  if (!gameModule) return;

  // Guard: don't allow scoring on a finished game
  if (game.status === 'finished') {
    router.navigate('winner', { roomCode });
    return;
  }

  const snapshot = game.playerSnapshot || {};
  const totals = game.totals || {};
  const rounds = game.rounds ? Object.values(game.rounds) : [];
  const roundNum = rounds.length + 1;
  const playerIds = game.playerIds || [];

  // Derive standings for mini scoreboard
  const standings = gameModule.deriveStandings(totals, playerIds, gameModule.winMode);

  container.innerHTML = `
    <div class="p-6 pb-32">
      <!-- Round Header -->
      <div class="flex justify-between items-end mb-4">
        <div>
          <p class="font-mono text-[10px] uppercase tracking-widest text-outline">ENTER SCORES</p>
          <h2 class="font-headline font-black text-2xl uppercase tracking-tight">Round ${roundNum}</h2>
        </div>
        <span class="font-mono text-[10px] border border-outline px-2 py-1 uppercase">${gameModule.label}</span>
      </div>

      <!-- Mini Standings -->
      <div class="bg-surface-container-lowest border border-outline mb-6 overflow-hidden">
        <div class="flex items-center justify-between px-4 py-2 bg-surface-container-high border-b border-outline">
          <span class="font-mono text-[10px] uppercase tracking-widest text-outline">STANDINGS</span>
          <span class="font-mono text-[10px] text-outline">RD ${rounds.length}${game.type === 'papayoo' ? '/' + (game.config?.roundLimit || 5) : ''}</span>
        </div>
        <div class="divide-y divide-outline-variant">
          ${standings.map((s) => {
            const p = snapshot[s.playerId] || {};
            const color = ACCENT_COLORS[p.accentIndex || 0];
            const rankLabel = s.rank <= 3 ? ['1ST', '2ND', '3RD'][s.rank - 1] : s.rank + 'TH';
            return `
              <div class="flex items-center px-4 py-2 gap-3">
                <div class="w-1 self-stretch shrink-0" style="background:${color}"></div>
                <span class="font-mono text-[10px] text-outline w-6">${rankLabel}</span>
                <span class="font-headline font-bold text-xs uppercase flex-1 truncate">${p.name || s.playerId}</span>
                <span class="font-mono text-sm font-bold ${s.rank === 1 ? 'text-secondary' : ''}">${s.total}</span>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Game-specific scorer -->
      <div id="scorer-form"></div>

      <!-- Submit -->
      <div class="mt-6 space-y-3">
        <button id="btn-submit-round" class="btn-primary flex items-center justify-center gap-2">
          CONFIRM ROUND
          <span class="material-symbols-outlined text-lg">check</span>
        </button>
        <div id="validation-error" class="font-mono text-[10px] text-error text-center uppercase" style="display:none"></div>
      </div>
    </div>
  `;

  // Render game-specific form
  const formEl = container.querySelector('#scorer-form');
  formEl.innerHTML = gameModule.renderScorer(playerIds, snapshot, totals, game);

  // Wire up game-specific interactive elements
  _bindFormInteractions(container, game.type, playerIds);

  // Submit handler
  container.querySelector('#btn-submit-round').addEventListener('click', () => {
    _submitRound(container, roomCode, game, gameModule);
  });
}

function _bindFormInteractions(container, gameType, playerIds) {
  if (gameType === 'flip7') {
    // Flip 7 toggle buttons
    container.querySelectorAll('.flip7-toggle').forEach((btn) => {
      btn.addEventListener('click', () => {
        btn.classList.toggle('active');
        if (btn.classList.contains('active')) {
          btn.style.background = '#000';
          btn.style.color = '#fff';
          btn.style.borderColor = '#000';
        } else {
          btn.style.background = '';
          btn.style.color = '';
          btn.style.borderColor = '';
        }
      });
    });
  }

  if (gameType === 'papayoo') {
    // Suit picker — single select
    container.querySelectorAll('.suit-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('.suit-btn').forEach((b) => {
          b.classList.remove('active');
          b.style.background = '';
          b.style.borderColor = '';
          b.style.color = '';
        });
        btn.classList.add('active');
        btn.style.background = '#000';
        btn.style.color = '#fff';
        btn.style.borderColor = '#000';
      });
    });

    // Live penalty sum
    container.querySelectorAll('.papayoo-input').forEach((input) => {
      input.addEventListener('input', () => {
        const sum = Array.from(container.querySelectorAll('.papayoo-input'))
          .reduce((s, el) => s + (parseInt(el.value) || 0), 0);
        const sumEl = container.querySelector('#penalty-sum');
        if (sumEl) {
          sumEl.textContent = sum;
          sumEl.style.color = sum === 250 ? '#00B85C' : sum > 250 ? '#ba1a1a' : '';
        }
      });
    });
  }

  if (gameType === 'cabo') {
    // Caller selection — single select
    container.querySelectorAll('.caller-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('.caller-btn').forEach((b) => {
          b.classList.remove('active');
          b.style.background = '';
          b.style.borderColor = '';
          b.style.color = '';
        });
        btn.classList.add('active');
        btn.style.background = '#000';
        btn.style.color = '#fff';
        btn.style.borderColor = '#000';
      });
    });

    // Kamikaze toggle
    const kamikazeBtn = container.querySelector('#kamikaze-toggle');
    if (kamikazeBtn) {
      kamikazeBtn.addEventListener('click', () => {
        kamikazeBtn.classList.toggle('active');
        const dot = kamikazeBtn.querySelector('div');
        const cardSection = container.querySelector('#card-totals-section');
        if (kamikazeBtn.classList.contains('active')) {
          kamikazeBtn.style.background = '#000';
          kamikazeBtn.style.borderColor = '#000';
          dot.style.transform = 'translateX(20px)';
          dot.style.background = '#fff';
          // Disable card total inputs when kamikaze
          if (cardSection) cardSection.style.opacity = '0.3';
          cardSection?.querySelectorAll('input').forEach((i) => { i.disabled = true; });
        } else {
          kamikazeBtn.style.background = '';
          kamikazeBtn.style.borderColor = '';
          dot.style.transform = 'translateX(0)';
          dot.style.background = '';
          if (cardSection) cardSection.style.opacity = '1';
          cardSection?.querySelectorAll('input').forEach((i) => { i.disabled = false; });
        }
      });
    }
  }
}

async function _submitRound(container, roomCode, game, gameModule) {
  const playerIds = game.playerIds || [];
  const totals = game.totals || {};
  const rounds = game.rounds ? Object.values(game.rounds) : [];

  // Collect draft from form
  const draft = gameModule.collectDraft(container, playerIds);

  // Validate
  const validation = gameModule.validateRound(draft, game);
  const errorEl = container.querySelector('#validation-error');

  if (!validation.valid) {
    errorEl.textContent = validation.error;
    errorEl.style.display = 'block';
    return;
  }
  errorEl.style.display = 'none';

  // Apply round to get new totals
  const newTotals = gameModule.applyRound({ ...totals }, draft, game);

  // Check end condition
  const newRoundCount = rounds.length + 1;
  const endResult = gameModule.checkEnd(newTotals, game.config, playerIds, newRoundCount);

  const btn = container.querySelector('#btn-submit-round');
  btn.disabled = true;
  btn.innerHTML = '<div class="spinner mx-auto"></div>';

  try {
    await fb.submitRound(roomCode, game.gameId, draft, newTotals, endResult.ended ? endResult : null);

    if (endResult.ended && endResult.winner) {
      router.navigate('winner', { roomCode });
    } else {
      // Re-render scoring form for next round
      toast.show(`Round ${rounds.length + 1} submitted`);
      _render(container, roomCode);
    }
  } catch (e) {
    console.error('Submit round failed:', e);
    toast.show('Submit failed');
    btn.disabled = false;
    btn.innerHTML = 'CONFIRM ROUND <span class="material-symbols-outlined text-lg">check</span>';
  }
}
