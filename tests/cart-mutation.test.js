import test from 'node:test';
import assert from 'node:assert/strict';
import {mutateCart} from '../lib/cart-mutation.js';
test('reconciles a coupon committed before the response failed without retrying writes', async()=>{
  const calls=[];let cart,error;
  const ok=await mutateCart({action:'apply-coupon',code:'TEST10'},{request:async(method)=>{calls.push(method);if(method==='POST')throw Error('timeout');return {total:90,coupons:['test10']};},sync:value=>cart=value,onError:value=>error=value,invalidate:()=>assert.fail('read succeeded')});
  assert.equal(ok,false);assert.deepEqual(calls,['POST','GET']);assert.equal(cart.total,90);assert.equal(error,'timeout');
});
test('blocks further checkout if authoritative reconciliation also fails',async()=>{
  let invalid=false;
  await mutateCart({},{request:async()=>{throw Error('offline');},sync:()=>assert.fail(),onError:()=>{},invalidate:()=>invalid=true});
  assert.equal(invalid,true);
});
