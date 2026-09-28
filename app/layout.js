import './craft-store.css';
import './theme.css';
import StoreShell from './components/store-shell';
import { customerAccount } from '../lib/customer-session';
import { storefrontConfig } from '../lib/storefront-config';

export const metadata = {
  title: `${storefrontConfig.name} | نمونه فروشگاه فارسی`,
  description: storefrontConfig.description,
};

export default async function Layout({ children }) {
  const mode = !process.env.WOOCOMMERCE_URL || process.env.WOOCOMMERCE_URL === 'demo' ? 'demo' : 'live';
  const account = await customerAccount();
  return <html lang="fa" dir="rtl"><body><StoreShell mode={mode} signedIn={Boolean(account)}>{children}</StoreShell></body></html>;
}
