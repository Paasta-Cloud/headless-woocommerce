import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {applyStorePreset} from '../lib/store-presets.js';
import {defaultDesign,normalizeDesign} from '../lib/design.js';

test('craft preset binds real category IDs and preserves merchant identity and page content',()=>{
 const original=structuredClone(defaultDesign);original.settings.pages.contact={enabled:true,title:'تماس',intro:'',body:'نشانی فروشگاه'};
 const categories=['شمال','جنوب','شرق','غرب'].map((name,i)=>({id:70+i,name:'صنایع دستی '+name}));
 const result=applyStorePreset(original,'craft',categories);
 assert.deepEqual(result.settings.pages,original.settings.pages);
 assert.equal(result.settings.name,original.settings.name);
 assert.equal(result.sections.length,16);
 assert.deepEqual(result.sections.filter(s=>s.source==='category').map(s=>s.categoryId),[70,71,72,73]);
 assert.ok(result.sections.filter(s=>s.source==='category').every(s=>s.image&&s.presentation==='offers'));
 assert.deepEqual(normalizeDesign(result),result);
 assert.ok(applyStorePreset(original,'craft').sections.filter(s=>s.image).every(s=>s.source==='all'));
});
test('poster and featured shelf fields survive normalization without expanding the schema',()=>{
 const d=structuredClone(defaultDesign);d.sections=[{type:'products',presentation:'offers',image:'https://example.test/poster.png',source:'category',categoryId:17},{type:'products',featuredProduct:true}];
 const result=normalizeDesign(d);
 assert.equal(result.sections[0].image,d.sections[0].image);
 assert.equal(result.sections[1].featuredProduct,true);
 const editor=readFileSync('app/manage/workspace.jsx','utf8');
 assert.match(editor,/بنر کنار ویترین/);assert.match(editor,/محصول منتخب کنار ویترین/);
 assert.match(editor,/draftRef.current\)!==snapshot/);
});
test('VibeFarsi switch stays semantic, controlled and disabled-compatible; storefront CSS stays scoped',()=>{
 const controls=readFileSync('app/components/vibefarsi/controls.jsx','utf8');
 assert.match(controls,/role="switch" aria-checked=\{on\}/);
 assert.match(controls,/checked!==undefined/);
 assert.match(controls,/\{\.\.\.props\}/);
 const css=readFileSync('app/craft-detail.css','utf8');
 assert.equal((css.match(/\.store-frame/g)||[]).length,(css.match(/\.store-frame\[data-store-theme=craft\]/g)||[]).length);
 assert.match(readFileSync('app/manage/studio.css','utf8'),/prefers-reduced-motion/);
 assert.match(readFileSync('app/manage/studio.css','utf8'),/\.vf-switch\{[^}]*justify-content:flex-start/);
 assert.match(css,/\.craft-poster-shelf>\.craft-shelf\{display:block/);
 assert.match(readFileSync('app/demos/[theme]/page.js','utf8'),/!\['digital','grocery'\]\.includes\(theme\)/);
});
