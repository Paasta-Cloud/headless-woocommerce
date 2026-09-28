import { storeOrigin } from './store.js';

const API_ROOT = '/wp-json/wc/store/v1/cart';

export function sameSiteOrigin(request) {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  try {
    const url = new URL(request.url);
    const supplied = new URL(origin);
    const host = request.headers.get('host') || url.host;
    const protocol = (request.headers.get('x-forwarded-proto') || url.protocol.slice(0, -1)).split(',')[0].trim();
    return supplied.host.toLowerCase() === host.toLowerCase() && supplied.protocol === `${protocol}:`;
  } catch { return false; }
}

// Variation adds go to WooCommerce with the chosen variation ID and the exact
// attribute pairs reported for it; Woo validates the pairs against that
// variation server-side, so nothing here trusts client-side matching.
function variationInput(value) {
  if (!value || typeof value !== 'object' || !Number.isSafeInteger(value.id) || value.id <= 0) return null;
  if (!Array.isArray(value.attributes) || !value.attributes.length || value.attributes.length > 6) return null;
  const attributes = [];
  for (const attribute of value.attributes) {
    if (!attribute || typeof attribute.name !== 'string' || typeof attribute.value !== 'string') return null;
    const name = attribute.name.trim();
    const option = attribute.value.trim();
    if (!name || name.length > 100 || option.length > 200) return null;
    attributes.push({ attribute: name, value: option });
  }
  return { id: value.id, attributes };
}

export function cartAction(input) {
  if (!input || typeof input !== 'object') return null;
  if (input.action === 'add' && Number.isSafeInteger(input.id) && input.id > 0) {
    if (input.variation !== undefined) {
      const variation = variationInput(input.variation);
      if (!variation) return null;
      return { path: '/add-item', body: { id: variation.id, quantity: 1, variation: variation.attributes } };
    }
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
  // Some WordPress front caches serve the anonymous cart GET across Cart-Token
  // values, even with no-store headers. A unique, non-sensitive URL bypasses it.
  const url = `${origin}${API_ROOT}${action?.path || ''}${action ? '' : `?session_check=${crypto.randomUUID()}`}`;
  const response = await fetch(url, {
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
      variation: (Array.isArray(item.variation) ? item.variation : [])
        .filter(attribute => attribute && typeof attribute.value === 'string' && attribute.value.trim())
        .map(attribute => {
          const name = typeof (attribute.name ?? attribute.attribute) === 'string' ? (attribute.name ?? attribute.attribute).trim() : '';
          const value = attribute.value.trim();
          return name ? `${name}: ${value}` : value;
        })
        .join('، '),
    })),
    totalItems: Number(body.items_count) || 0,
    subtotal: Number(totals.total_items || 0) / 10 ** minor,
    unit: currency === 'IRR' ? 'ریال' : currency === 'IRT' || currency === 'TOMAN' ? 'تومان' : currency,
  };
}
