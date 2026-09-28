import { shoppingGuide, storefrontConfig } from '../../lib/storefront-config';

export const metadata = { title: 'راهنمای خرید | خانه‌چین', description: 'راهنمای سفارش، پرداخت و دریافت از فروشگاه خانه‌چین.' };

export default function GuidePage() {
  return <main className="shop-shell">
    <nav className="shop-nav"><a href="/" className="shop-brand">{storefrontConfig.name}</a><div><a href="/">فروشگاه</a><a href="/favorites">علاقه‌مندی‌ها</a><a href="/account">حساب من</a></div></nav>
    <div className="page-heading"><span className="eyebrow">پیش از سفارش</span><h1>راهنمای خرید</h1><p>اطلاعات لازم برای یک خرید آزمایشی روشن و قابل‌پیگیری.</p></div>
    <section className="guide-layout"><div className="guide-content">{shoppingGuide.map(item => <article key={item.title}><h2>{item.title}</h2><p>{item.body}</p></article>)}</div><aside><strong>محل تحویل حضوری</strong><p>{storefrontConfig.pickupAddress}</p><small>نشانی و روش دریافت نهایی را پیش از فروش عمومی با اطلاعات واقعی فروشگاه جایگزین کنید.</small></aside></section>
  </main>;
}
