'use client';
import {useStoreSettings} from './store-settings';
import Icon from './icons';
import { Breadcrumbs } from './ui';
export default function AuthFrame({ children, embedded = false }) {
  const settings=useStoreSettings();
  if (embedded) return <div className="auth-embedded">{children}</div>;
  return <main className="shop-shell auth-page"><Breadcrumbs items={[{label:'حساب کاربری'}]}/><div className="auth-stage"><div className="auth-intro"><Icon name="user"/><h2>حساب شما در {settings.name}</h2><p>انتخاب‌های امروز، پیگیری خریدهای فردا.</p><a href="/shop">بازگشت به فروشگاه <Icon name="arrow"/></a></div>{children}</div></main>;
}
