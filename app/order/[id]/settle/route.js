import {cookies} from 'next/headers';
import {NextResponse} from 'next/server';
import {decodeReceipt,getOrder,orderCookieName} from '../../../../lib/order';
import {requestCart,sameSiteOrigin} from '../../../../lib/cart';
import {shouldDetachCart} from '../../../../lib/cart-settlement';

export async function POST(request,{params}) {
 const reply=(data,status=200)=>NextResponse.json(data,{status,headers:{'Cache-Control':'private, no-store'}});
 if(!sameSiteOrigin(request))return reply({error:'مبدأ درخواست معتبر نیست.'},403);
 const id=Number((await params).id),name=orderCookieName(id),jar=await cookies();
 const receipt=name?decodeReceipt(jar.get(name)?.value):null;
 if(!receipt)return reply({error:'دسترسی به سفارش تأیید نشد.'},401);
 if(receipt.settled)return reply({settled:true});
 try{
  const order=await getOrder(id,receipt);
  if(!order)return reply({error:'وضعیت سفارش دریافت نشد.'},502);
  if(!['processing','completed'].includes(order.status))return reply({settled:false});
  const token=jar.get('khanechin_cart')?.value;
  const cart=token?(await requestCart(token)).body:null;
  const clear=shouldDetachCart(order,receipt,token,cart);
  const response=reply({settled:true,cleared:clear});
  if(clear)response.cookies.set('khanechin_cart','',{path:'/',maxAge:0,httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production'});
  response.cookies.set(name,Buffer.from(JSON.stringify({...receipt,settled:true})).toString('base64url'),{path:`/order/${id}`,maxAge:86400,httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production'});
  return response;
 }catch{return reply({error:'همگام‌سازی سبد انجام نشد؛ دوباره تلاش کنید.'},502);}
}
