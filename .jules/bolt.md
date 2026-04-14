## 2024-04-12 - [Stats Calculation O(N^2) Bottleneck]
**Learning:** Found nested arrays lookup in stats iteration path inside `public/js/stats.js`. The functions doing loops on players used `Array.find` against a standings array resulting in O(N^2) complexity.
**Action:** Always replace `Array.find` inside loops with O(1) Map lookups when processing derived standings in stats engine.

## 2024-05-18 - [Redundant Calculation in sort comparator]
**Learning:** Found redundant calculations (`reduce`) inside a `sort` comparator for `overallList` in `public/js/stats.js`, resulting in O(N) operations inside an O(N log N) sorting algorithm.
**Action:** Pre-calculate any derived metrics (like averages) before sorting to maintain an O(1) comparator, avoiding redundant calculation.
