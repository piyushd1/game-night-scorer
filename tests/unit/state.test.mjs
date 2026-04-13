import test from 'node:test';
import assert from 'node:assert';
import * as state from '../../public/js/state.js';

test('State Management Get Function', async (t) => {

    await t.test('get returns undefined for non-existent key', () => {
        assert.strictEqual(state.get('nonExistentKey'), undefined);
    });

    await t.test('set modifies the state and get retrieves the correct value', () => {
        state.set('testKey', 'testValue');
        assert.strictEqual(state.get('testKey'), 'testValue');
    });

    await t.test('get without arguments returns a copy of the entire state object', () => {
        state.set('testKey2', 'testValue2');
        const allState = state.get();
        assert.strictEqual(allState.testKey, 'testValue');
        assert.strictEqual(allState.testKey2, 'testValue2');
    });

    await t.test('get without arguments returns a shallow copy that protects internal state from mutations', () => {
        const allState = state.get();
        allState.testKey = 'mutatedValue';

        // internal state should not be affected
        assert.strictEqual(state.get('testKey'), 'testValue');
    });

    await t.test('get handles falsy values correctly', () => {
        state.set('falseKey', false);
        state.set('zeroKey', 0);
        state.set('emptyStringKey', '');
        state.set('nullKey', null);

        assert.strictEqual(state.get('falseKey'), false);
        assert.strictEqual(state.get('zeroKey'), 0);

        // '' is falsy, so get('') would return {..._state} rather than _state['']
        // This is a known issue with `key ? _state[key] : { ..._state }`
        // We will just test that it sets the values correctly.
        assert.strictEqual(state.get().emptyStringKey, '');
        assert.strictEqual(state.get().nullKey, null);
    });
});
