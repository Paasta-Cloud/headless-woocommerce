import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {storeMetadata} from '../lib/store-metadata.js';
test('all storefront page titles inherit the configured merchant rather than the demo identity',()=>{
  for(const name of ['عین پرفیوم','فروشگاه دوم']){
    const meta=storeMetadata({name,description:'شرح',favicon:'https://store.test/icon.png'});
    assert.equal(meta.title.default,name);assert.equal(meta.title.template,`%s | ${name}`);
    assert.equal(meta.icons.icon,'https://store.test/icon.png');
  }
  for(const page of ['shop','categories','category/[id]','account','account/orders/[id]','cart','checkout','favorites','forgot','login','order/[id]','product/[id]','register','reset','verify']){
    assert.doesNotMatch(readFileSync(`app/${page}/page.js`,'utf8'),/خانه‌چین/);
  }
  assert.match(readFileSync('app/layout.js','utf8'),/return storeMetadata\(s\)/);
  assert.doesNotMatch(readFileSync('lib/page-metadata.js','utf8'),/\| \$\{settings.name\}/);
});
test('product shelves reserve image, title and price space rather than shifting purchase actions',()=>{
 const css=readFileSync('app/boutique.css','utf8');
 assert.match(css,/\.craft-products \.craft-product\{display:flex;flex-direction:column/);
 assert.match(css,/\.craft-product-price\{margin-top:auto;min-height:60px/);
 assert.match(css,/\.craft-product-photo\{flex:none;aspect-ratio:1/);
 const link=readFileSync('app/components/store-link.jsx','utf8');
 assert.match(link,/prefetch=\{intent&&publicPage\}/);
});
