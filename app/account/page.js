import './workspace.css';
import StoreLink from '../components/store-link';
import { customerAccountState } from '../../lib/customer-session';
import { customerOrderDate, customerOrderMoney, customerOrderStatus } from '../../lib/customer-account';
import ProfileEditor from './profile';
import LogoutButton, { AccountGate } from './view';
import { Breadcrumbs } from '../components/ui';
import Icon from '../components/icons';

export const metadata = { title: 'حساب من | خانه‌چین', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

const tabs = [
  ['overview', '/account', 'home', 'پیشخوان حساب'],
  ['orders', '/account?tab=orders', 'order', 'سفارش‌های من'],
  ['profile', '/account?tab=profile', 'user', 'اطلاعات حساب'],
];

function OrderList({ orders, recent = false }) {
  const visible = recent ? orders.slice(0, 5) : orders;
  if (!visible.length) return <div className="empty-state account-empty"><div className="empty-symbol"><Icon name="bag"/></div><h2>اولین انتخاب شما منتظر است</h2><p>هنوز سفارشی به این حساب متصل نیست. پس از ثبت سفارش، وضعیت آن را اینجا می‌بینید.</p><StoreLink className="primary-action" href="/shop">دیدن محصولات</StoreLink></div>;
  return <ul className="customer-order-list">{visible.map(order => {
    const status = customerOrderStatus(order.status);
    return <li key={order.id}><div className="customer-order-identity"><span className="customer-order-icon"><Icon name="order"/></span><div><h3><StoreLink href={`/account/orders/${order.id}`}>سفارش <bdi>#{Number(order.id).toLocaleString('fa-IR')}</bdi><span className="customer-order-open">دیدن جزئیات <Icon name="arrow"/></span></StoreLink></h3><p>{customerOrderDate(order.date)}</p></div></div><span className="customer-order-status" data-tone={status.tone}>{status.label}</span><div className="customer-order-amount"><span>مبلغ سفارش</span><strong><bdi>{customerOrderMoney(order.total, order.currency)}</bdi></strong></div></li>;
  })}</ul>;
}

export default async function AccountPage({ searchParams }) {
  const { state, account } = await customerAccountState();
  const selected = (await searchParams)?.tab;
  const tab = ['orders', 'profile'].includes(selected) ? selected : 'overview';
  if (!account) return <AccountGate state={state}/>;
  return <main className="shop-shell account-workspace"><Breadcrumbs items={[{ label: 'حساب کاربری' }]}/><div className="customer-account-layout">
    <aside className="customer-account-sidebar"><div className="customer-account-person"><span className="customer-account-avatar"><Icon name="user"/></span><div><strong>{account.name || 'حساب مشتری'}</strong><span>خوش آمدید</span></div></div><nav aria-label="بخش‌های حساب">{tabs.map(([key, href, icon, label]) => <StoreLink key={key} href={href} aria-current={tab === key ? 'page' : undefined}><Icon name={icon}/>{label}</StoreLink>)}<StoreLink href="/favorites"><Icon name="heart"/>علاقه‌مندی‌ها</StoreLink><StoreLink href="/forgot"><Icon name="check"/>بازیابی رمز عبور</StoreLink><StoreLink href="/guide"><Icon name="info"/>راهنمای خرید</StoreLink></nav><div className="customer-account-sidebar-foot"><LogoutButton/></div></aside>
    <section className="customer-account-main"><header className="customer-account-header"><span className="eyebrow">حساب کاربری من</span><h1>{tab === 'orders' ? 'سفارش‌های من' : tab === 'profile' ? 'اطلاعات حساب' : `سلام، ${account.name || 'خوش آمدید'}`}</h1><p>{tab === 'orders' ? 'وضعیت و مبلغ آخرین سفارش‌های متصل به حسابتان را بررسی کنید.' : tab === 'profile' ? 'اطلاعات شما، همان‌طور که در فروشگاه ذخیره شده است.' : 'سفارش‌ها، اطلاعات حساب و انتخاب‌های شما؛ همه در یک جا.'}</p></header>
      {tab === 'profile' ? <ProfileEditor account={account}/> : <>
        {tab === 'overview' && <div className="customer-account-shortcuts"><StoreLink href="/account?tab=orders"><Icon name="order"/><div><strong>پیگیری سفارش‌ها</strong><span>بررسی آخرین وضعیت سفارش</span></div><Icon name="arrow"/></StoreLink><StoreLink href="/favorites"><Icon name="heart"/><div><strong>انتخاب‌های ذخیره‌شده</strong><span>بازگشت به علاقه‌مندی‌ها</span></div><Icon name="arrow"/></StoreLink></div>}
        <section className="customer-orders" aria-labelledby="customer-orders-heading"><div className="customer-section-heading"><div><h2 id="customer-orders-heading">{tab === 'overview' ? 'آخرین سفارش‌ها' : 'فهرست سفارش‌های اخیر'}</h2><p>{tab === 'overview' ? 'حداکثر ۵ سفارش اخیر' : 'حداکثر ۲۰ سفارش اخیر این حساب نمایش داده می‌شود.'}</p></div>{tab === 'overview' && account.orders.length > 5 && <StoreLink href="/account?tab=orders">دیدن سفارش‌های اخیر <Icon name="arrow"/></StoreLink>}</div><OrderList orders={account.orders} recent={tab === 'overview'}/></section>
        <div className="customer-account-note"><Icon name="info"/><p>اگر پرداخت کرده‌اید اما سفارش هنوز در انتظار پرداخت است، دوباره پرداخت نکنید. ابتدا نتیجه را با فروشگاه پیگیری کنید.</p></div>
      </>}
    </section>
  </div></main>;
}
