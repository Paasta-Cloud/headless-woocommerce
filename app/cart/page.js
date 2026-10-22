import CartView from './cart-view';

export const metadata = { title: 'سبد خرید' };
export const dynamic = 'force-dynamic';

export default function CartPage() { return <CartView mode={process.env.WOOCOMMERCE_URL && process.env.WOOCOMMERCE_URL !== 'demo' ? 'live' : 'demo'} />; }
