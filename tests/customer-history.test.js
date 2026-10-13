import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCustomerHistory } from '../lib/customer-history.js';
const token = 'a'.repeat(64);
const cursor = `eyJhIjoxfQ.${'b'.repeat(64)}`;

test('history is private POST with only its bounded cursor, never a caller-supplied customer', async () => {
  assert.equal((await loadCustomerHistory('', '', () => assert.fail('must not fetch'))).state, 'guest');
  for (const invalid of [[], {}, 'a'.repeat(601)]) assert.equal((await loadCustomerHistory(token, invalid, () => assert.fail('must not fetch'))).state, 'invalid');
  const result = await loadCustomerHistory(token, cursor, async (...args) => {
    assert.deepEqual(args, ['customer-orders', token, 'POST', { cursor }]);
    return { status: 200, data: { orders: [{ id: 12 }], next_cursor: null } };
  });
  assert.deepEqual(result, { state: 'ready', orders: [{ id: 12 }], next: null });
});

test('old connector is distinguished from failures; no stale rows or private diagnostics escape', async () => {
  for (const [status, code, expected] of [[401, '', 'expired'], [400, '', 'invalid'], [404, 'rest_no_route', 'unsupported'], [404, '', 'unavailable'], [500, '', 'unavailable']]) {
    assert.deepEqual(await loadCustomerHistory(token, '', async () => ({ status, data: { code, private: 'secret' } })), { state: expected });
  }
  for (const data of [{ orders: [{ id: 0 }], next_cursor: null }, { orders: [], next_cursor: 'https://external.test' }, { orders: Array(21).fill({ id: 1 }), next_cursor: null }]) {
    assert.equal((await loadCustomerHistory(token, '', async () => ({ status: 200, data }))).state, 'unavailable');
  }
  assert.equal((await loadCustomerHistory(token, '', async () => { throw Error('private'); })).state, 'unavailable');
});
