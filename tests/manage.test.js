import test from 'node:test';
import assert from 'node:assert/strict';
import {managerRequest,MANAGER_ACTIONS,MANAGER_COOKIE} from '../lib/manage.js';

test('management transport is private, fixed to the configured tenant and never retries writes',async()=>{
  const previous=process.env.WOOCOMMERCE_URL,originalFetch=globalThis.fetch;
  process.env.WOOCOMMERCE_URL='https://shop.example.test';
  let calls=0;
  globalThis.fetch=async(url,options)=>{
    calls++;
    assert.equal(url,'https://shop.example.test/wp-json/paasta-headless/v1/manage/save');
    assert.equal(options.cache,'no-store');assert.equal(options.redirect,'error');assert.equal(options.method,'POST');
    assert.equal(options.headers.Authorization,`Bearer ${'a'.repeat(64)}`);
    assert.deepEqual(JSON.parse(options.body),{revision:'old',design:{version:1}});
    return Response.json({code:'conflict'},{status:409});
  };
  try{
    assert.equal((await managerRequest('save','a'.repeat(64),{revision:'old',design:{version:1}})).status,409);
    assert.equal(calls,1);
    await assert.rejects(managerRequest('../users','',{}));assert.equal(calls,1);
    assert.ok(!MANAGER_ACTIONS.has('delete-user'));assert.notEqual(MANAGER_COOKIE,'paasta_customer_session');
  }finally{globalThis.fetch=originalFetch;if(previous===undefined)delete process.env.WOOCOMMERCE_URL;else process.env.WOOCOMMERCE_URL=previous;}
});

test('management upload lets fetch generate the multipart boundary',async()=>{
  const previous=process.env.WOOCOMMERCE_URL,originalFetch=globalThis.fetch;
  process.env.WOOCOMMERCE_URL='https://shop.example.test';
  const form=new FormData();form.append('file',new Blob(['test'],{type:'image/png'}),'test.png');
  globalThis.fetch=async(url,options)=>{assert.equal(options.body,form);assert.equal(options.headers['Content-Type'],undefined);return Response.json({id:1});};
  try{assert.equal((await managerRequest('upload','a'.repeat(64),form)).data.id,1);}
  finally{globalThis.fetch=originalFetch;if(previous===undefined)delete process.env.WOOCOMMERCE_URL;else process.env.WOOCOMMERCE_URL=previous;}
});

test('backend failure diagnostics exclude credentials and submitted design',async()=>{
  const previous=process.env.WOOCOMMERCE_URL,originalFetch=globalThis.fetch,originalError=console.error;
  process.env.WOOCOMMERCE_URL='https://shop.example.test';let diagnostic;
  globalThis.fetch=async()=>{throw new DOMException('timed out','TimeoutError');};console.error=(...args)=>{diagnostic=args;};
  try{
    await assert.rejects(managerRequest('save','secret-token',{private:'private-design'}));
    assert.equal(diagnostic[1].stage,'headers');assert.equal(diagnostic[1].name,'TimeoutError');
    assert.ok(!JSON.stringify(diagnostic).includes('secret-token'));assert.ok(!JSON.stringify(diagnostic).includes('private-design'));
  }finally{globalThis.fetch=originalFetch;console.error=originalError;if(previous===undefined)delete process.env.WOOCOMMERCE_URL;else process.env.WOOCOMMERCE_URL=previous;}
});
