// ═══════════════════════════════════════════
// Reactive State Store
// ═══════════════════════════════════════════

const _state = {};
const _listeners = new Map();

export function get(key) {
  return key ? _state[key] : { ..._state };
}

export function set(key, value) {
  const prev = _state[key];
  _state[key] = value;
  if (prev !== value) {
    _emit(key, value, prev);
  }
}

export function update(key, fn) {
  set(key, fn(_state[key]));
}

export function on(key, fn) {
  if (!_listeners.has(key)) _listeners.set(key, new Set());
  _listeners.get(key).add(fn);
  return () => _listeners.get(key).delete(fn);
}

function _emit(key, value, prev) {
  const fns = _listeners.get(key);
  if (fns) fns.forEach((fn) => fn(value, prev));
  // Also emit wildcard
  const wild = _listeners.get('*');
  if (wild) wild.forEach((fn) => fn(key, value, prev));
}

// ── Convenience getters ──

let _cachedHostRoomCode = null;
let _cachedHostKey = null;

// Helper to clear cache if host key gets set after initial read
export function clearHostCache() {
  _cachedHostRoomCode = null;
  _cachedHostKey = null;
}

export function isHost() {
  const roomCode = get('roomCode');
  if (!roomCode) return false;

  // Bolt Optimization: Memoize localStorage read to avoid synchronous IO blocking hot render paths
  if (_cachedHostRoomCode !== roomCode) {
    _cachedHostRoomCode = roomCode;
    _cachedHostKey = localStorage.getItem(`gns_host_${roomCode}`);
  }

  const meta = get('roomMeta');
  return _cachedHostKey && meta && _cachedHostKey === meta.hostKey;
}

export function currentGame() {
  const games = get('games');
  const meta = get('roomMeta');
  if (!games || !meta || !meta.activeGameId) return null;
  return games[meta.activeGameId] || null;
}

export function activePlayers() {
  const players = get('players');
  if (!players) return [];
  return Object.values(players)
    .filter((p) => p.isActive)
    .sort((a, b) => a.seatOrder - b.seatOrder);
}

// ── Accent colors ──
export const ACCENT_COLORS = [
  '#0047FF', '#FF2E2E', '#FFB800', '#00B85C', '#8B5CF6',
  '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16',
];
