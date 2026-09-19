import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { checkoutReady, checkoutTotal, storeRequest, validAddress } from '../lib/checkout.js';

test('checkout displays currency minor units but retains raw amount for expected-total guard', () => {
  assert.deepEqual(checkoutTotal({ totals: { total_price: '365000000', currency_minor_unit: 2 } }), { raw: '365000000', display: 3650000 });
});

test('checkout rejects incomplete or unsafe billing details', () => {
  assert.equal(validAddress({ first_name: 'علی' }), null);
  assert.equal(validAddress({ first_name: 'علی', last_name: 'رضایی', email: 'not-email', phone: '0912', city: 'تهران', address_1: 'خیابان' }), null);
  assert.deepEqual(validAddress({ first_name: ' علی ', last_name: 'رضایی', email: 'a@example.com', phone: '09120000000', city: 'تهران', address_1: 'خیابان' }), { first_name: 'علی', last_name: 'رضایی', address_1: 'خیابان', city: 'تهران', state: '', postcode: '', email: 'a@example.com', phone: '09120000000', country: 'IR' });
});

test('checkout requires a live cash-on-delivery method and selected shipping', () => {
  assert.equal(checkoutReady({ items_count: 0, payment_methods: ['cod'] }).ready, false);
  assert.equal(checkoutReady({ items_count: 1, payment_methods: [] }).ready, false);
  assert.equal(checkoutReady({ items_count: 1, payment_methods: ['cod'], needs_shipping: true, shipping_rates: [{ shipping_rates: [] }] }).ready, false);
  assert.equal(checkoutReady({ items_count: 1, payment_methods: ['cod'], needs_shipping: true, shipping_rates: [{ shipping_rates: [{ selected: true }] }] }).ready, true);
});

test('checkout GET is cache-busted and never puts the private Cart Token in the URL', async () => {
  const seen = [];
  const server = createServer((request, response) => { seen.push({ url: request.url, token: request.headers['cart-token'] }); response.setHeader('content-type', 'application/json'); response.end('{}'); });
  await new Promise(resolve => server.listen(0, resolve));
  const previous = process.env.WOOCOMMERCE_URL;
  process.env.WOOCOMMERCE_URL = `http://localhost:${server.address().port}`;
  try {
    await storeRequest('cart', 'private-token');
    await storeRequest('cart', 'private-token');
    assert.notEqual(seen[0].url, seen[1].url);
    assert.ok(seen.every(item => item.token === 'private-token' && !item.url.includes('private-token')));
  } finally {
    if (previous === undefined) delete process.env.WOOCOMMERCE_URL;
    else process.env.WOOCOMMERCE_URL = previous;
    await new Promise(resolve => server.close(resolve));
  }
});
