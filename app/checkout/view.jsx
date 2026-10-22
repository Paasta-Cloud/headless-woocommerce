'use client';
import { Breadcrumbs, CheckoutSteps } from '../components/ui';


import { useEffect, useRef, useState } from 'react';
import { IRAN_STATES } from '../../lib/iran-states';
import CouponForm from '../components/coupon-form';
import {useCart} from '../use-cart';

const fields = {
  first_name: ['نام', 'given-name'], last_name: ['نام خانوادگی', 'family-name'],
  email: ['ایمیل', 'email'], phone: ['شماره تماس', 'tel'], state: ['استان', 'address-level1'],
  city: ['شهر', 'address-level2'], address_1: ['نشانی کامل', 'street-address'], postcode: ['کد پستی', 'postal-code'],
};

export default function CheckoutView({initialAddress={}}) {
  const {busy:cartBusy,error:cartError,refreshCart}=useCart();
  const [summary, setSummary] = useState(null);
  const [address, setAddress] = useState(Object.fromEntries(Object.keys(fields).map(key => [key, initialAddress[key]||''])));
  const [method, setMethod] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [order, setOrder] = useState(null);
  const submitting = useRef(false);
  const [refreshing,setRefreshing]=useState(false);
  const [quotedAddress,setQuotedAddress]=useState('');
  const [uncertain,setUncertain]=useState(false);
  const selections=summary?.shippingPackages?.map(group=>({packageId:group.id,rateId:group.rates.find(rate=>rate.selected)?.id}))||[];
  const needsQuote=summary?.native&&quotedAddress!==JSON.stringify({address,method});
  async function quoteShipping(event,nextSelections,nextMethod=method){
    if(event?.currentTarget.form&&!event.currentTarget.form.reportValidity())return;
    setRefreshing(true);setError('');
    try{
      const response=await fetch('/api/checkout',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({address,paymentMethod:nextMethod,...(nextSelections?{shippingSelections:nextSelections}:{})})});
      const data=await response.json();if(!response.ok)throw Error(data.error);
      const selected=data.methods.includes(nextMethod)?nextMethod:data.methods[0]||'';
      setSummary(data);setMethod(selected);setQuotedAddress(JSON.stringify({address,method:selected}));
    }catch(reason){setQuotedAddress('');setError(reason.message||'محاسبهٔ ارسال ممکن نشد.');}finally{setRefreshing(false);}
  }
  async function refreshSummary(){setRefreshing(true);setError('');try{const response=await fetch('/api/checkout',{cache:'no-store'});const data=await response.json();if(!response.ok)throw Error(data.error);setSummary(data);setMethod(previous=>data.methods.includes(previous)?previous:data.methods[0]||'');}catch(reason){setSummary(null);setError(reason.message||'مبلغ تازه دریافت نشد؛ صفحه را تازه کنید.');}finally{setRefreshing(false);}}

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
    if (submitting.current || cartBusy || refreshing || !summary?.ready || needsQuote || uncertain) return;
    submitting.current = true;
    setBusy(true); setError('');
    if(summary.native)setUncertain(true);
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, expectedTotal: summary.total, paymentMethod: method,...(summary.native?{shippingSelections:selections}:{}) }),
      });
      const data = await response.json();
      if (!response.ok) {
        if(summary.native&&response.status>=400&&response.status<500){setUncertain(false);setQuotedAddress('');}
        throw new Error(data.error);
      }
      if (data.redirect) { window.location.assign(data.redirect); return; }
      setUncertain(false);
      setOrder(data);
      await refreshCart();
    } catch (reason) {
      setError(reason.message || 'وضعیت سفارش مشخص نشد. پیش از تلاش دوباره حساب ووکامرس یا ایمیل خود را بررسی کنید.');
    } finally { submitting.current = false; setBusy(false); }
  }

  const price = value => new Intl.NumberFormat('fa-IR').format(Number(value || 0)) + ' ' + (['IRT','TOMAN'].includes(summary?.unit) ? 'تومان' : summary?.unit || '');
  return <main className="shop-shell"><Breadcrumbs items={[{label:'صورت‌حساب'}]}/><CheckoutSteps current={2}/>

    {order ? <section className="empty-state success-state" role="status"><span className="eyebrow">سفارش ثبت شد</span><h1>ممنون از خرید شما</h1><p>شمارهٔ سفارش: <b dir="ltr">{order.orderId}</b></p><p>{order.note}</p><p>این تأییدیه به معنی پرداخت‌شدن سفارش نیست.</p><a className="primary-action" href="/">بازگشت به فروشگاه</a></section> : <>
      <div className="page-heading"><span className="eyebrow">مرحلهٔ ۲ از ۳</span><h1>صورت‌حساب و دریافت سفارش</h1><p>پیش از ثبت نهایی، اطلاعات تماس، روش دریافت و مبلغ را بررسی کنید.</p></div>
      {error && <p className="form-error" role="alert">{error}</p>}
      {cartError&&<p className="form-error" role="alert">{cartError}</p>}
      {!summary ? error ? <div className="empty-state"><h2>صورت‌حساب دریافت نشد</h2><p>سفارشی از این صفحه ثبت نشده است.</p><a className="primary-action" href="/cart">بررسی سبد خرید</a></div> : <p role="status">در حال دریافت صورت‌حساب…</p> : <div className="checkout-grid">
        <form id="checkout-form" className="address-form" onSubmit={submit}>
          <h2>اطلاعات خریدار</h2>
          <div className="form-grid">{Object.entries(fields).map(([key, [label, autocomplete]]) => <label key={key} className={key === 'address_1' ? 'full' : ''}>{label}{key === 'state' ? <select required autoComplete={autocomplete} value={address.state} onChange={event => setAddress(previous => ({ ...previous, state: event.target.value }))}><option value="">استان را انتخاب کنید</option>{Object.entries(IRAN_STATES).sort((a, b) => a[1].localeCompare(b[1], 'fa')).map(([code, name]) => <option key={code} value={code}>{name}</option>)}</select> : <input required maxLength={key === 'postcode' ? 10 : 200} pattern={key === 'postcode' ? '[0-9]{10}' : undefined} inputMode={key === 'postcode' ? 'numeric' : undefined} title={key === 'postcode' ? 'کد پستی ۱۰ رقمی وارد کنید' : undefined} type={key === 'email' ? 'email' : key === 'phone' ? 'tel' : 'text'} autoComplete={autocomplete} value={address[key]} onChange={event => setAddress(previous => ({ ...previous, [key]: event.target.value }))}/>}</label>)}</div>
          {summary.native&&<><button type="button" className="secondary-action" onClick={quoteShipping} disabled={busy||refreshing}>{refreshing?'در حال محاسبه…':'محاسبهٔ ارسال و مبلغ نهایی'}</button><p className="fine-print" role="status">{needsQuote?'پس از تکمیل یا تغییر نشانی، ارسال را محاسبه کنید.':'ارسال و مبلغ برای این نشانی از ووکامرس دریافت شد.'}</p></>}
        </form>
        <aside className="order-summary">
          <h2>خلاصهٔ صورت‌حساب</h2>
          {summary.items.map(item => <div key={item.id}><span>{item.name} × {item.quantity.toLocaleString('fa-IR')}</span></div>)}
          <div className="total-row"><span>مبلغ فعلی</span><strong>{price(summary.displayTotal)}</strong></div>
          <CouponForm onChanging={()=>setRefreshing(true)} onChanged={refreshSummary} disabled={busy||refreshing}/>
          {summary.pickupAddress && <div className="pickup-info"><strong>تحویل حضوری رایگان</strong><span>{summary.pickupAddress}</span></div>}
          {summary.needsShipping && <p>روش دریافت و هزینهٔ آن در ووکامرس محاسبه می‌شود.</p>}
          {summary.native&&summary.shippingPackages?.map(group=><fieldset key={group.id} className="payment-options"><legend>{group.name}</legend>{group.rates.length?group.rates.map(rate=><label key={rate.id}><input type="radio" name={`shipping-${group.id}`} checked={rate.selected} disabled={busy||refreshing||needsQuote} onChange={()=>quoteShipping(null,selections.map(item=>item.packageId===group.id?{...item,rateId:rate.id}:item))}/><span>{rate.name}<small>{price(Number(rate.price)/10**(summary.minorUnit||0))}</small></span></label>):<p>برای این نشانی روش ارسالی دریافت نشد.</p>}</fieldset>)}
          <fieldset className="payment-options"><legend>روش پرداخت</legend>
            {summary.native?summary.paymentOptions.map(option=><label key={option.id}><input type="radio" name="payment" value={option.id} checked={method===option.id} disabled={busy||refreshing} onChange={()=>{setMethod(option.id);setQuotedAddress('');if(!needsQuote)quoteShipping(null,selections,option.id);}}/><span>{option.title}{option.description&&<small>{option.description}</small>}</span></label>):<>{summary.methods.includes('cod') && <label><input type="radio" name="payment" value="cod" checked={method === 'cod'} onChange={() => setMethod('cod')}/><span>پرداخت در محل<small>پرداخت هنگام تحویل حضوری</small></span></label>}
            {summary.methods.includes('WC_Gateway_Zibal') && <label><input type="radio" name="payment" value="WC_Gateway_Zibal" checked={method === 'WC_Gateway_Zibal'} onChange={() => setMethod('WC_Gateway_Zibal')}/><span>درگاه زیبال{summary.zibalSandbox ? ' (آزمایشی)' : ''}<small>{summary.zibalSandbox ? 'پرداخت واقعی انجام نمی‌شود' : 'پس از ثبت سفارش به صفحهٔ امن پرداخت می‌روید'}</small></span></label>}</>}
          </fieldset>
          {summary.zibalSandbox && <p className="fine-print">این یک سفارش آزمایشی با کالاهای نمایشی است. وجهی دریافت و کالایی تحویل داده نمی‌شود.</p>}
          {!summary.ready && <p className="form-error" role="alert">{summary.reason}</p>}
          <button type="submit" form="checkout-form" className="primary-action" disabled={!summary.ready || !method || busy || cartBusy || refreshing || needsQuote || uncertain}>{busy ? 'در حال ثبت سفارش…' : uncertain?'ابتدا وضعیت سفارش را پیگیری کنید':summary.native?'ثبت سفارش و ادامهٔ پرداخت':summary.zibalSandbox ? 'ثبت سفارش آزمایشی و ادامه به زیبال' : method === 'cod' ? 'ثبت سفارش با پرداخت در محل' : 'ادامه به زیبال'}</button>
          <p className="fine-print">ثبت سفارش به معنی پرداخت نیست؛ نتیجه فقط پس از بازگشت و تأیید سمت سرور ووکامرس معتبر است. اگر پاسخ نامشخص شد، پیش از تلاش دوباره سفارش‌ها یا ایمیل خود را بررسی کنید.</p>
        </aside>
      </div>}
    </>}
  </main>;
}
