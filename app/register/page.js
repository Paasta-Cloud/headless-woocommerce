export const metadata = { title: 'عضویت | خانه‌چین' };
export default function RegisterPage() {
  return <main className="shop-shell"><nav className="shop-nav"><a href="/" className="shop-brand">خانه‌چین</a><div><a href="/login">ورود</a><a href="/">فروشگاه</a></div></nav><section className="auth-panel"><span className="eyebrow">عضویت</span><h1>ساخت حساب خانه‌چین</h1><p>ثبت‌نام تازه تا برقراری ایمیل تأیید و بازیابی رمز فعال نیست. در این مدت، می‌توانید بدون حساب خرید کنید؛ سفارش شما در ووکامرس ثبت می‌شود.</p><div className="auth-actions"><a className="primary-action" href="/checkout">خرید مهمان</a><a href="/login">از قبل حساب دارید؟ ورود</a></div></section></main>;
}
