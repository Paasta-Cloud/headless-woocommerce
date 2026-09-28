'use client';
import AuthFrame from '../components/auth-frame';
import PasswordInput from '../components/password-input';
import { useState } from 'react';

export default function ResetForm({ login, key0 }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  async function submit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get('password') || '');
    const confirm = String(form.get('confirm') || '');
    setError('');
    if (password !== confirm) { setError('رمز عبور و تکرار آن یکسان نیستند.'); return; }
    if (password.length < 8) { setError('رمز عبور دست‌کم باید ۸ نویسه باشد.'); return; }
    setBusy(true);
    try {
      const response = await fetch('/api/account/reset', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ login, key: key0, password }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'تعیین رمز تازه ممکن نشد.');
      setDone(true);
    } catch (cause) { setError(cause.message); } finally { setBusy(false); }
  }
  if (!login || !key0) {
    return <AuthFrame><section className="auth-panel"><span className="eyebrow">حساب مشتری</span><h1>تعیین رمز تازه</h1><p className="form-error" role="alert">این پیوند بازیابی کامل نیست. دوباره درخواست پیوند بدهید.</p><div className="auth-actions"><a className="primary-action" href="/forgot">درخواست پیوند بازیابی</a></div></section></AuthFrame>;
  }
  return <AuthFrame><section className="auth-panel"><span className="eyebrow">حساب مشتری</span><h1>تعیین رمز تازه</h1>{done ? <>
    <p className="form-success">رمز عبور شما تغییر کرد. با رمز تازه وارد شوید.</p>
    <div className="auth-actions"><a className="primary-action" href="/login">ورود به حساب</a></div>
  </> : <>
    <p>برای حساب خود رمز تازه‌ای تعیین کنید.</p>
    <form onSubmit={submit}>
      <label>رمز تازه (دست‌کم ۸ نویسه)<PasswordInput name="password" autoComplete="new-password" required minLength="8" /></label>
      <label>تکرار رمز تازه<PasswordInput name="confirm" autoComplete="new-password" required minLength="8" /></label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="primary-action" disabled={busy}>{busy ? 'در حال ثبت…' : 'ثبت رمز تازه'}</button>
    </form>
  </>}</section></AuthFrame>;
}
