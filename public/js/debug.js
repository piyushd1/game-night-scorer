// ═══════════════════════════════════════════
// Debug Module — Staging Only
// ═══════════════════════════════════════════
// Activates via ?debug=1 URL param or localStorage gns_debug=1
// Provides runtime logging for router, state, firebase, and DOM health checks.
// This file should NEVER be shipped to production (main branch).

import * as state from './state.js';
import * as router from './router.js';
import * as fb from './firebase.js';

// ── Activation ──

let _debugActive = null;

function isDebug() {
  if (_debugActive !== null) return _debugActive;
  const urlFlag = new URLSearchParams(window.location.search).has('debug');
  const storageFlag = localStorage.getItem('gns_debug') === '1';
  _debugActive = urlFlag || storageFlag;
  if (_debugActive) localStorage.setItem('gns_debug', '1');
  return _debugActive;
}

// ── Event Buffer ──

const MAX_EVENTS = 30;
const _events = [];

function pushEvent(category, message, level = 'info') {
  const ts = new Date().toLocaleTimeString('en-US', { hour12: false, fractionalSecondDigits: 1 });
  const entry = { ts, category, message, level };
  _events.push(entry);
  if (_events.length > MAX_EVENTS) _events.shift();

  // Console output
  const prefix = `[${category}]`;
  if (level === 'warn') {
    console.warn(prefix, message);
  } else if (level === 'error') {
    console.error(prefix, message);
  } else {
    console.log(`%c${prefix}%c ${message}`, 'color: #0047FF; font-weight: bold', 'color: inherit');
  }

  _updatePanel();
}

// ── DOM Health Check ──

function checkDOM() {
  const container = document.getElementById('screen-container');
  if (!container) return;
  const screens = container.querySelectorAll('.screen');
  if (screens.length > 1) {
    const ids = Array.from(screens).map(el => el.id || 'unknown').join(', ');
    pushEvent('DOM', `SCREEN STACKING: ${screens.length} screens found [${ids}]`, 'error');
    container.style.outline = '3px solid red';
    setTimeout(() => { container.style.outline = ''; }, 2000);
  }
}

// ── Hook Registration ──

function registerHooks() {
  // Router hooks (via exported callbacks)
  router.onNavigate = (screenId, params, direction) => {
    pushEvent('ROUTER', `navigate → ${screenId} (${direction})`);
  };

  router.onRender = (screenId, screenCount) => {
    pushEvent('ROUTER', `mounted: ${screenId} (${screenCount} screen element${screenCount !== 1 ? 's' : ''} in DOM)`);
    if (screenCount > 1) {
      pushEvent('DOM', `STACKING DETECTED after mount: ${screenCount} .screen elements`, 'error');
    }
  };

  // Firebase hooks (via exported callback)
  fb.onFirebaseEvent = (event, data) => {
    if (event === 'watchRoom') {
      const meta = data.meta || {};
      const playerCount = data.players ? Object.keys(data.players).length : 0;
      pushEvent('FIREBASE', `watchRoom update — ${playerCount} players, status: ${meta.status || 'unknown'}`);
    } else {
      pushEvent('FIREBASE', `${event}(${JSON.stringify(data)})`);
    }
  };

  // State hooks (wildcard listener)
  state.on('*', (key, value, prev) => {
    // Summarize large objects
    let summary;
    if (value && typeof value === 'object') {
      const keys = Object.keys(value);
      summary = `{${keys.length} keys: ${keys.slice(0, 4).join(', ')}${keys.length > 4 ? '...' : ''}}`;
    } else {
      summary = JSON.stringify(value);
    }
    pushEvent('STATE', `set("${key}") → ${summary}`);
  });
}

// ── MutationObserver for screen-container ──

function watchContainer() {
  const container = document.getElementById('screen-container');
  if (!container) return;

  const observer = new MutationObserver(() => {
    checkDOM();
  });

  observer.observe(container, { childList: true });
}

// ── Debug Panel UI ──

let _panel = null;
let _collapsed = true;

function createPanel() {
  _panel = document.createElement('div');
  _panel.id = 'debug-panel';
  _panel.style.cssText = `
    position: fixed; bottom: 70px; left: 4px; z-index: 9999;
    font-family: 'Space Mono', monospace; font-size: 10px;
    background: #111; color: #ccc; border: 1px solid #444;
    max-width: 320px; width: calc(100vw - 8px);
    transition: height 0.2s;
    pointer-events: auto;
  `;

  // Toggle button
  const toggle = document.createElement('div');
  toggle.style.cssText = `
    padding: 4px 8px; cursor: pointer; background: #222;
    border-bottom: 1px solid #444; display: flex; justify-content: space-between;
    align-items: center; user-select: none;
  `;
  toggle.innerHTML = `<span style="color: #0047FF; font-weight: bold;">DEBUG</span><span id="debug-toggle-icon">+</span>`;
  toggle.addEventListener('click', () => {
    _collapsed = !_collapsed;
    body.style.display = _collapsed ? 'none' : 'block';
    document.getElementById('debug-toggle-icon').textContent = _collapsed ? '+' : '-';
  });

  // Body
  const body = document.createElement('div');
  body.id = 'debug-panel-body';
  body.style.cssText = `display: none; max-height: 300px; overflow-y: auto;`;

  // Info bar
  const info = document.createElement('div');
  info.id = 'debug-info';
  info.style.cssText = `padding: 4px 8px; background: #1a1a1a; border-bottom: 1px solid #333;`;

  // Events list
  const events = document.createElement('div');
  events.id = 'debug-events';
  events.style.cssText = `padding: 4px 0;`;

  body.appendChild(info);
  body.appendChild(events);
  _panel.appendChild(toggle);
  _panel.appendChild(body);
  document.body.appendChild(_panel);
}

function _updatePanel() {
  if (!_panel) return;

  // Info bar
  const info = _panel.querySelector('#debug-info');
  if (info) {
    const screen = router.currentScreen() || 'none';
    const roomCode = state.get('roomCode') || '-';
    const isHost = state.isHost() ? 'HOST' : 'VIEWER';
    info.innerHTML = `<span style="color: #FFB800">${screen}</span> | Room: ${roomCode} | ${isHost}`;
  }

  // Events
  const eventsEl = _panel.querySelector('#debug-events');
  if (eventsEl) {
    eventsEl.innerHTML = _events.slice(-20).reverse().map(e => {
      const color = e.level === 'error' ? '#FF2E2E' : e.level === 'warn' ? '#FFB800' : '#666';
      const catColor = e.category === 'ROUTER' ? '#0047FF'
        : e.category === 'STATE' ? '#00B85C'
        : e.category === 'FIREBASE' ? '#8B5CF6'
        : '#FF2E2E';
      return `<div style="padding: 2px 8px; border-bottom: 1px solid #222;">
        <span style="color: ${color}">${e.ts}</span>
        <span style="color: ${catColor}; font-weight: bold">[${e.category}]</span>
        <span>${e.message}</span>
      </div>`;
    }).join('');
  }
}

// ── Init ──

if (isDebug()) {
  // Wait for DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _boot);
  } else {
    _boot();
  }
}

function _boot() {
  pushEvent('DEBUG', 'Debug mode activated');
  registerHooks();
  watchContainer();
  createPanel();
  pushEvent('DEBUG', 'All hooks registered, panel ready');
}
