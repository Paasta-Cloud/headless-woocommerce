import { cookies } from 'next/headers';
import { storeOrigin } from './store.js';

export const SESSION_COOKIE = 'khanechin_customer_session';

export async function accountRequest(path, token, method = 'GET', body) {
  const origin = storeOrigin();
  if (!origin) return null;
  const response = await fetch(`${origin}/wp-json/khanechin/v1/${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
    signal: AbortSignal.timeout(8000),
  });
  const data = await response.json();
  return { status: response.status, data };
}

export async function customerAccount() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  try {
    // Authenticated reads use POST because the WordPress host's public cache
    // incorrectly reused private GET responses despite no-store headers.
    const result = await accountRequest('me', token, 'POST');
    return result?.status === 200 ? result.data : null;
  } catch { return null; }
}
