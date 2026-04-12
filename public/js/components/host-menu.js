// ═══════════════════════════════════════════
// Shared Host Menu Component
// ═══════════════════════════════════════════
// Lives in index.html as a fixed overlay.
// Screens call show/hide and bind actions.

import * as state from '../state.js';
import * as fb from '../firebase.js';
import * as router from '../router.js';
import * as toast from './toast.js';

let _bound = false;

export function init() {
  if (_bound) return;
  _bound = true;

  const overlay = document.getElementById('host-menu-overlay');
  const backdrop = document.getElementById('host-menu-backdrop');
  if (!overlay || !backdrop) return;

  // Close on backdrop click
  backdrop.addEventListener('click', hide);

  // Bind menu actions
  overlay.querySelectorAll('.host-menu-action').forEach((btn) => {
    btn.addEventListener('click', () => {
      hide();
      const action = btn.dataset.action;
      const roomCode = state.get('roomCode');

      if (action === 'new-game') {
        fb.setRoomStatus(roomCode, 'lobby');
        router.navigate('game-select', { roomCode });
      } else if (action === 'lobby') {
        router.navigate('lobby', { roomCode });
      } else if (action === 'end-game') {
        fb.setRoomStatus(roomCode, 'lobby');
        toast.show('Game ended');
        router.navigate('lobby', { roomCode });
      } else if (action === 'home') {
        fb.unwatchRoom();
        router.navigate('home', {}, 'back');
      }
    });
  });
}

export function toggle() {
  const overlay = document.getElementById('host-menu-overlay');
  if (!overlay) return;
  if (overlay.style.display === 'none') {
    show();
  } else {
    hide();
  }
}

export function show() {
  init();
  const overlay = document.getElementById('host-menu-overlay');
  if (overlay) overlay.style.display = 'block';
}

export function hide() {
  const overlay = document.getElementById('host-menu-overlay');
  if (overlay) overlay.style.display = 'none';
}

/**
 * Render the appropriate top-bar actions for an active game screen.
 * Call this from dashboard/scoring/rules mount.
 * Shows: room code + (host: 3-dot menu | viewer: exit button)
 */
export function renderTopBarActions(roomCode) {
  const isHost = state.isHost();
  const actionsEl = document.getElementById('top-bar-actions');
  if (!actionsEl) return;

  actionsEl.innerHTML = `
    <span class="font-mono text-[10px] text-outline border border-outline px-2 py-1">${roomCode}</span>
    ${isHost
      ? `<button id="btn-host-menu-trigger" class="material-symbols-outlined hover:bg-surface-container-high transition-colors p-1 ml-1" style="font-size:22px">more_vert</button>`
      : `<button id="btn-viewer-leave" class="material-symbols-outlined hover:bg-surface-container-high transition-colors p-1 ml-1" style="font-size:22px" title="Leave room">logout</button>`
    }
  `;

  // Bind trigger
  const menuTrigger = document.getElementById('btn-host-menu-trigger');
  if (menuTrigger) {
    menuTrigger.addEventListener('click', toggle);
  }

  const leaveBtn = document.getElementById('btn-viewer-leave');
  if (leaveBtn) {
    leaveBtn.addEventListener('click', () => {
      fb.unwatchRoom();
      router.navigate('home', {}, 'back');
    });
  }
}
