'use client';
import {useStoreSettings} from '../components/store-settings';
import AuthFrame from '../components/auth-frame';
import PasswordInput from '../components/password-input';
import { useState } from 'react';

export default function LoginForm({ embedded = false, native = false }) {
  const settings=useStoreSettings();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [unverified, setUnverified] = useState(false);
  async function submit(event) {
    event.preventDefault();
    setBusy(true); setError(''); setUnverified(false);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch('/api/account', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ login: form.get('login'), password: form.get('password') }) });
      const result = await response.json();
      if (!response.ok) {
        setUnverified(result.unverified === true);
        throw new Error(result.error || 'ورود ممکن نشد. دوباره تلاش کنید.');
      }
      window.location.assign('/account');
    } catch (cause) { setError(cause.message); setBusy(false); }
  }
  return <AuthFrame embedded={embedded}><section className="auth-panel"><span className="eyebrow">حساب مشتری</span><h1>{native?'ورود / عضویت در':'ورود به'} {settings.name}</h1><p>{native?'با همان حساب و روال ورود فروشگاه وارد شوید. حساب جداگانه‌ای برای هدلس لازم نیست.':'سفارش‌ها و وضعیت خریدهای خود را در یک جا ببینید.'}</p><form onSubmit={submit}><label>{native?'شماره موبایل، ایمیل یا نام کاربری':'ایمیل یا نام کاربری'}<input name="login" autoComplete="username" required maxLength="254" dir="auto" /></label><label>رمز عبور<PasswordInput name="password" autoComplete="current-password" required /></label>{error && <p className="form-error" role="alert">{error}</p>}{unverified && <p className="form-success">ایمیل تأیید نرسیده؟ <a href="/verify">ارسال دوبارهٔ پیوند تأیید</a></p>}<button className="primary-action" disabled={busy}>{busy ? 'در حال بررسی…' : native?'ورود / عضویت':'ورود به حساب'}</button></form><p className="auth-foot">رمز عبور را فراموش کرده‌اید؟ <a href="/forgot">بازیابی رمز عبور</a></p>{!native&&<p className="auth-foot">حساب ندارید؟ <a href="/register">صفحهٔ عضویت</a></p>}</section></AuthFrame>;
}
