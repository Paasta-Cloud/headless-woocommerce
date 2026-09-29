import test from 'node:test';
import assert from 'node:assert/strict';
import {publicVersionedRead} from '../lib/public-revision.js';
test('revision changes invalidate data across reads; missing plugin falls back safely', async()=>{
 const original=globalThis.fetch;let revision='a'.repeat(32),calls=0,checks=0;
 globalThis.fetch=async()=>{checks++;return Response.json({revision});};
 try{
  const load=async()=>++calls;
  assert.equal(await publicVersionedRead('https://tenant-a.test','catalog',load),1);
  assert.equal(await publicVersionedRead('https://tenant-a.test','catalog',load),1);
  assert.equal(checks,1);
  revision='b'.repeat(32);
  await new Promise(resolve=>setTimeout(resolve,15100));
  assert.equal(await publicVersionedRead('https://tenant-a.test','catalog',load),2);
  globalThis.fetch=async()=>new Response('',{status:404});
  assert.equal(await publicVersionedRead('https://legacy.test','legacy',load),3);
 }finally{globalThis.fetch=original;}
});
