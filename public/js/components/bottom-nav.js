// ═══════════════════════════════════════════
// Bottom Navigation Bar
// ═══════════════════════════════════════════

import * as state from '../state.js';
import * as router from '../router.js';

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

let _activeTab = 'dashboard';

export function show(activeTab = 'dashboard') {
  const nav = document.getElementById('bottom-nav');
  nav.style.display = 'flex';
  _activeTab = activeTab;
  render();
}

export function hide() {
  const nav = document.getElementById('bottom-nav');
  nav.style.display = 'none';
}

export function setActive(tabId) {
  _activeTab = tabId;
  render();
}

export function getActive() {
  return _activeTab;
}

function render() {
  const nav = document.getElementById('bottom-nav');
  const tabs = state.isHost() ? TABS.host : TABS.viewer;

  nav.innerHTML = tabs
    .map(
      (tab) => `
    <div class="nav-item ${tab.id === _activeTab ? 'active' : ''}" data-tab="${tab.id}">
      <span class="material-symbols-outlined" ${tab.id === _activeTab ? 'style="font-variation-settings: \'FILL\' 1;"' : ''}>${tab.icon}</span>
      <span>${tab.label}</span>
    </div>
  `
    )
    .join('');

  // Bind clicks
  nav.querySelectorAll('.nav-item').forEach((el) => {
    el.addEventListener('click', () => {
      const tabId = el.dataset.tab;
      if (tabId !== _activeTab) {
        _activeTab = tabId;
        render();
        // Emit tab change event
        state.set('activeTab', tabId);
      }
    });
  });
}
