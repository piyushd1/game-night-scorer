# Multi-Game Scorer V1, Revised

## Summary
Build a vanilla multi-file Firebase app around persistent `rooms`, non-destructive per-room `games`, and one `activeGameId` pointer. The app supports `Flip 7`, `Papayoo`, and `Cabo`, uses the `Analog Architect` system for all final styling, keeps live viewer sync, and preserves completed games for future history support even though V1 does not expose a History screen.

## Design System And Flow
- Final visual system is `Analog Architect` everywhere.
  Use `htmls/design-assets.html`, `htmls/cabo-rules.html`, and `htmls/specific-papayu-dash.html` as the styling source of truth.
  Treat the Space Grotesk mocks only as interaction wireframes.
- Component extraction map:
  `design-assets.html`: top bar, bottom nav, player tokens, chips/badges, asymmetric scoreboard rows, numeric pad, rule snippet blocks.
  `specific-papayu-dash.html`: inline scoring layout for Papayoo and overtime banner treatment.
  `cabo-rules.html` and `rule-lib.html`: editorial rules layout and static rules content pattern.
- App lifecycle:
  `Create / Join` → `Lobby / Manage Roster` → `Game Select` → `Active Game` → `Winner Modal` → `Replay Same Game` or `Back to Game Select`.
- Bottom nav behavior:
  Hidden before a game starts.
  Host during active game: `Dashboard`, `Rules`, `Scoring`.
  Viewer during active game: `Dashboard`, `Rules`.
  No `History` tab in V1.
- Roster behavior:
  Manage roster is available before a game starts and between games only.
  Active-game rosters are frozen once the game begins.

## Data Model And Room Lifecycle
- Use RTDB paths:
  `rooms/{roomCode}/meta`
  `rooms/{roomCode}/players/{playerId}`
  `rooms/{roomCode}/games/{gameId}`
- `meta` stores:
  `roomCode`, `hostKey`, `status`, `activeGameId`, `createdAt`, `updatedAt`, `expiresAt`, `version`.
- Persistent room players store:
  `id`, `name`, `isActive`, `seatOrder`, `accentKey`.
  `isActive` allows late arrivals and sit-outs without deleting a person from the room.
- Each game stores a snapshot:
  `gameId`, `type`, `config`, `playerIds`, `playerSnapshot`, `rounds`, `status`, `overtime`, `winner`, `startedAt`, `finishedAt`, `version`.
  `playerSnapshot` freezes names and seating for that game so later roster edits do not mutate completed games.
- New game behavior:
  Creating or replaying a game writes a new `games/{gameId}` node and updates `activeGameId`.
  No game data is deleted when switching games.
- Host identity:
  Host browser keeps the opaque `hostKey` in `localStorage`.
  Original host regains control on return within TTL.
  Viewers never auto-promote to host.
- Concurrency:
  All round submissions, undo-last-round actions, roster updates, and active-game switches use RTDB transactions against `version`.
  On version mismatch, reject the mutation, refresh the game state, and reopen the composer with a conflict message.
- Cleanup:
  Room codes remain 6-character uppercase alphanumeric.
  `expiresAt` is extended to 24 hours after last activity.
  Scheduled cleanup removes expired rooms and their nested games.

## Game Contracts
- Shared registry contract:
  `id`, `label`, `minPlayers`, `maxPlayers`, `winMode`, `defaultConfig`, `scoreComposerType`, `validateRound(draft, gameState)`, `applyRound(gameState, draft)`, `deriveWinner(gameState)`, `rulesContent`.
- Initial supported counts:
  `Flip 7`: `2-20` to preserve current scorer behavior.
  `Cabo`: `2-4`.
  `Papayoo`: `3-8`.
- Shared endgame rule:
  If an end trigger is reached but first place is tied, set `overtime = true`, show a visible `TIE-BREAKER / OVERTIME` state on dashboard and scoring screens, and continue until a unique winner exists.

