'use client';

// THESIS: A Persian handicraft shop following the user's Dinaha reference.
// OWN-WORLD: Turquoise, white shelves, cool gray ground, photographic craft banners.
// STORY: Explore a craft, inspect a real product, then buy through the existing cart.
// FIRST VIEWPORT: Two-row masthead, full-width image campaign, compact service strip.
// FORM: User-pinned reference; responsive image shelves with explicit carousel controls.
import { useMemo, useState } from 'react';
import { useCart } from './use-cart';
import { useFavorites } from './use-favorites';

const asset = 'https://dinaha.i-design.ir/wp-content/uploads/2022/11/';
const slides = [
  ['slide2.jpg', 'انواع ظروف میناکاری'], ['slide1.jpg', 'انواع ظروف فیروزه‌کوبی'],
  ['slide3.jpg', 'انواع شکلات‌خوری مسی'], ['slide4.jpg', 'انواع جعبه هدیه خاتم‌کاری'],
];
const tiles = [['banner1.jpg', 'هنر میناکاری', 'مینا'], ['banner2.jpg', 'انواع کیف چرم', 'کیف'], ['banner3.jpg', 'فرش دستبافت', 'فرش'], ['banner4.jpg', 'انواع دستبند', 'دستبند']];
const paths = {
  search: <><circle cx="10.5" cy="10.5" r="7"/><path d="m16 16 5 5"/></>,
  bag: <><path d="M4 8h16l-1 13H5L4 8Z"/><path d="M8 9V6a4 4 0 0 1 8 0v3"/></>,
  user: <><circle cx="12" cy="7" r="4"/><path d="M4 21v-3a8 8 0 0 1 16 0v3"/></>,
  heart: <path d="M12 21 3 12a5.5 5.5 0 0 1 9-7 5.5 5.5 0 0 1 9 7Z"/>,
  menu: <path d="M3 6h18M3 12h18M3 18h18"/>,
  arrow: <path d="m14 5-7 7 7 7"/>,
  check: <><path d="m8 12 3 3 6-7"/><path d="M12 2 3 6v6c0 5 9 10 9 10s9-5 9-10V6Z"/></>,
};
function Icon({ name }) { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>; }
const number = value => new Intl.NumberFormat('fa-IR').format(value);

