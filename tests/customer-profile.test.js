import test from 'node:test';
import assert from 'node:assert/strict';
import { profileAction, loadCustomerOrder, validProfileBody } from '../lib/customer-profile.js';
import { billingFields } from '../lib/customer-billing.js';
const token = 'a'.repeat(64);
const body = { revision: 'b'.repeat(64), values: Object.fromEntries(billingFields.map(field => [field, ''])) };
const request = (data = body, origin = 'https://shop.example') => new Request('https://shop.example/api/account/profile', { method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: JSON.stringify(data) });

test('profile rejects origin, unsigned sessions and protected/oversized fields before forwarding', async () => {
  const never = () => { throw new Error('Unexpected upstream'); };
  assert.equal((await profileAction(request(body, 'https://evil.example'), token, never)).status, 403);
  assert.equal((await profileAction(request(), null, never)).status, 401);
  for (const data of [null, { ...body, user_id: 99 }, { ...body, values: { ...body.values, email: 'other@example.test' } }, { ...body, values: { ...body.values, address_1: 'x'.repeat(601) } }, { ...body, revision: 'wrong' }]) {
    assert.equal(validProfileBody(data) || false, false);
    assert.equal((await profileAction(request(data), token, never)).status, 400);
  }
});
test('profile forwards only validated contact data using the private cookie token and returns confirmed readback', async () => {
  let seen;
  const response = await profileAction(request(), token, async (...args) => { seen = args; return { status: 200, data: { ok: true, billing: body.values, billing_revision: token, private_native: 'must not leak' } }; });
  assert.deepEqual(seen, ['profile', token, 'POST', body]);
  assert.deepEqual(await response.json(), { ok: true, billing: body.values, billing_revision: token });
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
});
test('conflict and ambiguous write failures require reconciliation, never automatic retry or raw error disclosure', async () => {
  for (const status of [409, 500, 503, 404]) {
    let calls = 0;
    const response = await profileAction(request(), token, async () => { calls++; return { status, data: { message: 'sensitive native error' } }; });
    const result = await response.json();
    assert.equal(calls, 1); assert.equal(result.reconcile, true); assert.equal(JSON.stringify(result).includes('sensitive'), false);
  }
  const response = await profileAction(request(), token, async () => { throw new Error('customer private'); });
  assert.equal((await response.json()).reconcile, true);
});
test('order reads are private POST, bounded and scoped to the customer token; foreign/missing orders stay indistinguishable', async () => {
  let seen;
  assert.deepEqual(await loadCustomerOrder(5, token, async (...args) => { seen = args; return { status: 200, data: { id: 5, items: [] } }; }), { state: 'ready', order: { id: 5, items: [] } });
  assert.deepEqual(seen, ['customer-order', token, 'POST', { id: 5 }]);
  const never = () => { throw new Error('Should not call'); };
  assert.equal((await loadCustomerOrder(5, null, never)).state, 'guest');
  for (const id of [NaN, 0, 1.5, Number.MAX_SAFE_INTEGER + 1]) assert.equal((await loadCustomerOrder(id, token, never)).state, 'missing');
  assert.equal((await loadCustomerOrder(5, token, async () => ({ status: 404 }))).state, 'missing');
  assert.equal((await loadCustomerOrder(5, token, async () => ({ status: 401 }))).state, 'expired');
  assert.equal((await loadCustomerOrder(5, token, async () => ({ status: 200, data: { id: 6, items: [] } }))).state, 'unavailable');
});
