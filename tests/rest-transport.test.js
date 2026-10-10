import test from 'node:test';
import assert from 'node:assert/strict';
import {getProduct} from '../lib/store.js';
import {wordpressRestUrl} from '../lib/wordpress-rest.js';
import {storeRequest} from '../lib/checkout.js';
import {managerRequest} from '../lib/manage.js';
import {accountRequest} from '../lib/account.js';

test('query REST preserves parameters and rejects cross-origin paths',()=>{
  const url=new URL(wordpressRestUrl('https://shop.example.test','/wc/store/v1/products?search=a%26b&page=2&rest_route=wrong'));
  assert.equal(url.origin,'https://shop.example.test');assert.equal(url.pathname,'/');
  assert.equal(url.searchParams.get('rest_route'),'/wc/store/v1/products');
  assert.equal(url.searchParams.getAll('rest_route').length,1);
  assert.equal(url.searchParams.get('search'),'a&b');assert.equal(url.searchParams.get('page'),'2');
  for(const path of ['https://other.example.test/x','//other.example.test/x','/path#fragment'])assert.throws(()=>wordpressRestUrl('https://shop.example.test',path));
});

test('private REST calls preserve method, body and authorization and never retry a write',async()=>{
  const previous=process.env.WOOCOMMERCE_URL,originalFetch=globalThis.fetch;process.env.WOOCOMMERCE_URL='https://private-query.example.test';
  const calls=[];globalThis.fetch=async(value,options)=>{const url=new URL(value);assert.equal(url.pathname,'/');assert.equal(options.cache,'no-store');calls.push({route:url.searchParams.get('rest_route'),options});return Response.json({ok:true});};
  try{
    await accountRequest('login',null,'POST',{email:'fixture@example.test'});
    await managerRequest('save','fixture-manager-token',{revision:1});
    await storeRequest('checkout','fixture-cart-token','POST',{payment_method:'cod'},'a'.repeat(64));
    assert.deepEqual(calls.map(call=>call.route),['/khanechin/v1/login','/paasta-headless/v1/manage/save','/wc/store/v1/checkout']);
    assert.ok(calls.every(call=>call.options.method==='POST'&&call.options.body));
    assert.equal(calls[1].options.headers.Authorization,'Bearer fixture-manager-token');
    assert.equal(calls[2].options.headers['Cart-Token'],'fixture-cart-token');assert.equal(calls[2].options.headers.Authorization,`Bearer ${'a'.repeat(64)}`);
    let attempts=0;globalThis.fetch=async()=>{attempts++;return Response.json({code:'unavailable'},{status:503});};
    await assert.rejects(storeRequest('checkout','fixture-cart-token','POST',{}));assert.equal(attempts,1);
  }finally{globalThis.fetch=originalFetch;if(previous===undefined)delete process.env.WOOCOMMERCE_URL;else process.env.WOOCOMMERCE_URL=previous;}
});

test('catalogue uses REST without depending on permalink rewrites', async () => {
  const previous=process.env.WOOCOMMERCE_URL, originalFetch=globalThis.fetch;
  process.env.WOOCOMMERCE_URL='https://plain-permalinks.example.test';
  globalThis.fetch=async value=>{
    const url=new URL(value);
    assert.equal(url.pathname,'/');
    const route=url.searchParams.get('rest_route');
    if(route==='/paasta-cache/v1/revision')return new Response('',{status:404});
    assert.equal(route,'/wc/store/v1/products/42');
    return Response.json({id:42,name:'Fixture',prices:{price:'100',currency_minor_unit:0,currency_code:'IRT'}});
  };
  try{assert.equal((await getProduct(42)).id,42);}
  finally{globalThis.fetch=originalFetch;if(previous===undefined)delete process.env.WOOCOMMERCE_URL;else process.env.WOOCOMMERCE_URL=previous;}
});
