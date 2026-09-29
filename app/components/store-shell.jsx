'use client';
// THESIS: One Dinaha-inspired retail frame for every storefront route and state.
// OWN-WORLD: Turquoise actions, white shelves, cool gray ground and compact Persian type.
// STORY: Browse, choose, sign in and buy without falling into a different template.
// FIRST VIEWPORT: Announcement, two-row masthead, breadcrumbs and the route's real task.
// FORM: User-pinned Dinaha reference; native dialogs for its account and cart drawers.
import { useRef, useState } from 'react';
import {usePathname} from 'next/navigation';
import { CartProvider, useCart } from '../use-cart';
import { demoProducts } from '../../lib/store';
import LoginForm from '../login/view';
import Icon from './icons';
import {StoreSettings} from './store-settings';
import { Benefits } from './ui';
import {defaultDesign,contrastingText} from '../../lib/design';

export default function StoreShell({ mode, children, signedIn = false, settings=defaultDesign.settings, preview=false }) {
  const pathname=usePathname();
  if(pathname==='/manage'||pathname?.startsWith('/manage/'))return children;
  const style={'--configured-primary':settings.primary,'--primary-contrast':contrastingText(settings.primary),'--configured-background':settings.background,'--configured-surface':settings.surface,'--configured-text':settings.text,'--configured-muted':settings.muted,'--store-font':settings.font==='custom'&&settings.fontUrl?'StoreCustom,Tahoma,sans-serif':settings.font==='tahoma'?'Tahoma,Arial,sans-serif':'"Yekan Bakh",Tahoma,Arial,sans-serif','--store-font-size':`${settings.fontSize}px`,'--font-scale':settings.fontSize/14,'--store-width':`${settings.containerWidth}px`};
  return <StoreSettings.Provider value={settings}><CartProvider mode={mode}><div className="store-frame" style={style}>{preview&&<div className="preview-notice">پیش‌نمایش خصوصی؛ این تغییرات هنوز برای مشتریان منتشر نشده‌اند.<a href="/">دیدن نسخهٔ عمومی</a></div>}<Chrome signedIn={signedIn} settings={settings}/>{children}<StoreFooter settings={settings}/></div></CartProvider></StoreSettings.Provider>;
}
function Chrome({ signedIn, settings }) {
  const login = useRef(null), basket = useRef(null);
  const { cart, entries, subtotal, unit, mode, loading, error } = useCart();
  const count = Object.values(cart).reduce((a,b)=>a+b,0);
  const lines = mode==='demo' ? demoProducts.filter(p=>cart[p.id]).map(p=>({...p,quantity:cart[p.id]})) : entries;
  const total = mode==='demo' ? lines.reduce((sum,p)=>sum+p.price*p.quantity,0) : subtotal;
  const [categories,setCategories]=useState([]), [categoryError,setCategoryError]=useState('');
  const [fetching,setFetching]=useState(false);
  async function loadCategories() {
    if (fetching || categories.length) return;
    setFetching(true); setCategoryError('');
    try { const response=await fetch('/api/catalog'); const data=await response.json(); if(!response.ok)throw Error('دسته‌ها دریافت نشدند.'); setCategories(data.categories); }
    catch { setCategoryError('دسته‌بندی‌ها دریافت نشدند. دوباره تلاش کنید.'); }
    finally { setFetching(false); }
  }
  return <>
    <a className="skip-link" href="#store-content">رفتن به محتوای صفحه</a>
    {settings.announcement&&<div className="craft-announcement">{settings.announcement} <span>{settings.announcementNote}</span></div>}
    <header className="craft-header"><div className="craft-head-main"><a className="craft-brand" href="/" aria-label={`${settings.name}، صفحهٔ اصلی`}>{settings.logo?<img src={settings.logo} alt={settings.name}/>:<b>{settings.name}</b>}<small>{settings.tagline}</small></a><form className="craft-search" role="search" action="/shop"><a href="/categories">دسته‌بندی <Icon name="grid"/></a><input name="q" aria-label="جست‌وجو در محصولات" placeholder="جست‌وجو در محصولات…" maxLength={100}/><button aria-label="جست‌وجو"><Icon name="search"/></button></form>{signedIn?<a className="craft-account" href="/account"><Icon name="user"/>حساب کاربری من</a>:<button className="craft-account" onClick={()=>login.current.showModal()}><Icon name="user"/>ورود | ثبت‌نام</button>}</div>
    <nav className="craft-navigation" aria-label="منوی فروشگاه"><div><details className="category-menu" onToggle={e=>{if(e.currentTarget.open)loadCategories();}}><summary><Icon name="menu"/>محصولات</summary><div className="category-dropdown"><a href="/shop">همهٔ محصولات <Icon name="arrow"/></a><a href="/categories">همهٔ دسته‌بندی‌ها</a>{fetching&&<p role="status">در حال دریافت دسته‌ها…</p>}{categoryError&&<button onClick={loadCategories}>{categoryError}</button>}{categories.map(c=><a key={c.id} href={`/category/${c.id}`}>{c.name}<small>{c.count.toLocaleString('fa-IR')}</small></a>)}</div></details>{settings.headerLinks.map((link,index)=><a key={index} href={link.href}>{link.label}</a>)}</div><div><a className="craft-tracking" href="/account"><Icon name="order"/>پیگیری سفارش‌ها</a><a href="/favorites" aria-label="علاقه‌مندی‌ها"><Icon name="heart"/></a><button className="craft-basket" onClick={()=>basket.current.showModal()} aria-label={`سبد خرید، ${count.toLocaleString('fa-IR')} کالا`}><Icon name="bag"/><b>{count.toLocaleString('fa-IR')}</b></button></div></nav></header>
    <div id="store-content" tabIndex={-1}/>
    <dialog ref={login} className="store-drawer" aria-label="ورود به حساب" onClick={e=>{if(e.target===e.currentTarget)login.current.close();}}><div className="drawer-heading"><h2><Icon name="user"/>ورود به سایت</h2><button aria-label="بستن فرم ورود" onClick={()=>login.current.close()}><Icon name="close"/></button></div><LoginForm embedded/><Icon name="user" className="drawer-watermark"/></dialog>
    <dialog ref={basket} className="store-drawer" aria-label="سبد خرید" onClick={e=>{if(e.target===e.currentTarget)basket.current.close();}}><div className="drawer-heading"><h2><Icon name="bag"/>سبد خرید</h2><button aria-label="بستن سبد خرید" onClick={()=>basket.current.close()}><Icon name="close"/></button></div>{error&&<p className="form-error" role="alert">{error}</p>}{loading?<p role="status">در حال دریافت سبد…</p>:lines.length?<><div className="mini-cart">{lines.map(item=><a key={item.key||item.id} href={`/product/${item.id}`}><div>{item.image?<img src={item.image} alt=""/>:<Icon name="bag"/>}</div><span><b>{item.name}</b><small>{item.quantity.toLocaleString('fa-IR')} × {item.price.toLocaleString('fa-IR')} {unit||'تومان'}</small></span></a>)}</div><div className="mini-total"><span>جمع کالاها</span><strong>{Number(total||0).toLocaleString('fa-IR')} {unit||'تومان'}</strong></div><a className="primary-action" href="/cart">مشاهدهٔ سبد خرید</a><a className="secondary-button" href="/checkout">ادامه به صورت‌حساب</a></>:<div className="drawer-empty"><Icon name="bag"/><h3>سبد خرید شما خالی است</h3><p>هنوز کالایی انتخاب نکرده‌اید.</p><a className="primary-action" href="/shop">دیدن محصولات</a></div>}</dialog>
    <nav className="mobile-shop-nav" aria-label="دسترسی سریع موبایل">{settings.mobileLinks.map((link,index)=><a key={index} href={link.href}><Icon name={link.icon}/><span>{link.label}</span></a>)}</nav>
  </>;
}
export function StoreFooter({settings=defaultDesign.settings}) {
  const groups=[...new Set(settings.footerLinks.map(link=>link.group||'پیوندها'))];
  return <footer className="store-footer"><div className="footer-inner"><Benefits/><div className="footer-columns"><div><a className="craft-brand" href="/">{settings.logo?<img src={settings.logo} alt={settings.name}/>:<b>{settings.name}</b>}</a><p>{settings.footerText}</p><small>{settings.footerNote}</small></div>{groups.map(group=><div key={group}><h2>{group}</h2>{settings.footerLinks.filter(link=>(link.group||'پیوندها')===group).map((link,index)=><a href={link.href} key={index}>{link.label}</a>)}</div>)}</div><div className="footer-bottom"><span>{settings.name} | {settings.description}</span><a href="#store-content">بازگشت به بالای صفحه ↑</a></div></div></footer>;
}
