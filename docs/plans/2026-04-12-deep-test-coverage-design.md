# Deep Test Coverage Expansion

## Problem

The existing 49 Playwright tests are navigation-level: they verify screens appear but not that correct data is displayed. A test like `expect(dashText).toContain('35')` passes whether 35 is Alice's score, Bob's score, or a CSS value. This means game logic (scoring, win conditions, overtime, undo, stats) is effectively untested.

Code analysis identified specific risks: XSS in player names (innerHTML without escaping), race conditions in router, concurrent submit not guarded, stale state after undo, and the recap screen having zero test coverage.

## Approach

Write ~77 new tests that deeply verify game logic, exact scores, and state management. Tests run against staging preview URL. Bug fixes cherry-picked to main.

## New Helper

`expectPlayerScore(page, playerName, expectedScore)` — finds a player's row on the dashboard and verifies their exact total. This replaces the current pattern of checking if a number appears "somewhere on the page."

## New Test Files

### 1. scoring-accuracy.spec.js (~20 tests)

**Flip 7:**
- 3-round cumulative scoring: verify each player's total after each round
- F7 bonus = base + 15, verified per-player
- All players get F7 in same round — each gets +15
- Player at exactly targetScore → win
- Multiple players exceed target same round → highest wins
- Score of 0 recorded correctly
- 5-round game with round-by-round chip verification
- Dashboard progress bar accuracy

**Papayoo:**
- 3-round cumulative penalties per player
- One player absorbs all 250 — extreme valid case
- 3-player vs 5-player distributions
- After round limit with clear winner → game ends

**Cabo:**
- Caller lowest = 0, verified with player name association
- Caller penalty = cardTotal + 10, exact verification
- Kamikaze: caller 0, others 50, verified per player
- Exact-100 reset: land on 100 → becomes 50
- Multiple exact-100 resets in one game
- Caller changes each round, cumulative totals correct
- 4-player full game with all mechanics

### 2. overtime.spec.js (~8 tests)

- Flip7: tied at target → overtime status + banner
- Flip7: overtime round resolves tie → correct winner
- Papayoo: tied at round limit → overtime
- Papayoo: multiple overtime rounds (tied twice, third resolves)
- Cabo: tied lowest when someone busts → overtime
- Dashboard shows "TIE-BREAKER / OVERTIME" text
- Scoring tab available during overtime
- Undo from overtime returns game to active status

### 3. undo-state.spec.js (~6 tests)

- Undo restores previous round's exact totals
- Undo at round 1 → all scores reset to 0
- Undo then resubmit → new totals correct
- Double undo → 2 rounds removed, totals match
- Undo updates round counter display
- Undo from overtime → game back to active

### 4. recap.spec.js (~6 tests)

- Stats toggle appears before first game, enables tracking
- Recap button appears in lobby after game completion
- Recap shows correct MVP (most wins)
- Per-game breakdown: game type, rounds, winner
- Abandoned game shows "INCONCLUSIVE"
- Recap not available when stats not enabled

### 5. security-validation.spec.js (~8 tests)

- XSS: player name `<script>alert(1)</script>` rendered as text
- HTML injection: `<b>TEST</b>` rendered as text
- Empty player name rejected
- Whitespace-only name rejected
- Max length (12 chars) accepted
- Over-max-length handled (truncated or rejected)
- Negative score input rejected
- Very large score input handled

### 6. game-config.spec.js (~6 tests)

- Flip7 min target (10) — game ends at 10
- Papayoo min rounds (1) — game ends after 1 round
- Game card disabled when player count incompatible
- Cabo max 4 players enforced
- Default config applied when not changed
- Config values shown on dashboard during game

### 7. viewer-advanced.spec.js (~4 tests)

- Viewer joins mid-game → sees dashboard with current scores
- Viewer sees overtime banner when game enters overtime
- Viewer navigates to winner when host completes game
- Viewer can access rules tab during game

### 8. cross-game.spec.js (~4 tests)

- Switch Flip7 → Papayoo: clean slate, correct scoring UI
- Play all 3 games in one session
- Replay with different config → new config used
- Dashboard layout correct for each game type

### 9. Existing test enhancements

Strengthen assertions in flip7.spec.js, papayoo.spec.js, cabo.spec.js to use `expectPlayerScore` instead of `textContent.toContain`.

## Bug Fix Workflow

1. Write all tests in staging branch
2. Run suite — failures = bugs
3. Fix bugs in staging
4. Re-run to verify fixes
5. Cherry-pick ONLY bug fix commits to main
6. Push staging (tests + fixes) and main (fixes only)

## Verification

- All ~126 tests (49 existing + 77 new) pass against staging
- Bug fixes cherry-picked to main, production deploy verified
- No test/debug code on main branch
