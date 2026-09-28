'use client';
import AuthFrame from '../components/auth-frame';
import PasswordInput from '../components/password-input';
import { useEffect, useState } from 'react';

export default function VerifyView({ token }) {
  const [state, setState] = useState(token ? 'checking' : 'form');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!token) return;
    let active = true;
    fetch('/api/account/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) })
      .then(async response => {
        const result = await response.json();
        if (!active) return;
        if (!response.ok) throw new Error(result.error || 'پیوند تأیید معتبر نیست.');
        setState('ok');
      })
      .catch(cause => { if (active) { setState('failed'); setNotice(cause.message); } });
    return () => { active = false; };
  }, [token]);

  async function resend(event) {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get('email') || '').trim();
    setBusy(true); setError(''); setSuccess('');
    try {
      const response = await fetch('/api/account/resend', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'ارسال ممکن نشد. دوباره تلاش کنید.');
      setSuccess(result.message || 'اگر حسابی تأییدنشده با این ایمیل باشد، پیوند تازه برایش ارسال شد.');
    } catch (cause) { setError(cause.message); } finally { setBusy(false); }
  }

  return <AuthFrame><section className="auth-panel"><span className="eyebrow">تأیید حساب</span><h1>تأیید ایمیل</h1>{state === 'checking' && <p role="status">در حال بررسی پیوند تأیید…</p>}{state === 'ok' && <>
    <p className="form-success">ایمیل شما تأیید شد. حالا می‌توانید وارد حساب شوید.</p>
    <div className="auth-actions"><a className="primary-action" href="/login">ورود به حساب</a></div>
  </>}{state === 'failed' && <>
    <p className="form-error" role="alert">{notice || 'پیوند تأیید معتبر نیست یا منقضی شده است.'}</p>
    <ResendForm onSubmit={resend} busy={busy} error={error} success={success} />
  </>}{state === 'form' && <>
    <p>ایمیل خود را وارد کنید تا اگر حسابی تأییدنشده با آن وجود دارد، پیوند تأیید تازه برایش ارسال شود.</p>
    <ResendForm onSubmit={resend} busy={busy} error={error} success={success} />
  </>}</section></AuthFrame>;
}

function ResendForm({ onSubmit, busy, error, success }) {
  return <form onSubmit={onSubmit}>
    <label>ایمیل<input name="email" type="email" autoComplete="email" required maxLength="254" dir="ltr" /></label>
    {error && <p className="form-error" role="alert">{error}</p>}
    {success && <p className="form-success" role="status">{success}</p>}
    <button className="primary-action" disabled={busy}>{busy ? 'در حال ارسال…' : 'ارسال پیوند تأیید'}</button>
  </form>;
}