export default function CraftStore({ products, mode, error }) {
  const [slide, setSlide] = useState(0);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('همه');
  const [sort, setSort] = useState('featured');
  const [notice, setNotice] = useState('');
  const favorites = useFavorites();
  const { cart, busy, error: cartError, addItem } = useCart(mode);
  const count = Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  const categories = ['همه', ...new Set(products.map(p => p.category))];
  const visible = useMemo(() => {
    const result = products.filter(p => (category === 'همه' || p.category === category) && `${p.name} ${p.category}`.includes(query.trim()));
    return sort === 'featured' ? result : [...result].sort(sort === 'cheap' ? (a,b) => a.price-b.price : (a,b) => b.price-a.price);
  }, [products, query, category, sort]);
  function findCraft(term) { setCategory('همه'); setQuery(term); }
  function card(product) { return <article className="craft-product" key={product.id}>
    <div className="craft-product-photo"><a href={`/product/${product.id}`}>{product.image ? <img src={product.image} alt={product.name} loading="lazy" width="300" height="300"/> : <span>{product.label}</span>}</a><button type="button" onClick={() => favorites.toggle(product.id)} aria-label={`${favorites.has(product.id) ? 'حذف از' : 'افزودن به'} علاقه‌مندی‌ها: ${product.name}`} aria-pressed={favorites.has(product.id)}><Icon name="heart"/></button></div>
    <div className="craft-product-body"><small>{product.category}</small><h3><a href={`/product/${product.id}`}>{product.name}</a></h3><div className="craft-product-price"><strong>{number(product.price)} <small>{product.unit}</small></strong></div>
    {product.type === 'variable' ? <a className="craft-buy" href={`/product/${product.id}`}>انتخاب گزینه‌ها <Icon name="arrow"/></a> : <button className="craft-buy" disabled={busy || product.purchasable === false} onClick={async () => { const result = await addItem(product.id); if (result !== false) setNotice('سبد خرید به‌روز شد.'); }}>{product.purchasable === false ? 'ناموجود' : 'افزودن به سبد'}<Icon name="bag"/></button>}</div>
  </article>; }
  return <div className="craft-store">
    <div className="craft-announcement">خانه‌چین؛ تماشای هنر، انتخابی برای خانه <span>فروشگاه نمونهٔ صنایع‌دستی</span></div>
    <header className="craft-header"><div className="craft-head-main"><a className="craft-brand" href="/"><b><span>خانه</span>‌چین</b><small>هنر ایرانی، برای خانهٔ شما</small></a><form className="craft-search" role="search" onSubmit={e => { e.preventDefault(); document.getElementById('products')?.scrollIntoView(); }}><label className="sr-only" htmlFor="craft-category">دسته‌بندی</label><select id="craft-category" value={category} onChange={e => setCategory(e.target.value)}>{categories.map(c => <option key={c}>{c}</option>)}</select><input aria-label="جست‌وجو در محصولات" placeholder="جست‌وجو در محصولات…" value={query} onChange={e => setQuery(e.target.value)}/><button aria-label="جست‌وجو"><Icon name="search"/></button></form><a className="craft-account" href="/login"><Icon name="user"/> ورود | ثبت‌نام</a></div>
    <nav className="craft-navigation" aria-label="منوی فروشگاه"><div><a href="#products"><Icon name="menu"/> محصولات</a><a href="/guide">راهنمای خرید</a><a href="/guide#faq">سؤالات متداول</a><a href="/account">حساب من</a></div><div><a className="craft-tracking" href="/account">پیگیری سفارش‌ها</a><a href="/favorites" aria-label="علاقه‌مندی‌ها"><Icon name="heart"/></a><a className="craft-basket" href="/cart" aria-label={`سبد خرید، ${number(count)} کالا`}><Icon name="bag"/><b>{number(count)}</b></a></div></nav></header>
    <main className="craft-main"><section className="craft-campaign" aria-label="پیشنهادهای صنایع‌دستی"><a href="#products"><img src={asset + slides[slide][0]} alt={slides[slide][1]} width="1400" height="513" fetchPriority="high"/></a><div className="craft-slide-controls">{slides.map(([file,title],index) => <button type="button" key={file} aria-label={title} aria-pressed={index===slide} onClick={() => setSlide(index)}/>)}</div><button className="craft-next" type="button" aria-label="بنر بعدی" onClick={() => setSlide((slide+1)%slides.length)}><Icon name="arrow"/></button></section>
    <section className="craft-benefits" aria-label="راهنمای خدمات">{[['check','قیمت و موجودی','هماهنگ با فروشگاه'],['user','حساب مشتری','پیگیری خریدهای شما'],['heart','انتخاب‌های شما','ذخیره در علاقه‌مندی‌ها'],['bag','سبد خرید آنلاین','بررسی پیش از پرداخت']].map(([icon,title,caption]) => <a href="/guide" key={title}><Icon name={icon}/><span><strong>{title}</strong><small>{caption}</small></span></a>)}</section>
    <section className="craft-tiles" aria-label="کشف صنایع‌دستی">{tiles.map(([file,title,term]) => <a href="#products" key={file} onClick={() => findCraft(term)}><img src={asset+file} alt={title} width="400" height="240" loading="lazy"/></a>)}</section>
    <section className="craft-shelf" id="products"><div className="craft-section-title"><h1>محصولات فروشگاه</h1><span>{number(visible.length)} کالا</span></div><div className="craft-tools"><div role="group" aria-label="فیلتر دسته‌بندی">{categories.map(c => <button type="button" key={c} aria-pressed={category===c} onClick={()=>setCategory(c)}>{c}</button>)}</div><select aria-label="مرتب‌سازی محصولات" value={sort} onChange={e=>setSort(e.target.value)}><option value="featured">جدیدترین‌ها</option><option value="cheap">ارزان‌ترین</option><option value="expensive">گران‌ترین</option></select></div>
    {(notice || cartError) && <p className="craft-message" role="status">{cartError || notice} <a href="/cart">مشاهدهٔ سبد خرید</a></p>}
    {error ? <p role="alert" className="craft-message">{error}</p> : visible.length ? <div className="craft-products">{visible.map(card)}</div> : <div className="craft-empty"><h2>محصولی پیدا نشد</h2><p>دسته‌بندی یا عبارت جست‌وجو را تغییر دهید.</p><button onClick={()=>{setQuery('');setCategory('همه');}}>نمایش همهٔ محصولات</button></div>}</section>
    <section className="craft-about"><div><span>خانه‌چین</span><h2>هنر دست، در خانهٔ شما</h2><p>جزئیات را ببینید، انتخاب‌هایتان را کنار بگذارید و پیش از ثبت سفارش، قیمت و روش دریافت را بررسی کنید.</p></div><a href="/guide">راهنمای خرید <Icon name="arrow"/></a></section></main>
    <footer className="craft-footer"><div><strong>خانه‌چین</strong><p>فروشگاه فارسی صنایع‌دستی؛ نمونهٔ متن‌باز روی پاستا</p></div><nav aria-label="راهنمای پایین صفحه"><a href="/account">حساب کاربری</a><a href="/favorites">علاقه‌مندی‌ها</a><a href="/guide">راهنمای خرید</a><a href="/cart">سبد خرید</a></nav><small>{mode === 'demo' ? 'کالاهای نمایشی؛ ثبت سفارش فعال نیست.' : 'قیمت و موجودی نهایی هنگام ثبت سفارش بررسی می‌شوند.'}</small></footer>
  </div>;
}
