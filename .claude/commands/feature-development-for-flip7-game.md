---
name: feature-development-for-flip7-game
description: Workflow command scaffold for feature-development-for-flip7-game in game-night-scorer.
allowed_tools: ["Bash", "Read", "Write", "Grep", "Glob"]
---

# /feature-development-for-flip7-game

Use this workflow when working on **feature-development-for-flip7-game** in `game-night-scorer`.

## Goal

Implements new features or UX improvements specifically for the Flip 7 game, often involving the card drawer, scoring logic, and dashboard integration.

## Common Files

- `public/js/games/flip7.js`
- `public/js/screens/dashboard.js`
- `public/js/screens/scoring.js`
- `public/images/flip7-cards.png`
- `public/js/components/player-row.js`

## Suggested Sequence

1. Understand the current state and failure mode before editing.
2. Make the smallest coherent change that satisfies the workflow goal.
3. Run the most relevant verification for touched files.
4. Summarize what changed and what still needs review.

## Typical Commit Signals

- Modify or add logic in public/js/games/flip7.js for game-specific rules or helpers.
- Update public/js/screens/dashboard.js to integrate new Flip 7 UI or scoring drawer features.
- Optionally update public/js/screens/scoring.js if the scoring flow is affected.
- Add or update assets such as card spritesheets in public/images/ if needed.
- Update related components (e.g., player-row) if the leaderboard or chips change.

## Notes

- Treat this as a scaffold, not a hard-coded script.
- Update the command if the workflow evolves materially.