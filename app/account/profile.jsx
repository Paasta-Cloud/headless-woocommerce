'use client';

import { useEffect, useRef, useState } from 'react';
import { billingFields } from '../../lib/customer-billing';
import { IRAN_STATES } from '../../lib/iran-states';
import Icon from '../components/icons';

const labels = { first_name: 'نام', last_name: 'نام خانوادگی', phone: 'شمارهٔ تماس', state: 'استان', city: 'شهر', postcode: 'کد پستی', address_1: 'نشانی صورت‌حساب' };
const editable = billing => Object.fromEntries(billingFields.map(field => [field, billing?.[field] || '']));

export default function ProfileEditor({ account }) {
  const [saved, setSaved] = useState(editable(account.billing));
  const [values, setValues] = useState(saved);
  const [revision, setRevision] = useState(account.billing_revision || '');
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [reconcile, setReconcile] = useState(false);
  const pending = useRef(false);
  const dirty = JSON.stringify(values) !== JSON.stringify(saved);
  const supported = /^[a-f0-9]{64}$/.test(revision);
  useEffect(() => {
    if (!dirty) return;
    const unload = event => { event.preventDefault(); event.returnValue = ''; };
    const leave = event => {
      const anchor = event.target.closest?.('a[href]');
      if (anchor && !anchor.hasAttribute('download') && anchor.target !== '_blank' && new URL(anchor.href).href !== window.location.href && !window.confirm('تغییرات ذخیره نشده‌اند. از این صفحه خارج می‌شوید؟')) { event.preventDefault(); event.stopPropagation(); }
    };
    window.addEventListener('beforeunload', unload);
    document.addEventListener('click', leave, true);
    return () => { window.removeEventListener('beforeunload', unload); document.removeEventListener('click', leave, true); };
  }, [dirty]);
  function readAgain() {
    if (!dirty || window.confirm('برای خواندن اطلاعات ذخیره‌شده، تغییرات این فرم کنار گذاشته شود؟')) window.location.reload();
  }
  async function submit(event) {
    event.preventDefault();
    if (pending.current || !dirty || reconcile || !supported) return;
    pending.current = true; setBusy(true); setFeedback(null);
    try {
      const response = await fetch('/api/account/profile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ values, revision }) });
      const data = await response.json();
      if (!response.ok || !data.ok) { setFeedback({ error: true, text: data.error || 'ذخیره انجام نشد.' }); setReconcile(data.reconcile === true || response.status === 401); return; }
      const next = editable(data.billing);
      setValues(next); setSaved(next); setRevision(data.billing_revision);
      setFeedback({ text: 'اطلاعات تماس و نشانی شما ذخیره شد.' });
    } catch { setFeedback({ error: true, text: 'نتیجهٔ ذخیره مشخص نیست. اطلاعات ذخیره‌شده را دوباره بخوانید.' }); setReconcile(true); }
    finally { pending.current = false; setBusy(false); }
  }
  return <section className="customer-profile" aria-labelledby="profile-heading"><div className="customer-section-heading"><div><h2 id="profile-heading">اطلاعات تماس و نشانی</h2><p>برای خریدهای بعدی ذخیره می‌شود؛ سفارش‌های قبلی تغییر نمی‌کنند.</p></div><Icon name="user"/></div>
    <div className="customer-profile-email"><span>ایمیل ورود به حساب</span><bdi dir="ltr">{account.email}</bdi><small>ایمیل و رمز ورود از این فرم تغییر نمی‌کنند.</small></div>
    {!supported && <p className="customer-profile-feedback" role="status">ویرایش اطلاعات هنوز در این فروشگاه فعال نشده است. اتصال فروشگاه باید به‌روز شود.</p>}
    <form onSubmit={submit} className="customer-profile-form"><fieldset disabled={busy || !supported}><legend className="sr-only">اطلاعات صورت‌حساب</legend><div className="customer-profile-inputs">{billingFields.map(field => <label key={field} className={field === 'address_1' ? 'customer-profile-wide' : ''} htmlFor={`profile-${field}`}><span>{labels[field]}</span>{field === 'state' && account.billing?.country === 'IR' ? <select id={`profile-${field}`} value={values[field]} onChange={event => setValues({ ...values, [field]: event.target.value })}><option value="">انتخاب استان</option>{values.state && !IRAN_STATES[values.state] && <option value={values.state}>{values.state}</option>}{Object.entries(IRAN_STATES).map(([code, name]) => <option key={code} value={code}>{name}</option>)}</select> : field === 'address_1' ? <textarea id={`profile-${field}`} rows={3} maxLength={600} autoComplete="billing street-address" value={values[field]} onChange={event => setValues({ ...values, [field]: event.target.value })}/> : <input id={`profile-${field}`} maxLength={200} dir={['phone', 'postcode'].includes(field) ? 'ltr' : 'auto'} inputMode={field === 'phone' ? 'tel' : field === 'postcode' ? 'numeric' : 'text'} autoComplete={`billing ${ { first_name: 'given-name', last_name: 'family-name', phone: 'tel', city: 'address-level2', state: 'address-level1', postcode: 'postal-code' }[field] }`} value={values[field]} onChange={event => setValues({ ...values, [field]: event.target.value })}/>}</label>)}</div></fieldset>
      {feedback && <p className="customer-profile-feedback" data-error={feedback.error || undefined} role={feedback.error ? 'alert' : 'status'}>{feedback.text}</p>}
      <div className="customer-profile-actions"><button type="submit" className="primary-action" disabled={!dirty || busy || reconcile || !supported}>{busy ? 'در حال ذخیره…' : 'ذخیرهٔ اطلاعات'}</button>{reconcile ? <button type="button" className="secondary-action" disabled={busy} onClick={readAgain}>خواندن دوبارهٔ اطلاعات</button> : <button type="button" className="secondary-action" disabled={!dirty || busy} onClick={() => { setValues(saved); setFeedback(null); }}>لغو تغییرات</button>}<span aria-live="polite">{dirty ? 'تغییرات ذخیره نشده‌اند' : 'اطلاعات ذخیره‌شده'}</span></div>
    </form>
  </section>;
}
