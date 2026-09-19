import './style.css';
import './cart.css';
import './shop.css';
import './checkout.css';

export const metadata = {
  title: 'خانه‌چین | نمونه فروشگاه فارسی',
  description: 'نمونه متن‌باز فروشگاه فارسی با فرانت‌اند جداگانه و ووکامرس',
};

export default function Layout({ children }) {
  return <html lang="fa" dir="rtl"><body>{children}</body></html>;
}
