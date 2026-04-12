// ═══════════════════════════════════════════
// Game Registry
// ═══════════════════════════════════════════

import flip7 from './flip7.js';
import papayoo from './papayoo.js';
import cabo from './cabo.js';

const _games = new Map();

_games.set('flip7', flip7);
_games.set('papayoo', papayoo);
_games.set('cabo', cabo);

export function getGame(id) {
  return _games.get(id) || null;
}

export function getAllGames() {
  return Array.from(_games.values());
}
