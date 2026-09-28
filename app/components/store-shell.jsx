'use client';
// THESIS: One Dinaha-inspired retail frame for every storefront route and state.
// OWN-WORLD: Turquoise actions, white shelves, cool gray ground and compact Persian type.
// STORY: Browse, choose, sign in and buy without falling into a different template.
// FIRST VIEWPORT: Announcement, two-row masthead, breadcrumbs and the route's real task.
// FORM: User-pinned Dinaha reference; native dialogs for its account and cart drawers.
import { useRef, useState } from 'react';
import { CartProvider, useCart } from '../use-cart';
import { demoProducts } from '../../lib/store';
import LoginForm from '../login/view';
import Icon from './icons';
import { Benefits } from './ui';

export default function StoreShell({ mode, children, signedIn = false }) {
  return <CartProvider mode={mode}><div className="store-frame"><Chrome signedIn={signedIn}/>{children}<StoreFooter/></div></CartProvider>;
}
function Chrome({ signedIn }) {
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
    <div className="craft-announcement">خانه‌چین؛ تماشای هنر، انتخابی برای خانه <span>فروشگاه نمونهٔ صنایع‌دستی</span></div>
    <header className="craft-header"><div className="craft-head-main"><a className="craft-brand" href="/" aria-label="خانه‌چین، صفحهٔ اصلی"><b><span>خانه</span>‌چین</b><small>هنر ایرانی، برای خانهٔ شما</small></a><form className="craft-search" role="search" action="/shop"><a href="/categories">دسته‌بندی <Icon name="grid"/></a><input name="q" aria-label="جست‌وجو در محصولات" placeholder="جست‌وجو در محصولات…" maxLength={100}/><button aria-label="جست‌وجو"><Icon name="search"/></button></form>{signedIn?<a className="craft-account" href="/account"><Icon name="user"/>حساب کاربری من</a>:<button className="craft-account" onClick={()=>login.current.showModal()}><Icon name="user"/>ورود | ثبت‌نام</button>}</div>
    <nav className="craft-navigation" aria-label="منوی فروشگاه"><div><details className="category-menu" onToggle={e=>{if(e.currentTarget.open)loadCategories();}}><summary><Icon name="menu"/>محصولات</summary><div className="category-dropdown"><a href="/shop">همهٔ محصولات <Icon name="arrow"/></a><a href="/categories">همهٔ دسته‌بندی‌ها</a>{fetching&&<p role="status">در حال دریافت دسته‌ها…</p>}{categoryError&&<button onClick={loadCategories}>{categoryError}</button>}{categories.map(c=><a key={c.id} href={`/category/${c.id}`}>{c.name}<small>{c.count.toLocaleString('fa-IR')}</small></a>)}</div></details><a href="/guide"><Icon name="order"/>راهنمای خرید</a><a href="/faq"><Icon name="info"/>سؤالات متداول</a><a href="/about">دربارهٔ ما</a><a href="/contact">ارتباط با ما</a></div><div><a className="craft-tracking" href="/account"><Icon name="order"/>پیگیری سفارش‌ها</a><a href="/favorites" aria-label="علاقه‌مندی‌ها"><Icon name="heart"/></a><button className="craft-basket" onClick={()=>basket.current.showModal()} aria-label={`سبد خرید، ${count.toLocaleString('fa-IR')} کالا`}><Icon name="bag"/><b>{count.toLocaleString('fa-IR')}</b></button></div></nav></header>
    <div id="store-content" tabIndex={-1}/>
    <dialog ref={login} className="store-drawer" aria-label="ورود به حساب" onClick={e=>{if(e.target===e.currentTarget)login.current.close();}}><div className="drawer-heading"><h2><Icon name="user"/>ورود به سایت</h2><button aria-label="بستن فرم ورود" onClick={()=>login.current.close()}><Icon name="close"/></button></div><LoginForm embedded/><Icon name="user" className="drawer-watermark"/></dialog>
    <dialog ref={basket} className="store-drawer" aria-label="سبد خرید" onClick={e=>{if(e.target===e.currentTarget)basket.current.close();}}><div className="drawer-heading"><h2><Icon name="bag"/>سبد خرید</h2><button aria-label="بستن سبد خرید" onClick={()=>basket.current.close()}><Icon name="close"/></button></div>{error&&<p className="form-error" role="alert">{error}</p>}{loading?<p role="status">در حال دریافت سبد…</p>:lines.length?<><div className="mini-cart">{lines.map(item=><a key={item.key||item.id} href={`/product/${item.id}`}><div>{item.image?<img src={item.image} alt=""/>:<Icon name="bag"/>}</div><span><b>{item.name}</b><small>{item.quantity.toLocaleString('fa-IR')} × {item.price.toLocaleString('fa-IR')} {unit||'تومان'}</small></span></a>)}</div><div className="mini-total"><span>جمع کالاها</span><strong>{Number(total||0).toLocaleString('fa-IR')} {unit||'تومان'}</strong></div><a className="primary-action" href="/cart">مشاهدهٔ سبد خرید</a><a className="secondary-button" href="/checkout">ادامه به صورت‌حساب</a></>:<div className="drawer-empty"><Icon name="bag"/><h3>سبد خرید شما خالی است</h3><p>هنوز کالایی انتخاب نکرده‌اید.</p><a className="primary-action" href="/shop">دیدن محصولات</a></div>}</dialog>
    <nav className="mobile-shop-nav" aria-label="دسترسی سریع موبایل">{[['home','خانه','/'],['grid','دسته‌ها','/categories'],['heart','علاقه‌مندی','/favorites'],['bag','سبد خرید','/cart'],['user','حساب من','/account']].map(([icon,title,href])=><a key={href} href={href}><Icon name={icon}/><span>{title}</span></a>)}</nav>
  </>;
}
export function StoreFooter() { return <footer className="store-footer"><div className="footer-inner"><Benefits/><div className="footer-columns"><div><a className="craft-brand" href="/"><b><span>خانه</span>‌چین</b></a><p>هنر دست، برای خانهٔ شما. جزئیات هر کالا را ببینید و انتخاب‌های خود را برای بعد نگه دارید.</p><small>نمونهٔ متن‌باز فروشگاه فارسی روی پاستا</small></div><div><h2>همراه خرید شما</h2><a href="/shop">همهٔ محصولات</a><a href="/categories">دسته‌بندی‌ها</a><a href="/favorites">علاقه‌مندی‌ها</a><a href="/cart">سبد خرید</a></div><div><h2>خدمات مشتریان</h2><a href="/account">حساب و سفارش‌ها</a><a href="/guide">راهنمای خرید</a><a href="/faq">سؤالات متداول</a><a href="/contact">ارتباط با ما</a></div><div><h2>دربارهٔ خانه‌چین</h2><a href="/about">داستان این فروشگاه</a><a href="/privacy">حریم خصوصی</a><a href="/terms">شرایط استفاده</a><a href="https://github.com/Paasta-Cloud/headless-woocommerce">کد متن‌باز فروشگاه</a></div></div><div className="footer-bottom"><span>خانه‌چین | فروشگاه نمونهٔ صنایع‌دستی</span><a href="#store-content">بازگشت به بالای صفحه ↑</a></div></div></footer>; }
