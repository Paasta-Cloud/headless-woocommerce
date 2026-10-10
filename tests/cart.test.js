import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { cartAction, publicCart, requestCart, sameSiteOrigin } from '../lib/cart.js';

test('cart origin follows the public proxy host and scheme without accepting another site', () => {
  const request = (origin, host = 'shop.example') => new Request('http://internal:3000/api/cart', {
    headers: { origin, host, 'x-forwarded-proto': 'https' },
  });
  assert.equal(sameSiteOrigin(request('https://shop.example')), true);
  assert.equal(sameSiteOrigin(request('https://other.example')), false);
  assert.equal(sameSiteOrigin(request('http://shop.example')), false);
  assert.equal(sameSiteOrigin(request('https://shop.example', 'other.example')), false);
});

test('cart mutation accepts only bounded supported operations', () => {
  assert.deepEqual(cartAction({ action: 'add', id: 42 }), { path: '/add-item', body: { id: 42, quantity: 1 } });
  assert.equal(cartAction({ action: 'add', id: -1 }), null);
  assert.deepEqual(cartAction({action:'add',id:42,quantity:5}),{path:'/add-item',body:{id:42,quantity:5}});
  for(const quantity of [0,-1,100,1.5,'2',null])assert.equal(cartAction({action:'add',id:42,quantity}),null);
  assert.equal(cartAction({ action: 'quantity', key: 'bad', quantity: 2 }), null);
  assert.equal(cartAction({ action: 'quantity', key: 'a'.repeat(32), quantity: 100 }), null);
  assert.deepEqual(cartAction({ action: 'remove', key: 'a'.repeat(32) }), { path: '/remove-item', body: { key: 'a'.repeat(32) } });
});

test('coupons use bounded native cart operations without accepting client discount amounts',()=>{
  assert.deepEqual(cartAction({action:'apply-coupon',code:' TEST10 ',amount:999}),{path:'/apply-coupon',body:{code:'TEST10'}});
  assert.deepEqual(cartAction({action:'remove-coupon',code:'test10'}),{path:'/remove-coupon',body:{code:'test10'}});
  for(const code of ['', ' ', '<script>', 'a'.repeat(101), 'bad\ncode', null, 10])assert.equal(cartAction({action:'apply-coupon',code}),null);
  const cart=publicCart({items:[],coupons:[{code:'test10',totals:{total_discount:'125',currency_minor_unit:2},secret:'hidden'}],totals:{total_items:'1250',total_discount:'125',total_price:'1125',currency_minor_unit:2,currency_code:'IRT'}});
  assert.equal(cart.discount,1.25);assert.equal(cart.total,11.25);assert.deepEqual(cart.coupons,[{code:'test10',discount:1.25}]);
});

test('variation adds carry the chosen variation id and exact attribute pairs', () => {
  assert.deepEqual(
    cartAction({ action: 'add', id: 9, variation: { id: 91, attributes: [{ name: 'رنگ', value: 'آبی' }] } }),
    { path: '/add-item', body: { id: 91, quantity: 1, variation: [{ attribute: 'رنگ', value: 'آبی' }] } },
  );
  // Malformed variations are rejected instead of being sent half-formed.
  assert.equal(cartAction({ action: 'add', id: 9, variation: { id: -1, attributes: [{ name: 'رنگ', value: 'آبی' }] } }), null);
  assert.equal(cartAction({ action: 'add', id: 9, variation: { id: 91, attributes: [] } }), null);
  assert.equal(cartAction({ action: 'add', id: 9, variation: { id: 91, attributes: [{ name: '', value: 'آبی' }] } }), null);
  assert.equal(cartAction({ action: 'add', id: 9, variation: { id: 91, attributes: [{ name: 'رنگ' }] } }), null);
  assert.equal(cartAction({ action: 'add', id: 9, variation: 'آبی' }), null);
});

test('cart token is forwarded to WooCommerce and private fields are not exposed', async () => {
  const server = createServer(async (request, response) => {
    assert.equal(request.url, '/?rest_route=%2Fwc%2Fstore%2Fv1%2Fcart%2Fadd-item');
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
    assert.deepEqual(publicCart(result.body), { items: [{ id: 42, key: 'a'.repeat(32), quantity: 1, name: 'محصول', image: '', price: 1000, variation: '' }], totalItems: 1, subtotal: 1000, discount:0,total:1000,coupons:[], unit: 'تومان' });
  } finally {
    if (previous === undefined) delete process.env.WOOCOMMERCE_URL;
    else process.env.WOOCOMMERCE_URL = previous;
    await new Promise(resolve => server.close(resolve));
  }
});

test('cart lines show the chosen variation attributes as a readable label', () => {
  const cart = publicCart({
    items: [
      { id: 9, key: 'a'.repeat(32), quantity: 2, name: 'ماگ متغیر', prices: { price: '500000', currency_minor_unit: 0 }, variation: [{ attribute: 'رنگ', value: 'آبی' }, { attribute: 'سایز', value: 'بزرگ' }] },
      { id: 3, key: 'b'.repeat(32), quantity: 1, name: 'ساده', prices: { price: '1000', currency_minor_unit: 0 }, variation: [] },
    ],
    totals: {},
  });
  assert.equal(cart.items[0].variation, 'رنگ: آبی، سایز: بزرگ');
  assert.equal(cart.items[1].variation, '');
});

test('cart reads bypass shared WordPress caches without putting the token in the URL', async () => {
  const requests = [];
  const server = createServer((request, response) => {
    requests.push({ url: request.url, token: request.headers['cart-token'] });
    response.setHeader('content-type', 'application/json');
    response.setHeader('Cart-Token', 'test-token');
    response.end(JSON.stringify({ items: [], items_count: 0, totals: {} }));
  });
  await new Promise(resolve => server.listen(0, resolve));
  const previous = process.env.WOOCOMMERCE_URL;
  process.env.WOOCOMMERCE_URL = `http://localhost:${server.address().port}`;
  try {
    await requestCart('test-token');
    await requestCart('test-token');
    assert.equal(requests.length, 2);
    assert.notEqual(requests[0].url, requests[1].url);
    for (const request of requests) {
      assert.equal(new URL(request.url, 'http://localhost').searchParams.get('rest_route'), '/wc/store/v1/cart');
      assert.equal(request.token, 'test-token');
      assert.ok(!request.url.includes('test-token'));
    }
  } finally {
    if (previous === undefined) delete process.env.WOOCOMMERCE_URL;
    else process.env.WOOCOMMERCE_URL = previous;
    await new Promise(resolve => server.close(resolve));
  }
});
