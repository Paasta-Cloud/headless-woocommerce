import test from 'node:test';
import assert from 'node:assert/strict';
import {defaultDesign,normalizeDesign,safeDesignUrl,contrastingText} from '../lib/design.js';
import {fetchDesign} from '../lib/design-fetch.js';
import {readFileSync} from 'node:fs';

test('private information previews remain within the preview cookie path',()=>{
  const route=readFileSync('app/preview/[page]/page.js','utf8');
  assert.match(route,/Object.hasOwn\(pages,page\)/);
  assert.match(route,/preview&&/);
  assert.match(readFileSync('app/api/design-preview/route.js','utf8'),/path:'\/preview'/);
  assert.match(readFileSync('app/preview/start.jsx','utf8'),/replaceState\(null,'',window.location.pathname\)/);
  assert.match(readFileSync('app/preview/navigation.jsx','utf8'),/href=\{'\/preview'/);
});

test('builder defaults preserve the existing five homepage sections',()=>{
  assert.deepEqual(defaultDesign.sections.map(s=>s.type),['hero','features','banners','products','text-image']);
  assert.equal(defaultDesign.sections[0].items.length,4);
  assert.equal(defaultDesign.settings.mobileLinks.length,5);
});

test('page and display settings are bounded, safe and backwards compatible',()=>{
  const raw=structuredClone(defaultDesign);
  raw.settings.pages={about:{enabled:true,title:'<b>درباره</b>',intro:'شرح',body:'x'.repeat(13000)},unknown:{enabled:true}};
  raw.settings.benefits=[{title:'<img>خدمت',body:'توضیح',href:'javascript:alert(1)',icon:'script'}];
  raw.settings.showSearch=false;raw.settings.authTitle='حساب {name}';
  const clean=normalizeDesign(raw);
  assert.equal(clean.settings.pages.about.title,'درباره');
  assert.equal(clean.settings.pages.about.body.length,12000);
  assert.equal(clean.settings.pages.unknown,undefined);
  assert.equal(clean.settings.pages.contact.enabled,false);
  assert.equal(clean.settings.benefits[0].href,'');
  assert.equal(clean.settings.benefits[0].icon,'info');
  assert.equal(clean.settings.showSearch,false);
  assert.equal(clean.settings.showMobileNav,true);
  assert.equal(normalizeDesign({...raw,settings:{}}).settings.benefits.length,4);
  assert.deepEqual(normalizeDesign(clean),clean);
});
test('design contract rejects unsupported versions and strips executable settings',()=>{
  assert.throws(()=>normalizeDesign({...defaultDesign,version:2}));
  const design=normalizeDesign({version:1,settings:{name:'<b>فروشگاه</b>',primary:'red;display:none',fontUrl:'https://example.test/font.css',secret:'private'},sections:[{type:'script'},{type:'products',columns:99,mobileColumns:99,limit:999,productIds:[1,1,-1,'2'],items:[{href:'javascript:alert(1)'}]}]});
  assert.equal(design.settings.name,'فروشگاه');assert.equal(design.settings.primary,defaultDesign.settings.primary);assert.equal(design.settings.fontUrl,'');assert.equal(design.settings.secret,undefined);
  assert.equal(design.sections.length,1);assert.equal(design.sections[0].columns,6);assert.equal(design.sections[0].mobileColumns,2);assert.equal(design.sections[0].limit,100);assert.deepEqual(design.sections[0].productIds,[1]);assert.equal(design.sections[0].items[0].href,'');
});
test('links and media reject scripts, credentials, protocol-relative URLs and CSS escapes',()=>{
  for(const value of ['javascript:alert(1)','//evil.test','https://user:pass@example.test/a','https://example.test/"</style>','/\\evil.test','data:image/svg+xml,x'])assert.equal(safeDesignUrl(value),'');
  assert.equal(safeDesignUrl('/shop?q=1'),'/shop?q=1');assert.equal(safeDesignUrl('#products'),'#products');assert.equal(safeDesignUrl('/image.png',true),'');
  assert.equal(contrastingText('#ffffff'),'#111111');assert.equal(contrastingText('#000000'),'#ffffff');
});
test('published fallback never includes a draft, invalid previews fail closed, and tenants do not share fallback',async()=>{
  const originalFetch=globalThis.fetch,originalOrigin=process.env.WOOCOMMERCE_URL;
  process.env.WOOCOMMERCE_URL='https://store.example.test';
  let kind='published';const token='a'.repeat(64);
  globalThis.fetch=async(url,options)=>{
    assert.equal(options.cache,'no-store');assert.equal(options.redirect,'error');assert.ok(!url.includes(token));
    if(kind==='failure')throw Error('offline');
    if(kind==='draft'){assert.equal(options.method,'POST');assert.equal(JSON.parse(options.body).token,token);}
    return new Response(JSON.stringify({...defaultDesign,settings:{...defaultDesign.settings,name:kind}}));
  };
  try{
    assert.equal((await fetchDesign()).settings.name,'published');kind='draft';assert.equal((await fetchDesign(token)).settings.name,'draft');
    kind='failure';assert.equal((await fetchDesign()).settings.name,'published');await assert.rejects(fetchDesign(token));await assert.rejects(fetchDesign('bad'));
    process.env.WOOCOMMERCE_URL='https://another.example.test';assert.equal((await fetchDesign()).settings.name,defaultDesign.settings.name);
  }finally{globalThis.fetch=originalFetch;if(originalOrigin===undefined)delete process.env.WOOCOMMERCE_URL;else process.env.WOOCOMMERCE_URL=originalOrigin;}
});
