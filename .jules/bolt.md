## 2024-04-12 - [Stats Calculation O(N^2) Bottleneck]
**Learning:** Found nested arrays lookup in stats iteration path inside `public/js/stats.js`. The functions doing loops on players used `Array.find` against a standings array resulting in O(N^2) complexity.
**Action:** Always replace `Array.find` inside loops with O(1) Map lookups when processing derived standings in stats engine.

## 2024-04-12 - [Sorting O(N) Reductions Anti-Pattern]
**Learning:** Found an anti-pattern in `public/js/stats.js` where `.reduce()` was used to compute the average finish inside a `.sort()` comparator. This increases sorting complexity from O(N log N) to O(M * N log N), as the O(M) calculation runs on every single comparison.
**Action:** Always pre-calculate derived metrics (like averages or sums) on objects *before* sorting, use the pre-calculated O(1) property in the sort comparator, and clean up the property afterwards if necessary.
