'use client';

import { useMemo, useState } from 'react';

const icons = {
  search: <><circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/></>,
  bag: <><path d="M4 8h16l-1.2 13H5.2L4 8Z"/><path d="M9 9V6a3 3 0 0 1 6 0v3"/></>,
  arrow: <><path d="M19 12H5m6-6-6 6 6 6"/></>,
  close: <><path d="M5 5l14 14M19 5 5 19"/></>,
  plus: <><path d="M12 5v14M5 12h14"/></>,
  minus: <><path d="M5 12h14"/></>,
};
function Icon({ name }) { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{icons[name]}</svg>; }

export default function Storefront({ products, mode, error }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('همه');
  const [cart, setCart] = useState({});
  const [cartOpen, setCartOpen] = useState(false);
  const categories = ['همه', ...new Set(products.map(product => product.category))];
  const visible = useMemo(() => products.filter(product => (category === 'همه' || product.category === category) && product.name.includes(query.trim())), [products, category, query]);
  const count = Object.values(cart).reduce((sum, quantity) => sum + quantity, 0);
  const total = products.reduce((sum, product) => sum + product.price * (cart[product.id] || 0), 0);
  const unit = products[0]?.unit || 'تومان';
  const price = value => new Intl.NumberFormat('fa-IR').format(value) + ' ' + unit;
  const changeQuantity = (id, delta) => setCart(previous => ({ ...previous, [id]: Math.max(0, (previous[id] || 0) + delta) }));

  return <>
    <div className="announcement">نمونهٔ متن‌باز فروشگاه فارسی <span>·</span> قیمت‌ها و کالاهای حالت نمایشی واقعی نیستند</div>
    <header className="site-header"><div className="header-inner">
      <a className="brand" href="/" aria-label="خانه‌چین، صفحه اصلی"><span className="brand-symbol">خ</span><span>خانه‌چین<small>چیزهای خوبِ هر روز</small></span></a>
      <label className="search"><Icon name="search"/><input value={query} onChange={event => setQuery(event.target.value)} placeholder="جست‌وجو میان کالاها..." aria-label="جست‌وجوی کالا"/></label>
      <button className="cart-trigger" type="button" onClick={() => setCartOpen(true)} aria-label={`سبد خرید، ${count} کالا`}><Icon name="bag"/><span>سبد خرید</span><b>{count.toLocaleString('fa-IR')}</b></button>
    </div></header>
    <main>
      <section className="hero"><div className="hero-copy"><span className="eyebrow">فروشگاه نمونهٔ خانه‌چین</span><h1>برای خانه،<br/><em>برای حال خوب.</em></h1><p>کالاهایی برای زندگی روزمره، در یک تجربهٔ خرید ساده و فارسی. این ویترین نمونه‌ای از فرانت‌اند جداگانه برای ووکامرس است.</p><a href="#products" className="hero-action">دیدن کالاها <Icon name="arrow"/></a></div><div className="hero-art" aria-hidden="true"><div className="art-circle"></div><div className="art-vase"><span></span></div><div className="art-caption">سادگی، در هر جزئیات</div></div></section>
      <section className="catalog" id="products"><div className="section-heading"><div><span className="eyebrow">انتخاب‌های فروشگاه</span><h2>کالاها را پیدا کنید</h2></div><p>{mode === 'demo' ? 'در حالت نمایشی هستید. با اتصال ووکامرس، کالاهای فروشگاه شما اینجا نمایش داده می‌شوند.' : 'محصولات این بخش از فروشگاه ووکامرس دریافت می‌شوند.'}</p></div>
      <div className="categories" role="group" aria-label="فیلتر دسته‌بندی">{categories.map(item => <button key={item} type="button" className={category === item ? 'active' : ''} aria-pressed={category === item} onClick={() => setCategory(item)}>{item}</button>)}</div>
      {error ? <div className="notice" role="alert">{error}</div> : visible.length ? <div className="product-grid">{visible.map(product => <article className="product" key={product.id}><div className={`product-image ${product.tone}`}>{product.image ? <img src={product.image} alt={product.name} loading="lazy"/> : <span>{product.label}</span>}</div><div className="product-info"><span>{product.category}</span><h3>{product.name}</h3><p>{product.description.replace(/<[^>]*>/g, '')}</p><div className="product-bottom"><strong>{price(product.price)}</strong><button type="button" onClick={() => changeQuantity(product.id, 1)} aria-label={`افزودن ${product.name} به سبد`}><Icon name="plus"/></button></div></div></article>)}</div> : <div className="empty">کالایی با این جست‌وجو پیدا نشد. عبارت دیگری امتحان کنید.</div>}</section>
      <section className="story"><span>یک نمونه برای ساختن</span><h2>ویترین را از خودتان کنید.</h2><p>طرح و کد این فروشگاه برای تغییر و یادگیری ساخته شده‌اند. محصول، دسته‌بندی و قیمت می‌توانند مستقیم از ووکامرس بیایند.</p></section>
    </main>
    <footer><strong>خانه‌چین</strong><span>نمونهٔ فروشگاه فارسی، ساخته‌شده برای توسعه و شخصی‌سازی.</span><a href="https://paasta.cloud">پاستا</a></footer>
    {cartOpen && <div className="drawer-layer"><button className="drawer-backdrop" type="button" aria-label="بستن سبد خرید" onClick={() => setCartOpen(false)}></button><aside className="drawer" role="dialog" aria-modal="true" aria-label="سبد خرید"><div className="drawer-head"><h2>سبد خرید <span>({count.toLocaleString('fa-IR')})</span></h2><button type="button" onClick={() => setCartOpen(false)} aria-label="بستن"><Icon name="close"/></button></div><div className="drawer-items">{count ? products.filter(product => cart[product.id]).map(product => <div className="cart-item" key={product.id}><div className={`cart-thumb ${product.tone}`}>{product.image ? <img src={product.image} alt=""/> : product.label}</div><div><strong>{product.name}</strong><span>{price(product.price)}</span><div className="quantity"><button type="button" aria-label={`کم کردن ${product.name}`} onClick={() => changeQuantity(product.id, -1)}><Icon name="minus"/></button><b>{cart[product.id].toLocaleString('fa-IR')}</b><button type="button" aria-label={`افزودن ${product.name}`} onClick={() => changeQuantity(product.id, 1)}><Icon name="plus"/></button></div></div></div>) : <p className="cart-empty">سبد شما خالی است. از میان کالاها چیزی انتخاب کنید.</p>}</div><div className="drawer-foot"><div><span>جمع کالاها</span><strong>{price(total)}</strong></div><p>این نمونه هنوز به پرداخت متصل نیست. افزودن کالاها فقط در همین صفحه نگهداری می‌شود و سفارشی ثبت نمی‌کند.</p><button type="button" onClick={() => setCartOpen(false)}>ادامهٔ دیدن کالاها</button></div></aside></div>}
  </>;
}
