'use client';
import {useState} from 'react';
import {storePresets} from '../../lib/store-presets';
import {presetAssets} from '../../lib/preset-assets';
import {buildConnectionPlan} from '../../lib/connection-plan';

// THESIS: Extend the existing merchant workbench with reversible starting points.
// OWN-WORLD: Existing RTL admin typography, quiet surfaces and explicit publication.
// STORY: Choose a draft, or prepare a connection plan without touching a live domain.
// FIRST VIEWPORT: Two named layouts or three labelled domain fields, one clear action.
// FORM: Local extension of the approved settings panel, not a new visual system.
export function PresetGallery({onSelect}){
  return <section className="manage-settings">
    <p>یک چیدمان اولیه انتخاب کنید، با محصولات خودتان پیش‌نمایش بگیرید و بعد منتشر کنید. چیدمان‌ها از Dina و Dinama الهام گرفته‌اند؛ تصاویر مرجع نمایشی‌اند و باید پیش از انتشار جایگزین شوند.</p>
    <div className="manage-preset-grid">{storePresets.map(preset=><article key={preset.id} className="manage-preset">
      <div className="manage-preset-swatch" style={{background:preset.background,borderTopColor:preset.color}}><img className="manage-preset-cover" src={presetAssets[preset.id].slides[0].image} alt={`اسلایدر قالب ${preset.name}`} width="1195" height="477" loading="lazy"/><details><summary>چیدمان {preset.sections.length.toLocaleString('fa-IR')} بخش صفحهٔ اصلی</summary><ol aria-label={`ترتیب بخش‌های ${preset.name}`}>{preset.sections.map((label,i)=><li key={label}><span>{(i+1).toLocaleString('fa-IR')}</span>{label}</li>)}</ol></details></div>
      <h2>{preset.name}</h2><p>{preset.description}</p><small>الهام از <bdi>{preset.reference}</bdi> · محصولات همین فروشگاه</small>
      <a href={`/demos/${preset.id}`} target="_blank" rel="noopener noreferrer">دیدن دمو با کاتالوگ نمایشی ↗</a>
      <button onClick={()=>onSelect(preset.id)}>استفاده در پیش‌نویس</button>
    </article>)}</div>
    <p className="manage-hint">نام، لوگو، فونت، منوها و صفحات شما حفظ می‌شوند. چیدمان صفحهٔ اصلی، سبک ویترین، عرض صفحه و دو رنگ تغییر می‌کنند؛ محصول نمونه وارد نمی‌شود. تغییر فقط پس از «انتشار تغییرات» عمومی خواهد شد.</p>
  </section>;
}

export function ConnectionPlanner(){
  const [values,setValues]=useState({backend:'',frontend:'',domain:''}),[plan,setPlan]=useState(null),[error,setError]=useState('');
  function submit(event){event.preventDefault();try{setPlan(buildConnectionPlan(values));setError('');}catch(e){setError(e.message);setPlan(null);}}
  function download(){const blob=new Blob([JSON.stringify(plan,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='paasta-connection-plan.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  return <section className="manage-settings manage-connection"><h2>ووکامرس همان‌جا؛ فرانت روی پاستا</h2><p>این مرحله برنامهٔ اتصال را آماده می‌کند؛ سرویس نمی‌سازد، دسترسی سایت را بررسی نمی‌کند و DNS را تغییر نمی‌دهد. رمز یا کلید API لازم نیست.</p><form onSubmit={submit}>{[['backend','نشانی مستقل ووکامرس','https://backend.your-store.ir','این نشانی پس از انتقال دامنهٔ اصلی هم باید به وردپرس برسد.'],['frontend','نشانی موقت فرانت در پاستا','https://your-app.region.paasta.app','پس از ساخت پروژه، نشانی واقعی را از پنل پاستا بردارید.'],['domain','دامنهٔ نهایی فروشگاه','https://your-store.ir','دامنه‌ای که مشتریان برای خرید باز می‌کنند.']].map(([key,label,placeholder,hint])=><label className="manage-field" key={key}><span>{label}</span><input type="url" dir="ltr" required maxLength={2048} placeholder={placeholder} value={values[key]} onChange={e=>{setValues({...values,[key]:e.target.value});setPlan(null);setError('');}}/><small>{hint}</small></label>)}{error&&<p role="alert" className="manage-message is-error">{error}</p>}<button className="manage-primary" type="submit">آماده‌کردن برنامهٔ اتصال</button></form>{plan&&<div className="manage-connection-result" role="region" aria-label="برنامهٔ اتصال"><p role="status">برنامه آماده است؛ اتصال و مالکیت دامنه‌ها هنوز بررسی نشده‌اند.</p><dl>{[['وردپرس روی هاست فعلی',plan.backend],['آزمون روی فرانت موقت',plan.temporaryFrontend],['فروشگاه نهایی',plan.publicFrontend]].map(([label,value])=><div key={label}><dt>{label}</dt><dd><bdi>{value}</bdi></dd></div>)}</dl><ol>{plan.steps.map(step=><li key={step.id}><h3>{step.title}</h3><p>{step.detail}</p></li>)}</ol><h3>متغیرهای اولیهٔ پروژه</h3><pre dir="ltr">{Object.entries(plan.environment).map(([key,value])=>`${key}=${value}`).join('\n')}</pre><button onClick={download} type="button">دریافت برنامهٔ اتصال (JSON)</button><p className="manage-hint">انتقال کامل وردپرس اختیاری است و در این برنامه انجام نمی‌شود. برای استقرار، از مسیر ساخت پروژه در حساب پاستای خودتان استفاده کنید.</p></div>}</section>;
}
