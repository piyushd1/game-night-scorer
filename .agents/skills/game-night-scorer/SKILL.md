```markdown
# game-night-scorer Development Patterns

> Auto-generated skill from repository analysis

## Overview

This skill teaches you how to contribute to the `game-night-scorer` JavaScript codebase, a web app for managing multiplayer game nights, scoring, and player management. You'll learn the project's coding conventions, how to implement new features or UI improvements, and how to follow established workflows for common tasks like enhancing the Flip 7 game, polishing the lobby, improving dashboards, handling winner payouts, and adding QR code invites.

## Coding Conventions

- **Language:** JavaScript (no framework)
- **File Naming:** camelCase (e.g., `playerRow.js`, `flip7.js`)
- **Import Style:** Relative imports

  ```js
  import { calculateScore } from './flip7.js';
  ```

- **Export Style:** Named exports

  ```js
  // In flip7.js
  export function calculateScore(cards) { ... }
  export const FLIP7_RULES = { ... };
  ```

- **Commit Messages:** Conventional commits with prefixes like `feat`, `fix`, `chore`
  - Example: `feat: add quick-add chips to lobby player cards`

## Workflows

### Feature Development for Flip 7 Game
**Trigger:** When adding or enhancing Flip 7-specific gameplay or UI features  
**Command:** `/feature-flip7`

1. Modify or add logic in `public/js/games/flip7.js` for game-specific rules or helpers.
2. Update `public/js/screens/dashboard.js` to integrate new Flip 7 UI or scoring drawer features.
3. Optionally update `public/js/screens/scoring.js` if the scoring flow is affected.
4. Add or update assets such as card spritesheets in `public/images/` if needed.
5. Update related components (e.g., `player-row`) if the leaderboard or chips change.

**Example:**
```js
// public/js/games/flip7.js
export function checkEnd(state) {
  // New rule for ending Flip 7 game
}
```

---

### Lobby Player Management and UI Polish
**Trigger:** When improving player management or polishing the lobby interface  
**Command:** `/lobby-polish`

1. Update player management logic in `public/js/screens/lobby.js` (e.g., quick-add, host assignment, player card UI).
2. Modify `public/js/firebase.js` if player data syncing or room code logic is affected.
3. Update or add UI elements such as QR code, PIN card, or quick-add chips.
4. Polish terminology, icons, and layout in the lobby.

**Example:**
```js
// public/js/screens/lobby.js
function quickAddPlayer(name) {
  // Add player logic
}
```

---

### Leaderboard and Dashboard UI Enhancement
**Trigger:** When enhancing the leaderboard or dashboard for hosts and spectators  
**Command:** `/dashboard-ui`

1. Update `public/js/screens/dashboard.js` for new features, styling, or edit modes.
2. Modify `public/js/components/player-row.js` for player row or chip styling.
3. Optionally update `public/js/screens/scoring.js` if scoring or edit flows are affected.
4. Update CSS in `public/css/app.css` for visual changes.

**Example:**
```js
// public/js/components/player-row.js
export function renderPlayerRow(player) {
  // Render player with new chip style
}
```

---

### Winner Screen Jua and Prize Math Enhancement
**Trigger:** When improving winner screen payout logic, especially for Jua games and ties  
**Command:** `/winner-jua`

1. Update `public/js/screens/winner.js` to show new math, tie breakdowns, or layout changes.
2. Modify `public/js/games/flip7.js` if Jua logic or `checkEnd` is affected.
3. Update `public/js/firebase.js` if backend logic for winner or prize distribution changes.
4. Update dashboard or recap screens if they reflect winner state.

**Example:**
```js
// public/js/screens/winner.js
function renderPrizeBreakdown(players) {
  // Show per-player payout
}
```

---

### QR Code Room Invite Feature
**Trigger:** When adding, updating, or polishing QR code sharing for room invites  
**Command:** `/qr-invite`

1. Add or update QR code modal/component (`public/js/components/qr-modal.js`).
2. Modify `public/js/screens/lobby.js` and/or `public/js/components/host-menu.js` to show QR code or copy-link buttons.
3. Update `public/index.html` if new modal or component is added.
4. Polish inline QR code rendering and caching logic.

**Example:**
```js
// public/js/components/qr-modal.js
export function showQrModal(roomCode) {
  // Render QR code for room invite
}
```

## Testing Patterns

- **Test File Pattern:** `*.test.*` (e.g., `flip7.test.js`)
- **Testing Framework:** Unknown (check for test runner in project)
- **Typical Test Example:**
  ```js
  // flip7.test.js
  import { calculateScore } from './flip7.js';

  test('calculates correct score for hand', () => {
    expect(calculateScore(['7H', '7S'])).toBe(14);
  });
  ```

## Commands

| Command         | Purpose                                                      |
|-----------------|--------------------------------------------------------------|
| /feature-flip7  | Add or enhance Flip 7 game features or UI                    |
| /lobby-polish   | Improve player management or polish the lobby interface       |
| /dashboard-ui   | Enhance leaderboard or dashboard UI/UX                       |
| /winner-jua     | Refine winner screen prize logic, especially for Jua & ties  |
| /qr-invite      | Implement or polish QR code room invite features             |
```
