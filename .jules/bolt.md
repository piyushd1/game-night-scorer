## 2024-04-12 - [Stats Calculation O(N^2) Bottleneck]
**Learning:** Found nested arrays lookup in stats iteration path inside `public/js/stats.js`. The functions doing loops on players used `Array.find` against a standings array resulting in O(N^2) complexity.
**Action:** Always replace `Array.find` inside loops with O(1) Map lookups when processing derived standings in stats engine.
## 2024-04-14 - [Stats MVP Sort O(N^2) Bottleneck]
**Learning:** Found redundant array reduce inside sort comparator in `public/js/stats.js` for `overallList`. `a.finishes.reduce` was computed on every comparison, resulting in inefficient sorting.
**Action:** Always pre-calculate derived metrics (like averages) outside of the `.sort()` comparator to keep the comparator O(1) time complexity.
## 2026-04-17 - [O(P^2 * R) Bottleneck in Game Scoring Loops]
**Learning:** Found that calculating O(N) derived values (like `minCardTotal` in Cabo) inside getter functions (`getRoundPoints`) called within nested rendering loops (iterating over rounds and players in `dashboard.js`) causes redundant O(P^2 * R) operations. This was amplified by inefficient `Object.entries().map().map()` intermediate array allocations in `applyRound`.
**Action:** Use a `WeakMap` to cleanly memoize derived data directly onto immutable state objects (like `roundData`), turning O(N) redundant calculations into O(1) lookups, and prefer `for...in` loops over chained array methods for critical calculation paths to avoid memory allocations.
## 2024-04-21 - [computeNightStats O(G*P*R) Recalculation on Render]
**Learning:** Found that `computeNightStats` in `public/js/stats.js` runs a heavy O(Games * Players * Rounds) operation every time the Recap screen renders or state updates. Because Firebase state syncing in `public/js/firebase.js` completely replaces the `games` object reference on any update to the room, we can use a WeakMap keyed by the `games` object to safely memoize this expensive calculation.
**Action:** Use `WeakMap` to memoize expensive derived state computations based on Firebase object references to skip redundant calculation cycles without creating memory leaks.
## 2024-04-22 - [Dashboard O(P*R) Recalculation on Render]
**Learning:** Found that computing `roundPoints` in `public/js/screens/dashboard.js` performs an O(Players * Rounds) nested iteration every time the dashboard renders. This calculation calls `getRoundPoints` which can do further nested loops in games like Cabo.
**Action:** Use a `WeakMap` to cleanly memoize derived round points directly onto the immutable `game.rounds` object, turning O(P*R) redundant calculations into O(1) lookups.
