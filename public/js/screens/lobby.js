// ═══════════════════════════════════════════
// Lobby Screen — Player Roster Management
// ═══════════════════════════════════════════

import * as state from '../state.js';
import * as fb from '../firebase.js';
import * as router from '../router.js';
import * as toast from '../components/toast.js';
import * as bottomNav from '../components/bottom-nav.js';
import { ACCENT_COLORS } from '../state.js';

let _unsub = null;

export function mount(container, params = {}) {
  bottomNav.hide();

  const roomCode = params.roomCode || state.get('roomCode');
  if (!roomCode) {
    router.navigate('home');
    return;
  }

  state.set('roomCode', roomCode);

  // Show top bar
  const topBar = document.getElementById('top-bar');
  topBar.style.display = 'flex';
  document.getElementById('top-bar-title').textContent = 'LOBBY';
  document.getElementById('top-bar-back').classList.remove('hidden');
  document.getElementById('top-bar-back').onclick = () => {
    fb.unwatchRoom();
    router.navigate('home', {}, 'back');
  };
  document.getElementById('top-bar-actions').innerHTML = '';

  container.innerHTML = `
    <div class="p-6 pb-32">
      <!-- Room Code -->
      <div class="bg-surface-container-lowest border border-outline p-6 mb-6">
        <p class="font-mono text-[10px] uppercase tracking-widest text-outline mb-2">ROOM PIN</p>
        <div class="flex items-center justify-between">
          <span class="font-mono text-3xl font-bold tracking-[0.3em]">${roomCode}</span>
          <button id="btn-copy" class="font-mono text-[10px] uppercase tracking-widest border border-outline px-3 py-2 hover:bg-surface-container-high transition-colors">
            COPY LINK
          </button>
        </div>
      </div>

      <!-- Host-only: Add Player -->
      <div id="host-controls" style="display:none">
        <h2 class="font-headline font-extrabold uppercase text-sm tracking-widest mb-4">PLAYERS</h2>

        <!-- Always-visible inline add -->
        <div class="flex gap-2 mb-4">
          <input
            id="input-player-name"
            type="text"
            maxlength="12"
            placeholder="Player name..."
            autocomplete="off"
            autocorrect="off"
            autocapitalize="characters"
            class="flex-1 bg-surface-container-lowest border border-outline font-headline font-bold text-sm uppercase py-3 px-4 placeholder:text-outline placeholder:normal-case placeholder:font-normal focus:outline-none focus:border-primary transition-colors"
          >
          <button id="btn-confirm-add" class="bg-primary text-on-primary px-4 font-headline font-bold text-sm uppercase tracking-widest flex items-center gap-1 hover:opacity-90 transition-opacity shrink-0">
            <span class="material-symbols-outlined text-lg">add</span>
          </button>
        </div>
      </div>

      <!-- Viewer label -->
      <div id="viewer-label" class="mb-4" style="display:none">
        <div class="bg-surface-container-high border border-outline p-4 text-center">
          <p class="font-mono text-[10px] uppercase tracking-widest text-outline">SPECTATOR MODE</p>
          <p class="font-body text-sm text-on-surface-variant mt-1">Waiting for the host to start a game...</p>
        </div>
      </div>

      <!-- Player List -->
      <div id="player-list" class="flex flex-col gap-1"></div>

      <!-- Night Recap (visible after at least 1 game) -->
      <div id="recap-section" class="mt-6" style="display:none">
        <button id="btn-recap" class="w-full bg-surface-container-lowest border border-outline py-3 font-headline font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-surface-container-high transition-colors">
          <span class="material-symbols-outlined text-sm">bar_chart</span>
          NIGHT RECAP
        </button>
      </div>

      <!-- Start Game (host only) -->
      <div id="start-section" class="mt-4" style="display:none">
        <button id="btn-start-game" class="btn-primary flex items-center justify-center gap-2" disabled>
          CHOOSE GAME
          <span class="material-symbols-outlined text-lg">arrow_forward</span>
        </button>
        <p id="start-hint" class="font-mono text-[10px] text-outline text-center mt-2 uppercase">ADD AT LEAST 2 PLAYERS</p>
      </div>
    </div>
  `;

  _bindEvents(container, roomCode);
  _startWatching(roomCode, container);
}

export function unmount() {
  // Keep the room watcher alive — we still need it
}

function _bindEvents(container, roomCode) {
  // Copy link
  container.querySelector('#btn-copy').addEventListener('click', () => {
    const url = `${window.location.origin}${window.location.pathname}?room=${roomCode}`;
    navigator.clipboard.writeText(url).then(() => {
      const btn = container.querySelector('#btn-copy');
      btn.textContent = 'COPIED';
      setTimeout(() => { btn.textContent = 'COPY LINK'; }, 2000);
    }).catch(() => toast.show('Copy failed'));
  });

  // Add player — inline always-visible
  container.querySelector('#btn-confirm-add')?.addEventListener('click', () => _addPlayer(container, roomCode));
  container.querySelector('#input-player-name')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') _addPlayer(container, roomCode);
  });

  // Start game
  container.querySelector('#btn-start-game')?.addEventListener('click', () => {
    const meta = state.get('roomMeta');
    if (meta?.activeGameId && meta?.status === 'playing') {
      router.navigate('dashboard');
    } else {
      router.navigate('game-select', { roomCode });
    }
  });

  // Night recap
  container.querySelector('#btn-recap')?.addEventListener('click', () => {
    router.navigate('recap', { roomCode });
  });
}

