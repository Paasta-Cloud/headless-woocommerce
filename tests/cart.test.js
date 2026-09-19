import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { cartAction, publicCart, requestCart } from '../lib/cart.js';

test('cart mutation accepts only bounded supported operations', () => {
  assert.deepEqual(cartAction({ action: 'add', id: 42 }), { path: '/add-item', body: { id: 42, quantity: 1 } });
  assert.equal(cartAction({ action: 'add', id: -1 }), null);
  assert.equal(cartAction({ action: 'quantity', key: 'bad', quantity: 2 }), null);
  assert.equal(cartAction({ action: 'quantity', key: 'a'.repeat(32), quantity: 100 }), null);
  assert.deepEqual(cartAction({ action: 'remove', key: 'a'.repeat(32) }), { path: '/remove-item', body: { key: 'a'.repeat(32) } });
});

test('cart token is forwarded to WooCommerce and private fields are not exposed', async () => {
  const server = createServer(async (request, response) => {
    assert.equal(request.url, '/wp-json/wc/store/v1/cart/add-item');
    assert.equal(request.headers['cart-token'], 'test-token');
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    assert.deepEqual(JSON.parse(Buffer.concat(chunks).toString()), { id: 42, quantity: 1 });
    response.setHeader('content-type', 'application/json');
    response.setHeader('Cart-Token', 'next-token');
    response.end(JSON.stringify({ items: [{ id: 42, key: 'a'.repeat(32), quantity: 1, name: 'محصول', prices: { price: '1000', currency_minor_unit: 0 }, secret: 'private' }], items_count: 1, totals: { total_items: '1000', currency_minor_unit: 0, currency_code: 'IRT' }, secret: 'private' }));
  });
  await new Promise(resolve => server.listen(0, resolve));
  const previous = process.env.WOOCOMMERCE_URL;
  process.env.WOOCOMMERCE_URL = `http://localhost:${server.address().port}`;
  try {
    const result = await requestCart('test-token', cartAction({ action: 'add', id: 42 }));
    assert.equal(result.token, 'next-token');
    assert.deepEqual(publicCart(result.body), { items: [{ id: 42, key: 'a'.repeat(32), quantity: 1, name: 'محصول', image: '', price: 1000 }], totalItems: 1, subtotal: 1000, unit: 'تومان' });
  } finally {
    if (previous === undefined) delete process.env.WOOCOMMERCE_URL;
    else process.env.WOOCOMMERCE_URL = previous;
    await new Promise(resolve => server.close(resolve));
  }
});
