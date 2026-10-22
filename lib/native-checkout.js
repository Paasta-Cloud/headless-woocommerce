import {accountRequest} from './account.js';
import {checkoutTotal,storeRequest} from './checkout.js';
import {storeOrigin} from './store.js';

export const nativeCheckout = () => process.env.STORE_CHECKOUT_MODE === 'native';
export function nativeFrontend(){
  try{const value=process.env.STORE_FRONTEND_URL||'';const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password&&!url.port&&!url.search&&!url.hash&&['','/'].includes(url.pathname)?url.origin:null;}catch{return null;}
}
export const ONLINE_METHODS = ['WC_ZPal','WC_Gateway_SnappPay','WC_Gateway_Zibal'];
export function nativeMethods(cart,config) {
  return (config?.methods||[]).filter(method => typeof method.id==='string' && cart.payment_methods?.includes(method.id));
}
export function shippingChoices(cart) {
  return (cart.shipping_rates||[]).map(group=>({id:group.package_id,name:group.name||'ارسال سفارش',rates:(group.shipping_rates||[]).map(rate=>({id:rate.rate_id,name:rate.name,selected:!!rate.selected,price:rate.price}))}));
}
export function nativeReady(cart,methods) {
  return !!cart.items_count && !!methods.length && (!cart.needs_shipping || !!cart.shipping_rates?.length && cart.shipping_rates.every(group=>group.shipping_rates?.some(rate=>rate.selected)));
}
export async function nativeSummary(cart) {
  const result=await accountRequest('commerce');
  if(result?.status!==200 || !Array.isArray(result.data?.methods)) throw Error('Native commerce unavailable');
  if(!nativeFrontend()||result.data.frontend!==nativeFrontend())throw Error('Native frontend origin is not configured');
  const methods=nativeMethods(cart,result.data);
  const enabled=process.env.STORE_CHECKOUT_ENABLED==='true';
  const minorUnit=Number(cart.totals?.currency_minor_unit||0);
  return {native:true,minorUnit,items:cart.items?.map(item=>({id:item.id,name:item.name,quantity:item.quantity}))||[],total:checkoutTotal(cart).raw,displayTotal:checkoutTotal(cart).display,unit:cart.totals?.currency_code||'',methods:methods.map(m=>m.id),paymentOptions:methods,shippingPackages:shippingChoices(cart),needsShipping:!!cart.needs_shipping,ready:enabled&&nativeReady(cart,methods),reason:!enabled?'ثبت سفارش این فروشگاه هنوز فعال نشده است.':!methods.length?'روش پرداخت سازگار و فعالی از ووکامرس دریافت نشد.':'نشانی و روش ارسال را بررسی و محاسبه کنید.'};
}
export function validSelections(cart,selections) {
  if(!cart.needs_shipping)return Array.isArray(selections)&&selections.length===0;
  return Array.isArray(selections) && selections.length===cart.shipping_rates?.length && cart.shipping_rates.every(group=>{
    const choices=selections.filter(s=>s&&s.packageId===group.package_id);
    return choices.length===1&&group.shipping_rates?.some(rate=>rate.rate_id===choices[0].rateId);
  });
}
export async function prepareNativeCart(token,address,selections,paymentMethod) {
  const {email,phone,...shipping}=address;
  let cart=await storeRequest('cart/update-customer',token,'POST',{billing_address:address,shipping_address:shipping,...(paymentMethod?{payment_method:paymentMethod}:{})});
  if(selections!==undefined){
    if(!validSelections(cart,selections))throw Object.assign(Error('Shipping changed'),{status:409});
    for(const selection of selections)cart=await storeRequest('cart/select-shipping-rate',token,'POST',{package_id:selection.packageId,rate_id:selection.rateId});
  }
  return {cart,shipping};
}
export function safeNativeGateway(value) {
  try {
    const u=new URL(value);
    const allowed=['www.zarinpal.com','zarinpal.com','payment.zarinpal.com','sandbox.zarinpal.com','snapppay.ir','gateway.zibal.ir','gateway.zibal.io'];
    return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&(allowed.includes(u.hostname)||u.hostname.endsWith('.snapppay.ir'))?u.href:null;
  }catch{return null;}
}
export function nativePaymentPlan(order,origin){
  const value=order.payment_result?.redirect_url;
  const direct=safeNativeGateway(value);if(direct)return {direct};
  try{
    const url=new URL(value);const id=String(order.order_id);
    if(url.origin!==new URL(origin).origin||url.username||url.password||url.searchParams.get('key')!==order.order_key)return null;
    return new RegExp(`/order-pay/${id}/?$`).test(url.pathname)||url.searchParams.get('order-pay')===id?{bridge:true}:null;
  }catch{return null;}
}
export async function startNativePayment(id,key,expectedTotal) {
  if(!nativeFrontend())return null;
  if(typeof expectedTotal!=='string'||!/^\d{1,16}$/.test(expectedTotal))return null;
  const u=new URL(storeOrigin());u.searchParams.set('paasta_payment_start','1');
  const response=await fetch(u,{method:'POST',body:new URLSearchParams({order_id:String(id),key,expected_total:expectedTotal}),redirect:'manual',cache:'no-store',signal:AbortSignal.timeout(25000)});
  return [301,302,303,307,308].includes(response.status)?safeNativeGateway(response.headers.get('location')):null;
}
