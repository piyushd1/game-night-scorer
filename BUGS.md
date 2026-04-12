# Bug Sheet — Game Night Scorer

**Date:** April 12, 2026 | **Based on:** Automated tests + full code audit

## Critical (Navigation Traps / Broken Flows)

| # | Bug | Location | Impact |
|---|-----|----------|--------|
| C1 | **Viewers stuck on winner screen** — no back button, no navigation. Dead end. | winner.js:80-84 | Viewers must close the tab |
| C2 | **Winner → "Choose New Game" doesn't reset room status** — lobby shows "RETURN TO GAME" instead of "CHOOSE GAME". Prevents starting new games. | winner.js:106-108, lobby.js:208-213 | Can't play multiple games per night |
| C3 | **No route guards** — navigating directly to #winner, #scoring, #recap without meeting preconditions shows broken/empty screens | router.js (no guards), all screens | Crashes on edge cases |
| C4 | **Tab navigation removes back button** — switching between Dashboard/Rules/Scoring via tabs hides the back button. No way to exit active game except host menu. | dashboard.js:22, scoring.js:26, rules.js | Viewers trapped in game view |

## High (Feature Gaps / Logic Errors)

| # | Bug | Location | Impact |
|---|-----|----------|--------|
| H1 | **Undo doesn't check game status** — can undo on a finished game, corrupting state | firebase.js:199-220 | Data corruption possible |
| H2 | **Replay creates game without checking active player count** — if players became inactive, game starts with ghost players | winner.js:90-104 | Invalid game state |
| H3 | **Stats toggle doesn't persist visually on re-render** — lobby re-renders on every Firebase update, toggle resets visual state | lobby.js:252-270 | Toggle appears off even when on |
| H4 | **Host menu doesn't reset room status on "New Game"** — goes to game-select but room status stays "playing" | dashboard.js:243 host menu | Lobby confused about state |
| H5 | **Manage players button is icon-only** — no label, users don't know what it does | dashboard.js:188 | Poor discoverability |

## Medium (UX Issues)

| # | Bug | Location | Impact |
|---|-----|----------|--------|
| M1 | **No validation on game config inputs** — can enter 0, negative, or blank target score | game-select.js:163-168 | Invalid game config |
| M2 | **Validation errors not scrolled to** — if scoring form is long, error may be below viewport | scoring.js:231-236 | User doesn't see error |
| M3 | **Router history grows unbounded** — rapid navigation creates huge history stack | router.js:22-35 | Memory/perf issue on long sessions |
| M4 | **No empty-state guard on recap screen** — if navigated to directly with trackStats=false, shows misleading "No Games Yet" | recap.js:26-34 | Confusing message |

## Low (Polish)

| # | Bug | Location | Impact |
|---|-----|----------|--------|
| L1 | **Hardcoded colors in toggle styles** — should use CSS variables | lobby.js:163-172 | Consistency |
| L2 | **No celebration animation on winner screen** — static display | winner.js | Underwhelming |
| L3 | **Firebase API key in source code** — expected for client-side Firebase, but RTDB rules should be tightened | app.js:12-21 | Security posture |
