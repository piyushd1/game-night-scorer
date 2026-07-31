1. **Optimize round metadata calculation in dashboard.js**
   - In `public/js/screens/dashboard.js`, the code currently does a separate O(P*R) calculation for `roundJuaMeta` by calling `rounds.map` for every player during each synchronous render.
   - I will merge the calculation of `roundJuaMeta` into the existing `_roundPointsCache` loop. This combines multiple O(P*R) operations into a single, unified cache memoization block, avoiding redundant independent iterations.
   - I will use `replace_with_git_merge_diff` directly to apply this change to `public/js/screens/dashboard.js`.

2. **Verify changes**
   - Use `node --check` to ensure there are no syntax errors in `public/js/screens/dashboard.js`.
   - Start a local static server.
   - Write and run a temporary Playwright script to verify the Dashboard UI loads properly.

3. **Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.**
   - Call `pre_commit_instructions` tool to get the pre-commit instructions, and follow them. Add learnings to `.jules/bolt.md` as required.

4. **Submit PR**
   - Create a PR with title "⚡ Bolt: [performance improvement]" and the correct description format.
