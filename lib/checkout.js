import { storeOrigin } from './store.js';

export function validAddress(value) {
  if (!value || typeof value !== 'object') return null;
  const fields = ['first_name', 'last_name', 'address_1', 'city', 'state', 'postcode', 'email', 'phone'];
  const address = Object.fromEntries(fields.map(key => [key, typeof value[key] === 'string' ? value[key].trim() : '']));
  if (!address.first_name || !address.last_name || !address.address_1 || !address.city || !address.phone || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address.email)) return null;
  if (fields.some(key => address[key].length > 200)) return null;
  return { ...address, country: 'IR' };
}

export function checkoutReady(cart) {
  if (!cart?.items_count) return { ready: false, reason: 'سبد خرید خالی است.' };
  if (!cart.payment_methods?.includes('cod')) return { ready: false, reason: 'پرداخت در محل هنوز در ووکامرس فعال نیست. سفارشی ثبت نمی‌شود.' };
  if (cart.needs_shipping && !cart.shipping_rates?.every(group => group.shipping_rates?.some(rate => rate.selected))) {
    return { ready: false, reason: 'روش ارسال برای این نشانی هنوز انتخاب نشده است. سفارشی ثبت نمی‌شود.' };
  }
  return { ready: true, reason: '' };
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
