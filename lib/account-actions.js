import { accountRequest, validEmail, validPassword } from './account.js';
import { sameAccountOrigin } from './account-origin.js';

// These handlers stay free of next/server imports so the test suite can run
// them with the standard Response. Route files simply re-export them as POST.

function json(payload, status) {
  return Response.json(payload, { status, headers: { 'Cache-Control': 'no-store' } });
}

async function readJson(request) {
  return request.json().catch(() => null);
}

export async function registerAction(request) {
  if (!sameAccountOrigin(request)) return json({ error: 'مبدأ درخواست معتبر نیست. صفحه را تازه کنید.' }, 403);
  const body = await readJson(request);
  if (!validEmail(body?.email) || !validPassword(body?.password)) {
    return json({ error: 'ایمیل معتبر و رمز دست‌کم ۸ نویسه لازم است.' }, 400);
  }
  try {
    const result = await accountRequest('register', null, 'POST', { email: body.email.trim(), password: body.password });
    if (!result) return json({ error: 'حساب کاربری در حالت نمایشی در دسترس نیست.' }, 503);
    if (result.status === 429) return json({ error: 'تلاش‌های ثبت‌نام زیاد بوده است. بعداً دوباره امتحان کنید.' }, 429);
    if (result.status === 409) return json({ error: 'این ایمیل قبلاً ثبت شده است. وارد شوید یا رمز عبور را بازیابی کنید.' }, 409);
    if (result.status !== 200 && result.status !== 201) {
      return json({ error: 'ساخت حساب ممکن نشد. دوباره تلاش کنید.' }, 502);
    }
    return json({ ok: true }, 200);
  } catch {
    return json({ error: 'ارتباط با فروشگاه برقرار نشد. داده‌ای تغییر نکرده است؛ دوباره تلاش کنید.' }, 503);
  }
}

export async function verifyAction(request) {
  if (!sameAccountOrigin(request)) return json({ error: 'مبدأ درخواست معتبر نیست. صفحه را تازه کنید.' }, 403);
  const body = await readJson(request);
  if (typeof body?.token !== 'string' || !/^[a-f0-9]{64}$/.test(body.token)) {
    return json({ error: 'پیوند تأیید معتبر نیست یا منقضی شده است.' }, 400);
  }
  try {
    const result = await accountRequest('verify', null, 'POST', { token: body.token });
    if (!result) return json({ error: 'حساب کاربری در حالت نمایشی در دسترس نیست.' }, 503);
    if (result.status !== 200) return json({ error: 'پیوند تأیید معتبر نیست یا منقضی شده است. می‌توانید از فرم پایین پیوند تازه بگیرید.' }, 400);
    return json({ ok: true }, 200);
  } catch {
    return json({ error: 'ارتباط با فروشگاه برقرار نشد. دوباره تلاش کنید.' }, 503);
  }
}

export async function resendAction(request) {
  if (!sameAccountOrigin(request)) return json({ error: 'مبدأ درخواست معتبر نیست. صفحه را تازه کنید.' }, 403);
  const body = await readJson(request);
  if (!validEmail(body?.email)) return json({ error: 'ایمیل معتبر نیست.' }, 400);
  try {
    const result = await accountRequest('resend', null, 'POST', { email: body.email.trim() });
    if (!result) return json({ error: 'حساب کاربری در حالت نمایشی در دسترس نیست.' }, 503);
    if (result.status === 429) return json({ error: 'تلاش‌های زیاد بوده است. کمی بعد دوباره امتحان کنید.' }, 429);
    // WordPress keeps the answer identical whether or not the address exists,
    // so the storefront never reveals registered emails.
    return json({ ok: true, message: 'اگر حسابی تأییدنشده با این ایمیل باشد، پیوند تازه برایش ارسال شد.' }, 200);
  } catch {
    return json({ error: 'ارتباط با فروشگاه برقرار نشد. دوباره تلاش کنید.' }, 503);
  }
}

export async function forgotAction(request) {
  if (!sameAccountOrigin(request)) return json({ error: 'مبدأ درخواست معتبر نیست. صفحه را تازه کنید.' }, 403);
  const body = await readJson(request);
  if (!validEmail(body?.email)) return json({ error: 'ایمیل معتبر نیست.' }, 400);
  try {
    const result = await accountRequest('lost-password', null, 'POST', { email: body.email.trim() });
    if (!result) return json({ error: 'حساب کاربری در حالت نمایشی در دسترس نیست.' }, 503);
    if (result.status === 429) return json({ error: 'تلاش‌های زیاد بوده است. کمی بعد دوباره امتحان کنید.' }, 429);
    return json({ ok: true, message: 'اگر این ایمیل در فروشگاه ثبت شده باشد، پیوند بازیابی برایتان ارسال شد.' }, 200);
  } catch {
    return json({ error: 'ارتباط با فروشگاه برقرار نشد. دوباره تلاش کنید.' }, 503);
  }
}

export async function resetAction(request) {
  if (!sameAccountOrigin(request)) return json({ error: 'مبدأ درخواست معتبر نیست. صفحه را تازه کنید.' }, 403);
  const body = await readJson(request);
  const login = typeof body?.login === 'string' ? body.login.trim() : '';
  const key = typeof body?.key === 'string' ? body.key : '';
  if (!login || login.length > 254 || !key || key.length > 128 || !validPassword(body?.password)) {
    return json({ error: 'رمز تازه دست‌کم ۸ نویسه لازم است.' }, 400);
  }
  try {
    const result = await accountRequest('reset-password', null, 'POST', { login, key, password: body.password });
    if (!result) return json({ error: 'حساب کاربری در حالت نمایشی در دسترس نیست.' }, 503);
    if (result.status !== 200) return json({ error: 'پیوند بازیابی معتبر نیست یا منقضی شده است. دوباره درخواست بدهید.' }, 400);
    return json({ ok: true }, 200);
  } catch {
    return json({ error: 'ارتباط با فروشگاه برقرار نشد. دوباره تلاش کنید.' }, 503);
  }
}
