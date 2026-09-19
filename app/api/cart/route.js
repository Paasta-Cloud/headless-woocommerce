import { cookies } from 'next/headers';
import { cartAction, publicCart, requestCart } from '../../../lib/cart';

const COOKIE = 'khanechin_cart';

function responseWithCart(result, request) {
  const response = Response.json(publicCart(result.body), { headers: { 'Cache-Control': 'no-store' } });
  if (result.token) {
    response.headers.append('Set-Cookie', `${COOKIE}=${encodeURIComponent(result.token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=2592000${new URL(request.url).protocol === 'https:' ? '; Secure' : ''}`);
  }
  return response;
}

function failure(reason) {
  const status = reason?.status === 400 || reason?.status === 404 ? 409 : 502;
  return Response.json({ error: status === 409
    ? 'کالا یا تعداد انتخاب‌شده در سبد پذیرفته نشد. سبد را تازه کنید و دوباره تلاش کنید.'
    : 'ارتباط با سبد ووکامرس برقرار نشد. سفارشی ثبت نشده است؛ کمی بعد دوباره تلاش کنید.' }, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function GET(request) {
  try {
    const token = (await cookies()).get(COOKIE)?.value;
    return responseWithCart(await requestCart(token), request);
  } catch (reason) { return failure(reason); }
}

export async function POST(request) {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) return Response.json({ error: 'درخواست از مبدأ نامعتبر رد شد.' }, { status: 403 });
  const input = await request.json().catch(() => null);
  const action = cartAction(input);
  if (!action) return Response.json({ error: 'درخواست سبد معتبر نیست.' }, { status: 400 });
  try {
    let token = (await cookies()).get(COOKIE)?.value;
    if (!token) token = (await requestCart(null)).token;
    if (!token) throw new Error('Cart token missing');
    return responseWithCart(await requestCart(token, action), request);
  } catch (reason) { return failure(reason); }
}
