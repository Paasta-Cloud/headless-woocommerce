import { sameAccountOrigin } from './account-origin.js';
import { accountRequest } from './account.js';

import { billingFields } from './customer-billing.js';
export function validProfileBody(body) {
  return body && Object.keys(body).every(key => ['revision', 'values'].includes(key))
    && typeof body.revision === 'string' && /^[a-f0-9]{64}$/.test(body.revision)
    && body.values && typeof body.values === 'object' && !Array.isArray(body.values)
    && Object.keys(body.values).length === billingFields.length
    && billingFields.every(field => typeof body.values[field] === 'string' && body.values[field].length <= (field === 'address_1' ? 600 : 200));
}

export async function profileAction(request, token, upstream = accountRequest) {
  const json = (data, status) => Response.json(data, { status, headers: { 'Cache-Control': 'private, no-store' } });
  if (!sameAccountOrigin(request)) return json({ error: 'مبدأ درخواست معتبر نیست. صفحه را تازه کنید.' }, 403);
  if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) return json({ error: 'برای ذخیره، دوباره وارد حساب شوید.' }, 401);
  const body = await request.json().catch(() => null);
  if (!validProfileBody(body)) return json({ error: 'اطلاعات فرم معتبر نیست.' }, 400);
  try {
    const result = await upstream('profile', token, 'POST', body);
    if (result?.status === 401) return json({ error: 'نشست شما منقضی شده است. دوباره وارد حساب شوید.' }, 401);
    if (result?.status === 409) return json({ error: 'اطلاعات تغییر کرده یا ذخیرهٔ دیگری در حال انجام است. اطلاعات را دوباره بخوانید؛ تغییرات این فرم بازنویسی نشد.', reconcile: true }, 409);
    if (result?.status === 400) return json({ error: 'اطلاعات فرم پذیرفته نشد. طول و محتوای فیلدها را بررسی کنید.' }, 400);
    if (result?.status === 200 && result.data?.ok === true && /^[a-f0-9]{64}$/.test(result.data.billing_revision || '') && result.data.billing && billingFields.every(field => typeof result.data.billing[field] === 'string')) {
      return json({ ok: true, billing: result.data.billing, billing_revision: result.data.billing_revision }, 200);
    }
  } catch { /* A transport failure is not evidence that no write occurred. */ }
  return json({ error: 'نتیجهٔ ذخیره مشخص نیست. پیش از تلاش دوباره، اطلاعات ذخیره‌شده را دوباره بخوانید.', reconcile: true }, 503);
}

export async function loadCustomerOrder(id, token, request = accountRequest) {
  if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) return { state: 'guest', order: null };
  if (!Number.isSafeInteger(id) || id < 1) return { state: 'missing', order: null };
  try {
    const result = await request('customer-order', token, 'POST', { id });
    if (result?.status === 401) return { state: 'expired', order: null };
    if (result?.status === 404) return { state: 'missing', order: null };
    if (result?.status === 200 && result.data?.id === id && Array.isArray(result.data.items)) return { state: 'ready', order: result.data };
  } catch { /* Keep credentials and native errors private. */ }
  return { state: 'unavailable', order: null };
}
