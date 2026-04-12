// ═══════════════════════════════════════════
// Hash-based SPA Router
// ═══════════════════════════════════════════

const _screens = new Map();
let _currentId = null;
let _container = null;
let _direction = 'forward'; // 'forward' or 'back'
const _history = [];

export function registerScreen(id, { mount, unmount }) {
  _screens.set(id, { mount, unmount });
}

export function init(containerId) {
  _container = document.getElementById(containerId);
  window.addEventListener('hashchange', _onHashChange);
  // Handle initial route
  _onHashChange();
}

export function navigate(screenId, params = {}, direction = 'forward') {
  _direction = direction;
  if (direction === 'forward' && _currentId) {
    _history.push(_currentId);
  }
  const hash = `#${screenId}`;
  if (window.location.hash === hash) {
    // Same hash — force re-render
    _renderScreen(screenId, params);
  } else {
    window._routeParams = params;
    window.location.hash = hash;
  }
}

export function back() {
  const prev = _history.pop();
  if (prev) {
    navigate(prev, {}, 'back');
  }
}

export function currentScreen() {
  return _currentId;
}

function _onHashChange() {
  const hash = window.location.hash.replace('#', '') || 'home';
  const params = window._routeParams || {};
  window._routeParams = null;
  _renderScreen(hash, params);
}

function _renderScreen(screenId, params = {}) {
  const screen = _screens.get(screenId);
  if (!screen) {
    console.warn(`Screen "${screenId}" not registered`);
    return;
  }

  // Unmount current
  if (_currentId) {
    const currentEl = _container.querySelector('.screen.active');
    const currentScreen = _screens.get(_currentId);
    if (currentScreen && currentScreen.unmount) {
      currentScreen.unmount();
    }
    if (currentEl) {
      currentEl.classList.remove('active');
      currentEl.classList.add(_direction === 'forward' ? 'exit-left' : 'exit-right');
      setTimeout(() => currentEl.remove(), 220);
    }
  }

  // Mount new
  const el = document.createElement('div');
  el.className = `screen ${_direction === 'forward' ? 'enter-right' : 'enter-left'}`;
  el.id = `screen-${screenId}`;
  _container.appendChild(el);

  screen.mount(el, params);

  // Trigger transition
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      el.classList.remove('enter-right', 'enter-left');
      el.classList.add('active');
    });
  });

  _currentId = screenId;
}
