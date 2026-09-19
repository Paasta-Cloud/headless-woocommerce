'use client';

import { useCart } from '../use-cart';
import { demoProducts } from '../../lib/store';

export default function CartView({ mode }) {
  const { cart, entries: liveEntries, subtotal: liveSubtotal, unit: liveUnit, busy, loading, error, changeQuantity } = useCart(mode);
  const entries = mode === 'demo' ? demoProducts.filter(item => cart[item.id]).map(item => ({ ...item, quantity: cart[item.id], key: String(item.id) })) : liveEntries;
  const subtotal = mode === 'demo' ? entries.reduce((total, item) => total + item.price * item.quantity, 0) : liveSubtotal;
  const unit = mode === 'demo' ? 'تومان' : liveUnit;
  const count = Object.values(cart).reduce((a, b) => a + b, 0);
  const format = value => new Intl.NumberFormat('fa-IR').format(value) + ' ' + (unit || 'تومان');
  return <main className="shop-shell"><nav className="shop-nav"><a href="/" className="shop-brand">خانه‌چین</a><div><a href="/">فروشگاه</a><a href="/account">حساب</a></div></nav><div className="page-heading"><span className="eyebrow">مرحلهٔ ۱ از ۲</span><h1>سبد خرید</h1><p>تعداد و قیمت نهایی از ووکامرس دریافت می‌شود.</p></div>{error && <p className="form-error" role="alert">{error}</p>}{loading ? <p role="status">در حال دریافت سبد خرید…</p> : count ? <div className="checkout-grid"><section className="order-list">{entries.map(item => <article key={item.key} className="order-row"><a href={`/product/${item.id}`} className="row-image">{item.image ? <img src={item.image} alt=""/> : item.name.slice(0, 2)}</a><div><h2><a href={`/product/${item.id}`}>{item.name}</a></h2><p>{format(item.price)}</p><div className="quantity"><button type="button" disabled={busy} aria-label={`کم کردن ${item.name}`} onClick={() => changeQuantity(item.id, -1)}>−</button><b>{item.quantity.toLocaleString('fa-IR')}</b><button type="button" disabled={busy} aria-label={`افزودن ${item.name}`} onClick={() => changeQuantity(item.id, 1)}>+</button></div></div></article>)}</section><aside className="order-summary"><h2>خلاصهٔ سفارش</h2><div><span>تعداد کالا</span><strong>{count.toLocaleString('fa-IR')}</strong></div><div><span>جمع کالاها</span><strong>{format(subtotal || 0)}</strong></div><p>هزینهٔ ارسال و مبلغ نهایی در صورت‌حساب محاسبه می‌شود.</p><a className="primary-action" href="/checkout">ادامه به صورت‌حساب</a></aside></div> : <div className="empty-state"><h2>سبد شما خالی است</h2><p>کالایی انتخاب کنید تا اینجا ببینید.</p><a className="primary-action" href="/">دیدن کالاها</a></div>}</main>;
}
