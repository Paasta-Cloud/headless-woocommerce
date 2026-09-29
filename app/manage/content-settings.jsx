'use client';
import {useId,useState} from 'react';
import {defaultDesign} from '../../lib/design';

const pages={about:'دربارهٔ ما',contact:'تماس و دریافت',guide:'راهنمای خرید',faq:'سؤالات متداول',terms:'شرایط استفاده',privacy:'حریم خصوصی'};
function Text({label,value,onChange,large=false,max=200,hint}){
  const id=useId();
  return <label className="manage-field" htmlFor={id}><span>{label}</span>{large?<textarea id={id} value={value??''} rows={10} maxLength={max} onChange={e=>onChange(e.target.value)}/>:<input id={id} value={value??''} maxLength={max} onChange={e=>onChange(e.target.value)}/>} {hint&&<small>{hint}</small>}</label>;
}
function Toggle({label,value,onChange}){return <label className="manage-toggle"><input type="checkbox" checked={value} onChange={e=>onChange(e.target.checked)}/><span>{label}</span></label>;}
export default function ContentSettings({mode,value:s,onChange:set}){
  const [selected,select]=useState('about');
  const page=s.pages?.[selected]||defaultDesign.settings.pages[selected];
  const update=changes=>set({pages:{...s.pages,[selected]:{...page,...changes}}});
  const benefits=s.benefits??defaultDesign.settings.benefits;
  function item(index,changes){set({benefits:benefits.map((b,i)=>i===index?{...b,...changes}:b)});}
  if(mode==='content')return <>
    <h2>محتوای صفحات فروشگاه</h2>
    <p className="manage-hint">هر صفحه را جداگانه شخصی‌سازی کنید. تا «انتشار تغییرات» را نزنید، متن فعلی حفظ می‌شود. سیاست‌های فروش و حریم خصوصی باید با عملکرد واقعی فروشگاه هماهنگ باشند.</p>
    <label className="manage-field"><span>انتخاب صفحه</span><select value={selected} onChange={e=>select(e.target.value)}>{Object.entries(pages).map(([key,title])=><option key={key} value={key}>{title}</option>)}</select></label>
    <div className="manage-panel-heading"><h2>{pages[selected]}</h2><a href={'/'+selected} target="_blank" rel="noopener noreferrer">دیدن نسخهٔ منتشرشده ↗</a></div>
    <Toggle label="استفاده از محتوای اختصاصی این صفحه" value={page.enabled} onChange={enabled=>update({enabled})}/>
    <p className="manage-hint">خاموش‌کردن این گزینه، محتوای پیش‌فرض را برمی‌گرداند؛ متن اختصاصی شما پاک نمی‌شود.</p>
    <Text label="عنوان صفحه" value={page.title} onChange={title=>update({title})} hint="اگر خالی باشد، عنوان فعلی باقی می‌ماند."/>
    <Text label="توضیح زیر عنوان" value={page.intro} max={1000} onChange={intro=>update({intro})}/>
    <Text label="متن صفحه" value={page.body} max={12000} large onChange={body=>update({body})} hint="متن ساده؛ با یک خط خالی، پاراگراف تازه بسازید. کد HTML اجرا نمی‌شود. فعال‌کردن محتوای اختصاصی، تمام متن قبلی این صفحه را جایگزین می‌کند."/>
    {page.enabled&&!page.body.trim()&&<p className="manage-message">متن اختصاصی خالی است؛ پس از انتشار، بدنهٔ این صفحه خالی نمایش داده می‌شود.</p>}
  </>;
  return <>
    <h2>نمایش اجزای فروشگاه</h2>
    <p className="manage-hint">این گزینه‌ها فقط ظاهر را تغییر می‌دهند؛ پنهان‌کردن یک پیوند، مسیر یا قابلیت آن را غیرفعال نمی‌کند.</p>
    <div className="manage-visibility">{Object.entries({showSearch:'جست‌وجو در سربرگ',showCategories:'منوی دسته‌بندی‌ها',showTracking:'پیوند پیگیری سفارش',showFavorites:'پیوند علاقه‌مندی‌ها',showMobileNav:'نوار دسترسی موبایل',showBenefits:'خدمات پایین فروشگاه'}).map(([key,label])=><Toggle key={key} label={label} value={s[key]!==false} onChange={v=>set({[key]:v})}/>)}</div>
    <h2>صفحات ورود و حساب</h2>
    <Text label="عنوان کنار فرم ورود" value={s.authTitle} onChange={authTitle=>set({authTitle})} hint="عبارت {name} با نام فروشگاه جایگزین می‌شود."/>
    <Text label="توضیح کنار فرم ورود" value={s.authDescription} max={1000} onChange={authDescription=>set({authDescription})}/>
    <h2>خدمات پایین فروشگاه</h2>
    <p className="manage-hint">فقط خدماتی را بنویسید که واقعاً ارائه می‌کنید. حداکثر ۸ مورد؛ تغییر ترتیب با دکمه‌های بالا و پایین.</p>
    {benefits.map((b,index)=><section className="manage-benefit-editor" key={index}><h3>خدمت {(index+1).toLocaleString('fa-IR')}</h3><Text label="عنوان خدمت" value={b.title} onChange={title=>item(index,{title})}/><Text label="توضیح خدمت" value={b.body} max={500} onChange={body=>item(index,{body})}/><Text label="پیوند (اختیاری)" value={b.href} max={2048} onChange={href=>item(index,{href})} hint="مسیر داخلی مثل /guide یا نشانی کامل https://"/>
      <label className="manage-field"><span>آیکون</span><select value={b.icon} onChange={e=>item(index,{icon:e.target.value})}>{Object.entries({check:'تأیید',user:'حساب',heart:'قلب',bag:'سبد',order:'سفارش',info:'اطلاعات',pin:'نشانی',home:'خانه',grid:'دسته‌ها',search:'جست‌وجو'}).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>
      <div className="manage-item-actions"><button disabled={index===0} onClick={()=>{const next=[...benefits];[next[index-1],next[index]]=[next[index],next[index-1]];set({benefits:next});}} aria-label={'انتقال خدمت '+(index+1)+' به بالا'}>↑</button><button disabled={index===benefits.length-1} onClick={()=>{const next=[...benefits];[next[index+1],next[index]]=[next[index],next[index+1]];set({benefits:next});}} aria-label={'انتقال خدمت '+(index+1)+' به پایین'}>↓</button><button onClick={()=>set({benefits:benefits.filter((_,i)=>i!==index)})}>حذف خدمت</button></div>
    </section>)}
    <button disabled={benefits.length>=8} onClick={()=>set({benefits:[...benefits,{title:'',body:'',href:'',icon:'info'}]})}>+ افزودن خدمت</button>
  </>;
}
