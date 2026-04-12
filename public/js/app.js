// ═══════════════════════════════════════════
// Game Night Scorer — App Entry
// ═══��═══════════════════════════════════════

import { initFirebase } from './firebase.js';
import * as router from './router.js';
import * as state from './state.js';
import * as fb from './firebase.js';

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

  // Check URL for room code
  const urlParams = new URLSearchParams(window.location.search);
  const roomCode = urlParams.get('room');

  if (roomCode && fb.isConfigured()) {
    // Try to join the room from URL
    try {
      const code = await fb.joinRoom(roomCode);
      if (code) {
        window.location.hash = '#lobby';
        window._routeParams = { roomCode: code };
      }
    } catch (e) {
      console.warn('Room from URL not found');
    }
  }

  // Start router
  router.init('screen-container');

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
