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

*(Ships in the follow-up PR — P4b. This section will describe the data mirror and its schema version once implemented.)*

Summary of intent: mirror `roomMeta`, `players`, and `games` to localStorage keyed by room code, so a cold open renders instantly from the cached snapshot while Firebase's persistent socket reconciles over its usual delta sync. The mirror will have a separate `SCHEMA_VERSION` constant, independent of the SW's asset version. Bumping `SCHEMA_VERSION` purges local game data on next open — use it only when the Firebase data shape changes in a breaking way.

## Release process

### Ordinary release (bug fix, feature, any merge to `main`)

1. Merge the PR. That's it.
2. The merge workflow stamps `sw.js` with the new short SHA and deploys.
3. Clients get the new asset cache on their next cold open.
4. Users' cached game data in localStorage is untouched — in-progress games keep working.

### Major release (breaking data-shape change)

1. Bump `SCHEMA_VERSION` in the localStorage mirror (see P4b once it lands).
2. Merge. The SW version bumps as usual; the schema version bump wipes cached game data on next open so clients don't render stale shapes.

## Adding or removing a precached asset

Edit the `APP_SHELL` array in [`public/sw.js`](../public/sw.js). Keep it aligned with the files actually shipped under `/public`. There's no automated check — if you add a new screen or game module and forget to list it here, offline cold starts for that file will fall through to the network (which is often fine, just not offline-safe).
