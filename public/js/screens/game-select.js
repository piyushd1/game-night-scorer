// ═══════════════════════════════════════════
// Game Select Screen
// ═══════════════════════════════════════════

import * as state from '../state.js';
import * as fb from '../firebase.js';
import * as router from '../router.js';
import * as toast from '../components/toast.js';
import * as bottomNav from '../components/bottom-nav.js';
import { getGame, getAllGames } from '../games/registry.js';

let _selectedGame = null;

export function mount(container, params = {}) {
  bottomNav.hide();
  const roomCode = params.roomCode || state.get('roomCode');

  const topBar = document.getElementById('top-bar');
  topBar.style.display = 'flex';
  document.getElementById('top-bar-title').textContent = 'SELECT GAME';
  document.getElementById('top-bar-back').classList.remove('hidden');
  document.getElementById('top-bar-back').onclick = () => router.navigate('lobby', { roomCode }, 'back');
  document.getElementById('top-bar-actions').innerHTML = '';

  _selectedGame = null;

  const players = state.activePlayers();
  const playerCount = players.length;
  const games = getAllGames();

  container.innerHTML = `
    <div class="p-6 pb-32">
      <div class="flex justify-between items-end mb-6">
        <div>
          <p class="font-mono text-[10px] uppercase tracking-widest text-outline mb-1">CHOOSE YOUR GAME</p>
          <h2 class="font-headline font-black text-2xl uppercase tracking-tight">What are we playing?</h2>
        </div>
        <span class="font-mono text-[10px] border border-outline px-2 py-1 uppercase">${playerCount} Players</span>
      </div>

      <!-- Game Cards -->
      <div class="flex flex-col gap-1 border-t border-l border-outline" id="game-cards">
        ${games.map((g) => {
          const compatible = playerCount >= g.minPlayers && playerCount <= g.maxPlayers;
          return `
            <button class="game-card w-full text-left bg-surface-container-lowest border-r border-b border-outline p-6 transition-colors ${compatible ? 'hover:bg-surface-container group' : 'opacity-40 cursor-not-allowed'}" data-id="${g.id}" ${!compatible ? 'disabled' : ''}>
              <div class="flex justify-between items-start mb-3">
                <span class="font-mono text-[10px] text-outline tracking-widest uppercase">${g.minPlayers}-${g.maxPlayers} PLAYERS</span>
                <div class="w-6 h-6 border ${_selectedGame === g.id ? 'bg-primary border-primary' : 'border-outline'} flex items-center justify-center transition-colors">
                  ${_selectedGame === g.id ? '<span class="material-symbols-outlined text-white text-sm">check</span>' : ''}
                </div>
              </div>
              <h3 class="font-headline font-black text-2xl uppercase tracking-tighter mb-1 group-hover:text-secondary transition-colors">${g.label}</h3>
              <p class="text-on-surface-variant text-sm">${g.description}</p>
              <div class="flex gap-3 mt-3">
                <span class="font-mono text-[10px] text-outline uppercase">${g.winMode === 'highest_total' ? 'HIGHEST WINS' : 'LOWEST WINS'}</span>
              </div>
            </button>
          `;
        }).join('')}
      </div>

      <!-- Config Section (shown after selection) -->
      <div id="game-config" class="mt-6" style="display:none"></div>

      <!-- Start Button -->
      <div class="mt-8">
        <button id="btn-start" class="btn-primary flex items-center justify-center gap-2" disabled>
          START GAME
          <span class="material-symbols-outlined text-lg">arrow_forward</span>
        </button>
      </div>
    </div>
  `;

  // Bind card clicks
  container.querySelectorAll('.game-card:not([disabled])').forEach((card) => {
    card.addEventListener('click', () => {
      _selectedGame = card.dataset.id;
      _renderSelection(container);
      _renderConfig(container);
    });
  });

  // Start game
  container.querySelector('#btn-start').addEventListener('click', () => _startGame(container, roomCode));
}

export function unmount() {
  _selectedGame = null;
}

function _renderSelection(container) {
  container.querySelectorAll('.game-card').forEach((card) => {
    const indicator = card.querySelector('div:last-child > div');
    if (!indicator) return;
    const isSelected = card.dataset.id === _selectedGame;
    if (isSelected) {
      card.style.borderLeft = '3px solid #000000';
      indicator.className = 'w-6 h-6 border bg-primary border-primary flex items-center justify-center transition-colors';
      indicator.innerHTML = '<span class="material-symbols-outlined text-white text-sm">check</span>';
    } else {
      card.style.borderLeft = '';
      indicator.className = 'w-6 h-6 border border-outline flex items-center justify-center transition-colors';
      indicator.innerHTML = '';
    }
  });

  container.querySelector('#btn-start').disabled = !_selectedGame;
}

function _renderConfig(container) {
  const configEl = container.querySelector('#game-config');
  if (!_selectedGame) {
    configEl.style.display = 'none';
    return;
  }

  const game = getGame(_selectedGame);
  if (!game || !game.configFields || game.configFields.length === 0) {
    configEl.style.display = 'none';
    return;
  }

  configEl.style.display = 'block';
  configEl.innerHTML = `
    <div class="bg-surface-container-lowest border border-outline p-4">
      <p class="font-mono text-[10px] uppercase tracking-widest text-outline mb-4">GAME SETTINGS</p>
      ${game.configFields.map((f) => `
        <div class="flex items-center justify-between py-3 border-b border-outline-variant last:border-0">
          <label class="font-headline font-bold text-sm uppercase">${f.label}</label>
          <input
            type="number"
            id="config-${f.key}"
            value="${game.defaultConfig[f.key]}"
            min="${f.min || 1}"
            class="w-20 bg-transparent border-0 border-b-2 border-primary font-mono text-lg text-right py-1 px-0 focus:outline-none focus:border-secondary"
          >
        </div>
      `).join('')}
    </div>
  `;
}

async function _startGame(container, roomCode) {
  if (!_selectedGame) return;

  const game = getGame(_selectedGame);
  const players = state.activePlayers();
  const playerIds = players.map((p) => p.id);

  // Build config from form
  const config = { ...game.defaultConfig };
  if (game.configFields) {
    game.configFields.forEach((f) => {
      const input = container.querySelector(`#config-${f.key}`);
      if (input) config[f.key] = parseInt(input.value) || game.defaultConfig[f.key];
    });
  }

  // Build player snapshot
  const snapshot = {};
  players.forEach((p) => {
    snapshot[p.id] = { name: p.name, accentIndex: p.accentIndex, seatOrder: p.seatOrder };
  });

  const btn = container.querySelector('#btn-start');
  btn.disabled = true;
  btn.innerHTML = '<div class="spinner mx-auto"></div>';

  try {
    await fb.createGame(roomCode, _selectedGame, config, playerIds, snapshot);
    router.navigate('dashboard', { roomCode });
  } catch (e) {
    console.error('Start game failed:', e);
    toast.show('Failed to start game');
    btn.disabled = false;
    btn.innerHTML = 'START GAME <span class="material-symbols-outlined text-lg">arrow_forward</span>';
  }
}
