// ═══════════════════════════════════════════
// Room State Cache — localStorage mirror
// ═══════════════════════════════════════════
//
// Mirrors `roomMeta`, `players`, and `games` to localStorage so a cold open
// renders instantly from the last-known snapshot while Firebase reconnects
// in the background. Firebase's own socket handles deltas after reconnect.
//
// Two knobs:
//   SCHEMA_VERSION — bump when the shape of meta/players/games changes in a
//     breaking way. Any mismatch wipes every gns_cache_* entry on next boot.
//     Independent of the service worker's asset VERSION (see docs/CACHING.md).
//   TTL_MS — stale entries are evicted on read. Protects against a user
//     rejoining a long-dead room and seeing a multi-day-old snapshot.
//
// Keys: `gns_cache_<roomCode>` → { ts, meta, players, games }

const SCHEMA_VERSION = 1;
const SCHEMA_KEY = 'gns_schema_version';
const PREFIX = 'gns_cache_';
const TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

// Run once on module load: if the stored schema doesn't match, purge every
// gns_cache_* entry. Schema bumps are rare and intentional — this is safe.
(function enforceSchema() {
  try {
    const stored = parseInt(localStorage.getItem(SCHEMA_KEY), 10);
    if (stored !== SCHEMA_VERSION) {
      clearAllCaches();
      localStorage.setItem(SCHEMA_KEY, String(SCHEMA_VERSION));
    }
  } catch {
    // localStorage may be unavailable (private mode, quota, etc.) — non-fatal.
  }
})();

export function writeCache(roomCode, snapshot) {
  if (!roomCode || !snapshot) return;
  try {
    const entry = {
      ts: Date.now(),
      meta: snapshot.meta || null,
      players: snapshot.players || null,
      games: snapshot.games || null,
    };
    localStorage.setItem(PREFIX + roomCode, JSON.stringify(entry));
  } catch (e) {
    // Quota exceeded or serialization error — non-fatal, just means the
    // next cold open will wait for Firebase instead of hydrating instantly.
    console.warn('Room cache write failed:', e);
  }
}

export function readCache(roomCode) {
  if (!roomCode) return null;
  try {
    const raw = localStorage.getItem(PREFIX + roomCode);
    if (!raw) return null;
    const entry = JSON.parse(raw);
    if (!entry || typeof entry.ts !== 'number') return null;
    if (Date.now() - entry.ts > TTL_MS) {
      localStorage.removeItem(PREFIX + roomCode);
      return null;
    }
    return entry;
  } catch {
    return null;
  }
}

export function clearCache(roomCode) {
  if (!roomCode) return;
  try {
    localStorage.removeItem(PREFIX + roomCode);
  } catch {
    // ignore
  }
}

export function clearAllCaches() {
  try {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(PREFIX)) keys.push(k);
    }
    keys.forEach((k) => localStorage.removeItem(k));
  } catch {
    // ignore
  }
}
