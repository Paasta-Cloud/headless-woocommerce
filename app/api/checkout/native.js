import {NextResponse} from 'next/server';
import {cookies} from 'next/headers';
import {SESSION_COOKIE} from '../../../lib/account';
import {nativeSummary,nativeReady,prepareNativeCart,ONLINE_METHODS,startNativePayment,nativePaymentPlan,nativeFrontend} from '../../../lib/native-checkout';
import {storeOrigin} from '../../../lib/store';
import {storeRequest} from '../../../lib/checkout';
import {receiptFromCheckout,orderCookieName} from '../../../lib/order';
import {cartDigest,cartSessionDigest} from '../../../lib/cart-settlement';

const headers={'Cache-Control':'no-store'};
export async function nativeSubmit(request,input,token,address){
  let submitting=false;
  try{
    const {cart,shipping}=await prepareNativeCart(token,address,input.shippingSelections,input.paymentMethod);
    const summary=await nativeSummary(cart);
    if(!summary.methods.includes(input.paymentMethod)||!nativeReady(cart,summary.methods)||!Array.isArray(input.shippingSelections))return Response.json({error:'نشانی، ارسال و روش پرداخت را دوباره بررسی کنید. سفارشی ثبت نشده است.'},{status:409,headers});
    if(cart.totals?.total_price!==input.expectedTotal)return Response.json({error:'مبلغ تغییر کرده است. ارسال را دوباره محاسبه و مبلغ نهایی را تأیید کنید.'},{status:409,headers});
    submitting=true;
    const customer=(await cookies()).get(SESSION_COOKIE)?.value;
    const order=await storeRequest('checkout',token,'POST',{billing_address:address,shipping_address:shipping,payment_method:input.paymentMethod,expected_total:input.expectedTotal},customer,nativeFrontend());
    if(!Number.isSafeInteger(order?.order_id)||!['processing','on-hold','pending','completed'].includes(order.status))throw Error('Order confirmation unavailable');
    const online=ONLINE_METHODS.includes(input.paymentMethod);
    const receipt=receiptFromCheckout(order,address.email,{cartSession:cartSessionDigest(token),cartDigest:cartDigest(cart)});
    if(!receipt)throw Error('Order receipt unavailable');
    const unpaid=online&&order.status==='pending';
    const plan=unpaid?nativePaymentPlan(order,storeOrigin()):null;
    const gateway=plan?.direct||(plan?.bridge?await startNativePayment(order.order_id,order.order_key,input.expectedTotal).catch(()=>null):null);
    const response=NextResponse.json({orderId:order.order_id,status:order.status,...(online?{redirect:gateway||`/order/${order.order_id}${unpaid?'?payment=start-failed':''}`} :{}),note:online?'سفارش ثبت شد؛ نتیجهٔ پرداخت پس از تأیید ووکامرس مشخص می‌شود.':'سفارش با روش پرداخت انتخاب‌شده در ووکامرس ثبت شد.'},{headers});
    response.cookies.set(orderCookieName(order.order_id),receipt,{path:`/order/${order.order_id}`,httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',maxAge:86400});
    if(!online)response.cookies.set('khanechin_cart','',{path:'/',maxAge:0,httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production'});
    return response;
  }catch(error){
    if(error?.status===409&&['paasta_total_changed','paasta_invalid_total'].includes(error.code))return Response.json({error:'مبلغ نهایی در ووکامرس تغییر کرده است؛ پرداخت آغاز نشده است. مبلغ را دوباره محاسبه و تأیید کنید.'},{status:409,headers});
    return Response.json({error:submitting?'وضعیت سفارش مشخص نشد. پیش از تلاش دوباره سفارش‌ها یا ایمیل خود را بررسی کنید.':'اطلاعات ارسال یا مبلغ تازه دریافت نشد. سفارشی ثبت نشده است؛ ارسال را دوباره محاسبه کنید.'},{status:submitting?502:409,headers});
  }
}
