'use client';

// THESIS: A Persian handicraft shop following the user's Dinaha reference.
// OWN-WORLD: Turquoise, white shelves, cool gray ground, photographic craft banners.
// STORY: Explore a craft, inspect a real product, then buy through the existing cart.
// FIRST VIEWPORT: Two-row masthead, full-width image campaign, compact service strip.
// FORM: User-pinned reference; responsive image shelves with explicit carousel controls.
import { useMemo, useState } from 'react';
import ProductCard from './components/product-card';
import Icon from './components/icons';

const asset = 'https://dinaha.i-design.ir/wp-content/uploads/2022/11/';
const slides = [
  ['slide2.jpg', 'انواع ظروف میناکاری'], ['slide1.jpg', 'انواع ظروف فیروزه‌کوبی'],
  ['slide3.jpg', 'انواع شکلات‌خوری مسی'], ['slide4.jpg', 'انواع جعبه هدیه خاتم‌کاری'],
];
const tiles = [['banner1.jpg', 'هنر میناکاری', 'مینا'], ['banner2.jpg', 'انواع کیف چرم', 'کیف'], ['banner3.jpg', 'فرش دستبافت', 'فرش'], ['banner4.jpg', 'انواع دستبند', 'دستبند']];
const number = value => new Intl.NumberFormat('fa-IR').format(value);

export default function CraftStore({ products, mode, error }) {
  const [slide, setSlide] = useState(0);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('همه');
  const [sort, setSort] = useState('featured');
  const categories = ['همه', ...new Set(products.flatMap(p => p.categories?.length ? p.categories : [p.category]))];
  const visible = useMemo(() => {
    const result = products.filter(p => (category === 'همه' || (p.categories || [p.category]).includes(category)) && `${p.name} ${(p.categories || [p.category]).join(' ')}`.includes(query.trim()));
    return sort === 'featured' ? result : [...result].sort(sort === 'cheap' ? (a,b) => a.price-b.price : (a,b) => b.price-a.price);
  }, [products, query, category, sort]);
  function findCraft(term) { setCategory('همه'); setQuery(term); }
  return <div className="craft-store">
    <main className="craft-main"><section className="craft-campaign" aria-label="پیشنهادهای صنایع‌دستی"><a href="#products"><img src={asset + slides[slide][0]} alt={slides[slide][1]} width="1400" height="513" fetchPriority="high"/></a><div className="craft-slide-controls">{slides.map(([file,title],index) => <button type="button" key={file} aria-label={title} aria-pressed={index===slide} onClick={() => setSlide(index)}/>)}</div><button className="craft-next" type="button" aria-label="بنر بعدی" onClick={() => setSlide((slide+1)%slides.length)}><Icon name="arrow"/></button></section>
    <section className="craft-benefits" aria-label="راهنمای خدمات">{[['check','قیمت و موجودی','هماهنگ با فروشگاه'],['user','حساب مشتری','پیگیری خریدهای شما'],['heart','انتخاب‌های شما','ذخیره در علاقه‌مندی‌ها'],['bag','سبد خرید آنلاین','بررسی پیش از پرداخت']].map(([icon,title,caption]) => <a href="/guide" key={title}><Icon name={icon}/><span><strong>{title}</strong><small>{caption}</small></span></a>)}</section>
    <section className="craft-tiles" aria-label="کشف صنایع‌دستی">{tiles.map(([file,title,term]) => <a href="#products" key={file} onClick={() => findCraft(term)}><img src={asset+file} alt={title} width="400" height="240" loading="lazy"/></a>)}</section>
    <section className="craft-shelf" id="products"><div className="craft-section-title"><h1>محصولات فروشگاه</h1><span>{number(visible.length)} کالا</span></div><div className="craft-tools"><div role="group" aria-label="فیلتر دسته‌بندی">{categories.map(c => <button type="button" key={c} aria-pressed={category===c} onClick={()=>setCategory(c)}>{c}</button>)}</div><select aria-label="مرتب‌سازی محصولات" value={sort} onChange={e=>setSort(e.target.value)}><option value="featured">جدیدترین‌ها</option><option value="cheap">ارزان‌ترین</option><option value="expensive">گران‌ترین</option></select></div>
    {error ? <p role="alert" className="craft-message">{error}</p> : visible.length ? <div className="craft-products">{visible.map(product=><ProductCard key={product.id} product={product}/>)}</div> : <div className="craft-empty"><h2>محصولی پیدا نشد</h2><p>دسته‌بندی یا عبارت جست‌وجو را تغییر دهید.</p><button onClick={()=>{setQuery('');setCategory('همه');}}>نمایش همهٔ محصولات</button></div>}</section>
    <section className="craft-about"><div><span>خانه‌چین</span><h2>هنر دست، در خانهٔ شما</h2><p>جزئیات را ببینید، انتخاب‌هایتان را کنار بگذارید و پیش از ثبت سفارش، قیمت و روش دریافت را بررسی کنید.</p></div><a href="/guide">راهنمای خرید <Icon name="arrow"/></a></section></main>
  </div>;
}
