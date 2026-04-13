import cabo from '../../../public/js/games/cabo.js';
import assert from 'node:assert';
import test from 'node:test';

test('validateRound: returns error if callerId is missing', () => {
  const draft = { entries: {} };
  const gameState = { playerIds: ['p1'] };
  const result = cabo.validateRound(draft, gameState);
  assert.strictEqual(result.valid, false);
  assert.strictEqual(result.error, 'Select who called Cabo');
});

test('validateRound: returns error if entries are missing', () => {
  const draft = { callerId: 'p1' };
  const gameState = { playerIds: ['p1'] };
  const result = cabo.validateRound(draft, gameState);
  assert.strictEqual(result.valid, false);
  assert.strictEqual(result.error, 'No scores entered');
});

test('validateRound: returns error if cardTotal is missing for a player', () => {
  const draft = {
    callerId: 'p1',
    entries: {
      p1: { cardTotal: 5 },
      p2: {} // cardTotal missing
    }
  };
  const gameState = { playerIds: ['p1', 'p2'] };
  const result = cabo.validateRound(draft, gameState);
  assert.strictEqual(result.valid, false);
  assert.strictEqual(result.error, 'Enter card total for all players');
});

test('validateRound: returns error if cardTotal is negative', () => {
  const draft = {
    callerId: 'p1',
    entries: {
      p1: { cardTotal: -1 },
      p2: { cardTotal: 5 }
    }
  };
  const gameState = { playerIds: ['p1', 'p2'] };
  const result = cabo.validateRound(draft, gameState);
  assert.strictEqual(result.valid, false);
  assert.strictEqual(result.error, 'Card totals cannot be negative');
});

test('validateRound: returns valid: true for valid input', () => {
  const draft = {
    callerId: 'p1',
    entries: {
      p1: { cardTotal: 5 },
      p2: { cardTotal: 10 }
    }
  };
  const gameState = { playerIds: ['p1', 'p2'] };
  const result = cabo.validateRound(draft, gameState);
  assert.strictEqual(result.valid, true);
});

test('validateRound: handles 0 as a valid cardTotal', () => {
  const draft = {
    callerId: 'p1',
    entries: {
      p1: { cardTotal: 0 },
      p2: { cardTotal: 10 }
    }
  };
  const gameState = { playerIds: ['p1', 'p2'] };
  const result = cabo.validateRound(draft, gameState);
  assert.strictEqual(result.valid, true);
});
