# PLAN.md — Game Night Scorer

Product decisions, roadmap, and iteration log for the game-night-scorer project.

---

## What this is

A lightweight, real-time card game scorer built for Flip 7 game nights. Designed to run on phones, require zero installs, and sync live across all players. The north star: open a link, play, done.

---

## Design decisions

### Single HTML file
No React, no build step, no node_modules. The entire app is one `index.html`. This means:
- Anyone can host it anywhere (GitHub Pages, Firebase Hosting, Netlify, even a WhatsApp attachment)
- Zero maintenance overhead — no dependency updates, no security patches for npm packages
- Trivially forkable and editable by non-developers

The tradeoff is code organization. CSS and JS live in the same file. Acceptable for a tool of this size.

### Firebase Realtime Database over Firestore
Realtime Database (RTDB) was chosen over Firestore for this use case:
- WebSocket-based — sub-second push, no polling
- Simpler data model — our state is a single JSON object per game
- Free tier is sufficient (1 GB storage, 10 GB/month transfer)
- No complex querying needed — we just read/write one game node

Firestore would be overkill and adds latency via its REST-over-HTTP polling fallback.

### No authentication
Host identity is stored in `localStorage` keyed by game code. This is intentional:
- Friends don't need to create accounts
- No friction to join as spectator
- Good enough for a private game among known people

The risk (someone else claiming host) is negligible in a private game context.

### 6-character random game codes
Generated with `Math.random().toString(36).substring(2,8).toUpperCase()`. ~2.1 billion combinations. Collision probability is effectively zero for casual use. No lookup table needed.

---

## Current state (v1)

### ✅ Shipped
- [x] Dynamic player count (2–20)
- [x] Custom initials per player
- [x] Configurable win target
- [x] Firebase real-time sync
- [x] Host / spectator split
- [x] 6-char shareable game code
- [x] Copy link button
- [x] Flip 7 +15 bonus toggle (toggleable, editable until confirm)
- [x] Live mini-leaderboard in entry modal (updates on keystroke)
- [x] Progress bar per player toward win target
- [x] Highest score on top (descending sort)
- [x] 🥇🥈🥉 medals for top 3
- [x] Round chips with score per round
- [x] Winner detection + banner
- [x] Reset propagates to all devices
- [x] Row highlight on focus (no jumping rows)
- [x] 0-score rounds shown distinctly

---

## Roadmap

### V1.1 — Polish (next)
- [ ] **Game expiry** — auto-delete games older than 24h via Firebase Cloud Function. Prevents DB accumulating stale games forever.
- [ ] **Undo last round** — host can remove the most recent round. Essential for input mistakes.
- [ ] **Round history modal** — tap a round chip to see full breakdown for that round.
- [ ] **Haptic feedback** on confirm (mobile vibration API).
- [ ] **Dark/light theme toggle** — currently dark only.

### V1.2 — Multi-game support
- [ ] **Game lobby** — host can name a session (e.g. "Friday Night"). Multiple games run under one session.
- [ ] **Game history** — view past completed games within a session.
- [ ] **Other games** — scoring template for other card/board games (e.g. Rummy, 29, etc.). Name change from "Flip 7 Scorer" to "Game Night Scorer" is already reflected in the repo name.

### V1.3 — Social layer
- [ ] **Player stats** — across sessions, track each player's win count, average score, bust rate.
- [ ] **QR code** — generate a QR from the game code for in-person sharing (no typing needed).
- [ ] **Confetti animation** on winner declaration.
- [ ] **Sound effects** — subtle audio on round confirm and winner (toggleable).

### V2 — Auth + persistence (if this gets used regularly)
- [ ] **Firebase Auth** (Google Sign-In) — optional, for players who want persistent identity.
- [ ] **Player profiles** — name, avatar color, historical record.
- [ ] **Leaderboard across sessions** — who's won the most game nights.
- [ ] **Admin dashboard** — manage multiple ongoing game nights.

---

## Tech debt

| Item | Priority | Notes |
|---|---|---|
| Firebase security rules | High | Currently open test mode. Tighten to game-scoped write rules before sharing publicly. |
| Game code collision handling | Low | Theoretical. Add a check + retry on create if ever needed. |
| LocalStorage host key loss | Medium | If user clears browser data, host access is lost. Consider passing hostKey in URL hash (not querystring) so it's never sent to server but persists in share. |
| No input validation | Medium | Scores accept any number. Could add range validation (e.g. 0–200 per round). |
| Single file grows unwieldy | Low | If features keep being added, split into HTML + CSS file + JS file and bundle via a simple script. |

---

## Iteration log

### Session 1 — Initial build
- Built offline-only scorer with static 11-player grid
- Issues: always 11 players, lowest score sorted first, no bust support

### Session 2 — UX pass
- Dynamic player count (2–20)
- Sort descending (highest wins)
- Auto-rotate rows on fill → caused mis-taps on mobile
- Added BUST button and F7 toggle

### Session 3 — Fix UX, add live leaderboard
- Removed auto-rotation entirely — rows now stable
- Replaced rotation with green highlight on focused row
- Removed BUST button (enter 0 instead)
- Made F7 properly toggleable (on/off until submit)
- Added live mini-leaderboard in modal — updates on every keystroke

### Session 4 — Firebase multiplayer
- Firebase Realtime Database integration
- Host/spectator split via localStorage hostKey
- Game code generation and URL-based joining
- Copy link button
- Reset propagates to all devices
- Loading screen while connecting
- Config warning if Firebase not set up

---

## Out of scope (intentionally)

- **Chat / messaging** — this is a scorer, not a social app
- **Video/audio** — use a call for that
- **Card dealing simulation** — the app scores what happened, it doesn't play the game
- **Monetisation** — no ads, no paywall, this is a tool for personal use
