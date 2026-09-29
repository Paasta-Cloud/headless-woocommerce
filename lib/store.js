import {publicVersionedRead} from './public-revision.js';
export const demoProducts = [
  { id: 1, name: 'چراغ مطالعه آرا', category: 'خانه و زندگی', price: 890000, unit: 'تومان', image: '', label: 'آرا', tone: 'sand', description: 'نوری آرام برای میز کار و مطالعه.', type: 'simple' },
  { id: 2, name: 'ماگ سرامیکی رُستا', category: 'خانه و زندگی', price: 420000, unit: 'تومان', image: '', label: 'رُستا', tone: 'clay', description: 'یک همراه ساده برای لحظه‌های روزمره.', type: 'simple' },
  { id: 3, name: 'هدفون بی‌سیم موج', category: 'دیجیتال', price: 2490000, unit: 'تومان', image: '', label: 'موج', tone: 'stone', description: 'طراحی سبک و بی‌حاشیه برای شنیدن روزانه.', type: 'simple' },
  { id: 4, name: 'دفتر نقطه‌ای روز', category: 'لوازم تحریر', price: 185000, unit: 'تومان', image: '', label: 'روز', tone: 'olive', description: 'فضایی برای یادداشت‌ها و ایده‌های تازه.', type: 'simple' },
  { id: 5, name: 'اسپیکر رومیزی نوا', category: 'دیجیتال', price: 1790000, unit: 'تومان', image: '', label: 'نوا', tone: 'blue', description: 'صدای دلخواه، در اندازه‌ای جمع‌وجور.', type: 'simple' },
  { id: 6, name: 'گلدان سفالی لاله', category: 'خانه و زندگی', price: 365000, unit: 'تومان', image: '', label: 'لاله', tone: 'rose', description: 'یک جزئیات گرم برای گوشهٔ خانه.', type: 'simple' },
];

export function formatPrice(value) {
  return new Intl.NumberFormat('fa-IR').format(value) + ' تومان';
}

export function storeOrigin() {
  const configured = process.env.WOOCOMMERCE_URL?.trim();
  if (!configured || configured === 'demo') return null;
  const url = new URL(configured);
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && url.hostname === 'localhost')) {
    throw new Error('WooCommerce origin must use HTTPS');
  }
  return url.origin;
}

function priceUnit(currency) {
  const code = String(currency || '').toUpperCase();
  return code === 'IRR' ? 'ریال' : code === 'IRT' || code === 'TOMAN' ? 'تومان' : code;
}

export function normalizeProduct(item) {
  const amount = Number(item?.prices?.price);
  const minor = Number(item?.prices?.currency_minor_unit ?? 0);
  const type = item?.type === 'variable' ? 'variable' : 'simple';
  const outOfStock = item?.is_in_stock === false;
  const categories = (item.categories || []).filter(category => String(category.id) !== process.env.WOOCOMMERCE_CATEGORY_ID?.trim());
  // Variation attributes usable for picking a variant: label plus its possible terms.
  const options = (Array.isArray(item?.attributes) ? item.attributes : [])
    .filter(attribute => attribute?.has_variations && typeof attribute.name === 'string' && attribute.name.trim())
    .map(attribute => ({
      name: attribute.name.trim(),
      terms: (Array.isArray(attribute.terms) ? attribute.terms : [])
        .filter(term => term && typeof term.slug === 'string' && term.slug)
        .map(term => ({ name: String(term.name || term.slug), slug: term.slug, default: term.default === true })),
    }))
    .filter(attribute => attribute.terms.length > 0);
  // Embedded variation references: id plus the exact attribute pairs Woo expects back.
  const variations = (Array.isArray(item?.variations) ? item.variations : [])
    .filter(variation => variation && Number.isSafeInteger(variation.id) && variation.id > 0)
    .map(variation => ({
      id: variation.id,
      attributes: (Array.isArray(variation.attributes) ? variation.attributes : [])
        .filter(attribute => attribute && typeof attribute.name === 'string' && attribute.name.trim())
        .map(attribute => ({ name: attribute.name.trim(), value: String(attribute.value ?? '') })),
    }));
  return {
    id: item.id,
    name: item.name,
    category: categories[0]?.name || 'سایر',
    categories: categories.map(category => category.name),
    categoryRefs: categories.map(({id,name,slug}) => ({id,name,slug})),
    images: (item.images || []).map(image => ({src:image.src,alt:image.alt || item.name})),
    sku: item.sku || '',
    specifications: (item.attributes || []).map(attribute => ({name:attribute.name, value:(attribute.terms || []).map(term => term.name).join('، ')})).filter(attribute => attribute.name && attribute.value),
    price: Number.isFinite(amount) ? amount / 10 ** minor : 0,
    unit: priceUnit(item?.prices?.currency_code),
    image: item.images?.[0]?.src || '',
    thumbnail: item.images?.[0]?.thumbnail || item.images?.[0]?.src || '',
    imageSrcSet: item.images?.[0]?.srcset || '',
    label: item.name?.slice(0, 2) || 'کالا',
    tone: 'stone',
    description: item.description || item.summary || '',
    type,
    outOfStock,
    options,
    variations,
    // purchasable means "addable as-is"; variable products need a selected variation first.
    purchasable: item.is_purchasable !== false && !outOfStock && type !== 'variable',
  };
}

