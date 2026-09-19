import { storeOrigin } from './store.js';

export function orderCookieName(id) {
  return Number.isSafeInteger(id) && id > 0 ? `khanechin_order_${id}` : null;
}

export function receiptFromCheckout(order, email) {
  if (!orderCookieName(order?.order_id) || !/^wc_order_[A-Za-z0-9]{8,64}$/.test(order?.order_key || '') || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '')) return null;
  return Buffer.from(JSON.stringify({ key: order.order_key, email }), 'utf8').toString('base64url');
}

export function decodeReceipt(value) {
  try {
    if (!value || value.length > 512) return null;
    const data = JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
    return /^wc_order_[A-Za-z0-9]{8,64}$/.test(data.key || '') && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email || '') ? data : null;
  } catch { return null; }
}

export async function getOrder(id, receipt) {
  const origin = storeOrigin();
  if (!origin || !orderCookieName(id) || !receipt) return null;
  const url = new URL(`${origin}/wp-json/wc/store/v1/order/${id}`);
  url.searchParams.set('key', receipt.key);
  url.searchParams.set('billing_email', receipt.email);
  const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(8000) });
  if (!response.ok) return null;
  const order = await response.json();
  if (order?.id !== id) return null;
  return {
    id,
    status: order.status,
    items: Array.isArray(order.items) ? order.items.map(item => ({ name: String(item.name || ''), quantity: Number(item.quantity || 0) })) : [],
    total: String(order.totals?.total_price || '0'),
    minorUnit: Number(order.totals?.currency_minor_unit || 0),
    currency: String(order.totals?.currency_code || ''),
  };
}
