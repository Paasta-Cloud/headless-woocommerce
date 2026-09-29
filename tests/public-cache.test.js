import test from 'node:test';
import assert from 'node:assert/strict';
import {createPublicCache} from '../lib/public-cache.js';
test('public reads coalesce, expire, isolate tenants and do not retain failures',async()=>{
 let now=0,calls=0;const read=createPublicCache({max:2,now:()=>now}),load=async()=>({value:++calls});
 const [a,b]=await Promise.all([read('a/product',load,10),read('a/product',load,10)]);
 assert.equal(calls,1);a.value=99;assert.equal(b.value,1);assert.equal((await read('a/product',load)).value,1);
 assert.equal((await read('b/product',load)).value,2);
 now=11;assert.equal((await read('a/product',load,10)).value,3);
 await assert.rejects(read('a/failure',async()=>{throw Error('offline');}));
 assert.equal((await read('a/failure',load)).value,4);
});
test('public cache is bounded',async()=>{
 let calls=0;const read=createPublicCache({max:1}),load=async()=>++calls;
 await read('one',load);await read('two',load);await read('one',load);assert.equal(calls,3);
});
