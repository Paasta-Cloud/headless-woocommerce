import { storeOrigin } from './store.js';

export function validAddress(value) {
  if (!value || typeof value !== 'object') return null;
  const fields = ['first_name', 'last_name', 'address_1', 'city', 'state', 'postcode', 'email', 'phone'];
  const address = Object.fromEntries(fields.map(key => [key, typeof value[key] === 'string' ? value[key].trim() : '']));
  if (!address.first_name || !address.last_name || !address.address_1 || !address.city || !address.phone || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address.email)) return null;
  if (fields.some(key => address[key].length > 200)) return null;
  return { ...address, country: 'IR' };
}

export const ZIBAL_METHOD = 'WC_Gateway_Zibal';

export function pickupRate(cart) {
  if (!cart?.needs_shipping) return null;
  if (cart.shipping_rates?.length !== 1) return null;
  return cart.shipping_rates[0].shipping_rates?.find(rate => rate.method_id === 'local_pickup' && rate.price === '0') || null;
}

export function checkoutReady(cart, method = 'cod') {
  if (!cart?.items_count) return { ready: false, reason: 'سبد خرید خالی است.' };
  if (!['cod', ZIBAL_METHOD].includes(method) || !cart.payment_methods?.includes(method)) return { ready: false, reason: 'روش پرداخت انتخاب‌شده در ووکامرس فعال نیست. سفارشی ثبت نمی‌شود.' };
  if (cart.needs_shipping && !pickupRate(cart)) {
    return { ready: false, reason: 'روش ارسال برای این نشانی هنوز انتخاب نشده است. سفارشی ثبت نمی‌شود.' };
  }
  return { ready: true, reason: '' };
}

export function safePaymentRedirect(value, store) {
  try {
    const url = new URL(value);
    const storeUrl = new URL(store);
    if (url.protocol !== 'https:' || ![storeUrl.hostname, 'gateway.zibal.ir', 'gateway.zibal.io'].includes(url.hostname)) return null;
    return url.href;
  } catch { return null; }
}

export function checkoutTotal(cart) {
  const minor = Number(cart?.totals?.currency_minor_unit || 0);
  const raw = String(cart?.totals?.total_price || '0');
  return { raw, display: Number(raw) / 10 ** minor };
}

export async function storeRequest(path, token, method = 'GET', body) {
  const origin = storeOrigin();
  if (!origin) throw new Error('WooCommerce is not configured');
  const url = `${origin}/wp-json/wc/store/v1/${path}${method === 'GET' ? `${path.includes('?') ? '&' : '?'}session_check=${crypto.randomUUID()}` : ''}`;
  const response = await fetch(url, { method, headers: { 'Cart-Token': token, ...(body ? { 'Content-Type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}), cache: 'no-store', signal: AbortSignal.timeout(12000) });
  const data = await response.json().catch(() => null);
  if (!response.ok) { const error = new Error('WooCommerce request failed'); error.status = response.status; error.code = data?.code; throw error; }
  return data;
}
