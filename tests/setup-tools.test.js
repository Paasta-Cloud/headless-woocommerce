import test from 'node:test';
import assert from 'node:assert/strict';
import {defaultDesign,normalizeDesign} from '../lib/design.js';
import {applyStorePreset,storePresets} from '../lib/store-presets.js';
import {buildConnectionPlan,publicHttpsOrigin} from '../lib/connection-plan.js';
import {readFileSync} from 'node:fs';

test('visual demos are read-only and never select demo products for real checkout',()=>{
  const page=readFileSync(new URL('../app/demos/[theme]/page.js',import.meta.url),'utf8');
  assert.match(page,/<div inert>/);
  assert.match(page,/StoreFrame mode="preview"/);
  assert.match(page,/if\(!preset\)notFound\(\)/);
  assert.match(page,/getProducts\(\)/);
  assert.doesNotMatch(page,/api\/checkout|api\/manage\/save/);
});

test('all starter layouts preserve identity and page data without mutating the current design',()=>{
  const original=structuredClone(defaultDesign),before=JSON.stringify(original);
  for(const preset of storePresets){
    const result=applyStorePreset(original,preset.id);
    assert.equal(JSON.stringify(original),before);
    assert.deepEqual(result,normalizeDesign(result));
    const {primary,background,theme,...rest}=result.settings;
    const {primary:oldPrimary,background:oldBackground,theme:oldTheme,...oldRest}=original.settings;
    assert.deepEqual(rest,oldRest);
    assert.equal(result.sections.length,6);
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
