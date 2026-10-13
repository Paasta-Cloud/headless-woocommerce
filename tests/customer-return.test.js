import test from 'node:test';
import assert from 'node:assert/strict';
import {customerReturnAction} from '../lib/customer-return.js';
const token='a'.repeat(64);
const request=(body,origin='https://shop.example')=>new Request('https://shop.example/api/account/return',{method:'POST',headers:{origin,'Content-Type':'application/json'},body:JSON.stringify(body)});
test('return BFF rejects other origins, guest calls and customer approval or money fields before WordPress',async()=>{
 let calls=0;const upstream=()=>{calls++;};
 assert.equal((await customerReturnAction(request({verb:'read',orderId:1},'https://other.example'),token,upstream)).status,403);
 assert.equal((await customerReturnAction(request({verb:'read',orderId:1}),null,upstream)).status,401);
 for(const body of [{verb:'decide',orderId:1},{verb:'request',orderId:1,decision:'approved'},{verb:'request',orderId:1,amount:1}])assert.equal((await customerReturnAction(request(body),token,upstream)).status,400);
 assert.equal(calls,0);
});
test('return BFF keeps responses private and ambiguous writes do not get retried',async()=>{
 let calls=0;
 const result=await customerReturnAction(request({verb:'request',orderId:1}),token,async()=>{calls++;throw Error('private backend details');});
 assert.equal(calls,1);assert.equal(result.status,503);assert.match(result.headers.get('Cache-Control'),/no-store/);assert.doesNotMatch(await result.text(),/private backend/);
 const ready=await customerReturnAction(request({verb:'read',orderId:1}),token,async(path,t,method,body)=>{assert.equal(path,'customer-return');assert.equal(method,'POST');assert.deepEqual(body,{verb:'read',orderId:1});return {status:200,data:{case:null,revision:'a'.repeat(64),automaticRefund:false}};});
 assert.equal(ready.status,200);assert.equal((await ready.json()).automaticRefund,false);
});
