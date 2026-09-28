import './style.css';
import './cart.css';
import './shop.css';
import './checkout.css';
import './account.css';
import './enhancements.css';
import { storefrontConfig } from '../lib/storefront-config';

export const metadata = {
  title: `${storefrontConfig.name} | نمونه فروشگاه فارسی`,
  description: storefrontConfig.description,
};

export default function Layout({ children }) {
  return <html lang="fa" dir="rtl"><body>{children}</body></html>;
}
