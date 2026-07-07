---
name: lobby-player-management-and-ui-polish
description: Workflow command scaffold for lobby-player-management-and-ui-polish in game-night-scorer.
allowed_tools: ["Bash", "Read", "Write", "Grep", "Glob"]
---

# /lobby-player-management-and-ui-polish

Use this workflow when working on **lobby-player-management-and-ui-polish** in `game-night-scorer`.

## Goal

Adds or updates lobby features related to player management, quick-add chips, host assignment, and UI/UX improvements.

## Common Files

- `public/js/screens/lobby.js`
- `public/js/firebase.js`

## Suggested Sequence

1. Understand the current state and failure mode before editing.
2. Make the smallest coherent change that satisfies the workflow goal.
3. Run the most relevant verification for touched files.
4. Summarize what changed and what still needs review.

## Typical Commit Signals

- Update player management logic in public/js/screens/lobby.js (e.g., quick-add, host assignment, player card UI).
- Modify public/js/firebase.js if player data syncing or room code logic is affected.
- Update or add UI elements such as QR code, PIN card, or quick-add chips.
- Polish terminology, icons, and layout in the lobby.

## Notes

- Treat this as a scaffold, not a hard-coded script.
- Update the command if the workflow evolves materially.