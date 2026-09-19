import test from 'node:test';
import assert from 'node:assert/strict';
import { demoProducts, normalizeProduct } from '../lib/store.js';

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
