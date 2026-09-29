import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { demoProducts, getProducts, getProduct, getVariations, normalizeProduct, normalizeVariation } from '../lib/store.js';

test('demo catalog is synthetic and available without credentials', () => {
  assert.ok(demoProducts.length >= 6);
  assert.ok(demoProducts.every(product => product.id && product.name && product.price > 0));
});

test('explicit demo setting works for Git deployments requiring an environment value', async () => {
  const previous = process.env.WOOCOMMERCE_URL;
  process.env.WOOCOMMERCE_URL = 'demo';
  try {
    const result = await getProducts();
    assert.equal(result.mode, 'demo');
    assert.equal(result.products.length, demoProducts.length);
  } finally {
    if (previous === undefined) delete process.env.WOOCOMMERCE_URL;
    else process.env.WOOCOMMERCE_URL = previous;
  }
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
    if(request.url==='/wp-json/paasta-cache/v1/revision'){response.writeHead(404);response.end();return;}
    assert.equal(request.url, '/wp-json/wc/store/v1/products?per_page=100&page=1');
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

test('catalogue follows all pages and preserves the optional category boundary', async () => {
  const requests = [];
  const server = createServer((request, response) => {
    if(request.url==='/wp-json/paasta-cache/v1/revision'){response.writeHead(404);response.end();return;}
    const url = new URL(request.url, 'http://localhost');
    requests.push(url.searchParams.get('page'));
    assert.equal(url.searchParams.get('category'), '176');
    response.setHeader('x-wp-totalpages', '2');
    response.setHeader('content-type', 'application/json');
    response.end(JSON.stringify([{ id: Number(url.searchParams.get('page')), name: 'کالا', categories: [{ id: 176, name: 'نمونه' }, { id: 177, name: 'مینا' }] }]));
  });
  await new Promise(resolve => server.listen(0, resolve));
  const previous = { url: process.env.WOOCOMMERCE_URL, category: process.env.WOOCOMMERCE_CATEGORY_ID };
  process.env.WOOCOMMERCE_URL = `http://localhost:${server.address().port}`;
  process.env.WOOCOMMERCE_CATEGORY_ID = '176';
  try {
    const result = await getProducts();
    assert.deepEqual(requests, ['1', '2']);
    assert.deepEqual(result.products.map(p => p.id), [1, 2]);
    assert.deepEqual(result.products[0].categories, ['مینا']);
    assert.equal(result.products[0].category, 'مینا');
  } finally {
    for (const [key, value] of [['WOOCOMMERCE_URL', previous.url], ['WOOCOMMERCE_CATEGORY_ID', previous.category]]) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
    await new Promise(resolve => server.close(resolve));
  }
});

test('variable products keep their variation options and stay non-addable as-is', () => {
  const product = normalizeProduct({
    id: 9, name: 'ماگ متغیر', type: 'variable', is_in_stock: true,
    prices: { price: '420000', currency_minor_unit: 0, currency_code: 'IRT' },
    attributes: [
      { name: 'رنگ', has_variations: true, terms: [{ name: 'آبی', slug: 'آبی' }, { name: 'سبز', slug: 'سبز' }] },
      { name: 'سایز', has_variations: false, terms: [{ name: 'بزرگ', slug: 'بزرگ' }] },
    ],
    variations: [
      { id: 91, attributes: [{ name: 'رنگ', value: 'آبی' }] },
      { id: 92, attributes: [{ name: 'رنگ', value: 'سبز' }] },
    ],
  });
  assert.equal(product.type, 'variable');
  assert.equal(product.purchasable, false);
  assert.equal(product.outOfStock, false);
  assert.deepEqual(product.options.map(option => option.name), ['رنگ']);
  assert.deepEqual(product.options[0].terms[0], { name: 'آبی', slug: 'آبی', default: false });
  assert.deepEqual(product.variations.map(variation => variation.id), [91, 92]);
  assert.equal(product.variations[0].attributes[0].value, 'آبی');
});

test('out-of-stock and non-purchasable products are never directly addable', () => {
  assert.equal(normalizeProduct({ id: 12, name: 'ناموجود', is_in_stock: false, prices: { price: '1000', currency_minor_unit: 0, currency_code: 'IRT' } }).outOfStock, true);
  assert.equal(normalizeProduct({ id: 13, name: 'غیرقابل فروش', is_purchasable: false, prices: { price: '1000', currency_minor_unit: 0, currency_code: 'IRT' } }).purchasable, false);
});

test('variation details expose price, unit and stock without attribute guessing', () => {
  const variation = normalizeVariation({ id: 91, prices: { price: '500000', currency_minor_unit: 0, currency_code: 'IRT' }, is_in_stock: true, is_purchasable: true });
  assert.equal(variation.id, 91);
  assert.equal(variation.price, 500000);
  assert.equal(variation.unit, 'تومان');
  assert.equal(variation.inStock, true);
  assert.equal(normalizeVariation({ id: 92, prices: { price: '1000', currency_minor_unit: 0, currency_code: 'IRT' }, is_in_stock: false }).inStock, false);
});

test('variation stock and price are read from the Store API variation query', async () => {
  const server = createServer((request, response) => {
    assert.equal(request.url, '/wp-json/wc/store/v1/products?type=variation&parent=9&per_page=100&orderby=id&order=asc');
    response.setHeader('content-type', 'application/json');
    response.end(JSON.stringify([
      { id: 91, prices: { price: '500000', currency_minor_unit: 0, currency_code: 'IRT' }, is_in_stock: true },
      { id: 92, prices: { price: '450000', currency_minor_unit: 0, currency_code: 'IRT' }, is_in_stock: false },
    ]));
  });
  await new Promise(resolve => server.listen(0, resolve));
  const previous = process.env.WOOCOMMERCE_URL;
  process.env.WOOCOMMERCE_URL = `http://localhost:${server.address().port}`;
  try {
    const variations = await getVariations(9);
    assert.deepEqual(variations.map(variation => variation.id), [91, 92]);
    assert.equal(variations[0].price, 500000);
    assert.equal(variations[1].inStock, false);
  } finally {
    if (previous === undefined) delete process.env.WOOCOMMERCE_URL;
    else process.env.WOOCOMMERCE_URL = previous;
    await new Promise(resolve => server.close(resolve));
  }
});

test('variation fetch failures surface a recovery message instead of silent emptiness', async () => {
  const server = createServer((request, response) => {
    response.writeHead(500);
    response.end(JSON.stringify({ code: 'boom' }));
  });
  await new Promise(resolve => server.listen(0, resolve));
  const previous = process.env.WOOCOMMERCE_URL;
  process.env.WOOCOMMERCE_URL = `http://localhost:${server.address().port}`;
  try {
    await assert.rejects(getVariations(9), /گزینه‌های این کالا دریافت نشد/);
  } finally {
    if (previous === undefined) delete process.env.WOOCOMMERCE_URL;
    else process.env.WOOCOMMERCE_URL = previous;
    await new Promise(resolve => server.close(resolve));
  }
});

test('demo mode has no variation stock source', async () => {
  const previous = process.env.WOOCOMMERCE_URL;
  process.env.WOOCOMMERCE_URL = 'demo';
  try {
    assert.equal(await getVariations(9), null);
    assert.equal(await getVariations(-1), null);
    assert.equal(await getProduct(1).then(product => product.type), 'simple');
  } finally {
    if (previous === undefined) delete process.env.WOOCOMMERCE_URL;
    else process.env.WOOCOMMERCE_URL = previous;
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
