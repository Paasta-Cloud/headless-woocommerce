import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { validEmail, validPassword } from '../lib/account.js';
import { registerAction as registerPost, verifyAction as verifyPost, resendAction as resendPost, forgotAction as forgotPost, resetAction as resetPost } from '../lib/account-actions.js';

function storefrontRequest(path, body) {
  return new Request(`http://localhost:3000/api/account/${path}`, {
    method: 'POST',
    headers: { origin: 'http://localhost:3000', host: 'localhost:3000', 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function mockWordPress(handler) {
  const server = createServer(async (request, response) => {
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    const body = Buffer.concat(chunks).toString() ? JSON.parse(Buffer.concat(chunks).toString()) : {};
    const respond = handler(request.url, body);
    response.setHeader('content-type', 'application/json');
    response.writeHead(respond.status);
    response.end(JSON.stringify(respond.data));
  });
  return new Promise(resolve => server.listen(0, 'localhost', () => resolve(server)));
}

test('registration inputs are bounded before any WordPress call', async () => {
  const server = await mockWordPress(() => ({ status: 200, data: { ok: true } }));
  const previous = process.env.WOOCOMMERCE_URL;
  process.env.WOOCOMMERCE_URL = `http://localhost:${server.address().port}`;
  try {
    assert.equal(validEmail('user@example.com'), true);
    assert.equal(validEmail('user@example'), false);
    assert.equal(validEmail('a'.repeat(255) + '@example.com'), false);
    assert.equal(validPassword('12345678'), true);
    assert.equal(validPassword('1234567'), false);
    assert.equal(validPassword('x'.repeat(1025)), false);
    const badEmail = await registerPost(storefrontRequest('register', { email: 'not-an-email', password: '12345678' }));
    assert.equal(badEmail.status, 400);
    const shortPassword = await registerPost(storefrontRequest('register', { email: 'user@example.com', password: '1234567' }));
    assert.equal(shortPassword.status, 400);
    assert.equal((await registerPost(storefrontRequest('register', { email: 'user@example.com' }))).status, 400);
  } finally {
    if (previous === undefined) delete process.env.WOOCOMMERCE_URL;
    else process.env.WOOCOMMERCE_URL = previous;
    await new Promise(resolve => server.close(resolve));
  }
});

test('successful registration forwards only email and password and sets no session', async () => {
  let seen = null;
  const server = await mockWordPress((url, body) => {
    seen = { url, body };
    return { status: 200, data: { ok: true } };
  });
  const previous = process.env.WOOCOMMERCE_URL;
  process.env.WOOCOMMERCE_URL = `http://localhost:${server.address().port}`;
  try {
    const response = await registerPost(storefrontRequest('register', { email: 'user@example.com', password: 'پسورد-طولانی' }));
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { ok: true });
    assert.equal(seen.url, '/wp-json/khanechin/v1/register');
    assert.deepEqual(seen.body, { email: 'user@example.com', password: 'پسورد-طولانی' });
    assert.equal(response.headers.get('set-cookie'), null);
    assert.equal(response.headers.get('cache-control'), 'no-store');
  } finally {
    if (previous === undefined) delete process.env.WOOCOMMERCE_URL;
    else process.env.WOOCOMMERCE_URL = previous;
    await new Promise(resolve => server.close(resolve));
  }
});

test('taken emails surface the duplicate message without leaking sessions', async () => {
  const server = await mockWordPress(() => ({ status: 409, data: { code: 'email_taken' } }));
  const previous = process.env.WOOCOMMERCE_URL;
  process.env.WOOCOMMERCE_URL = `http://localhost:${server.address().port}`;
  try {
    const response = await registerPost(storefrontRequest('register', { email: 'taken@example.com', password: '12345678' }));
    assert.equal(response.status, 409);
    assert.match((await response.json()).error, /قبلاً ثبت شده/);
  } finally {
    if (previous === undefined) delete process.env.WOOCOMMERCE_URL;
    else process.env.WOOCOMMERCE_URL = previous;
    await new Promise(resolve => server.close(resolve));
  }
});

test('verification accepts only 64-hex tokens and forwards valid ones', async () => {
  let seen = null;
  const server = await mockWordPress((url, body) => {
    seen = { url, body };
    return { status: 200, data: { ok: true } };
  });
  const previous = process.env.WOOCOMMERCE_URL;
  process.env.WOOCOMMERCE_URL = `http://localhost:${server.address().port}`;
  try {
    assert.equal((await verifyPost(storefrontRequest('verify', { token: 'short' }))).status, 400);
    assert.equal(seen, null);
    const ok = await verifyPost(storefrontRequest('verify', { token: 'a'.repeat(64) }));
    assert.equal(ok.status, 200);
    assert.deepEqual(seen.body, { token: 'a'.repeat(64) });
    assert.equal(seen.url, '/wp-json/khanechin/v1/verify');
    const second = await verifyPost(storefrontRequest('verify', { token: 'b'.repeat(64) }));
    assert.equal(second.status, 200);
    assert.equal(seen.body.token, 'b'.repeat(64));
  } finally {
    if (previous === undefined) delete process.env.WOOCOMMERCE_URL;
    else process.env.WOOCOMMERCE_URL = previous;
    await new Promise(resolve => server.close(resolve));
  }
});

test('resend answers identically without confirming whether an account exists', async () => {
  const server = await mockWordPress(() => ({ status: 200, data: { ok: true } }));
  const previous = process.env.WOOCOMMERCE_URL;
  process.env.WOOCOMMERCE_URL = `http://localhost:${server.address().port}`;
  try {
    const response = await resendPost(storefrontRequest('resend', { email: 'maybe@example.com' }));
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { ok: true, message: 'اگر حسابی تأییدنشده با این ایمیل باشد، پیوند تازه برایش ارسال شد.' });
    assert.equal((await resendPost(storefrontRequest('resend', { email: 'bad' }))).status, 400);
  } finally {
    if (previous === undefined) delete process.env.WOOCOMMERCE_URL;
    else process.env.WOOCOMMERCE_URL = previous;
    await new Promise(resolve => server.close(resolve));
  }
});

test('password recovery request is generic and never reveals registered emails', async () => {
  const server = await mockWordPress((url, body) => {
    assert.equal(url, '/wp-json/khanechin/v1/lost-password');
    return { status: 200, data: { ok: true } };
  });
  const previous = process.env.WOOCOMMERCE_URL;
  process.env.WOOCOMMERCE_URL = `http://localhost:${server.address().port}`;
  try {
    const response = await forgotPost(storefrontRequest('forgot', { email: 'whoever@example.com' }));
    assert.equal(response.status, 200);
    assert.match((await response.json()).message, /اگر این ایمیل در فروشگاه ثبت شده باشد/);
    assert.equal((await forgotPost(storefrontRequest('forgot', { email: 'nope' }))).status, 400);
  } finally {
    if (previous === undefined) delete process.env.WOOCOMMERCE_URL;
    else process.env.WOOCOMMERCE_URL = previous;
    await new Promise(resolve => server.close(resolve));
  }
});

test('password reset forwards the login and key once and rejects short passwords', async () => {
  let seen = null;
  const server = await mockWordPress((url, body) => {
    seen = { url, body };
    return seen.body.password === 'rejected' ? { status: 400, data: { code: 'invalid_key' } } : { status: 200, data: { ok: true } };
  });
  const previous = process.env.WOOCOMMERCE_URL;
  process.env.WOOCOMMERCE_URL = `http://localhost:${server.address().port}`;
  try {
    assert.equal((await resetPost(storefrontRequest('reset', { login: 'user', key: 'k'.repeat(20), password: 'short' }))).status, 400);
    const ok = await resetPost(storefrontRequest('reset', { login: 'user@example.com', key: 'k'.repeat(20), password: 'رمز-تازه-۸نویسه' }));
    assert.equal(ok.status, 200);
    assert.equal(seen.url, '/wp-json/khanechin/v1/reset-password');
    assert.deepEqual(seen.body, { login: 'user@example.com', key: 'k'.repeat(20), password: 'رمز-تازه-۸نویسه' });
    const invalid = await resetPost(storefrontRequest('reset', { login: 'user@example.com', key: 'k'.repeat(20), password: 'rejected' }));
    assert.equal(invalid.status, 400);
    assert.match((await invalid.json()).error, /معتبر نیست یا منقضی شده/);
  } finally {
    if (previous === undefined) delete process.env.WOOCOMMERCE_URL;
    else process.env.WOOCOMMERCE_URL = previous;
    await new Promise(resolve => server.close(resolve));
  }
});
