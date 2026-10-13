'use client';
import {useRef,useState} from 'react';
import './readiness.css';

const checks = [
  ['woocommerce','ووکامرس','ووکامرس و دسترسی کاتالوگ باید روی سایت متصل فعال باشند.','/manage/store?tab=products'],
  ['frontend','نشانی فرانت','نشانی HTTPS فرانت باید در اتصال وردپرس ثبت شود و با نشانی بک‌اند متفاوت باشد.'],
  ['account','حساب مشتری','ماژول حساب باید فعال باشد. ورود، عضویت و بازیابی رمز را هم با حساب آزمایشی امتحان کنید.','/login'],
  ['history','تاریخچهٔ کامل سفارش','ماژول جدید حساب برای دسترسی مشتری به سفارش‌های قدیمی لازم است.','/account?tab=orders'],
  ['payments','روش پرداخت پشتیبانی‌شده','پرداخت در محل یا زیبال باید در ووکامرس فعال باشد. فعال‌بودن تنظیم، تأیید اعتبار درگاه نیست.','/manage/store?tab=gateways'],
  ['other_gateways','سازگاری درگاه‌های دیگر','درگاه‌های خارج از فهرست پشتیبانی باید جداگانه بررسی شوند؛ به‌صورت خودکار در فرانت فعال نمی‌شوند.','/manage/store?tab=gateways'],
  ['shipping','روش دریافت سفارش','روش ارسال یا تحویل حضوری را تنظیم کنید. تطبیق با نشانی مشتری فقط در سبد خرید مشخص می‌شود.','/manage/store?tab=zones'],
  ['email','تحویل ایمیل','یک ایمیل بازیابی رمز و اعلان سفارش بفرستید و رسیدن آن‌ها به صندوق گیرنده را بررسی کنید.'],
  ['domain','دامنه و گواهی HTTPS','وضعیت دامنه را در پروژهٔ پاستا بررسی کنید؛ نشانی بک‌اند و رکوردهای ایمیل باید حفظ شوند.'],
  ['purchase','آزمون خرید','خرید موفق، لغو پرداخت، موجودی، تخفیف و خالی‌شدن سبد را روی دامنهٔ نهایی آزمایش کنید.'],
  ['restore','بازیابی پشتیبان','یک نسخهٔ پشتیبان را در محیط جدا بازیابی و محصولات و سفارش‌های آن را کنترل کنید.'],
];
export default function Readiness({request}) {
  const [report,setReport]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const lock=useRef(false),heading=useRef(null);
  async function inspect(){
    if(lock.current)return;lock.current=true;setBusy(true);setError('');setReport(null);
    try{const result=await request('readiness');if(!result?.checks)throw Error('پاسخ بررسی کامل نیست. دوباره تلاش کنید.');setReport(result);}
    catch(error){setError(error.message||'بررسی انجام نشد. دوباره تلاش کنید.');}
    finally{lock.current=false;setBusy(false);heading.current?.focus();}
  }
  const labels={configured:'تنظیم شده',blocked:'نیازمند اصلاح',review:'نیازمند آزمون'};
  return <section className="manage-readiness" aria-busy={busy} aria-labelledby="readiness-title">
    <div className="readiness-heading"><div><h2 id="readiness-title" ref={heading} tabIndex={-1}>بررسی فروشگاه متصل</h2><p>این بررسی فقط تنظیمات همین فروشگاه را می‌خواند. دامنه، محصولات، سفارش‌ها و پرداخت تغییری نمی‌کنند.</p></div><button type="button" className="manage-primary" disabled={busy} onClick={inspect}>{busy?'در حال بررسی…':report?'بررسی دوباره':'بررسی تنظیمات اتصال'}</button></div>
    {error&&<p className="manage-message is-error" role="alert">{error}</p>}
    {report&&<><div className="readiness-summary" role="status"><strong>{report.checkoutEnabled?'ثبت سفارش در فرانت فعال است.':'ثبت سفارش در فرانت غیرفعال است.'}</strong><span>{report.sandbox?'فرانت روی حالت آزمایشی زیبال است؛ حالت درگاه در وردپرس را هم بررسی کنید.':'فرانت روی حالت آزمایشی نیست؛ پیش از خرید، تنظیمات درگاه و مبلغ را بررسی کنید.'}</span><p>«تنظیم شده» فقط وجود تنظیمات را تأیید می‌کند. این گزارش، موفقیت خرید یا آمادگی نهایی فروشگاه را تضمین نمی‌کند.</p></div>
      <ol className="readiness-checks">{checks.map(([id,title,detail,href])=>{const state=Object.hasOwn(labels,report.checks[id])?report.checks[id]:'review';return <li key={id}><div><h3>{title}</h3><p>{detail}</p>{href&&<a href={href}>بازکردن بخش مربوط</a>}</div><span className="readiness-state" data-state={state}>{labels[state]}</span></li>;})}</ol>
    </>}
  </section>;
}
