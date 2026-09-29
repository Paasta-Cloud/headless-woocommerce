import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {decodeReceipt,receiptFromCheckout,orderCookieName} from '../lib/order.js';
import {sameSiteOrigin} from '../lib/cart.js';
import {shouldDetachCart,cartDigest,cartSessionDigest} from '../lib/cart-settlement.js';
const token='header.'+Buffer.from(JSON.stringify({user_id:'original',iss:'store-api'})).toString('base64url')+'.signature';
const source=readFileSync('app/order/[id]/settle/route.js','utf8').replace(/^import .*;\r?\n/gm,'').replace('export async function POST','async function POST');
const cart={items:[{id:42,quantity:1}],coupons:[]};
async function invoke({status='processing',origin='https://shop.test',present=true,settled=false,changed=false,missing=false}={}){
 let reads=0;const receipt=receiptFromCheckout({order_id:1,order_key:'wc_order_abcdefgh1234'},'buyer@example.test',{cartSession:cartSessionDigest(token),cartDigest:cartDigest(cart),settled});
 const cookieValues={'khanechin_cart':token,...(present?{khanechin_order_1:receipt}:{})};
 const NextResponse={json:(body,options)=>{const response=Response.json(body,options);response.writes=[];response.cookies={set:(...args)=>response.writes.push(args)};return response;}};
 const post=new Function('cookies','NextResponse','decodeReceipt','getOrder','orderCookieName','requestCart','sameSiteOrigin','shouldDetachCart',source+'\nreturn POST;')(async()=>({get:key=>cookieValues[key]?{value:cookieValues[key]}:undefined}),NextResponse,decodeReceipt,async()=>{reads++;return missing?null:{id:1,status,...cart};},orderCookieName,async()=>({body:changed?{items:[{id:99,quantity:1}],coupons:[]}:cart}),sameSiteOrigin,shouldDetachCart);
 const response=await post(new Request('https://shop.test/order/1/settle',{method:'POST',headers:{origin,host:'shop.test'}}),{params:Promise.resolve({id:'1'})});
 return {response,reads};
}
test('settlement blocks cross-origin and missing receipt before accessing WooCommerce',async()=>{
 for(const input of [{origin:'https://other.test'},{present:false}]){const {response,reads}=await invoke(input);assert.ok([401,403].includes(response.status));assert.equal(reads,0);assert.equal(response.writes.length,0);}
});
test('settlement requires verified order, ignores query claims and is idempotent',async()=>{
 for(const status of ['pending','failed','cancelled']){const {response}=await invoke({status});assert.equal(response.writes.length,0);}
 const failed=await invoke({missing:true});assert.equal(failed.response.status,502);assert.equal(failed.response.writes.length,0);
 const paid=await invoke();assert.equal(paid.response.writes[0][0],'khanechin_cart');assert.equal(paid.response.writes[0][2].maxAge,0);assert.equal(paid.response.writes[1][2].path,'/order/1');assert.equal(decodeReceipt(paid.response.writes[1][1]).settled,true);
 const again=await invoke({settled:true});assert.equal(again.reads,0);assert.equal(again.response.writes.length,0);
});
test('settlement marks a changed cart handled without clearing it',async()=>{
 const {response}=await invoke({changed:true});assert.equal(response.writes.length,1);assert.equal(response.writes[0][0],'khanechin_order_1');assert.equal((await response.json()).cleared,false);
});
