import { cookies } from 'next/headers';
import { checkoutReady, checkoutTotal, storeRequest, validAddress } from '../../../lib/checkout';
import { sameSiteOrigin } from '../../../lib/cart';

const noStore = { 'Cache-Control': 'no-store' };
const fail = (error, status) => Response.json({ error }, { status, headers: noStore });

async function cartToken() { return (await cookies()).get('khanechin_cart')?.value; }

export async function GET() {
  const token = await cartToken();
  if (!token) return fail('سبد خرید خالی است. ابتدا کالایی انتخاب کنید.', 409);
  try {
    const cart = await storeRequest('cart', token);
    const state = process.env.STORE_CHECKOUT_ENABLED === 'true'
      ? checkoutReady(cart)
      : { ready: false, reason: 'ثبت سفارش تا تعیین نشانی تحویل حضوری و فعال‌سازی آن در ووکامرس بسته است.' };
    return Response.json({ items: cart.items?.map(item => ({ id: item.id, name: item.name, quantity: item.quantity })) || [], total: checkoutTotal(cart).raw, displayTotal: checkoutTotal(cart).display, unit: cart.totals?.currency_code === 'IRR' ? 'ریال' : cart.totals?.currency_code || '', ready: state.ready, reason: state.reason, needsShipping: !!cart.needs_shipping, shippingRates: cart.shipping_rates?.map(group => group.shipping_rates?.map(rate => ({ id: rate.rate_id, name: rate.name, selected: rate.selected, price: rate.price })) || []) || [] }, { headers: noStore });
  } catch { return fail('اطلاعات صورت‌حساب از ووکامرس دریافت نشد. داده‌ای تغییر نکرده است؛ دوباره تلاش کنید.', 502); }
}

export async function POST(request) {
  if (!sameSiteOrigin(request)) return fail('درخواست از مبدأ نامعتبر رد شد.', 403);
  if (process.env.STORE_CHECKOUT_ENABLED !== 'true') return fail('ثبت سفارش هنوز فعال نیست. هیچ سفارشی ایجاد نشده است.', 409);
  const token = await cartToken();
  if (!token) return fail('سبد خرید خالی است.', 409);
  const input = await request.json().catch(() => null);
  const address = validAddress(input?.address);
  if (!address || typeof input?.expectedTotal !== 'string' || !/^\d{1,16}$/.test(input.expectedTotal)) return fail('اطلاعات تماس، نشانی یا مبلغ معتبر نیست. فرم را بررسی کنید.', 400);
  try {
    const cart = await storeRequest('cart', token);
    const state = checkoutReady(cart);
    if (!state.ready) return fail(state.reason, 409);
    if (cart.totals?.total_price !== input.expectedTotal) return fail('مبلغ سبد تغییر کرده است. صورت‌حساب را تازه کنید و دوباره تأیید کنید.', 409);
    const order = await storeRequest('checkout', token, 'POST', { billing_address: address, shipping_address: address, payment_method: 'cod', expected_total: input.expectedTotal });
    if (!Number.isSafeInteger(order?.order_id) || !['processing', 'on-hold', 'pending'].includes(order.status)) return fail('تأیید ثبت سفارش دریافت نشد. پیش از تلاش دوباره، سفارش‌های حساب ووکامرس را بررسی کنید.', 502);
    return Response.json({ orderId: order.order_id, status: order.status, note: 'سفارش در ووکامرس ثبت شد. پرداخت در زمان تحویل انجام می‌شود.' }, { headers: noStore });
  } catch (error) {
    if (error?.status === 409) return fail('مبلغ یا موجودی تغییر کرده است. صورت‌حساب را تازه کنید و دوباره بررسی کنید.', 409);
    return fail('وضعیت ثبت سفارش نامشخص است. پیش از تلاش دوباره، سفارش‌های حساب ووکامرس یا ایمیل تأیید را بررسی کنید تا سفارش تکراری ثبت نشود.', 502);
  }
}
