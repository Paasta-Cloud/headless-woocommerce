'use client';
import StoreLink from './store-link';

// THESIS: One Dinaha-inspired retail frame for every storefront route and state.
// OWN-WORLD: Turquoise actions, white shelves, cool gray ground and compact Persian type.
// STORY: Browse, choose, sign in and buy without falling into a different template.
// FIRST VIEWPORT: Announcement, two-row masthead, breadcrumbs and the route's real task.
// FORM: User-pinned Dinaha reference; native dialogs for its account and cart drawers.
import { useEffect, useRef, useState } from 'react';
import {usePathname} from 'next/navigation';
import { CartProvider, useCart } from '../use-cart';
import { demoProducts } from '../../lib/store';
import LoginForm from '../login/view';
import Icon from './icons';
import {StoreSettings} from './store-settings';
import IconBenefits from './store-benefits';
import {defaultDesign,contrastingText} from '../../lib/design';

export default function StoreShell({ mode, children, signedIn = false, settings=defaultDesign.settings, preview=false }) {
  const pathname=usePathname();
  if(pathname==='/manage'||pathname?.startsWith('/manage/')||pathname?.startsWith('/demos/'))return children;
  return <StoreFrame mode={mode} signedIn={signedIn} settings={settings} preview={preview}>{children}</StoreFrame>;
}
export function StoreFrame({mode,children,signedIn=false,settings=defaultDesign.settings,preview=false}){
  const style={'--configured-primary':settings.primary,'--primary-contrast':contrastingText(settings.primary),'--configured-background':settings.background,'--configured-surface':settings.surface,'--configured-text':settings.text,'--configured-muted':settings.muted,'--store-font':settings.font==='custom'&&settings.fontUrl?'StoreCustom,Tahoma,sans-serif':settings.font==='tahoma'?'Tahoma,Arial,sans-serif':'"Yekan Bakh",Tahoma,Arial,sans-serif','--store-font-size':`${settings.fontSize}px`,'--font-scale':settings.fontSize/14,'--store-width':`${settings.containerWidth}px`};
  return <StoreSettings.Provider value={settings}><CartProvider mode={mode}><div className="store-frame" data-store-theme={settings.theme} style={style}>{preview&&<div className="preview-notice">پیش‌نمایش خصوصی؛ این تغییرات هنوز برای مشتریان منتشر نشده‌اند.<StoreLink href="/">دیدن نسخهٔ عمومی</StoreLink></div>}<Chrome signedIn={signedIn} settings={settings}/>{children}<StoreFooter settings={settings}/></div></CartProvider></StoreSettings.Provider>;
}
function Chrome({ signedIn, settings }) {
  const login = useRef(null), basket = useRef(null);
  const pathname=usePathname();
  useEffect(()=>{login.current?.close();basket.current?.close();},[pathname]);
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
    <StoreLink className="skip-link" href="#store-content">رفتن به محتوای صفحه</StoreLink>
    {settings.announcement&&<div className="craft-announcement">{settings.announcement} <span>{settings.announcementNote}</span></div>}
    <header className="craft-header"><div className="craft-head-main"><StoreLink className="craft-brand" href="/" aria-label={`${settings.name}، صفحهٔ اصلی`}>{settings.logo?<img src={settings.logo} alt={settings.name}/>:<b>{settings.name}</b>}<small>{settings.tagline}</small></StoreLink>{settings.showSearch&&<form className="craft-search" role="search" action="/shop"><StoreLink href="/categories">دسته‌بندی <Icon name="grid"/></StoreLink><input name="q" aria-label="جست‌وجو در محصولات" placeholder="جست‌وجو در محصولات…" maxLength={100}/><button aria-label="جست‌وجو"><Icon name="search"/></button></form>}{signedIn?<StoreLink className="craft-account" href="/account"><Icon name="user"/>حساب کاربری من</StoreLink>:<button className="craft-account" onClick={()=>login.current.showModal()}><Icon name="user"/>ورود | ثبت‌نام</button>}</div>
    <nav className="craft-navigation" aria-label="منوی فروشگاه"><div>{settings.showCategories&&<details className="category-menu" onToggle={e=>{if(e.currentTarget.open)loadCategories();}}><summary><Icon name="menu"/>محصولات</summary><div className="category-dropdown"><StoreLink href="/shop">همهٔ محصولات <Icon name="arrow"/></StoreLink><StoreLink href="/categories">همهٔ دسته‌بندی‌ها</StoreLink>{fetching&&<p role="status">در حال دریافت دسته‌ها…</p>}{categoryError&&<button onClick={loadCategories}>{categoryError}</button>}{categories.map(c=><StoreLink key={c.id} href={`/category/${c.id}`}>{c.name}<small>{c.count.toLocaleString('fa-IR')}</small></StoreLink>)}</div></details>}{settings.headerLinks.map((link,index)=><StoreLink key={index} href={link.href}>{link.label}</StoreLink>)}</div><div>{settings.showTracking&&<StoreLink className="craft-tracking" href="/account"><Icon name="order"/>پیگیری سفارش‌ها</StoreLink>}{settings.showFavorites&&<StoreLink href="/favorites" aria-label="علاقه‌مندی‌ها"><Icon name="heart"/></StoreLink>}<button className="craft-basket" onClick={()=>basket.current.showModal()} aria-label={`سبد خرید، ${count.toLocaleString('fa-IR')} کالا`}><Icon name="bag"/><b>{count.toLocaleString('fa-IR')}</b></button></div></nav></header>
    <div id="store-content" tabIndex={-1}/>
    <dialog ref={login} className="store-drawer" aria-label="ورود به حساب" onClick={e=>{if(e.target===e.currentTarget)login.current.close();}}><div className="drawer-heading"><h2><Icon name="user"/>ورود به سایت</h2><button aria-label="بستن فرم ورود" onClick={()=>login.current.close()}><Icon name="close"/></button></div><LoginForm embedded/><Icon name="user" className="drawer-watermark"/></dialog>
    <dialog ref={basket} className="store-drawer" aria-label="سبد خرید" onClick={e=>{if(e.target===e.currentTarget)basket.current.close();}}><div className="drawer-heading"><h2><Icon name="bag"/>سبد خرید</h2><button aria-label="بستن سبد خرید" onClick={()=>basket.current.close()}><Icon name="close"/></button></div>{error&&<p className="form-error" role="alert">{error}</p>}{loading?<p role="status">در حال دریافت سبد…</p>:lines.length?<><div className="mini-cart">{lines.map(item=><StoreLink key={item.key||item.id} href={`/product/${item.id}`}><div>{item.image?<img src={item.image} alt=""/>:<Icon name="bag"/>}</div><span><b>{item.name}</b><small>{item.quantity.toLocaleString('fa-IR')} × {item.price.toLocaleString('fa-IR')} {unit||'تومان'}</small></span></StoreLink>)}</div><div className="mini-total"><span>جمع کالاها</span><strong>{Number(total||0).toLocaleString('fa-IR')} {unit||'تومان'}</strong></div><StoreLink className="primary-action" href="/cart">مشاهدهٔ سبد خرید</StoreLink><StoreLink className="secondary-button" href="/checkout">ادامه به صورت‌حساب</StoreLink></>:<div className="drawer-empty"><Icon name="bag"/><h3>سبد خرید شما خالی است</h3><p>هنوز کالایی انتخاب نکرده‌اید.</p><StoreLink className="primary-action" href="/shop">دیدن محصولات</StoreLink></div>}</dialog>
    {settings.showMobileNav&&<nav className="mobile-shop-nav" aria-label="دسترسی سریع موبایل">{settings.mobileLinks.map((link,index)=><StoreLink key={index} href={link.href}><Icon name={link.icon}/><span>{link.label}</span></StoreLink>)}</nav>}
  </>;
}
export function StoreFooter({settings=defaultDesign.settings}) {
  const groups=[...new Set(settings.footerLinks.map(link=>link.group||'پیوندها'))];
  return <footer className="store-footer"><div className="footer-inner">{settings.showBenefits&&<IconBenefits items={settings.benefits}/>}<div className="footer-columns"><div><StoreLink className="craft-brand" href="/">{settings.logo?<img src={settings.logo} alt={settings.name}/>:<b>{settings.name}</b>}</StoreLink><p>{settings.footerText}</p><small>{settings.footerNote}</small></div>{groups.map(group=><div key={group}><h2>{group}</h2>{settings.footerLinks.filter(link=>(link.group||'پیوندها')===group).map((link,index)=><StoreLink href={link.href} key={index}>{link.label}</StoreLink>)}</div>)}</div><div className="footer-bottom"><span>{settings.name} | {settings.description}</span><StoreLink href="#store-content">بازگشت به بالای صفحه ↑</StoreLink></div></div></footer>;
}
