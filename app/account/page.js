import { storeOrigin } from '../../lib/store';

export const metadata = { title: 'حساب کاربری | خانه‌چین' };
export const dynamic = 'force-dynamic';

export default function AccountPage() {
  const origin = storeOrigin();
  return <main className="shop-shell"><nav className="shop-nav"><a href="/" className="shop-brand">خانه‌چین</a><div><a href="/cart">سبد خرید</a><a href="/">فروشگاه</a></div></nav><div className="account-panel"><span className="eyebrow">حساب کاربری</span><h1>ورود و پیگیری سفارش‌ها</h1><p>حساب مشتری و سفارش‌ها در ووکامرس نگهداری می‌شوند. ورود از صفحهٔ امن خود وردپرس انجام می‌شود؛ گذرواژه در فرانت‌اند خانه‌چین دریافت یا ذخیره نمی‌شود.</p>{origin ? <a className="primary-action" href={`${origin}/my-account/`}>ورود به حساب ووکامرس</a> : <p className="form-error">در حالت نمایشی، حساب کاربری فعال نیست. نشانی ووکامرس را تنظیم کنید.</p>}<p className="fine-print">برای خرید مهمان، می‌توانید بدون ورود به <a href="/checkout">صورت‌حساب</a> بروید؛ ثبت سفارش فقط با روش پرداخت و ارسال فعال ممکن است.</p></div></main>;
}
