## 2024-04-12 - [Stats Calculation O(N^2) Bottleneck]
**Learning:** Found nested arrays lookup in stats iteration path inside `public/js/stats.js`. The functions doing loops on players used `Array.find` against a standings array resulting in O(N^2) complexity.
**Action:** Always replace `Array.find` inside loops with O(1) Map lookups when processing derived standings in stats engine.
## 2024-04-14 - [Stats MVP Sort O(N^2) Bottleneck]
**Learning:** Found redundant array reduce inside sort comparator in `public/js/stats.js` for `overallList`. `a.finishes.reduce` was computed on every comparison, resulting in inefficient sorting.
**Action:** Always pre-calculate derived metrics (like averages) outside of the `.sort()` comparator to keep the comparator O(1) time complexity.
## 2024-04-16 - [DOM Event Handler Redundant Query Selector Optimization]
**Learning:** Found redundant `container.querySelectorAll('.suit-btn')` and `.caller-btn` calls being executed inside event listener callbacks during the `.forEach` initialization loop in `public/js/screens/scoring.js`.
**Action:** Extract generic DOM selector queries to variables outside of iterators or event handlers to cache the static elements, effectively reducing execution time and overhead from repetitive lookups.
