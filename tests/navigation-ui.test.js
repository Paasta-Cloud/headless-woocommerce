import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {cartBadgeLabel,isNavigationCurrent} from '../lib/navigation-ui.js';

test('cart badge hides empty counts and bounds visual width without changing actual quantities',()=>{
 for(const value of [0,-1,NaN,Infinity])assert.equal(cartBadgeLabel(value),null);
 assert.equal(cartBadgeLabel(1),'۱');assert.equal(cartBadgeLabel(10),'۱۰');assert.equal(cartBadgeLabel(99),'۹۹');
 assert.equal(cartBadgeLabel(100),'۹۹+');assert.equal(cartBadgeLabel(10000),'۹۹+');
});
test('active navigation matches exact routes and meaningful child routes, never home prefixes or external links',()=>{
 assert.equal(isNavigationCurrent('/','/'),true);assert.equal(isNavigationCurrent('/cart','/'),false);
 assert.equal(isNavigationCurrent('/cart/','/cart'),true);assert.equal(isNavigationCurrent('/cartography','/cart'),false);
 assert.equal(isNavigationCurrent('/login','/account'),true);assert.equal(isNavigationCurrent('/register','/account'),true);
 assert.equal(isNavigationCurrent('/account/addresses','/account'),true);assert.equal(isNavigationCurrent('/category/42','/categories'),true);
 for(const href of ['https://example.test/cart','//example.test/cart','/cart?mode=1','#cart'])assert.equal(isNavigationCurrent('/cart',href),false);
});
test('shared cart control replaces detached legacy badges, keeps full accessible quantity and mobile totals',()=>{
 const shell=readFileSync('app/components/store-shell.jsx','utf8'),css=readFileSync('app/interface.css','utf8');
 assert.match(shell,/<CartCount count=\{count\}\/\>/);assert.ok(!shell.includes('<b>{count.toLocaleString'));
 assert.match(shell,/aria-label=\{`سبد خرید، \$\{count.toLocaleString\('fa-IR'\)\} کالا`\}/);
 assert.match(css,/\.cart-count\{[^}]*inset-block-start:0;inset-inline-end:0/);
 assert.match(css,/\.order-row \.row-total\{display:block/);
 assert.match(shell,/categoryMenu.current.open=false/);
});
test('grouped operational forms preserve native values and private write transport',()=>{
 const ui=readFileSync('app/manage/store/workspace.jsx','utf8');
 for(const key of ['discount_type','date_expires','usage_limit_per_user','minimum_amount','maximum_amount','individual_use','exclude_sale_items','free_shipping'])assert.ok(ui.includes(key));
 assert.match(ui,/f.private\?'':f.value\?\?''/);assert.match(ui,/if\(f.private\)return <Field label=\{label\} type="password"/);
 assert.match(ui,/set\(\{settings:\{\.\.\.v.settings,\[key\]:value\}\}\)/);
 assert.match(ui,/cache:'no-store'/);assert.match(ui,/id:editor.id,revision/);assert.match(ui,/operationKey:crypto.randomUUID\(\)/);
 assert.match(ui,/SettingsSection icon="order" title="اعتبار و سقف استفاده"/);
});
