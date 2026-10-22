import {cookies} from 'next/headers';
import {NextResponse} from 'next/server';
import {decodeReceipt,orderCookieName} from '../../../../lib/order';
import {nativeCheckout,startNativePayment} from '../../../../lib/native-checkout';
import {sameSiteOrigin} from '../../../../lib/cart';

export async function POST(request,{params}){
  if(!sameSiteOrigin(request))return new Response('درخواست معتبر نیست.',{status:403});
  const id=Number((await params).id);const name=orderCookieName(id);
  const receipt=name?decodeReceipt((await cookies()).get(name)?.value):null;
  if(!nativeCheckout()||!receipt)return new Response('پرداخت در این نشست در دسترس نیست.',{status:404,headers:{'Cache-Control':'no-store'}});
  const body=await request.formData().catch(()=>null);
  const target=await startNativePayment(id,receipt.key,body?.get('expectedTotal')).catch(()=>null);
  // Any initialization failure stays on the frontend receipt, with no new order.
  const response=NextResponse.redirect(target||new URL(`/order/${id}?payment=start-failed`,request.url),303);
  response.headers.set('Cache-Control','no-store');response.headers.set('Referrer-Policy','no-referrer');return response;
}
