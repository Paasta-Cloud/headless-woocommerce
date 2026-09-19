import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { decodeReceipt, getOrder, orderCookieName, receiptFromCheckout } from '../lib/order.js';

test('receipt requires a valid WooCommerce order key and stays scoped to the order', () => {
  const value = receiptFromCheckout({ order_id: 29, order_key: 'wc_order_abcdefgh1234' }, 'buyer@example.com');
  assert.equal(orderCookieName(29), 'khanechin_order_29');
  assert.deepEqual(decodeReceipt(value), { key: 'wc_order_abcdefgh1234', email: 'buyer@example.com' });
  assert.equal(receiptFromCheckout({ order_id: 29, order_key: 'bad' }, 'buyer@example.com'), null);
  assert.equal(orderCookieName(-1), null);
  assert.equal(decodeReceipt('not-json'), null);
});

test('order status is read from WooCommerce with guest credentials and no Cart Token', async () => {
  let seen;
  const server = createServer((request, response) => {
    seen = { url: request.url, token: request.headers['cart-token'] };
    response.setHeader('content-type', 'application/json');
    response.end(JSON.stringify({ id: 29, status: 'processing', totals: { total_price: '420000', currency_minor_unit: 0, currency_code: 'IRR' }, items: [{ name: 'ماگ', quantity: 1 }] }));
  });
  await new Promise(resolve => server.listen(0, resolve));
  const previous = process.env.WOOCOMMERCE_URL;
  process.env.WOOCOMMERCE_URL = `http://localhost:${server.address().port}`;
  try {
    const order = await getOrder(29, { key: 'wc_order_abcdefgh1234', email: 'buyer@example.com' });
    assert.equal(order.status, 'processing');
    assert.equal(order.items[0].name, 'ماگ');
    assert.equal(seen.token, undefined);
    assert.match(seen.url, /^\/wp-json\/wc\/store\/v1\/order\/29\?/);
    assert.match(seen.url, /billing_email=buyer%40example.com/);
  } finally {
    if (previous === undefined) delete process.env.WOOCOMMERCE_URL;
    else process.env.WOOCOMMERCE_URL = previous;
    await new Promise(resolve => server.close(resolve));
  }
});
