'use client';
import { useRef, useState } from 'react';
import AuthFrame from '../components/auth-frame';
import StoreLink from '../components/store-link';
import Icon from '../components/icons';
import { useStoreSettings } from '../components/store-settings';

export function AccountGate({ state }) {
  const settings = useStoreSettings();
  const unavailable = state === 'unavailable';
  const expired = state === 'expired';
  return <AuthFrame><section className="auth-panel account-gate"><span className="eyebrow">حساب من</span>{unavailable && <span className="account-gate-icon"><Icon name="info"/></span>}<h1>{unavailable ? 'اطلاعات حساب فعلاً در دسترس نیست' : expired ? 'دوباره وارد حساب شوید' : `به ${settings.name} خوش آمدید`}</h1><p>{unavailable ? 'ارتباط با فروشگاه برقرار نشد. درخواستی برای خروج از حساب یا تغییر اطلاعات شما ارسال نشده است. کمی بعد دوباره تلاش کنید.' : expired ? 'نشست ورود شما پایان یافته است. برای دیدن اطلاعات و سفارش‌ها، دوباره وارد شوید.' : 'برای دیدن اطلاعات حساب و سفارش‌های خود وارد شوید.'}</p><div className="auth-actions">{unavailable ? <><button type="button" className="primary-action" onClick={() => window.location.reload()}>تلاش دوباره</button><StoreLink href="/shop">بازگشت به فروشگاه</StoreLink></> : <><StoreLink className="primary-action" href="/login">ورود به حساب</StoreLink><StoreLink href="/register">هنوز حساب ندارید؟ عضویت</StoreLink></>}</div>{!unavailable && <p className="auth-foot">رمز را فراموش کرده‌اید؟ <StoreLink href="/forgot">بازیابی رمز</StoreLink></p>}</section></AuthFrame>;
}

export default function LogoutButton() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submitting = useRef(false);
  async function logout() {
    if (submitting.current) return;
    submitting.current = true;
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/account', { method: 'DELETE' });
      if (!response.ok) throw new Error('خروج تأیید نشد؛ ممکن است نشست شما هنوز فعال باشد. دوباره تلاش کنید.');
      window.location.assign('/login');
    } catch { setError('خروج تأیید نشد؛ ممکن است نشست شما هنوز فعال باشد. دوباره تلاش کنید.'); setBusy(false); submitting.current = false; }
  }
  return <div><button type="button" className="auth-logout" onClick={logout} disabled={busy}>{busy ? 'در حال خروج…' : 'خروج از حساب'}</button>{error && <p className="form-error" role="alert">{error}</p>}</div>;
}
