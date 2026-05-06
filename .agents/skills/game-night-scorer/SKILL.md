```markdown
# game-night-scorer Development Patterns

> Auto-generated skill from repository analysis

## Overview
This skill teaches the core development patterns and conventions used in the `game-night-scorer` JavaScript codebase. You'll learn how to structure files, write and organize code, follow commit conventions, and run tests. These patterns help maintain consistency and clarity across the project.

## Coding Conventions

### File Naming
- Use **camelCase** for all file names.
  - Example: `scoreCalculator.js`, `playerList.js`

### Import Style
- Use **relative imports** to reference local modules.
  - Example:
    ```javascript
    import { calculateScore } from './scoreCalculator.js';
    ```

### Export Style
- Use **named exports** for all exported functions or variables.
  - Example:
    ```javascript
    // scoreCalculator.js
    export function calculateScore(players) { ... }
    ```

### Commit Messages
- Follow **Conventional Commits** with the `perf` prefix for performance-related changes.
  - Example:
    ```
    perf: optimize score calculation for large player lists
    ```
- Average commit message length is around 51 characters.

## Workflows

### Performance Improvement
**Trigger:** When optimizing code for better performance.
**Command:** `/perf-improvement`

1. Identify a performance bottleneck in the codebase.
2. Refactor or optimize the relevant code.
3. Write a commit message starting with `perf:`.
4. Ensure all tests pass before pushing changes.

### Adding a New Feature
**Trigger:** When implementing a new feature.
**Command:** `/add-feature`

1. Create a new file using camelCase naming.
2. Write your feature code, using named exports.
3. Import dependencies using relative paths.
4. Add or update relevant tests in a `.test.js` file.
5. Commit your changes with an appropriate conventional commit message.

### Writing Tests
**Trigger:** When adding or updating tests.
**Command:** `/write-test`

1. Create or update a test file matching the pattern `*.test.*`.
2. Write tests for your feature or bugfix.
3. Run the test suite to ensure all tests pass.

## Testing Patterns

- Test files follow the pattern: `*.test.*` (e.g., `scoreCalculator.test.js`).
- The testing framework is **unknown**; check existing test files for structure.
- Place tests alongside or near the files they test.
- Example test file:
  ```javascript
  import { calculateScore } from './scoreCalculator.js';

  test('calculates score correctly', () => {
    const players = [/* ... */];
    expect(calculateScore(players)).toBe(/* expected value */);
  });
  ```

## Commands
| Command            | Purpose                                           |
|--------------------|---------------------------------------------------|
| /perf-improvement  | Start a performance optimization workflow         |
| /add-feature       | Guide for adding a new feature                    |
| /write-test        | Steps for writing or updating tests               |
```
