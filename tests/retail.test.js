import test from 'node:test';
import assert from 'node:assert/strict';
import {defaultDesign,normalizeDesign} from '../lib/design.js';
import {sectionProducts} from '../lib/catalog.js';
import {readFileSync} from 'node:fs';
test('retail presentation is bounded and backwards compatible',()=>{
 for(const presentation of ['stories','brands','editorial','showcase','ranked','spotlight','offers']){
  const d=structuredClone(defaultDesign);d.sections[0].presentation=presentation;
  assert.equal(normalizeDesign(d).sections[0].presentation,presentation);
 }
 const d=structuredClone(defaultDesign);d.sections[0].presentation='<script>';
 assert.equal(normalizeDesign(d).sections[0].presentation,'standard');
});
test('spotlight respects category, manual source, sorting and limit',()=>{
 const products=[{id:1,price:30,category:'A',categoryRefs:[{id:7,name:'A'}]},{id:2,price:10,category:'A',categoryRefs:[{id:7,name:'A'}]},{id:3,price:20,category:'B',categoryRefs:[{id:8,name:'B'}]}];
 assert.deepEqual(sectionProducts(products,{source:'category',categoryId:7,sort:'cheap',limit:1}).map(p=>p.id),[2]);
 assert.deepEqual(sectionProducts(products,{source:'manual',productIds:[1,3],sort:'expensive',limit:2}).map(p=>p.id),[1,3]);
 assert.deepEqual(sectionProducts(products,{source:'category',categoryId:999,limit:5}),[]);
});
test('demo favorites and navigation are isolated without disabling slide controls',()=>{
 const card=readFileSync('app/components/product-card.jsx','utf8'),link=readFileSync('app/components/store-link.jsx','utf8');
 assert.match(card,/useFavorites\(mode!=='preview'\)/);
 assert.match(link,/#demo-\$\{encodeURIComponent\(href\)\}/);
 assert.match(link,/event.preventDefault\(\);demoNavigate\(href\)/);
 assert.doesNotMatch(readFileSync('app/demos/[theme]/page.js','utf8'),/\binert\b/);
});
