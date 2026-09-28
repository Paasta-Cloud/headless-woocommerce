'use client';
import {Breadcrumbs} from './components/ui';
import Icon from './components/icons';
export default function ErrorPage({retry}){return <main className="shop-shell"><Breadcrumbs items={[{label:'خطا در دریافت اطلاعات'}]}/><section className="empty-state"><div className="empty-symbol"><Icon name="info"/></div><h1>اطلاعات این صفحه دریافت نشد</h1><p>کمی بعد دوباره تلاش کنید. اگر خطا هنگام پرداخت رخ داده، پیش از پرداخت مجدد وضعیت سفارش را در حساب خود بررسی کنید.</p><div className="order-actions"><button className="primary-action" onClick={()=>retry()}>تلاش دوباره</button><a href="/account">بررسی سفارش‌ها</a><a href="/">صفحهٔ اصلی</a></div></section></main>;}