async function _addPlayer(container, roomCode) {
  const input = container.querySelector('#input-player-name');
  const name = input.value.trim();
  if (!name) {
    toast.show('Enter a name');
    return;
  }

  // Check for duplicate names
  const players = state.get('players') || {};
  const nameUpper = name.toUpperCase();
  const duplicate = Object.values(players).some((p) => p.name === nameUpper);
  if (duplicate) {
    toast.show('Name already exists');
    input.select();
    return;
  }

  const count = Object.keys(players).length;
  const accentIndex = count % ACCENT_COLORS.length;

  try {
    await fb.addPlayer(roomCode, name, count, accentIndex);
    input.value = '';
    input.focus();
  } catch (e) {
    toast.show('Failed to add player');
  }
}

function _startWatching(roomCode, container) {
  fb.watchRoom(roomCode, (data) => {
    if (!data) {
      toast.show('Room not found');
      router.navigate('home');
      return;
    }

    const isHost = state.isHost();
    const meta = data.meta || {};
    const players = data.players || {};

    // Show/hide host controls
    container.querySelector('#host-controls').style.display = isHost ? 'block' : 'none';
    container.querySelector('#viewer-label').style.display = isHost ? 'none' : 'block';
    container.querySelector('#start-section').style.display = isHost ? 'block' : 'none';

    // If game is active and viewer just joined, go to dashboard
    if (!isHost && meta.status === 'playing' && meta.activeGameId) {
      router.navigate('dashboard', { roomCode });
      return;
    }

    // Render player list
    _renderPlayers(container, players, isHost, roomCode);

    // Show recap button if any games have been played
    const games = data.games || {};
    const hasPlayedGames = Object.values(games).some((g) => g.rounds && Object.keys(g.rounds).length > 0);
    const recapSection = container.querySelector('#recap-section');
    if (recapSection) recapSection.style.display = hasPlayedGames ? 'block' : 'none';

    // Enable/disable start
    const activeCount = Object.values(players).filter((p) => p.isActive).length;
    const btn = container.querySelector('#btn-start-game');
    const hint = container.querySelector('#start-hint');
    if (btn) {
      btn.disabled = activeCount < 2;
      if (meta.status === 'playing') {
        btn.textContent = 'RETURN TO GAME';
        btn.querySelector('.material-symbols-outlined')?.remove();
        btn.disabled = false;
        hint.textContent = '';
      } else {
        hint.textContent = activeCount < 2 ? 'ADD AT LEAST 2 PLAYERS' : `${activeCount} PLAYERS READY`;
      }
    }
  });
}

function _renderPlayers(container, players, isHost, roomCode) {
  const list = container.querySelector('#player-list');
  const sorted = Object.values(players).sort((a, b) => a.seatOrder - b.seatOrder);

  if (sorted.length === 0) {
    list.innerHTML = `
      <div class="text-center py-12">
        <span class="material-symbols-outlined text-4xl text-outline mb-2">group_add</span>
        <p class="font-body text-sm text-on-surface-variant">${isHost ? 'Add players to get started' : 'Waiting for host to add players...'}</p>
      </div>
    `;
    return;
  }

  list.innerHTML = sorted
    .map((p) => {
      const color = ACCENT_COLORS[p.accentIndex % ACCENT_COLORS.length];
      const inactive = !p.isActive ? 'opacity-40' : '';
      return `
        <div class="bg-surface-container-lowest border border-outline ${inactive} flex items-center">
          <div class="w-1.5 self-stretch" style="background:${color}"></div>
          <div class="flex-1 p-4 flex items-center gap-3">
            <div class="w-10 h-10 border border-outline flex items-center justify-center font-mono font-bold text-sm" style="border-top: 3px solid ${color}">
              ${p.name.substring(0, 2)}
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <p class="font-headline font-extrabold text-sm uppercase truncate">${p.name}</p>
                ${p.seatOrder === 0 ? '<span class="font-mono text-[8px] bg-primary text-on-primary px-1.5 py-0.5 uppercase tracking-widest shrink-0">HOST</span>' : ''}
              </div>
              <p class="font-mono text-[10px] text-outline uppercase">${p.isActive ? 'ACTIVE' : 'INACTIVE'}</p>
            </div>
            ${isHost ? `
              <div class="flex gap-1">
                <button class="player-toggle p-1.5 hover:bg-surface-container-high transition-colors" data-id="${p.id}" data-active="${p.isActive}">
                  <span class="material-symbols-outlined text-sm">${p.isActive ? 'person_off' : 'person'}</span>
                </button>
                <button class="player-remove p-1.5 hover:bg-surface-container-high transition-colors" data-id="${p.id}">
                  <span class="material-symbols-outlined text-sm text-error">close</span>
                </button>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    })
    .join('');

  // Bind player action buttons
  if (isHost) {
    list.querySelectorAll('.player-toggle').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const isActive = btn.dataset.active === 'true';
        fb.updatePlayer(roomCode, id, { isActive: !isActive });
      });
    });

    list.querySelectorAll('.player-remove').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        fb.removePlayer(roomCode, id);
      });
    });
  }
}
