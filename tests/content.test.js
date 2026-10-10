import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {contentDraft,contentHref,moveContentBlock} from '../lib/content.js';
import {getContent} from '../lib/content-server.js';
test('rich WordPress content is not flattened by a metadata edit',()=>{
 assert.ok(!Object.hasOwn(contentDraft({editable:false,blocks:[{type:'p',text:'Original'}]}),'blocks'));
 const original={blocks:[{type:'p',text:'Original'}]};const draft=contentDraft(original);draft.blocks[0].text='Changed';assert.equal(original.blocks[0].text,'Original');
});
test('content navigation stays inside the storefront and block moves preserve text',()=>{
 assert.equal(contentHref('pages','test'),'\/pages/test');assert.equal(contentHref('posts','a/b'),'/blog/a%2Fb');
 const blocks=[{type:'p',text:'A'},{type:'h2',text:'B'}];assert.deepEqual(moveContentBlock(blocks,0,1),[blocks[1],blocks[0]]);assert.deepEqual(moveContentBlock(blocks,0,-1),blocks);
});
test('public content transport is tenant fixed, bounded, cookie-free and fails closed',async()=>{
 const previous=process.env.WOOCOMMERCE_URL,fetcher=globalThis.fetch;process.env.WOOCOMMERCE_URL='https://content-fixture.example.test';let count=0;
 globalThis.fetch=async(url,opts)=>{count++;const u=new URL(url);assert.equal(u.origin,'https://content-fixture.example.test');assert.equal(u.pathname,'/');assert.equal(u.searchParams.get('rest_route'),'/paasta-headless/v1/content');assert.equal(u.searchParams.get('page'),'100');assert.equal(opts.cache,'no-store');assert.equal(opts.redirect,'error');assert.equal(opts.headers,undefined);return Response.json({items:[],total:0});};
 try{await getContent({type:'page',page:999});await getContent({type:'page',page:999});assert.equal(count,1);globalThis.fetch=async()=>new Response('',{status:503});await assert.rejects(getContent({slug:'failure'}));}finally{globalThis.fetch=fetcher;if(previous===undefined)delete process.env.WOOCOMMERCE_URL;else process.env.WOOCOMMERCE_URL=previous;}
});
test('content renders as escaped React text and publication uses existing private write flow',()=>{
 assert.ok(!readFileSync('app/components/content-body.jsx','utf8').includes('dangerouslySetInnerHTML'));
 const editor=readFileSync('app/manage/store/content-editor.jsx','utf8');assert.match(editor,/v.blocks\?/);assert.match(editor,/پیش‌نمایش خصوصی/);
 const ui=readFileSync('app/manage/store/workspace.jsx','utf8');assert.match(ui,/Boolean\(editor\?\.protected\)/);assert.match(ui,/crypto.randomUUID\(\)/);
});
