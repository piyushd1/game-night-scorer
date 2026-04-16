import { test } from 'node:test';
import assert from 'node:assert/strict';
import { get, set } from '../../public/js/state.js';

// Mock localStorage to avoid errors if state.js tries to access it
global.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {}
};

test('state.js get() function', async (t) => {
  await t.test('returns undefined for non-existent key', () => {
    assert.equal(get('nonExistentKey'), undefined);
  });

  await t.test('returns the value for an existing key', () => {
    set('testKey', 'testValue');
    assert.equal(get('testKey'), 'testValue');
  });

  await t.test('returns a shallow copy of the entire state when no key is provided', () => {
    set('key1', 'value1');
    set('key2', 'value2');

    const wholeState = get();
    assert.equal(wholeState.key1, 'value1');
    assert.equal(wholeState.key2, 'value2');
    assert.equal(wholeState.testKey, 'testValue');

    // Check it's a shallow copy, not a reference to the same object
    // If we modify wholeState, the internal state shouldn't be affected
    wholeState.key1 = 'modified';
    assert.equal(get('key1'), 'value1'); // Internal state remains 'value1'
  });
});
