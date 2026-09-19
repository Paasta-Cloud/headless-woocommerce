import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { demoProducts, getProducts, normalizeProduct } from '../lib/store.js';

test('demo catalog is synthetic and available without credentials', () => {
  assert.ok(demoProducts.length >= 6);
  assert.ok(demoProducts.every(product => product.id && product.name && product.price > 0));
});

test('Store API minor units and rial currency remain explicit', () => {
  const product = normalizeProduct({ id: 10, name: 'نمونه', prices: { price: '1234500', currency_minor_unit: 0, currency_code: 'IRR' }, categories: [{ name: 'خانه' }] });
  assert.equal(product.price, 1234500);
  assert.equal(product.unit, 'ریال');
  assert.equal(product.category, 'خانه');
});

test('Store API toman amounts do not receive a hidden conversion', () => {
  const product = normalizeProduct({ id: 11, name: 'نمونه', prices: { price: '123450', currency_minor_unit: 0, currency_code: 'IRT' } });
  assert.equal(product.price, 123450);
  assert.equal(product.unit, 'تومان');
});

test('live WooCommerce response is used without silently falling back to demo', async () => {
  const server = createServer((request, response) => {
    assert.equal(request.url, '/wp-json/wc/store/v1/products?per_page=24');
    response.setHeader('content-type', 'application/json');
    response.end(JSON.stringify([{ id: 42, name: 'محصول زنده', prices: { price: '100000', currency_minor_unit: 0, currency_code: 'IRT' } }]));
  });
  await new Promise(resolve => server.listen(0, resolve));
  const previous = process.env.WOOCOMMERCE_URL;
  process.env.WOOCOMMERCE_URL = `http://localhost:${server.address().port}`;
  try {
    const result = await getProducts();
    assert.equal(result.mode, 'live');
    assert.equal(result.products.length, 1);
    assert.equal(result.products[0].id, 42);
  } finally {
    if (previous === undefined) delete process.env.WOOCOMMERCE_URL;
    else process.env.WOOCOMMERCE_URL = previous;
    await new Promise(resolve => server.close(resolve));
  }
});

test('live source failure shows recovery instead of synthetic products', async () => {
  const previous = process.env.WOOCOMMERCE_URL;
  process.env.WOOCOMMERCE_URL = 'http://example.com';
  try {
    const result = await getProducts();
    assert.equal(result.mode, 'live');
    assert.deepEqual(result.products, []);
    assert.match(result.error, /بررسی/);
  } finally {
    if (previous === undefined) delete process.env.WOOCOMMERCE_URL;
    else process.env.WOOCOMMERCE_URL = previous;
  }
});
