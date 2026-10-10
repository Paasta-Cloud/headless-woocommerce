import '../../workspace.css';
import { cookies } from 'next/headers';
import { SESSION_COOKIE } from '../../../../lib/account';
import { loadCustomerOrder } from '../../../../lib/customer-profile';
import { customerOrderDate, customerOrderMoney, customerOrderStatus } from '../../../../lib/customer-account';
import { IRAN_STATES } from '../../../../lib/iran-states';
import { AccountGate } from '../../view';
import StoreLink from '../../../components/store-link';
import { Breadcrumbs } from '../../../components/ui';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'جزئیات سفارش | خانه‌چین', robots: { index: false, follow: false } };

function Address({ value }) {
  if (!value || !Object.values(value).some(Boolean)) return <p className="customer-unset">نشانی ثبت نشده است.</p>;
  return <address>{[value.first_name, value.last_name].filter(Boolean).join(' ')}<br/>{[IRAN_STATES[value.state] || value.state, value.city, value.address_1, value.address_2].filter(Boolean).join('، ')}{value.postcode && <p>کد پستی: <bdi dir="ltr">{value.postcode}</bdi></p>}{value.phone && <p>شمارهٔ تماس: <bdi dir="ltr">{value.phone}</bdi></p>}</address>;
}

export default async function CustomerOrderPage({ params }) {
  const raw = (await params).id;
  const id = /^\d+$/.test(raw) ? Number(raw) : NaN;
  const { state, order } = await loadCustomerOrder(id, (await cookies()).get(SESSION_COOKIE)?.value);
  if (['guest', 'expired', 'unavailable'].includes(state)) return <AccountGate state={state}/>;
  const status = customerOrderStatus(order?.status);
  const money = amount => customerOrderMoney(amount, order?.currency);
  return <main className="shop-shell account-workspace customer-order-page"><Breadcrumbs items={[{ label: 'حساب کاربری', href: '/account' }, { label: 'سفارش‌های من', href: '/account?tab=orders' }, { label: 'جزئیات سفارش' }]}/><StoreLink className="customer-order-back" href="/account?tab=orders">بازگشت به سفارش‌های من</StoreLink>
    {!order ? <section className="customer-account-header"><h1>سفارش در دسترس نیست</h1><p>این سفارش در حساب شما پیدا نشد. شمارهٔ سفارش و حسابی را که با آن خرید کرده‌اید بررسی کنید.</p></section> : <>
      <header className="customer-account-header"><span className="eyebrow">جزئیات سفارش</span><h1>سفارش <bdi>#{id.toLocaleString('fa-IR')}</bdi></h1><p>{customerOrderDate(order.date)}</p><span className="customer-order-status" data-tone={status.tone}>{status.label}</span></header>
      <div className="customer-order-detail-layout"><section className="customer-orders"><div className="customer-section-heading"><div><h2>اقلام سفارش</h2><p>اطلاعات ثبت‌شده هنگام خرید؛ مستقل از قیمت و نشانی فعلی شما</p></div></div><ul className="customer-order-items">{order.items.map((item, index) => <li key={index}><div><strong>{item.name}</strong><span>تعداد: <bdi>{Number(item.quantity).toLocaleString('fa-IR')}</bdi></span></div><bdi>{money(item.total)}</bdi></li>)}</ul></section>
      <aside className="customer-profile customer-order-summary"><div className="customer-section-heading"><h2>صورت‌حساب سفارش</h2></div><dl>{[['جمع اقلام', order.subtotal], ['تخفیف', order.discount], ['هزینهٔ ارسال', order.shipping_total], ['مالیات', order.tax], ['مبلغ نهایی', order.total]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd><bdi>{money(value)}</bdi></dd></div>)}</dl><p>روش پرداخت: {order.payment || 'ثبت نشده'}</p><p>روش تحویل: {order.delivery || 'ثبت نشده'}</p></aside></div>
      <section className="customer-profile customer-order-addresses"><div><h2>نشانی صورت‌حساب</h2><Address value={order.billing}/></div><div><h2>نشانی تحویل</h2><Address value={order.shipping}/></div></section><div className="customer-account-note"><p>وضعیت نمایش‌داده‌شده، وضعیت ثبت‌شدهٔ سفارش است. اگر پرداخت کرده‌اید اما سفارش در انتظار پرداخت است، دوباره پرداخت نکنید و با فروشگاه پیگیری کنید.</p></div>
    </>}
  </main>;
}
