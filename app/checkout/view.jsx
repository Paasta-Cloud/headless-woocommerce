'use client';

import { useEffect, useState } from 'react';

const labels = { first_name: 'نام', last_name: 'نام خانوادگی', email: 'ایمیل', phone: 'شماره تماس', state: 'استان', city: 'شهر', address_1: 'نشانی کامل', postcode: 'کد پستی' };
const fields = Object.keys(labels);

export default function CheckoutView() {
  const [summary, setSummary] = useState(null);
  const [address, setAddress] = useState(Object.fromEntries(fields.map(key => [key, ''])));
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [order, setOrder] = useState(null);
  useEffect(() => { let active = true; fetch('/api/checkout', { cache: 'no-store' }).then(async response => { const value = await response.json(); if (!response.ok) throw new Error(value.error); if (active) setSummary(value); }).catch(reason => { if (active) setError(reason.message || 'صورت‌حساب بارگذاری نشد.'); }); return () => { active = false; }; }, []);
  async function submit(event) {
    event.preventDefault();
    if (busy || !summary?.ready) return;
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ address, expectedTotal: summary.total }) });
      const value = await response.json();
      if (!response.ok) throw new Error(value.error);
      setOrder(value);
    } catch (reason) { setError(reason.message || 'ثبت سفارش تأیید نشد. پیش از تلاش دوباره حساب خود را بررسی کنید.'); }
    finally { setBusy(false); }
  }
  const price = amount => new Intl.NumberFormat('fa-IR').format(Number(amount || 0)) + ' ' + (summary?.unit || '');
  return <main className="shop-shell"><nav className="shop-nav"><a href="/" className="shop-brand">خانه‌چین</a><div><a href="/cart">بازگشت به سبد</a><a href="/account">حساب</a></div></nav>{order ? <div className="empty-state success-state" role="status"><span className="eyebrow">سفارش ثبت شد</span><h1>ممنون از خرید شما</h1><p>شمارهٔ سفارش: <b dir="ltr">{order.orderId}</b></p><p>{order.note}</p><p>این تأییدیه به معنی پرداخت‌شدن سفارش نیست.</p><a className="primary-action" href="/">بازگشت به فروشگاه</a></div> : <><div className="page-heading"><span className="eyebrow">مرحلهٔ ۲ از ۲</span><h1>صورت‌حساب و دریافت سفارش</h1><p>پیش از ثبت نهایی، اطلاعات تماس، نشانی و مبلغ را بررسی کنید.</p></div>{error && <p className="form-error" role="alert">{error}</p>}{!summary ? <p role="status">در حال دریافت صورت‌حساب…</p> : <div className="checkout-grid"><form id="checkout-form" className="address-form" onSubmit={submit}><h2>اطلاعات خریدار</h2><div className="form-grid">{fields.map(key => <label key={key} className={key === 'address_1' ? 'full' : ''}>{labels[key]}<input required={key !== 'postcode'} type={key === 'email' ? 'email' : key === 'phone' ? 'tel' : 'text'} autoComplete={{ first_name: 'given-name', last_name: 'family-name', email: 'email', phone: 'tel', state: 'address-level1', city: 'address-level2', address_1: 'street-address', postcode: 'postal-code' }[key]} value={address[key]} onChange={event => setAddress(previous => ({ ...previous, [key]: event.target.value }))}/></label>)}</div></form><aside className="order-summary"><h2>خلاصهٔ صورت‌حساب</h2>{summary.items.map(item => <div key={item.id}><span>{item.name} × {item.quantity.toLocaleString('fa-IR')}</span></div>)}<div className="total-row"><span>مبلغ فعلی</span><strong>{price(summary.displayTotal)}</strong></div><p>روش پرداخت: پرداخت در محل. مبلغی آنلاین دریافت نمی‌شود.</p>{summary.needsShipping && <p>روش ارسال و هزینهٔ آن باید پیش از ثبت سفارش در ووکامرس تعیین شود.</p>}{!summary.ready && <p className="form-error" role="alert">{summary.reason}</p>}<button type="submit" form="checkout-form" className="primary-action" disabled={!summary.ready || busy}>{busy ? 'در حال ثبت سفارش…' : 'ثبت سفارش با پرداخت در محل'}</button><p className="fine-print">با ثبت سفارش، اطلاعات این فرم برای پردازش سفارش به ووکامرس فرستاده می‌شود. اگر پاسخ نامشخص شد، پیش از تلاش دوباره سفارش‌های حساب یا ایمیل تأیید را بررسی کنید.</p></aside></div>}</>}</main>;
}
