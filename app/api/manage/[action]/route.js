import {NextResponse} from 'next/server';
import {sameAccountOrigin} from '../../../../lib/account-origin.js';
import {MANAGER_ACTIONS,MANAGER_COOKIE,managerRequest} from '../../../../lib/manage.js';
const headers={'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer','X-Robots-Tag':'noindex'};
const json=(data,status=200)=>NextResponse.json(data,{status,headers});
export async function POST(request,{params}){
  if(!sameAccountOrigin(request))return json({error:'مبدأ درخواست معتبر نیست. صفحه را تازه کنید.'},403);
  const {action}=await params;if(!MANAGER_ACTIONS.has(action))return json({error:'این بخش در دسترس نیست.'},404);
  const token=request.cookies.get(MANAGER_COOKIE)?.value;
  if(action!=='login'&&(!token||!/^[a-f0-9]{64}$/.test(token)))return json({error:'برای مدیریت فروشگاه وارد حساب مدیر شوید.'},401);
  let body;
  try{
    if(action==='upload'){
      if(Number(request.headers.get('content-length'))>6*1024*1024)return json({error:'حجم تصویر باید کمتر از ۵ مگابایت باشد.'},413);
      const form=await request.formData(),file=form.get('file');
      if(!(file instanceof File)||file.size>5*1024*1024||!['image/jpeg','image/png','image/webp'].includes(file.type))return json({error:'یک تصویر JPEG، PNG یا WebP با حجم کمتر از ۵ مگابایت انتخاب کنید.'},400);
      body=new FormData();body.append('file',file);
    }else{
      const raw=await request.text();if(raw.length>220000)return json({error:'حجم تنظیمات بیش از حد مجاز است.'},413);
      try{body=raw?JSON.parse(raw):{};}catch{return json({error:'ساختار درخواست معتبر نیست.'},400);}
      if(!body||typeof body!=='object'||Array.isArray(body))return json({error:'ساختار درخواست معتبر نیست.'},400);
      if(action==='login'&&(typeof body.login!=='string'||typeof body.password!=='string'||body.login.length>254||body.password.length>1024))return json({error:'نام کاربری و رمز عبور معتبر وارد کنید.'},400);
    }
    const result=await managerRequest(action,token,body);
    if(result.status!==200)return json({error:result.data?.message||'درخواست انجام نشد. دوباره تلاش کنید.',code:result.data?.code},result.status>=400&&result.status<600?result.status:502);
    if(action==='login'){
      if(!/^[a-f0-9]{64}$/.test(result.data?.token||''))throw Error('Invalid session');
      const response=json({ok:true});response.cookies.set(MANAGER_COOKIE,result.data.token,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'strict',path:'/api/manage',maxAge:3600});return response;
    }
    const response=json(result.data);
    if(action==='logout')response.cookies.set(MANAGER_COOKIE,'',{path:'/api/manage',maxAge:0,httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'strict'});
    return response;
  }catch{return json({error:'پاسخ فروشگاه دریافت نشد. تغییرات شما در این صفحه حفظ شده؛ پیش از تکرار انتشار، نسخهٔ ذخیره‌شده را بررسی کنید.'},503);}
}
