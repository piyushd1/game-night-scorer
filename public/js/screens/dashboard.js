// ═══════════════════════════════════════════
// Dashboard Screen — Live Scoreboard
// ═══════════════════════════════════════════

import * as state from '../state.js';
import * as fb from '../firebase.js';
import * as router from '../router.js';
import * as bottomNav from '../components/bottom-nav.js';
import * as toast from '../components/toast.js';
import * as hostMenu from '../components/host-menu.js';
import { renderRow } from '../components/player-row.js';
import { getGame } from '../games/registry.js';
import { ACCENT_COLORS } from '../state.js';

let _unsubTab = null;

export function mount(container, params = {}) {
  const roomCode = params.roomCode || state.get('roomCode');

  // Top bar
  const topBar = document.getElementById('top-bar');
  topBar.style.display = 'flex';
  document.getElementById('top-bar-back').classList.add('hidden');

  // Bottom nav
  bottomNav.show('dashboard');

  // Listen for tab changes
  _unsubTab = state.on('activeTab', (tab) => {
    if (tab === 'rules') router.navigate('rules', { roomCode });
    else if (tab === 'scoring') router.navigate('scoring', { roomCode });
  });

  container.innerHTML = `<div id="dash-content" class="p-6 pb-8"></div>`;

  // Watch for state changes
  const renderHandler = () => _render(container, roomCode);
  state.on('games', renderHandler);
  state.on('roomMeta', renderHandler);

  // Ensure room is being watched
  if (!state.get('roomCode')) {
    state.set('roomCode', roomCode);
  }
  if (!state.get('roomMeta')) {
    fb.watchRoom(roomCode, () => {});
  }

  // Initial render
  _render(container, roomCode);
}

export function unmount() {
  if (_unsubTab) _unsubTab();
  _unsubTab = null;
}

