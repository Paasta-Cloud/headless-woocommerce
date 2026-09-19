export const demoProducts = [
  { id: 1, name: 'چراغ مطالعه آرا', category: 'خانه و زندگی', price: 890000, image: '', label: 'آرا', tone: 'sand', description: 'نوری آرام برای میز کار و مطالعه.' },
  { id: 2, name: 'ماگ سرامیکی رُستا', category: 'خانه و زندگی', price: 420000, image: '', label: 'رُستا', tone: 'clay', description: 'یک همراه ساده برای لحظه‌های روزمره.' },
  { id: 3, name: 'هدفون بی‌سیم موج', category: 'دیجیتال', price: 2490000, image: '', label: 'موج', tone: 'stone', description: 'طراحی سبک و بی‌حاشیه برای شنیدن روزانه.' },
  { id: 4, name: 'دفتر نقطه‌ای روز', category: 'لوازم تحریر', price: 185000, image: '', label: 'روز', tone: 'olive', description: 'فضایی برای یادداشت‌ها و ایده‌های تازه.' },
  { id: 5, name: 'اسپیکر رومیزی نوا', category: 'دیجیتال', price: 1790000, image: '', label: 'نوا', tone: 'blue', description: 'صدای دلخواه، در اندازه‌ای جمع‌وجور.' },
  { id: 6, name: 'گلدان سفالی لاله', category: 'خانه و زندگی', price: 365000, image: '', label: 'لاله', tone: 'rose', description: 'یک جزئیات گرم برای گوشهٔ خانه.' },
];

export function formatPrice(value) {
  return new Intl.NumberFormat('fa-IR').format(value) + ' تومان';
}

export function storeOrigin() {
  const configured = process.env.WOOCOMMERCE_URL?.trim();
  if (!configured) return null;
  const url = new URL(configured);
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && url.hostname === 'localhost')) {
    throw new Error('WooCommerce origin must use HTTPS');
  }
  return url.origin;
}

export function normalizeProduct(item) {
  const amount = Number(item?.prices?.price);
  const minor = Number(item?.prices?.currency_minor_unit ?? 0);
  const currency = String(item?.prices?.currency_code || '').toUpperCase();
  const unit = currency === 'IRR' ? 'ریال' : currency === 'IRT' || currency === 'TOMAN' ? 'تومان' : currency;
  return {
    id: item.id,
    name: item.name,
    category: item.categories?.[0]?.name || 'سایر',
    price: Number.isFinite(amount) ? amount / 10 ** minor : 0,
    unit,
    image: item.images?.[0]?.src || '',
    label: item.name?.slice(0, 2) || 'کالا',
    tone: 'stone',
    description: item.summary || '',
    purchasable: item.is_purchasable !== false && item.is_in_stock !== false && item.type !== 'variable',
  };
}

export async function getProducts() {
  if (!process.env.WOOCOMMERCE_URL?.trim()) return { products: demoProducts, mode: 'demo', error: '' };
  try {
    const response = await fetch(`${storeOrigin()}/wp-json/wc/store/v1/products?per_page=24`, { cache: 'no-store', signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error(`پاسخ ووکامرس: ${response.status}`);
    const items = await response.json();
    if (!Array.isArray(items)) throw new Error('ساختار پاسخ ووکامرس معتبر نیست.');
    return { products: items.map(normalizeProduct), mode: 'live', error: '' };
  } catch {
    return { products: [], mode: 'live', error: 'دریافت محصولات ممکن نشد. داده‌ای تغییر نکرده است؛ نشانی و وضعیت ووکامرس را بررسی و صفحه را تازه کنید.' };
  }
}
