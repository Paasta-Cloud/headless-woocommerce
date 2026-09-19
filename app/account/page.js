import { customerAccount } from '../../lib/account';
import LogoutButton from './view';

export const metadata = { title: 'حساب من | خانه‌چین' };
export const dynamic = 'force-dynamic';

export default async function AccountPage() {
  const account = await customerAccount();
  return <main className="shop-shell"><nav className="shop-nav"><a href="/" className="shop-brand">خانه‌چین</a><div><a href="/cart">سبد خرید</a><a href="/">فروشگاه</a></div></nav>{account ? <section className="account-home"><div className="account-top"><div><span className="eyebrow">حساب من</span><h1>سلام، {account.name}</h1><p dir="ltr">{account.email}</p></div><LogoutButton /></div><h2>سفارش‌های من</h2>{account.orders?.length ? <div className="account-orders">{account.orders.map(order => <article key={order.id}><strong>سفارش #{order.id}</strong><span>{order.date}</span><span>{order.status}</span><b>{new Intl.NumberFormat('fa-IR').format(Number(order.total))} {order.currency === 'IRR' ? 'ریال' : order.currency}</b></article>)}</div> : <div className="empty-state"><h2>هنوز سفارشی ندارید</h2><p>کالاهای فروشگاه را ببینید و اولین سفارش خود را ثبت کنید.</p><a className="primary-action" href="/">دیدن کالاها</a></div>}</section> : <section className="auth-panel"><span className="eyebrow">حساب من</span><h1>خوش آمدید</h1><p>برای دیدن سفارش‌ها و اطلاعات حساب، وارد شوید.</p><div className="auth-actions"><a className="primary-action" href="/login">ورود</a><a href="/register">ساخت حساب</a></div><p className="fine-print">خرید مهمان بدون ورود نیز از <a href="/checkout">صورت‌حساب</a> ممکن است.</p></section>}</main>;
}
