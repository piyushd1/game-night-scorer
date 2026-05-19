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

let _lastIsHostRoom = null;
let _lastIsHostMetaKey = null;
let _cachedIsHost = false;

export function clearHostCache() {
  _lastIsHostRoom = null;
}

export function isHost() {
  const roomCode = get('roomCode');
  if (!roomCode) return false;

  const meta = get('roomMeta');
  const metaKey = meta ? meta.hostKey : null;

  if (_lastIsHostRoom === roomCode && _lastIsHostMetaKey === metaKey) {
    return _cachedIsHost;
  }

  const storedKey = localStorage.getItem(`gns_host_${roomCode}`);
  _cachedIsHost = !!(storedKey && meta && storedKey === meta.hostKey);

  _lastIsHostRoom = roomCode;
  _lastIsHostMetaKey = metaKey;

  return _cachedIsHost;
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
