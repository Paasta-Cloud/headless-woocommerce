'use client';

import { useState } from 'react';
import { useCart } from '../../use-cart';

export default function ProductView({ product, mode }) {
  const { cart, busy, error, changeQuantity } = useCart(mode);
  const [added, setAdded] = useState(false);
  const price = new Intl.NumberFormat('fa-IR').format(product.price) + ' ' + product.unit;
  return <main className="shop-shell">
    <nav className="shop-nav"><a href="/" className="shop-brand">خانه‌چین</a><div><a href="/">همهٔ کالاها</a><a href="/cart">سبد خرید ({Object.values(cart).reduce((a, b) => a + b, 0).toLocaleString('fa-IR')})</a><a href="/account">حساب</a></div></nav>
    <div className="breadcrumbs"><a href="/">فروشگاه</a><span> / </span><span>{product.category}</span><span> / </span><span>{product.name}</span></div>
    <section className="detail-grid"><div className={`detail-image ${product.tone}`}>{product.image ? <img src={product.image} alt={product.name}/> : <span>{product.label}</span>}</div><div className="detail-copy"><span className="eyebrow">{product.category}</span><h1>{product.name}</h1><p>{product.description.replace(/<[^>]*>/g, '') || 'اطلاعات تکمیلی این کالا در فروشگاه ووکامرس ثبت نشده است.'}</p><div className="detail-price">{price}</div><p className="detail-state">{product.purchasable === false ? 'این کالا فعلاً قابل سفارش نیست.' : 'قیمت و موجودی هنگام افزودن به سبد دوباره با ووکامرس بررسی می‌شود.'}</p><button className="primary-action" type="button" disabled={busy || product.purchasable === false} onClick={async () => { await changeQuantity(product.id, 1); setAdded(true); }}>{busy ? 'در حال افزودن…' : 'افزودن به سبد خرید'}</button>{error && <p role="alert" className="form-error">{error}</p>}{added && !error && <p role="status" className="form-success">کالا به سبد اضافه شد. <a href="/cart">مشاهدهٔ سبد</a></p>}</div></section>
  </main>;
}
