'use client';
import AuthFrame from '../components/auth-frame';
import PasswordInput from '../components/password-input';
import { useState } from 'react';

export default function ForgotForm() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  async function submit(event) {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get('email') || '').trim();
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/account/forgot', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'ارسال ممکن نشد. دوباره تلاش کنید.');
      setDone(true);
    } catch (cause) { setError(cause.message); } finally { setBusy(false); }
  }
  return <AuthFrame><section className="auth-panel"><span className="eyebrow">حساب مشتری</span><h1>بازیابی رمز عبور</h1>{done ? <>
    <p className="form-success">اگر این ایمیل در فروشگاه ثبت شده باشد، پیوند بازیابی برایتان ارسال شد. صندوق ایمیل خود را ببینید.</p>
    <div className="auth-actions"><a className="primary-action" href="/login">بازگشت به ورود</a></div>
  </> : <>
    <p>ایمیل حساب خود را وارد کنید. پیوندی برای تعیین رمز تازه برایتان فرستاده می‌شود.</p>
    <form onSubmit={submit}>
      <label>ایمیل<input name="email" type="email" autoComplete="email" required maxLength="254" dir="ltr" /></label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="primary-action" disabled={busy}>{busy ? 'در حال ارسال…' : 'ارسال پیوند بازیابی'}</button>
    </form>
    <p className="auth-foot">یادتان آمد؟ <a href="/login">ورود</a></p>
  </>}</section></AuthFrame>;
}