## Per-Game Rules And Scoring
- `Flip 7`
  - `winMode = highest_total`.
  - Config: `targetScore`, default `200`, editable before game start.
  - Composer: bottom-sheet scoring form derived from the current scorer behavior.
  - Draft shape: `entries[{ playerId, basePoints, flip7BonusApplied }]`.
  - Validation: `basePoints >= 0`.
  - Round formula: `roundPoints = basePoints + (flip7BonusApplied ? 15 : 0)`.
  - End trigger: any cumulative total `>= targetScore`.
  - End resolution: highest cumulative total must be unique; otherwise overtime continues.
- `Papayoo`
  - `winMode = lowest_total`.
  - Config: `roundLimit`, default `5`, editable before game start.
  - Composer: dedicated inline scoring screen, not a modal.
  - Passing cards remains physical-only and is never tracked in-app.
  - Draft shape: `papayooSuit`, `entries[{ playerId, penaltyPoints }]`.
  - Validation:
    `papayooSuit` is required.
    Sum of all `penaltyPoints` must equal exactly `250`.
    Disable submit until checksum passes.
  - Storage uses host-entered final penalties only; the app does not track individual Payoo cards.
  - End trigger: current round count reaches `roundLimit`.
  - Overtime behavior: if lowest cumulative total is tied at the round limit, increment effective round count one round at a time until unique.
- `Cabo`
  - `winMode = lowest_total`.
  - Config: fixed `lossThreshold = 100`.
  - Composer: bottom-sheet scoring form with caller selection and Kamikaze toggle.
  - Draft shape: `callerId`, `kamikazeApplied`, `entries[{ playerId, cardTotal }]`.
  - Validation:
    `callerId` required.
    If `kamikazeApplied` is true, standard caller-rule calculation is skipped.
    Card totals must be present for all active players.
  - Round formula:
    If `kamikazeApplied`, caller gets `0`, every other player gets `50`.
    Else find the minimum `cardTotal`.
    If caller’s `cardTotal` equals that minimum, caller gets `0`.
    Else caller gets `cardTotal + 10`.
    Non-callers get their `cardTotal`.
  - Exact-100 rule:
    After cumulative totals are updated, any player landing on exactly `100` resets to `50`.
  - End trigger:
    any cumulative total becomes `> 100`.
  - End resolution:
    lowest cumulative total must be unique; otherwise overtime continues.
- Winner UI
  - Always use the hero winner treatment.
  - Rank order follows `winMode`.
  - For lowest-wins games, first place is the smallest total and second place is the next-smallest total.
  - Primary actions: `Replay Same Game` and `Choose New Game`.

## Host Controls
- Host-only controls in V1:
  `Submit Round`, `Undo Last Round`, `Manage Roster`, `Replay Same Game`, `Choose New Game`.
- `Undo Last Round` removes only the most recently submitted round from the active game via transaction and recomputes derived totals.
- Viewers never see mutation controls.

## Test Plan
- Room creation, join-by-code, direct-link join, refresh, and browser reopen all preserve expected host/viewer roles within TTL.
- Manage roster allows add, rename, activate, deactivate between games, and active-game rosters remain frozen.
- Starting a new game creates a new `gameId` and leaves previous game data intact.
- `Flip 7` preserves existing scoring behavior, respects configurable target, and enters overtime on tied leaders at threshold.
- `Papayoo` requires `papayooSuit`, blocks submit unless penalties sum to `250`, respects configurable round limit, and signals overtime when tied at the round limit.
- `Cabo` applies caller logic correctly, applies Kamikaze override correctly, resets exact `100` to `50`, and only ends once someone is over `100` with a unique lowest total.
- `Undo Last Round` works for all three games and is rejected safely on stale-tab conflicts.
- Overtime state is visually obvious on dashboard, scoring, and winner-prevention states.
- Winner screen sorts correctly for both highest-wins and lowest-wins games.

## Assumptions
- V1 stores completed games now even though there is no History UI yet.
- `Analog Architect` tokens and layout language are used across the whole product.
- `Papayoo` uses official scoring totals, with the current Papayoo mockup treated as visual structure rather than rule truth.
- Rules pages are static in V1; search and cross-game rule browsing remain later scope.