function _render(container, roomCode) {
  const content = container.querySelector('#dash-content');
  if (!content) return;

  const game = state.currentGame();
  const meta = state.get('roomMeta') || {};
  const isHost = state.isHost();

  if (!game) {
    document.getElementById('top-bar-title').textContent = 'GAME NIGHT';
    content.innerHTML = `
      <div class="text-center py-20">
        <span class="material-symbols-outlined text-5xl text-outline mb-4">casino</span>
        <p class="font-headline font-bold text-lg uppercase mb-2">No Active Game</p>
        <p class="font-body text-sm text-on-surface-variant">
          ${isHost ? 'Go back to the lobby to start a game.' : 'Waiting for the host to start a game...'}
        </p>
      </div>
    `;
    return;
  }

  const gameModule = getGame(game.type);
  if (!gameModule) return;

  const snapshot = game.playerSnapshot || {};
  const totals = game.totals || {};
  const rounds = game.rounds ? Object.values(game.rounds) : [];
  const playerIds = game.playerIds || [];

  // Title
  document.getElementById('top-bar-title').textContent = gameModule.label.toUpperCase();

  // Top bar actions — shared host menu component
  hostMenu.hide();
  hostMenu.renderTopBarActions(roomCode);

  // Derive standings
  const standings = gameModule.deriveStandings(totals, playerIds, gameModule.winMode);

  // Progress calculation
  let getProgress;
  if (gameModule.winMode === 'highest_total') {
    const target = game.config?.targetScore || 200;
    getProgress = (total) => Math.min(100, Math.round((total / target) * 100));
  } else if (game.type === 'papayoo') {
    const roundLimit = game.config?.roundLimit || 5;
    getProgress = () => Math.min(100, Math.round((rounds.length / roundLimit) * 100));
  } else {
    const threshold = game.config?.lossThreshold || 100;
    getProgress = (total) => Math.min(100, Math.round((total / threshold) * 100));
  }

  // Round points per player
  const roundPoints = {};
  playerIds.forEach((pid) => { roundPoints[pid] = []; });
  rounds.forEach((rnd) => {
    const applied = gameModule.applyRound({}, rnd, game);
    // We need per-player round deltas — compute from entries
    playerIds.forEach((pid) => {
      const prevTotal = roundPoints[pid].reduce((s, v) => s + v, 0);
      const currentTotal = totals[pid] || 0;
      // Simple: just show the entry value
      if (rnd.entries && rnd.entries[pid]) {
        const entry = rnd.entries[pid];
        if (game.type === 'flip7') {
          roundPoints[pid].push((entry.basePoints || 0) + (entry.flip7 ? 15 : 0));
        } else if (game.type === 'papayoo') {
          roundPoints[pid].push(entry.penaltyPoints || 0);
        } else {
          roundPoints[pid].push(entry.cardTotal || 0);
        }
      }
    });
  });

  // Check winner
  if (game.status === 'finished' && game.winner) {
    router.navigate('winner', { roomCode });
    return;
  }

  let html = '';

  // Overtime banner
  if (game.overtime || game.status === 'overtime') {
    html += `<div class="overtime-banner mb-4">TIE-BREAKER / OVERTIME</div>`;
  }

  // Game info bar
  html += `
    <div class="flex justify-between items-end mb-4">
      <div>
        <p class="font-mono text-[10px] uppercase tracking-widest text-outline">ROUND</p>
        <p class="font-mono text-xl font-bold">${rounds.length}${game.type === 'papayoo' ? `/${game.config?.roundLimit || 5}` : ''}</p>
      </div>
      <div class="text-right">
        <p class="font-mono text-[10px] uppercase tracking-widest text-outline">${gameModule.winMode === 'highest_total' ? 'TARGET' : game.type === 'cabo' ? 'BUST AT' : 'ROUNDS'}</p>
        <p class="font-mono text-xl font-bold">${gameModule.winMode === 'highest_total' ? game.config?.targetScore : game.type === 'cabo' ? '>100' : game.config?.roundLimit}</p>
      </div>
    </div>
  `;

  // Scoreboard
  html += `<div class="flex flex-col gap-1">`;
  standings.forEach((s, i) => {
    const p = snapshot[s.playerId] || {};
    html += renderRow({
      name: p.name || s.playerId,
      total: s.total,
      accentIndex: p.accentIndex || 0,
      rank: s.rank,
      rounds: roundPoints[s.playerId] || [],
      progressPct: getProgress(s.total),
      isLeader: s.rank === 1,
      winMode: gameModule.winMode,
    });
  });
  html += `</div>`;

  // Host actions
  if (isHost) {
    html += `
      <div class="flex gap-2 mt-6">
        <button id="btn-undo" class="flex-1 bg-surface-container-lowest border border-outline py-3 text-sm font-headline font-bold uppercase tracking-widest flex items-center justify-center gap-1 hover:bg-surface-container-high transition-colors disabled:opacity-30" ${rounds.length === 0 ? 'disabled' : ''}>
          <span class="material-symbols-outlined text-sm">undo</span>
          UNDO
        </button>
      </div>
    `;
  }

  content.innerHTML = html;

  // Bind host actions
  if (isHost) {
    content.querySelector('#btn-undo')?.addEventListener('click', () => _undoRound(roomCode, game, gameModule));
  }
}

async function _undoRound(roomCode, game, gameModule) {
  const rounds = game.rounds ? Object.values(game.rounds) : [];
  if (rounds.length === 0) return;

  // Recalculate totals without last round
  const playerIds = game.playerIds;
  const allRoundsExceptLast = rounds.slice(0, -1);
  let newTotals = Object.fromEntries(playerIds.map((id) => [id, 0]));

  allRoundsExceptLast.forEach((rnd) => {
    newTotals = gameModule.applyRound(newTotals, rnd, game);
  });

  try {
    await fb.undoLastRound(roomCode, game.gameId, newTotals, 'active');
    toast.show('Round undone');
  } catch (e) {
    toast.show('Undo failed');
  }
}
