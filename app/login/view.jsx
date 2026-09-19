'use client';
import { useState } from 'react';

export default function LoginForm() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(event) {
    event.preventDefault();
    setBusy(true); setError('');
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch('/api/account', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ login: form.get('login'), password: form.get('password') }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'ورود ممکن نشد. دوباره تلاش کنید.');
      window.location.assign('/account');
    } catch (cause) { setError(cause.message); setBusy(false); }
  }
  return <main className="shop-shell"><nav className="shop-nav"><a href="/" className="shop-brand">خانه‌چین</a><div><a href="/register">عضویت</a><a href="/">فروشگاه</a></div></nav><section className="auth-panel"><span className="eyebrow">حساب مشتری</span><h1>ورود به خانه‌چین</h1><p>سفارش‌ها و وضعیت خریدهای خود را در یک جا ببینید.</p><form onSubmit={submit}><label>ایمیل یا نام کاربری<input name="login" autoComplete="username" required maxLength="254" /></label><label>رمز عبور<input name="password" type="password" autoComplete="current-password" required /></label>{error && <p className="form-error" role="alert">{error}</p>}<button className="primary-action" disabled={busy}>{busy ? 'در حال بررسی…' : 'ورود به حساب'}</button></form><p className="auth-foot">حساب ندارید؟ <a href="/register">صفحهٔ عضویت</a></p></section></main>;
}
