import { storeOrigin } from './store.js';

export const SESSION_COOKIE = 'khanechin_customer_session';

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validEmail(value) {
  return typeof value === 'string' && value.length <= 254 && EMAIL_PATTERN.test(value);
}

export function validPassword(value) {
  return typeof value === 'string' && value.length >= 8 && value.length <= 1024;
}

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
