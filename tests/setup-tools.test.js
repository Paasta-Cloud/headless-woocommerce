import test from 'node:test';
import assert from 'node:assert/strict';
import {defaultDesign,normalizeDesign} from '../lib/design.js';
import {applyStorePreset,storePresets} from '../lib/store-presets.js';
import {buildConnectionPlan,publicHttpsOrigin} from '../lib/connection-plan.js';
import {readFileSync} from 'node:fs';

test('visual demos are read-only and never select demo products for real checkout',()=>{
  const page=readFileSync(new URL('../app/demos/[theme]/page.js',import.meta.url),'utf8');
  assert.match(page,/<DemoBoundary products=/);
  const boundary=readFileSync(new URL('../app/components/demo-boundary.jsx',import.meta.url),'utf8');
  const link=readFileSync(new URL('../app/components/store-link.jsx',import.meta.url),'utf8');
  assert.doesNotMatch(boundary,/fetch\(|api\/|localStorage|sessionStorage|window.location/);
  assert.match(link,/demoNavigate.*href/);
  assert.match(page,/StoreFrame mode="preview"/);
  assert.match(page,/if\(!preset\)notFound\(\)/);
  assert.match(page,/demo-digital\.json/);
  assert.match(page,/demo-grocery\.json/);
  assert.doesNotMatch(page,/getProducts\(\)/);
  assert.doesNotMatch(page,/api\/checkout|api\/manage\/save/);
});

test('demo snapshots never claim live inventory or offers',()=>{
  for(const theme of ['digital','grocery']){
    const data=JSON.parse(readFileSync(new URL(`../lib/demo-${theme}.json`,import.meta.url),'utf8'));
    assert.equal(data.products.length,12);
    assert.ok(data.products.every(p=>p.purchasable===false&&Number.isFinite(p.price)&&new URL(p.image).protocol==='https:'));
    assert.match(data.notice,/Never use for checkout/);
  }
});

test('all starter layouts preserve identity and page data without mutating the current design',()=>{
  const original=structuredClone(defaultDesign),before=JSON.stringify(original);
  for(const preset of storePresets){
    const result=applyStorePreset(original,preset.id);
    assert.equal(JSON.stringify(original),before);
    assert.deepEqual(result,normalizeDesign(result));
    const {primary,background,theme,containerWidth,...rest}=result.settings;
    const {primary:oldPrimary,background:oldBackground,theme:oldTheme,containerWidth:oldWidth,...oldRest}=original.settings;
    assert.deepEqual(rest,oldRest);
    assert.equal(result.sections.length,preset.sections.length);
    assert.equal(containerWidth,1440);
    for(const presentation of ['stories','spotlight','offers','ranked','showcase','brands','editorial'])assert.ok(result.sections.some(s=>s.presentation===presentation));
    assert.equal(result.settings.theme,preset.id);
    assert.equal(result.sections.find(section=>section.type==='hero').featuredProduct,true);
    assert.ok(result.sections.every(section=>!section.productIds.length&&!section.categoryIds.length&&!section.image));
    assert.ok(result.sections.filter(section=>section.type==='products').every(section=>section.source==='all'));
  }
  assert.throws(()=>applyStorePreset(original,'unknown'));
  original.settings.frontendUrl='https://store.shop.ir';
  assert.equal(applyStorePreset(original,'digital').settings.frontendUrl,original.settings.frontendUrl);
});

test('connection plan keeps external backend independent and checkout disabled',()=>{
  const plan=buildConnectionPlan({backend:'https://backend.shop.ir/',frontend:'https://store.neda1.paasta.app',domain:'https://shop.ir'});
  assert.equal(plan.backend,'https://backend.shop.ir');
  assert.equal(plan.mode,'external-woocommerce');
  assert.equal(plan.verified,false);
  assert.equal(plan.environment.STORE_CHECKOUT_ENABLED,'false');
  assert.equal(plan.steps.length,5);
  assert.equal(plan.environment.WOOCOMMERCE_URL,plan.backend);
  assert.throws(()=>buildConnectionPlan({backend:plan.backend,frontend:plan.backend,domain:plan.publicFrontend}));
  assert.throws(()=>buildConnectionPlan({backend:plan.publicFrontend,frontend:plan.temporaryFrontend,domain:plan.publicFrontend}));
  assert.throws(()=>buildConnectionPlan({backend:plan.backend,frontend:plan.publicFrontend,domain:plan.publicFrontend}));
});

test('planner refuses unsafe and ambiguous origins, without making any network requests',()=>{
  for(const value of ['http://shop.ir','https://user:secret@shop.ir','https://shop.ir/wp','https://shop.ir/?key=secret','https://shop.ir/#secret','https://shop.ir:8443','https://127.0.0.1','https://0x7f000001','https://[::1]','https://host.local','https://host.internal','https://localhost','shop.ir','//shop.ir'])assert.throws(()=>publicHttpsOrigin(value),value);
  assert.equal(publicHttpsOrigin(' https://SHOP.ir/ '),'https://shop.ir');
  assert.equal(publicHttpsOrigin('https://shop.ir.'),'https://shop.ir');
  for(const value of ['https://shop..ir','https://-shop.ir','https://shop-.ir','https://shop_ir.ir'])assert.throws(()=>publicHttpsOrigin(value));
  assert.throws(()=>buildConnectionPlan({backend:'https://shop.ir.',frontend:'https://shop.neda1.paasta.app',domain:'https://shop.ir'}));
});
