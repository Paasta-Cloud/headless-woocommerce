import { accountRequest } from './account.js';

export async function loadCustomerHistory(token, cursor = '', request = accountRequest) {
  if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) return { state: 'guest' };
  if (typeof cursor !== 'string' || cursor.length > 600) return { state: 'invalid' };
  try {
    const result = await request('customer-orders', token, 'POST', { cursor });
    if (result?.status === 401) return { state: 'expired' };
    if (result?.status === 400) return { state: 'invalid' };
    // An older connector still serves the latest orders through /me.
    if (result?.status === 404 && result.data?.code === 'rest_no_route') return { state: 'unsupported' };
    const data = result?.data;
    if (result?.status === 200 && Array.isArray(data?.orders) && data.orders.length <= 20
      && data.orders.every(order => Number.isSafeInteger(order?.id) && order.id > 0)
      && (data.next_cursor === null || (typeof data.next_cursor === 'string' && /^[A-Za-z0-9_-]+\.[a-f0-9]{64}$/.test(data.next_cursor) && data.next_cursor.length <= 600))) {
      return { state: 'ready', orders: data.orders, next: data.next_cursor };
    }
  } catch { /* Keep a valid session and never show upstream/private errors. */ }
  return { state: 'unavailable' };
}
