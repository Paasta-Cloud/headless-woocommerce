import test from 'node:test';
import assert from 'node:assert/strict';
import {cartDigest,tokenDigest,shouldDetachCart} from '../lib/cart-settlement.js';
const cart={items:[{id:11,quantity:2}],coupons:[{code:'test10'}]};
const paid={...cart,status:'processing'};
const receipt={cartToken:tokenDigest('original'),cartDigest:cartDigest(cart)};
test('only a verified paid order and its unchanged original cart can detach',()=>{
 assert.equal(shouldDetachCart(paid,receipt,'original',cart),true);
 for(const status of ['pending','failed','cancelled','on-hold'])assert.equal(shouldDetachCart({...paid,status},receipt,'original',cart),false);
 assert.equal(shouldDetachCart(null,receipt,'original',cart),false);
 assert.equal(shouldDetachCart(paid,receipt,'different',cart),false);
 assert.equal(shouldDetachCart(paid,{...receipt,settled:true},'original',cart),false);
});
test('changed quantities, new products and new discounts survive a payment return',()=>{
 for(const changed of [{...cart,items:[{id:11,quantity:3}]},{...cart,items:[...cart.items,{id:12,quantity:1}]},{...cart,coupons:[]}])assert.equal(shouldDetachCart(paid,receipt,'original',changed),false);
});
test('pre-upgrade receipt is recovered only with an exact verified order match',()=>{
 assert.equal(shouldDetachCart(paid,{},'original',cart),true);
 assert.equal(shouldDetachCart({...paid,items:[{id:12,quantity:2}]},{},'original',cart),false);
});
