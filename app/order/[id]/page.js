import { cookies } from 'next/headers';
import { decodeReceipt, getOrder, orderCookieName } from '../../../lib/order';

export const metadata = { title: 'پیگیری سفارش | خانه‌چین', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

const messages = {
  processing: ['سفارش در حال آماده‌سازی است', 'ووکامرس سفارش را پذیرفته است. جزئیات تحویل را از حساب فروشگاه پیگیری کنید.'],
  completed: ['سفارش تکمیل شده است', 'وضعیت تکمیل سفارش در ووکامرس ثبت شده است.'],
  'on-hold': ['سفارش نیازمند بررسی است', 'وضعیت پرداخت یا سفارش هنوز قطعی نیست. پیش از هر پرداخت دوباره با فروشگاه تماس بگیرید.'],
  pending: ['پرداخت هنوز تأیید نشده است', 'وضعیت سفارش در ووکامرس در انتظار پرداخت است. پیش از تلاش دوباره، نتیجهٔ تراکنش را با فروشگاه بررسی کنید.'],
  failed: ['پرداخت تأیید نشد', 'این سفارش در ووکامرس ناموفق ثبت شده است. برای ادامه، از حساب فروشگاه وضعیت آن را بررسی کنید.'],
  cancelled: ['سفارش لغو شده است', 'ووکامرس این سفارش را لغوشده نشان می‌دهد.'],
  refunded: ['سفارش بازپرداخت شده است', 'جزئیات بازپرداخت را از حساب فروشگاه پیگیری کنید.'],
};

export default async function OrderPage({ params }) {
  const id = Number((await params).id);
  const name = orderCookieName(id);
  const receipt = name ? decodeReceipt((await cookies()).get(name)?.value) : null;
  let order = null;
  try { order = await getOrder(id, receipt); } catch { /* Display a safe recovery path. */ }
  const [title, explanation] = order ? (messages[order.status] || ['وضعیت سفارش مشخص نیست', 'برای پیگیری با فروشگاه تماس بگیرید.']) : ['اطلاعات سفارش در دسترس نیست', 'برای مشاهدهٔ امن سفارش، از همان مرورگری که خرید را آغاز کردید استفاده کنید یا وارد حساب ووکامرس شوید.'];
  const amount = order ? new Intl.NumberFormat('fa-IR').format(Number(order.total) / 10 ** order.minorUnit) : '';
  const unit = order?.currency === 'IRR' ? 'ریال' : order?.currency === 'IRT' ? 'تومان' : order?.currency || '';
  return <main className="shop-shell order-page">
    <nav className="shop-nav"><a href="/" className="shop-brand">خانه‌چین</a><div><a href="/account">حساب</a><a href="/">فروشگاه</a></div></nav>
    <section className="order-result" aria-labelledby="order-title">
      <span className="eyebrow">پیگیری سفارش از ووکامرس</span>
      <h1 id="order-title">{title}</h1>
      <p>{explanation}</p>
      {order && <div className="order-details"><div><span>شمارهٔ سفارش</span><strong dir="ltr">{order.id}</strong></div><div><span>مبلغ سفارش</span><strong>{amount} {unit}</strong></div>{order.items.map((item, index) => <div key={`${index}-${item.name}`}><span>{item.name}</span><strong>× {new Intl.NumberFormat('fa-IR').format(item.quantity)}</strong></div>)}</div>}
      <p className="fine-print">این صفحه وضعیت ثبت‌شده در ووکامرس را نشان می‌دهد، نه صرفاً پیام بازگشت از درگاه. اگر پرداختی انجام داده‌اید ولی وضعیت هنوز تغییر نکرده است، دوباره پرداخت نکنید و با فروشگاه پیگیری کنید.</p>
      <div className="order-actions"><a className="primary-action" href="/account">پیگیری از حساب فروشگاه</a><a href="/">بازگشت به فروشگاه</a></div>
    </section>
  </main>;
}
