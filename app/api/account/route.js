import { NextResponse } from 'next/server';
import { accountRequest, SESSION_COOKIE } from '../../../lib/account.js';
import { sameAccountOrigin } from '../../../lib/account-origin.js';

export async function POST(request) {
  if (!sameAccountOrigin(request)) return NextResponse.json({ error: 'مبدأ درخواست معتبر نیست. صفحه را تازه کنید.' }, { status: 403 });
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'درخواست نامعتبر است.' }, { status: 400 }); }
  const login = typeof body?.login === 'string' ? body.login.trim() : '';
  const password = typeof body?.password === 'string' ? body.password : '';
  if (!login || !password || login.length > 254 || password.length > 1024) return NextResponse.json({ error: 'ایمیل و رمز عبور را وارد کنید.' }, { status: 400 });
  try {
    const result = await accountRequest('login', null, 'POST', { login, password });
    if (!result) return NextResponse.json({ error: 'حساب کاربری در حالت نمایشی در دسترس نیست.' }, { status: 503 });
    if (result.status !== 200 || !/^[a-f0-9]{64}$/.test(result.data?.token || '')) return NextResponse.json({ error: result.status === 429 ? 'تلاش‌های ورود زیاد بوده است. ۱۵ دقیقه دیگر دوباره امتحان کنید.' : 'نام کاربری یا رمز عبور درست نیست.' }, { status: result.status === 429 ? 429 : 401 });
    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE, result.data.token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 12 * 60 * 60 });
    response.headers.set('Cache-Control', 'no-store');
    return response;
  } catch { return NextResponse.json({ error: 'ارتباط با فروشگاه برقرار نشد. داده‌ای تغییر نکرده است؛ دوباره تلاش کنید.' }, { status: 503 }); }
}

export async function DELETE(request) {
  if (!sameAccountOrigin(request)) return NextResponse.json({ error: 'مبدأ درخواست معتبر نیست.' }, { status: 403 });
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (token) {
    try {
      const result = await accountRequest('logout', token, 'POST');
      if (result?.status !== 200) throw new Error('Session revocation failed');
    } catch {
      return NextResponse.json({ error: 'خروج از سرور انجام نشد. نشست شما هنوز فعال است؛ کمی بعد دوباره تلاش کنید.' }, { status: 503 });
    }
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(SESSION_COOKIE);
  response.headers.set('Cache-Control', 'no-store');
  return response;
}
