'use client';
import {useStoreSettings} from '../components/store-settings';
import AuthFrame from '../components/auth-frame';
import PasswordInput from '../components/password-input';
import { useState } from 'react';

export default function RegisterForm() {
  const settings=useStoreSettings();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  async function submit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get('email') || '').trim();
    const password = String(form.get('password') || '');
    const confirm = String(form.get('confirm') || '');
    setError('');
    if (password !== confirm) { setError('رمز عبور و تکرار آن یکسان نیستند.'); return; }
    if (password.length < 8) { setError('رمز عبور دست‌کم باید ۸ نویسه باشد.'); return; }
    setBusy(true);
    try {
      const response = await fetch('/api/account/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'ثبت‌نام ممکن نشد. دوباره تلاش کنید.');
      setDone(true);
    } catch (cause) { setError(cause.message); } finally { setBusy(false); }
  }
  return <AuthFrame><section className="auth-panel"><span className="eyebrow">عضویت</span><h1>ساخت حساب {settings.name}</h1>{done ? <>
    <p className="form-success">حساب شما ساخته شد. پیوند تأیید به ایمیل شما ارسال شد؛ برای فعال‌شدن حساب، آن را باز کنید.</p>
    <div className="auth-actions"><a className="primary-action" href="/login">رفتن به ورود</a><a href="/verify">پیوند تأیید نرسیده؟ ارسال دوباره</a></div>
  </> : <>
    <p>پس از عضویت، سفارش‌های خود را در یک جا ببینید. برای فعال‌شدن حساب، پیوند تأیید به ایمیل شما فرستاده می‌شود.</p>
    <form onSubmit={submit}>
      <label>ایمیل<input name="email" type="email" autoComplete="email" required maxLength="254" dir="ltr" /></label>
      <label>رمز عبور (دست‌کم ۸ نویسه)<PasswordInput name="password" autoComplete="new-password" required minLength="8" /></label>
      <label>تکرار رمز عبور<PasswordInput name="confirm" autoComplete="new-password" required minLength="8" /></label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="primary-action" disabled={busy}>{busy ? 'در حال ساخت حساب…' : 'ساخت حساب'}</button>
    </form>
    <p className="auth-foot">از قبل حساب دارید؟ <a href="/login">ورود</a></p>
  </>}</section></AuthFrame>;
}
