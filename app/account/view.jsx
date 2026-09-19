'use client';
import { useState } from 'react';

export default function LogoutButton() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function logout() {
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/account', { method: 'DELETE' });
      if (!response.ok) throw new Error('خروج انجام نشد. دوباره تلاش کنید.');
      window.location.assign('/login');
    } catch (cause) { setError(cause.message); setBusy(false); }
  }
  return <div><button type="button" className="auth-logout" onClick={logout} disabled={busy}>{busy ? 'در حال خروج…' : 'خروج از حساب'}</button>{error && <p className="form-error" role="alert">{error}</p>}</div>;
}
