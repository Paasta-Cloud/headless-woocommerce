import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {customerDraft,customerDiff,orderStatusOptions,money,dateLabel} from '../lib/customer-orders.js';
test('customer edit limits fields and sends only changed address fields',()=>{
 const before=customerDraft({first_name:'Original',email:'login@example.invalid',role:'administrator',billing:{first_name:'Original',city:'Tehran',phone:'test',custom_key:'keep'},shipping:{country:'IR'}});
 assert.ok(!Object.hasOwn(before,'email'));assert.ok(!Object.hasOwn(before,'role'));assert.ok(!Object.hasOwn(before.billing,'custom_key'));
 const next=structuredClone(before);next.billing.city='Updated';assert.deepEqual(customerDiff(before,next),{billing:{city:'Updated'}});
 assert.deepEqual(customerDiff(before,before),{});
});
test('order actions never offer unpaid online completion or reopening terminal orders',()=>{
 const unpaid=orderStatusOptions({status:'pending',payment_method:'zibal'});assert.ok(!Object.hasOwn(unpaid,'completed'));assert.ok(!Object.hasOwn(unpaid,'processing'));
 assert.ok(Object.hasOwn(orderStatusOptions({status:'pending',payment_method:'cod'}),'completed'));
 assert.ok(Object.hasOwn(orderStatusOptions({status:'processing',date_paid:'2026-10-08'}),'completed'));
 for(const status of ['failed','cancelled','refunded'])assert.deepEqual(Object.keys(orderStatusOptions({status})),[status]);
});
test('totals retain the actual WooCommerce unit and invalid dates do not display garbage',()=>{
 assert.match(money('100','IRR'),/ریال/);assert.match(money('100','IRT'),/تومان/);
 assert.equal(dateLabel(null),'ثبت نشده');assert.equal(dateLabel('bad date'),'ثبت نشده');
});
test('customer records and notes use private manager transport and recovery markers contain no personal values',()=>{
 const ui=readFileSync('app/manage/store/workspace.jsx','utf8');const editor=readFileSync('app/manage/store/customer-orders.jsx','utf8');
 assert.match(ui,/customerDiff\(before,draft\)/);assert.match(ui,/customer_note:false/);assert.match(ui,/sessionStorage.setItem\(storageKey,JSON.stringify\(marker\)\)/);
 assert.match(ui,/resource==='orders'&&customerFilter/);assert.ok(!editor.includes('dangerouslySetInnerHTML'));
 assert.match(editor,/ایمیل ورود، رمز و سطح دسترسی/);
});
test('unsent notes warn on navigation and filtered customer pages retain upstream pagination',()=>{
 const ui=readFileSync('app/manage/store/workspace.jsx','utf8');const editor=readFileSync('app/manage/store/customer-orders.jsx','utf8');
 assert.match(ui,/\(!dirty&&!noteDirty\)\|\|window.confirm/);
 assert.match(ui,/if\(dirty\|\|noteDirty\)/);
 assert.match(editor,/onDraftChange\(Boolean\(note.trim\(\)\)\)/);
 assert.match(editor,/<OrderNotes key=\{item.id\}/);
 assert.ok(ui.includes('disabled={busy||page*20>=total}'));
});
