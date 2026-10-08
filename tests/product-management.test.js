import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stockLabel,productPrice,draftPrice,variationTitle} from '../lib/product-management.js';

test('product rows distinguish free prices, unset prices and actual currency without conversions',()=>{
 assert.match(productPrice({price:'0'},'IRT'),/۰ تومان/);
 assert.equal(productPrice({price:''},'IRT'),'قیمت ثبت نشده');
 assert.equal(productPrice({price:null},'IRR'),'قیمت ثبت نشده');
 assert.equal(productPrice({},'IRT'),'قیمت ثبت نشده');
 assert.match(productPrice({price:'420000'},'IRR'),/۴۲۰٬۰۰۰ ریال/);
});
test('stock copy uses actual status and does not invent quantities for unmanaged or missing stock',()=>{
 assert.equal(stockLabel({stock_status:'instock',manage_stock:false,stock_quantity:12}),'موجود');
 assert.equal(stockLabel({stock_status:'instock',manage_stock:true,stock_quantity:null}),'موجود');
 assert.equal(stockLabel({stock_status:'outofstock',manage_stock:true,stock_quantity:0}),'ناموجود · ۰ عدد');
 assert.equal(stockLabel({stock_status:'onbackorder'}),'پیش‌خرید');
});
test('draft summaries do not mutate payloads or invent variable prices and variation names are escaped text',()=>{
 const draft={type:'simple',regular_price:'480000',sale_price:''};const original=structuredClone(draft);
 assert.match(draftPrice(draft,{},'IRT'),/۴۸۰٬۰۰۰/);assert.deepEqual(draft,original);
 assert.match(draftPrice({...draft,sale_price:'420000'},{},'IRT'),/۴۲۰٬۰۰۰/);
 assert.equal(draftPrice({type:'variable',regular_price:'999999',sale_price:'123'}, {price:''},'IRT'),'قیمت ثبت نشده');
 assert.match(draftPrice({type:'variable'},{price:'0'},'IRR'),/۰ ریال/);
 assert.equal(variationTitle({attributes:[{option:'<b>سبز</b>'},{option:'بزرگ'}]}),'سبز / بزرگ');
 assert.equal(variationTitle({}),'تنوع بدون گزینه');
});
test('new product sections retain private write safeguards, independent media state and native pagination',()=>{
 const ui=readFileSync('app/manage/store/workspace.jsx','utf8'),editor=readFileSync('app/manage/store/product-editor.jsx','utf8');
 assert.match(ui,/key=\{resource\+'-'\+\(editor.id\|\|'new'\)\}/);
 assert.match(ui,/resource==='products'\|\|contentResources.has\(resource\)/);
 assert.match(ui,/cache:'no-store'/);assert.match(ui,/operationKey:crypto.randomUUID\(\)/);assert.match(ui,/id:editor.id,revision/);
 assert.match(editor,/visited.includes\('organization'\)/);assert.match(editor,/page\*20>=total/);
 assert.match(editor,/setMedia\(current=>\[\.\.\.current,image\]\)/);
 assert.ok(!editor.includes('dangerouslySetInnerHTML'));assert.match(editor,/hidden=\{active!==key\}/);
});
