import {NextResponse} from 'next/server';
import {sameAccountOrigin} from '../../../lib/account-origin';
import {fetchDesign} from '../../../lib/design-fetch';
export async function POST(request){
  const headers={'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer'};
  if(!sameAccountOrigin(request))return NextResponse.json({error:'مبدأ درخواست معتبر نیست.'},{status:403,headers});
  let token;try{token=(await request.json()).token;}catch{return NextResponse.json({error:'درخواست معتبر نیست.'},{status:400,headers});}
  if(typeof token!=='string'||!/^[a-f0-9]{64}$/.test(token))return NextResponse.json({error:'پیش‌نمایش معتبر نیست.'},{status:400,headers});
  try{await fetchDesign(token);}catch{return NextResponse.json({error:'پیش‌نمایش منقضی شده یا در دسترس نیست.'},{status:410,headers});}
  const response=NextResponse.json({ok:true},{headers});
  response.cookies.set('paasta_design_preview',token,{path:'/preview',httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',maxAge:600});
  return response;
}
