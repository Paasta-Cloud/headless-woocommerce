import { cookies } from 'next/headers';
import { checkoutReady, checkoutTotal, pickupRate, safePaymentRedirect, storeRequest, validAddress, ZIBAL_METHOD } from '../../../lib/checkout';
import { sameSiteOrigin } from '../../../lib/cart';
import { storeOrigin } from '../../../lib/store';

const noStore = { 'Cache-Control': 'no-store' };
const fail = (error, status) => Response.json({ error }, { status, headers: noStore });

async function cartToken() { return (await cookies()).get('khanechin_cart')?.value; }

export async function GET() {
  const token = await cartToken();
  if (!token) return fail('سبد خرید خالی است. ابتدا کالایی انتخاب کنید.', 409);
  try {
    const cart = await storeRequest('cart', token);
    const methods = cart.payment_methods?.filter(method => ['cod', ZIBAL_METHOD].includes(method)) || [];
    const state = process.env.STORE_CHECKOUT_ENABLED === 'true'
      ? { ready: methods.some(method => checkoutReady(cart, method).ready), reason: methods.length ? checkoutReady(cart, methods[0]).reason : 'روش پرداخت فعالی در ووکامرس وجود ندارد.' }
      : { ready: false, reason: 'ثبت سفارش تا تعیین نشانی تحویل حضوری و فعال‌سازی آن در ووکامرس بسته است.' };
    return Response.json({ items: cart.items?.map(item => ({ id: item.id, name: item.name, quantity: item.quantity })) || [], total: checkoutTotal(cart).raw, displayTotal: checkoutTotal(cart).display, unit: cart.totals?.currency_code === 'IRR' ? 'ریال' : cart.totals?.currency_code || '', ready: state.ready, reason: state.reason, methods, zibalSandbox: process.env.ZIBAL_SANDBOX === 'true', pickupAddress: process.env.STORE_PICKUP_ADDRESS || '', needsShipping: !!cart.needs_shipping, shippingRates: cart.shipping_rates?.map(group => group.shipping_rates?.map(rate => ({ id: rate.rate_id, name: rate.name, selected: rate.selected, price: rate.price })) || []) || [] }, { headers: noStore });
  } catch { return fail('اطلاعات صورت‌حساب از ووکامرس دریافت نشد. داده‌ای تغییر نکرده است؛ دوباره تلاش کنید.', 502); }
}

export async function POST(request) {
  if (!sameSiteOrigin(request)) return fail('درخواست از مبدأ نامعتبر رد شد.', 403);
  if (process.env.STORE_CHECKOUT_ENABLED !== 'true') return fail('ثبت سفارش هنوز فعال نیست. هیچ سفارشی ایجاد نشده است.', 409);
  const token = await cartToken();
  if (!token) return fail('سبد خرید خالی است.', 409);
  const input = await request.json().catch(() => null);
  const address = validAddress(input?.address);
  const method = input?.paymentMethod;
  if (!['cod', ZIBAL_METHOD].includes(method) || !address || typeof input?.expectedTotal !== 'string' || !/^\d{1,16}$/.test(input.expectedTotal)) return fail('اطلاعات تماس، روش پرداخت یا مبلغ معتبر نیست. فرم را بررسی کنید.', 400);
  try {
    const shippingAddress = { country: 'IR', state: 'THR', city: 'تهران', address_1: process.env.STORE_PICKUP_ADDRESS || 'تهران، خیابان تست، کوچه تستی' };
    let cart = await storeRequest('cart/update-customer', token, 'POST', { billing_address: address, shipping_address: shippingAddress });
    const pickup = pickupRate(cart);
    if (!pickup) return fail('تحویل حضوری برای تهران در دسترس نیست. سفارشی ثبت نشده است.', 409);
    if (!pickup.selected) cart = await storeRequest('cart/select-shipping-rate', token, 'POST', { package_id: cart.shipping_rates[0].package_id, rate_id: pickup.rate_id });
    if (!pickupRate(cart)?.selected) return fail('انتخاب تحویل حضوری تأیید نشد. سفارشی ثبت نشده است.', 409);
    const state = checkoutReady(cart, method);
    if (!state.ready) return fail(state.reason, 409);
    if (cart.totals?.total_price !== input.expectedTotal) return fail('مبلغ سبد تغییر کرده است. صورت‌حساب را تازه کنید و دوباره تأیید کنید.', 409);
    const order = await storeRequest('checkout', token, 'POST', { billing_address: address, shipping_address: shippingAddress, payment_method: method, expected_total: input.expectedTotal });
    if (!Number.isSafeInteger(order?.order_id) || !['processing', 'on-hold', 'pending'].includes(order.status)) return fail('تأیید ثبت سفارش دریافت نشد. پیش از تلاش دوباره، سفارش‌های حساب ووکامرس را بررسی کنید.', 502);
    if (method === ZIBAL_METHOD) {
      const redirect = safePaymentRedirect(order.payment_result?.redirect_url, storeOrigin());
      if (!redirect) return fail('سفارش ایجاد شد، اما نشانی امن پرداخت دریافت نشد. پیش از تلاش دوباره وضعیت سفارش را در ووکامرس بررسی کنید.', 502);
      return Response.json({ orderId: order.order_id, status: order.status, redirect, note: 'سفارش در ووکامرس ایجاد شد. پرداخت فقط پس از بازگشت و تأیید زیبال قطعی است.' }, { headers: noStore });
    }
    return Response.json({ orderId: order.order_id, status: order.status, note: 'سفارش در ووکامرس ثبت شد. پرداخت در زمان تحویل انجام می‌شود.' }, { headers: noStore });
  } catch (error) {
    if (error?.status === 409) return fail('مبلغ یا موجودی تغییر کرده است. صورت‌حساب را تازه کنید و دوباره بررسی کنید.', 409);
    return fail('وضعیت ثبت سفارش نامشخص است. پیش از تلاش دوباره، سفارش‌های حساب ووکامرس یا ایمیل تأیید را بررسی کنید تا سفارش تکراری ثبت نشود.', 502);
  }
}
