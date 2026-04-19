# Caching Strategy

Two independent layers. One handles code, the other handles data. They version separately.

## Layer 1 — Service Worker (asset cache)

Owns everything the app loads to render: HTML, JS, CSS, the manifest, vendor CDN assets. Lives in [`public/sw.js`](../public/sw.js).

| Kind | Strategy | Cache |
|---|---|---|
| Same-origin app shell (JS, CSS, HTML, manifest) | cache-first, precached on install | `gns-app-<VERSION>` |
| Cross-origin vendor assets (Google Fonts, Material Symbols, Tailwind CDN) | stale-while-revalidate | `gns-vendor-<VERSION>` |
| Firebase RTDB, Firebase SDK scripts, Google APIs | network-first (real-time data must not go stale) | — |
| Anything else cross-origin | pass-through, no cache | — |

### How versioning works

- `public/sw.js` ships with a literal placeholder: `const VERSION = '__VERSION__';`
- The deploy workflows ([`firebase-hosting-merge.yml`](../.github/workflows/firebase-hosting-merge.yml) and [`firebase-hosting-pull-request.yml`](../.github/workflows/firebase-hosting-pull-request.yml)) run a `sed` step before deploy that replaces `__VERSION__` with the short git SHA of the commit being deployed.
- Every merge to `main` produces a unique SW version. When a client next opens the app, it fetches the new `sw.js` (served `no-cache` by Firebase Hosting — see [`firebase.json`](../firebase.json)), detects a different `VERSION`, installs, and in its `activate` handler deletes every cache whose name doesn't match the new `gns-app-<VERSION>` / `gns-vendor-<VERSION>` keys.
- Net effect: **every production deploy = next cold open = fresh JS/CSS/HTML**. Developers don't bump a version manually.

### In local development

The `sed` replacement doesn't run locally. `VERSION` stays as the literal string `__VERSION__`, so the caches are named `gns-app-__VERSION__`. This is fine — nothing special happens, the SW just uses that constant key. To force a local cache reset, open DevTools → Application → Service Workers → Unregister, then reload.

### Why HTML stays `no-cache` at the edge

Even though the SW caches HTML for returning visitors, the Firebase Hosting `no-cache` header (set for `*.html`, `*.js`, `*.css`, `/` in [`firebase.json`](../firebase.json)) still matters:

1. First-time visitors have no SW registered yet. They get fresh HTML from the server, which loads the latest `sw.js`, which precaches the right assets. Without no-cache, a browser-cached `index.html` from before a deploy could bootstrap a stale SW.
2. When the SW goes to re-fetch during an update, no-cache ensures Firebase Hosting really serves the new bytes (no edge caching in the way).

## Layer 2 — localStorage (data mirror)

Owns the room state the user was last looking at: `roomMeta`, `players`, `games`. Lives in [`public/js/cache.js`](../public/js/cache.js).

| Concern | Mechanism |
|---|---|
| Storage | `localStorage`, keyed by `gns_cache_<roomCode>` → `{ ts, meta, players, games }` |
| Write | Every `roomRef.on('value')` callback in [`firebase.js`](../public/js/firebase.js) writes through to the cache after updating the state store |
| Read | [`app.js`](../public/js/app.js) reads on boot when `?room=<PIN>` is in the URL, hydrates the state store, and optimistically navigates to the Lobby — Firebase's watcher reconciles within ~1s |
| Eviction | Entries older than 12h are evicted on read (TTL guards against a user rejoining a long-dead room and seeing multi-day-old data) |
| Schema invalidation | Single `SCHEMA_VERSION` constant at the top of `cache.js`. Mismatch → wipe every `gns_cache_*` entry on module load |
| Room no longer exists | If the optimistic navigate rendered the cached snapshot but `fb.joinRoom` returns null, the cache entry is cleared and we fall back to Home |

### `SCHEMA_VERSION` vs. the SW's `VERSION`

They're independent on purpose:

- SW `VERSION` — bumps on **every** deploy (injected from the git SHA). Purges the **asset** cache, so the client runs the latest code on the next cold open. Does not touch user data.
- `SCHEMA_VERSION` — bumps **rarely**, only when the shape of `meta` / `players` / `games` in Firebase changes in a way that would make old cached entries crash the new code. Purges the **data** cache. User data in Firebase is untouched — only the local mirror is wiped.

A bug fix or UI change = SW bump only, in-progress games keep working. A Firebase schema migration = bump both.

### Release process

#### Ordinary release (bug fix, feature, any merge to `main`)

1. Merge the PR. That's it.
2. The merge workflow stamps `sw.js` with the new short SHA and deploys.
3. Clients get the new asset cache on their next cold open.
4. Users' cached game data in localStorage is untouched — in-progress games keep working.

#### Major release (breaking data-shape change)

1. Bump `SCHEMA_VERSION` in [`public/js/cache.js`](../public/js/cache.js).
2. Merge. The SW version bumps as usual; the schema bump wipes cached game data on next open so clients don't render stale shapes.

### When is the cache cleared?

- On read if the entry is older than TTL (12h)
- On boot if `SCHEMA_VERSION` doesn't match what's stored (purges every `gns_cache_*`)
- Explicitly via `cache.clearCache(roomCode)` — called in `app.js` when Firebase reports the room no longer exists; also available for "Leave Room" in P5

### What isn't cached

- Firebase RTDB deltas themselves. Once Firebase's socket is up, it handles incremental sync natively — the mirror is only for cold-start speed, not for replacing the live connection.
- Anything outside a specific room (stats across rooms, user preferences, etc.). Add new storage keys with a distinct prefix if needed.

## Adding or removing a precached asset

Edit the `APP_SHELL` array in [`public/sw.js`](../public/sw.js). Keep it aligned with the files actually shipped under `/public`. There's no automated check — if you add a new screen or game module and forget to list it here, offline cold starts for that file will fall through to the network (which is often fine, just not offline-safe).
