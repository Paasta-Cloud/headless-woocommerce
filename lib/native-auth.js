import {storeOrigin} from './store.js';
import {accountRequest} from './account.js';

export const nativeAuth = () => process.env.STORE_AUTH_PROVIDER==='avina';
export function avinaIdentity(value){
  const login=value.trim().replace(/[۰-۹]/g,d=>String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[٠-٩]/g,d=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
  const type=/^09[0-9]{9}$/.test(login)?'mobile':/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(login)?'email':/^[A-Za-z0-9._-]{4,20}$/.test(login)?'username':null;
  return type?{login,type}:null;
}
function nativeCookies(response){
  return response.headers.getSetCookie().map(line=>line.split(';',1)[0]).filter(pair=>/^[A-Za-z0-9_-]+=[^\r\n]*$/.test(pair)).join('; ');
}
export function nativeCookieProof(response){
  const pair=response.headers.getSetCookie().map(line=>line.split(';',1)[0]).find(pair=>/^wordpress_logged_in_[a-f0-9]+=/.test(pair));
  if(!pair||pair.length>4096)return null;
  try{return decodeURIComponent(pair.slice(pair.indexOf('=')+1));}catch{return null;}
}
export async function nativeLogin(login,password){
  const identity=avinaIdentity(login);
  if(!identity)return {status:401,data:{}};
  const guard=await accountRequest('native-auth-guard',null,'POST',{login:identity.login});
  if(guard?.status!==200)return guard;
  const origin=storeOrigin();
  // Use the installed theme's own nonce and cookie context; never invent OTPs,
  // map users by client-supplied ID, or send a password to another origin.
  const page=await fetch(new URL('/account/',origin),{cache:'no-store',redirect:'error',signal:AbortSignal.timeout(10000)});
  if(!page.ok)throw Error('Native account unavailable');
  const html=await page.text();
  if(html.length>262144||!html.includes('with_password'))throw Error('Unsupported native account');
  const input=html.match(/<input\b[^>]*\bname=["']avina_auth_nonce["'][^>]*>/i)?.[0];
  const nonce=input?.match(/\bvalue=["']([A-Za-z0-9]{8,64})["']/)?.[1];
  if(!nonce)throw Error('Native account nonce unavailable');
  const cookie=nativeCookies(page);if(cookie.length>16384)throw Error('Invalid native context');
  const response=await fetch(new URL('/avi_ajax/static_pass_check/',origin),{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded',...(cookie?{Cookie:cookie}:{}),'Origin':origin,'Referer':new URL('/account/',origin).href},body:new URLSearchParams({email:identity.login,pass:password,type:identity.type,nonce}),redirect:'manual',cache:'no-store',signal:AbortSignal.timeout(15000)});
  const data=await response.json().catch(()=>null);
  if(response.status!==200||![true,1,'1'].includes(data?.status))return {status:401,data:{}};
  const proof=nativeCookieProof(response);
  if(!proof)throw Error('Native sign-in not confirmed');
  return accountRequest('native-session',null,'POST',{cookie:proof});
}
