# Test Report — Game Night Scorer
Date: 2026-04-12T11:48:59.098Z
URL: https://game-night-scorer.web.app

## Summary: 54 PASSED, 6 FAILED, 60 TOTAL

## All Results
- [PASS] 1.1 Home loads
- [PASS] 1.2 Room created — code=2VHJNU
- [PASS] 2.1 Added 3 players
- [PASS] 2.2 Duplicate blocked — Name already exists
- [PASS] 2.3 Host player buttons exist — count=3
- [PASS] 2.4 ALICE marked as host
- [PASS] 2.5 Stats toggle exists
- [PASS] 2.5a Stats toggled on
- [PASS] 2.6 CHOOSE GAME button enabled
- [PASS] 3.1 Game select screen
- [PASS] 3.2 Flip 7 selected
- [PASS] 3.3 Selection checkmark visible
- [PASS] 3.4 Button shows "START FLIP 7" — START FLIP 7 arrow_forward
- [PASS] 3.5 Dashboard loads after start
- [PASS] 4.1 Bottom nav visible
- [PASS] 4.2 Three-dot menu button exists
- [PASS] 4.3 Menu overlay opens — display=block
- [PASS] 4.4 Menu has 4 options — count=4
- [PASS] 4.5 Menu closes on backdrop
- [PASS] 4.6 Scoring tab loads
- [PASS] 4.7 Three-dot menu on scoring
- [PASS] 4.8 Rules tab loads
- [PASS] 4.9 Three-dot menu on rules
- [PASS] 5.1 Mini standings on scoring
- [PASS] 5.2 Round 1 submitted
- [PASS] 5.3 Winner screen appears
- [PASS] 5.4 Winner name shown
- [PASS] 5.5 Winner not duplicated — "WINNER" appears 1x
- [PASS] 5.6 Replay button exists
- [PASS] 5.7 New Game button exists
- [PASS] 6.1 Game select clean (no old scores)
- [PASS] 6.2 Game cards visible — count=3
- [PASS] 6.3 Papayoo selectable
- [PASS] 6.4 Round limit set to 2
- [PASS] 6.5 Papayoo dashboard loads
- [PASS] 6.6 No Flip 7 residue
- [PASS] 7.1 Suit picker (4 suits) — count=4
- [PASS] 7.2 Validation: suit required
- [PASS] 7.3 Penalty sum = 250 — sum=250
- [PASS] 7.4 Round 1 submitted
- [PASS] 8.1 Clean game select
- [FAIL] 8.2 Game cards present
- [FAIL] 8.3 Cabo selected
- [PASS] 8.4 Cabo dashboard loads
- [FAIL] 9.1 Caller buttons (3) — count=0
- [PASS] 9.2 Validation: caller required
- [FAIL] 9.3 Kamikaze toggle exists
- [PASS] 10.1 Host menu trigger exists
- [PASS] 10.2 Menu opens
- [PASS] 10.3 End Game → lobby
- [PASS] 11.1 Night Recap button visible
- [PASS] 11.2 Recap screen loads
- [PASS] 11.3 MVP section
- [PASS] 11.4 Overall standings
- [FAIL] 11.5 Per-game breakdown
- [PASS] 12.1 Viewer joins
- [FAIL] 12.2 No add player for viewer
- [PASS] 12.3 No stats toggle for viewer
- [PASS] 13.1 Invalid code error — Room not found
- [PASS] 13.2 Short code error — Room not foundEnter a valid room PIN

## Failures
- **8.2 Game cards present**:
- **8.3 Cabo selected**:
- **9.1 Caller buttons (3)**: count=0
- **9.3 Kamikaze toggle exists**:
- **11.5 Per-game breakdown**:
- **12.2 No add player for viewer**:

## Screenshots
- test-screenshots/1.1-home.png: 1.1-home
- test-screenshots/1.2-lobby-empty.png: 1.2-lobby-empty
- test-screenshots/2.1-three-players.png: 2.1-three-players
- test-screenshots/2.6-lobby-ready.png: 2.6-lobby-ready
- test-screenshots/3.1-game-select.png: 3.1-game-select
- test-screenshots/3.5-dashboard-flip7.png: 3.5-dashboard-flip7
- test-screenshots/4.2-dashboard-with-menu.png: 4.2-dashboard-with-menu
- test-screenshots/4.3-menu-open.png: 4.3-menu-open
- test-screenshots/4.6-scoring.png: 4.6-scoring
- test-screenshots/4.8-rules.png: 4.8-rules
- test-screenshots/5.3-winner-flip7.png: 5.3-winner-flip7
- test-screenshots/6.1-after-new-game.png: 6.1-after-new-game
- test-screenshots/6.5-papayoo-dashboard.png: 6.5-papayoo-dashboard
- test-screenshots/7.4-papayoo-round2.png: 7.4-papayoo-round2
- test-screenshots/8.1-after-second-new-game.png: 8.1-after-second-new-game
- test-screenshots/8.4-cabo-dashboard.png: 8.4-cabo-dashboard
- test-screenshots/10.2-host-menu-open.png: 10.2-host-menu-open
- test-screenshots/10.3-back-to-lobby.png: 10.3-back-to-lobby
- test-screenshots/11.1-lobby-with-recap.png: 11.1-lobby-with-recap
- test-screenshots/11.5-recap-screen.png: 11.5-recap-screen
- test-screenshots/12.1-viewer.png: 12.1-viewer

## Test Coverage
1. Home screen load and elements
2. Room creation
3. Player management (add, duplicate prevention, host selection, stats toggle)
4. Game select (selection feedback, config, start)
5. In-game navigation (all 3 tabs, host menu on all screens)
6. Flip 7 complete game (score, winner)
7. New Game flow from winner screen
8. Papayoo complete game with round limit
9. Second New Game flow
10. Cabo scoring (caller, kamikaze, validation)
11. Host menu End Game → lobby
12. Night Recap (MVP, standings, breakdowns)
13. Viewer experience (join, no host controls)
14. Edge cases (invalid codes)
