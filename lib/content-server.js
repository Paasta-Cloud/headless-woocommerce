import {storeOrigin} from './store.js';
import {wordpressRestUrl} from './wordpress-rest.js';
import {publicRead} from './public-cache.js';
export async function getContent({type='post',slug='',page=1}={}){
 const origin=storeOrigin();if(!origin)return {items:[],total:0};
 const query=new URLSearchParams({type:type==='page'?'page':'post',page:String(Math.max(1,Math.min(100,Number(page)||1)))});if(slug)query.set('slug',slug);
 // Short bounded cache; drafts and private manager responses never enter it.
 return publicRead(`content:${origin}:${query}`,async()=>{
  const response=await fetch(wordpressRestUrl(origin,`/paasta-headless/v1/content?${query}`),{cache:'no-store',redirect:'error',signal:AbortSignal.timeout(8000)});
  if(!response.ok)throw Error('Content unavailable');const data=await response.json();
  if(!Array.isArray(data.items))throw Error('Invalid content');return data;
 },15000);
}
