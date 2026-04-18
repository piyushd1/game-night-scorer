// ═══════════════════════════════════════════
// Game Night Scorer — App Entry
// ═══��═══════════════════════════════════════

import { initFirebase } from './firebase.js';
import * as router from './router.js';
import * as fb from './firebase.js';
import * as state from './state.js';

// ── Firebase Config ──
// Replace with your Firebase project config
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyB5p1wV0pcpUgAQH2Zz4pjXiCRoOQeKc5U",
  authDomain: "game-night-scorer.firebaseapp.com",
  databaseURL: "https://game-night-scorer-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "game-night-scorer",
  storageBucket: "game-night-scorer.firebasestorage.app",
  messagingSenderId: "410138952060",
  appId: "1:410138952060:web:1c537946e06b30b474a4f9",
  measurementId: "G-CE2HYH3XS9"
};

// ── Screen Imports ──
import * as homeScreen from './screens/home.js';
import * as lobbyScreen from './screens/lobby.js';
import * as gameSelectScreen from './screens/game-select.js';
import * as dashboardScreen from './screens/dashboard.js';
import * as rulesScreen from './screens/rules.js';
import * as scoringScreen from './screens/scoring.js';
import * as winnerScreen from './screens/winner.js';
import * as recapScreen from './screens/recap.js';
import * as hostMenu from './components/host-menu.js';

// ── Init ──
async function init() {
  // Init Firebase
  initFirebase(FIREBASE_CONFIG);

  // Register screens
  router.registerScreen('home', homeScreen);
  router.registerScreen('lobby', lobbyScreen);
  router.registerScreen('game-select', gameSelectScreen);
  router.registerScreen('dashboard', dashboardScreen);
  router.registerScreen('rules', rulesScreen);
  router.registerScreen('scoring', scoringScreen);
  router.registerScreen('winner', winnerScreen);
  router.registerScreen('recap', recapScreen);

  // Init shared host menu
  hostMenu.init();

  // Start router FIRST (before any navigation)
  router.init('screen-container');

  // Auto-navigate on night-ended / night-resumed status changes
  state.on('roomMeta', (newMeta, prevMeta) => {
    if (!newMeta) return;
    const screen = router.currentScreen();
    const roomCode = newMeta.roomCode || state.get('roomCode');
    if (!roomCode) return;

    if (newMeta.status === 'night-ended' && screen !== 'recap') {
      router.navigate('recap', { roomCode });
    } else if (prevMeta?.status === 'night-ended' && newMeta.status === 'lobby') {
      if (screen === 'recap') router.navigate('lobby', { roomCode });
    }
  });

  // Then check URL for room code and navigate via router
  const urlParams = new URLSearchParams(window.location.search);
  const roomCode = urlParams.get('room');

  if (roomCode && fb.isConfigured()) {
    try {
      const code = await fb.joinRoom(roomCode);
      if (code) {
        router.navigate('lobby', { roomCode: code });
      }
    } catch (e) {
      console.warn('Room from URL not found');
    }
  }

  // Register PWA service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
}

// Add shake keyframe for input validation
const style = document.createElement('style');
style.textContent = `
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    75% { transform: translateX(5px); }
  }
`;
document.head.appendChild(style);

init();