export function normalizeVariation(item) {
  const amount = Number(item?.prices?.price);
  const minor = Number(item?.prices?.currency_minor_unit ?? 0);
  return {
    id: item?.id,
    price: Number.isFinite(amount) ? amount / 10 ** minor : 0,
    unit: priceUnit(item?.prices?.currency_code),
    inStock: item?.is_in_stock !== false && item?.is_purchasable !== false,
  };
}

export async function getProducts() {
  try {
    const origin = storeOrigin();
    if (!origin) return { products: demoProducts, mode: 'demo', error: '' };
    const params = new URLSearchParams({ per_page: '100' });
    const category = process.env.WOOCOMMERCE_CATEGORY_ID?.trim();
    if (category) {
      if (!/^[1-9]\d*$/.test(category)) throw new Error('Invalid catalogue category');
      params.set('category', category);
    }
    const signal = AbortSignal.timeout(12000);
    const items = [];
    let pages = 1;
    for (let page = 1; page <= pages; page++) {
      params.set('page', String(page));
      const url=`${origin}/wp-json/wc/store/v1/products?${params}`;
      const data=await publicVersionedRead(origin,url,async()=>{
        const response=await fetch(url,{cache:'no-store',signal});
        if(!response.ok)throw new Error(`پاسخ ووکامرس: ${response.status}`);
        return {pages:Number(response.headers.get('x-wp-totalpages')||1),items:await response.json()};
      });
      // ponytail: client-side filtering is bounded to 1000 products; larger shops need server-side discovery.
      pages = data.pages;
      if (!Number.isSafeInteger(pages) || pages < 0 || pages > 10) throw new Error('Catalogue exceeds starter limit');
      const batch = data.items;
      if (!Array.isArray(batch)) throw new Error('ساختار پاسخ ووکامرس معتبر نیست.');
      items.push(...batch);
    }
    return { products: items.map(normalizeProduct), mode: 'live', error: '' };
  } catch {
    return { products: [], mode: 'live', error: 'دریافت محصولات ممکن نشد. داده‌ای تغییر نکرده است؛ نشانی و وضعیت ووکامرس را بررسی و صفحه را تازه کنید.' };
  }
}

export async function getProduct(id) {
  if (!Number.isSafeInteger(id) || id <= 0) return null;
  const origin = storeOrigin();
  if (!origin) return demoProducts.find(item => item.id === id) || null;
  const url=`${origin}/wp-json/wc/store/v1/products/${id}`;
  const item=await publicVersionedRead(origin,url,async()=>{
    const response=await fetch(url,{cache:'no-store',signal:AbortSignal.timeout(8000)});
    if(response.status===404)return null;
    if(!response.ok)throw new Error('دریافت کالا از ووکامرس ممکن نشد. دوباره تلاش کنید.');
    return response.json();
  });
  return item?normalizeProduct(item):null;
}

// The Store API has no /products/{id}/variations route; variations are products
// of type=variation with a parent filter. Price and stock come from here, the
// attribute pairs of each variation come from the parent product response.
export async function getVariations(id) {
  if (!Number.isSafeInteger(id) || id <= 0) return null;
  const origin = storeOrigin();
  if (!origin) return null;
  const response = await fetch(`${origin}/wp-json/wc/store/v1/products?type=variation&parent=${id}&per_page=100&orderby=id&order=asc`, { cache: 'no-store', signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error('گزینه‌های این کالا دریافت نشد. دوباره تلاش کنید.');
  const items = await response.json();
  return Array.isArray(items) ? items.map(normalizeVariation) : [];
}
