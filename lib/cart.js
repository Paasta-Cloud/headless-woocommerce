import { storeOrigin } from './store.js';

const API_ROOT = '/wp-json/wc/store/v1/cart';

export function cartAction(input) {
  if (!input || typeof input !== 'object') return null;
  if (input.action === 'add' && Number.isSafeInteger(input.id) && input.id > 0) {
    return { path: '/add-item', body: { id: input.id, quantity: 1 } };
  }
  if (input.action === 'quantity' && typeof input.key === 'string' && /^[a-f0-9]{32}$/i.test(input.key)
    && Number.isSafeInteger(input.quantity) && input.quantity >= 1 && input.quantity <= 99) {
    return { path: '/update-item', body: { key: input.key, quantity: input.quantity } };
  }
  if (input.action === 'remove' && typeof input.key === 'string' && /^[a-f0-9]{32}$/i.test(input.key)) {
    return { path: '/remove-item', body: { key: input.key } };
  }
  return null;
}

export async function requestCart(token, action) {
  const origin = storeOrigin();
  if (!origin) throw new Error('WooCommerce is not configured');
  const response = await fetch(`${origin}${API_ROOT}${action?.path || ''}`, {
    method: action ? 'POST' : 'GET',
    headers: {
      ...(token ? { 'Cart-Token': token } : {}),
      ...(action ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(action ? { body: JSON.stringify(action.body) } : {}),
    cache: 'no-store',
    signal: AbortSignal.timeout(8000),
  });
  const body = await response.json().catch(() => null);
  if (!response.ok || !body || !Array.isArray(body.items)) {
    const error = new Error('WooCommerce cart request failed');
    error.status = response.status;
    throw error;
  }
  return { body, token: response.headers.get('Cart-Token') || token };
}

export function publicCart(body) {
  const totals = body.totals || {};
  const minor = Number(totals.currency_minor_unit || 0);
  const currency = String(totals.currency_code || '').toUpperCase();
  return {
    items: body.items.map(item => ({
      id: item.id,
      key: item.key,
      quantity: item.quantity,
      name: item.name,
      image: item.images?.[0]?.src || '',
      price: Number(item.prices?.price || 0) / 10 ** Number(item.prices?.currency_minor_unit || 0),
    })),
    totalItems: Number(body.items_count) || 0,
    subtotal: Number(totals.total_items || 0) / 10 ** minor,
    unit: currency === 'IRR' ? 'ریال' : currency === 'IRT' || currency === 'TOMAN' ? 'تومان' : currency,
  };
}
