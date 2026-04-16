import { test } from 'node:test';
import assert from 'node:assert/strict';
import { currentGame, set, get } from '../../public/js/state.js';

test('currentGame() edge cases', async (t) => {
  // Reset state helper
  const resetState = () => {
    set('games', undefined);
    set('roomMeta', undefined);
  };

  await t.test('returns null when state is completely empty', () => {
    resetState();
    assert.equal(currentGame(), null);
  });

  await t.test('returns null when games is not set', () => {
    resetState();
    set('roomMeta', { activeGameId: 'game1' });
    assert.equal(currentGame(), null);
  });

  await t.test('returns null when roomMeta is not set', () => {
    resetState();
    set('games', { game1: { id: 'game1' } });
    assert.equal(currentGame(), null);
  });

  await t.test('returns null when activeGameId is not set in roomMeta', () => {
    resetState();
    set('games', { game1: { id: 'game1' } });
    set('roomMeta', { someOtherProp: true });
    assert.equal(currentGame(), null);
  });

  await t.test('returns null when activeGameId does not exist in games', () => {
    resetState();
    set('games', { game1: { id: 'game1' } });
    set('roomMeta', { activeGameId: 'game2' });
    assert.equal(currentGame(), null);
  });

  await t.test('returns the active game when correctly configured', () => {
    resetState();
    set('games', { game1: { id: 'game1' }, game2: { id: 'game2' } });
    set('roomMeta', { activeGameId: 'game2' });
    assert.deepEqual(currentGame(), { id: 'game2' });
  });
});
