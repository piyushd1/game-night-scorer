import test from 'node:test';
import assert from 'node:assert/strict';
import cabo from '../../public/js/games/cabo.js';

test('Cabo Game Module - Optimization Regressions', async (t) => {
  await t.test('applyRound computes new totals correctly', () => {
    const currentTotals = { p1: 10, p2: 20, p3: 30 };
    const roundData = {
      callerId: 'p1',
      entries: {
        p1: { cardTotal: 5 },
        p2: { cardTotal: 10 },
        p3: { cardTotal: 15 },
      },
    };
    const gameState = {};

    const result = cabo.applyRound(currentTotals, roundData, gameState);
    // p1 (caller) has minimum (5), gets 0. Total: 10 + 0 = 10
    // p2 gets 10. Total: 20 + 10 = 30
    // p3 gets 15. Total: 30 + 15 = 45
    assert.deepEqual(result, { p1: 10, p2: 30, p3: 45 });
  });

  await t.test('applyRound computes correctly when caller is not minimum', () => {
    const currentTotals = { p1: 10, p2: 20, p3: 30 };
    const roundData = {
      callerId: 'p1',
      entries: {
        p1: { cardTotal: 10 },
        p2: { cardTotal: 5 },
        p3: { cardTotal: 15 },
      },
    };
    const gameState = {};

    const result = cabo.applyRound(currentTotals, roundData, gameState);
    // p1 (caller) does not have minimum. Penalty = 10 + 10 = 20. Total: 10 + 20 = 30
    // p2 has minimum (5). Gets 5. Total: 20 + 5 = 25
    // p3 gets 15. Total: 30 + 15 = 45
    assert.deepEqual(result, { p1: 30, p2: 25, p3: 45 });
  });

  await t.test('getRoundPoints returns correct points and uses memoized value', () => {
    const roundData = {
      callerId: 'p1',
      entries: {
        p1: { cardTotal: 5 },
        p2: { cardTotal: 10 },
        p3: { cardTotal: 15 },
      },
    };

    // p1 is caller and has min (5) -> 0 points
    assert.equal(cabo.getRoundPoints(roundData, 'p1'), 0);
    // p2 -> 10 points
    assert.equal(cabo.getRoundPoints(roundData, 'p2'), 10);
    // p3 -> 15 points
    assert.equal(cabo.getRoundPoints(roundData, 'p3'), 15);
  });

  await t.test('getRoundPoints returns correct points without prior applyRound call', () => {
      const roundData = {
        callerId: 'p1',
        entries: {
          p1: { cardTotal: 10 },
          p2: { cardTotal: 5 },
          p3: { cardTotal: 15 },
        },
      };

      // getRoundPoints should correctly compute min (5)
      // p1 is caller and NOT min -> cardTotal (10) + 10 penalty = 20 points
      assert.equal(cabo.getRoundPoints(roundData, 'p1'), 20);
      assert.equal(cabo.getRoundPoints(roundData, 'p2'), 5);
      assert.equal(cabo.getRoundPoints(roundData, 'p3'), 15);
  })
});
