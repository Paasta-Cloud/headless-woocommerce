// Export only public product facts, not third-party descriptions, reviews or theme code.
// Usage: node scripts/reference-products.mjs > reference-products.csv
const origin = 'https://dinaha.i-design.ir';
const first = await fetch(`${origin}/wp-json/wc/store/v1/products?per_page=100`, { signal: AbortSignal.timeout(30000) });
if (!first.ok) throw new Error(`Reference catalog returned ${first.status}`);
const products = await first.json();
const pages = Number(first.headers.get('x-wp-totalpages') || 1);
if (pages > 10) throw new Error('Catalog exceeds the explicit 1000-product export bound.');
for (let page = 2; page <= pages; page++) {
  const response = await fetch(`${origin}/wp-json/wc/store/v1/products?per_page=100&page=${page}`, { signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`Reference page ${page} returned ${response.status}`);
  products.push(...await response.json());
}
const quote = value => '"' + String(value ?? '').replaceAll('"', '""') + '"';
const rows = [['Type','SKU','Name','Published','Visibility in catalog','In stock?','Regular price','Categories','Images']];
for (const p of products) {
  if (p.prices.currency_code !== 'IRT') throw new Error('Expected toman prices; verify the destination currency before importing.');
  rows.push(['simple', `dinaha-reference-${p.id}`, p.name, 1, 'visible', 0,
    Number(p.prices.price) / 10 ** Number(p.prices.currency_minor_unit),
    ['نمونه صنایع‌دستی', ...p.categories.map(c => c.name)].join(', '),
    p.images.slice(0,1).map(i=>i.src).join(', ')]);
}
process.stdout.write('\uFEFF' + rows.map(row=>row.map(quote).join(',')).join('\r\n'));
process.stderr.write(`Exported ${products.length} reference products in IRT. Import with Update existing products enabled for idempotent SKU matching. Reference products are out of stock until the merchant sets actual inventory.\n`);
