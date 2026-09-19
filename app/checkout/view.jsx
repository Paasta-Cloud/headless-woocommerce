'use client';

import { useEffect, useRef, useState } from 'react';

const fields = {
  first_name: ['نام', 'given-name'], last_name: ['نام خانوادگی', 'family-name'],
  email: ['ایمیل', 'email'], phone: ['شماره تماس', 'tel'], state: ['استان', 'address-level1'],
  city: ['شهر', 'address-level2'], address_1: ['نشانی کامل', 'street-address'], postcode: ['کد پستی', 'postal-code'],
};

export default function CheckoutView() {
  const [summary, setSummary] = useState(null);
  const [address, setAddress] = useState(Object.fromEntries(Object.keys(fields).map(key => [key, ''])));
  const [method, setMethod] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [order, setOrder] = useState(null);
  const submitting = useRef(false);

  useEffect(() => {
    let active = true;
    fetch('/api/checkout', { cache: 'no-store' }).then(async response => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      if (active) { setSummary(data); setMethod(data.methods?.[0] || ''); }
    }).catch(reason => { if (active) setError(reason.message || 'صورت‌حساب بارگذاری نشد. صفحه را تازه کنید.'); });
    return () => { active = false; };
  }, []);

  async function submit(event) {
    event.preventDefault();
    if (submitting.current || !summary?.ready) return;
    submitting.current = true;
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, expectedTotal: summary.total, paymentMethod: method }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      if (data.redirect) { window.location.assign(data.redirect); return; }
      setOrder(data);
    } catch (reason) {
      setError(reason.message || 'وضعیت سفارش مشخص نشد. پیش از تلاش دوباره حساب ووکامرس یا ایمیل خود را بررسی کنید.');
    } finally { submitting.current = false; setBusy(false); }
  }

  const price = value => new Intl.NumberFormat('fa-IR').format(Number(value || 0)) + ' ' + (summary?.unit || '');
  return <main className="shop-shell">
    <nav className="shop-nav"><a href="/" className="shop-brand">خانه‌چین</a><div><a href="/cart">بازگشت به سبد</a><a href="/account">حساب</a></div></nav>
    {order ? <section className="empty-state success-state" role="status"><span className="eyebrow">سفارش ثبت شد</span><h1>ممنون از خرید شما</h1><p>شمارهٔ سفارش: <b dir="ltr">{order.orderId}</b></p><p>{order.note}</p><p>این تأییدیه به معنی پرداخت‌شدن سفارش نیست.</p><a className="primary-action" href="/">بازگشت به فروشگاه</a></section> : <>
      <div className="page-heading"><span className="eyebrow">مرحلهٔ ۲ از ۲</span><h1>صورت‌حساب و دریافت سفارش</h1><p>پیش از ثبت نهایی، اطلاعات تماس، روش دریافت و مبلغ را بررسی کنید.</p></div>
      {error && <p className="form-error" role="alert">{error}</p>}
      {!summary ? <p role="status">در حال دریافت صورت‌حساب…</p> : <div className="checkout-grid">
        <form id="checkout-form" className="address-form" onSubmit={submit}>
          <h2>اطلاعات خریدار</h2>
          <div className="form-grid">{Object.entries(fields).map(([key, [label, autocomplete]]) => <label key={key} className={key === 'address_1' ? 'full' : ''}>{label}<input required={key !== 'postcode' && key !== 'state'} maxLength={200} type={key === 'email' ? 'email' : key === 'phone' ? 'tel' : 'text'} autoComplete={autocomplete} value={address[key]} onChange={event => setAddress(previous => ({ ...previous, [key]: event.target.value }))}/></label>)}</div>
        </form>
        <aside className="order-summary">
          <h2>خلاصهٔ صورت‌حساب</h2>
          {summary.items.map(item => <div key={item.id}><span>{item.name} × {item.quantity.toLocaleString('fa-IR')}</span></div>)}
          <div className="total-row"><span>مبلغ فعلی</span><strong>{price(summary.displayTotal)}</strong></div>
          {summary.pickupAddress && <div className="pickup-info"><strong>تحویل حضوری رایگان</strong><span>{summary.pickupAddress}</span></div>}
          {summary.needsShipping && <p>روش دریافت و هزینهٔ آن در ووکامرس محاسبه می‌شود.</p>}
          <fieldset className="payment-options"><legend>روش پرداخت</legend>
            {summary.methods.includes('cod') && <label><input type="radio" name="payment" value="cod" checked={method === 'cod'} onChange={() => setMethod('cod')}/><span>پرداخت در محل<small>پرداخت هنگام تحویل حضوری</small></span></label>}
            {summary.methods.includes('WC_Gateway_Zibal') && <label><input type="radio" name="payment" value="WC_Gateway_Zibal" checked={method === 'WC_Gateway_Zibal'} onChange={() => setMethod('WC_Gateway_Zibal')}/><span>درگاه زیبال{summary.zibalSandbox ? ' (آزمایشی)' : ''}<small>{summary.zibalSandbox ? 'پرداخت واقعی انجام نمی‌شود' : 'پس از ثبت سفارش به صفحهٔ امن پرداخت می‌روید'}</small></span></label>}
          </fieldset>
          {summary.zibalSandbox && <p className="fine-print">این یک سفارش آزمایشی با کالاهای نمایشی است. وجهی دریافت و کالایی تحویل داده نمی‌شود.</p>}
          {!summary.ready && <p className="form-error" role="alert">{summary.reason}</p>}
          <button type="submit" form="checkout-form" className="primary-action" disabled={!summary.ready || !method || busy}>{busy ? 'در حال ثبت سفارش…' : summary.zibalSandbox ? 'ثبت سفارش آزمایشی و ادامه به زیبال' : method === 'cod' ? 'ثبت سفارش با پرداخت در محل' : 'ادامه به زیبال'}</button>
          <p className="fine-print">در زیبال، ثبت سفارش به معنی پرداخت نیست؛ نتیجه فقط پس از بازگشت و تأیید سمت سرور ووکامرس معتبر است. اگر پاسخ نامشخص شد، پیش از تلاش دوباره سفارش‌ها یا ایمیل خود را بررسی کنید.</p>
        </aside>
      </div>}
    </>}
  </main>;
}
