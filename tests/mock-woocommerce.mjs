import { createServer } from 'node:http';

const key = 'a'.repeat(32);
const product = {
  id: 42, name: 'چراغ آزمایشی', type: 'simple', is_purchasable: true, is_in_stock: true,
  categories: [{ name: 'آزمایشی' }], images: [], summary: 'فقط برای آزمون اتصال.',
  prices: { price: '120000', currency_minor_unit: 0, currency_code: 'IRT' },
};
let quantity = 0;

function cart() {
  return {
    items: quantity ? [{ id: product.id, key, name: product.name, quantity, prices: product.prices, images: [] }] : [],
    items_count: quantity,
    totals: { total_items: String(quantity * 120000), currency_minor_unit: 0, currency_code: 'IRT' },
  };
}

createServer(async (request, response) => {
  response.setHeader('Content-Type', 'application/json');
  response.setHeader('Cart-Token', 'local-test-token');
  if (request.url?.startsWith('/wp-json/wc/store/v1/products')) {
    response.end(JSON.stringify([product]));
    return;
  }
  if (request.url?.startsWith('/wp-json/wc/store/v1/cart')) {
    if (request.method === 'POST') {
      const chunks = [];
      for await (const chunk of request) chunks.push(chunk);
      const body = JSON.parse(Buffer.concat(chunks).toString());
      if (request.url.endsWith('/add-item') && body.id === product.id) quantity += 1;
      else if (request.url.endsWith('/update-item') && body.key === key) quantity = body.quantity;
      else if (request.url.endsWith('/remove-item') && body.key === key) quantity = 0;
      else { response.writeHead(400); response.end(JSON.stringify({ code: 'invalid_request' })); return; }
    }
    response.end(JSON.stringify(cart()));
    return;
  }
  response.writeHead(404);
  response.end(JSON.stringify({ code: 'not_found' }));
}).listen(3220, 'localhost', () => process.stdout.write('Mock WooCommerce ready on 3220\n'));
