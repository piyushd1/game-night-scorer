// ═══════════════════════════════════════════
// Bottom Navigation Bar
// ═══════════════════════════════════════════

import * as state from '../state.js';
import * as router from '../router.js';
import { getGame } from '../games/registry.js';

const LOBBY_TAB = { id: 'lobby', icon: 'group', label: 'LOBBY' };

const TABS = {
  host: [
    { id: 'dashboard', icon: 'dashboard', label: 'DASHBOARD' },
    { id: 'rules', icon: 'menu_book', label: 'RULES' },
    { id: 'scoring', icon: 'calculate', label: 'SCORING' },
  ],
  viewer: [
    { id: 'dashboard', icon: 'dashboard', label: 'DASHBOARD' },
    { id: 'rules', icon: 'menu_book', label: 'RULES' },
  ],
};

// Flip 7 uses inline scoring and has no rules tab — just Lobby + the game itself.
// The game tab (labeled with the game's name, e.g. "FLIP 7") only appears while
// the game is in progress; once it's finished only the Lobby tab remains.
function flip7Tabs(game) {
  const lobby = state.get('roomLobby') || {};
  const tabs = [LOBBY_TAB];
  // The game tab only appears while a game is actually in progress. Ending a
  // game flips lobby.status back to 'waiting' (the game may linger as activeGameId),
  // so gate on that rather than the game's own status alone.
  if (lobby.status === 'playing' && game?.status === 'active') {
    const gameLabel = (getGame(game?.type)?.label || 'Game').toUpperCase();
    tabs.push({ id: 'dashboard', icon: 'dashboard', label: gameLabel });
  }
  return tabs;
}

let _activeTab = 'dashboard';

export function show(activeTab = 'dashboard') {
  const nav = document.getElementById('bottom-nav');
  nav.style.display = 'flex';

  // Remove no-nav from current active screen
  const activeScreen = document.querySelector('.screen.active');
  if (activeScreen) activeScreen.classList.remove('no-nav');

  _activeTab = activeTab;
  render();
}

export function hide() {
  const nav = document.getElementById('bottom-nav');
  nav.style.display = 'none';

  // Add no-nav to current active screen
  const activeScreen = document.querySelector('.screen.active');
  if (activeScreen) activeScreen.classList.add('no-nav');
}

export function setActive(tabId) {
  _activeTab = tabId;
  render();
}

/**
 * Re-render the nav (e.g. after game data loads so the tab set reflects the
 * current game type). No-op when the nav is hidden.
 */
export function refresh() {
  const nav = document.getElementById('bottom-nav');
  if (!nav || nav.style.display === 'none') return;
  render();
}

export function getActive() {
  return _activeTab;
}

function render() {
  const nav = document.getElementById('bottom-nav');
  const game = state.currentGame();

  // Flip 7 swaps the rules tab for a Lobby tab and renames Dashboard to "Game".
  // On the lobby with no active Flip 7 game, only the Lobby tab is shown.
  let tabs;
  if (game?.type === 'flip7') {
    tabs = flip7Tabs(game);
  } else if (_activeTab === 'lobby') {
    tabs = [LOBBY_TAB];
  } else {
    tabs = state.isHost() ? TABS.host : TABS.viewer;
  }

  // Add ARIA attributes to indicate it is a tablist
  nav.setAttribute('role', 'tablist');

  nav.innerHTML = tabs
    .map(
      (tab) => `
    <button type="button" role="tab" aria-selected="${tab.id === _activeTab}" aria-controls="screen-container" id="tab-${tab.id}" class="nav-item ${tab.id === _activeTab ? 'active' : ''}" data-tab="${tab.id}">
      <span class="material-symbols-outlined" aria-hidden="true" ${tab.id === _activeTab ? 'style="font-variation-settings: \'FILL\' 1;"' : ''}>${tab.icon}</span>
      <span>${tab.label}</span>
    </button>
  `
    )
    .join('');

  // Direct routing on click — no state indirection
  nav.querySelectorAll('.nav-item').forEach((el) => {
    el.addEventListener('click', () => {
      const tabId = el.dataset.tab;
      if (tabId === _activeTab) return;
      _activeTab = tabId;
      render();
      const roomCode = state.get('roomCode');
      router.navigate(tabId, { roomCode });
    });
  });
}
