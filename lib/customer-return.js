import {sameAccountOrigin} from './account-origin.js';
import {accountRequest} from './account.js';

export async function customerReturnAction(request,token,upstream=accountRequest){
  const json=(data,status)=>Response.json(data,{status,headers:{'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer'}});
  if(!sameAccountOrigin(request))return json({error:'مبدأ درخواست معتبر نیست.'},403);
  if(typeof token!=='string'||!/^[a-f0-9]{64}$/.test(token))return json({error:'برای پیگیری مرجوعی وارد حساب شوید.'},401);
  const raw=await request.text();if(raw.length>12000)return json({error:'توضیح درخواست بیش از حد طولانی است.'},413);
  let body;try{body=JSON.parse(raw);}catch{return json({error:'درخواست معتبر نیست.'},400);}
  if(!body||typeof body!=='object'||Array.isArray(body)||Object.keys(body).some(key=>!['orderId','verb','reason','operationKey','confirmed'].includes(key))||!Number.isSafeInteger(body.orderId)||body.orderId<1||!['read','request'].includes(body.verb))return json({error:'درخواست معتبر نیست.'},400);
  try{
    const result=await upstream('customer-return',token,'POST',body);
    if(result?.status===200&&result.data?.automaticRefund===false&&typeof result.data.revision==='string')return json(result.data,200);
    if(result?.status===404&&result.data?.code==='rest_no_route')return json({error:'پیگیری مرجوعی هنوز روی این فروشگاه فعال نشده است.'},409);
    if([400,401,403,404,409].includes(result?.status))return json({error:({400:'اطلاعات و تأیید درخواست را بررسی کنید.',401:'دوباره وارد حساب مشتری شوید.',403:'اجازهٔ این عملیات را ندارید.',404:'این سفارش در حساب شما پیدا نشد.',409:'وضعیت درخواست تغییر کرده است؛ نتیجه را دوباره بخوانید.'})[result.status]},result.status);
  }catch{/* Never infer a failed write from a transport error. */}
  return json({error:'پاسخ قطعی دریافت نشد؛ پیش از تکرار، نتیجه را دوباره بخوانید.'},503);
}
