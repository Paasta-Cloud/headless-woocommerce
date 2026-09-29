import test from 'node:test';
import assert from 'node:assert/strict';
import {cartDigest,cartSessionDigest,shouldDetachCart} from '../lib/cart-settlement.js';
const jwt=(user_id,exp=1)=>'header.'+Buffer.from(JSON.stringify({user_id,exp,iss:'store-api'})).toString('base64url')+'.signature';
const original=jwt('original');
const cart={items:[{id:11,quantity:2}],coupons:[{code:'test10'}]};
const paid={...cart,status:'processing'};
const receipt={cartSession:cartSessionDigest(original),cartDigest:cartDigest(cart)};
test('only a verified paid order and its unchanged original cart can detach',()=>{
 assert.equal(shouldDetachCart(paid,receipt,original,cart),true);
 assert.equal(shouldDetachCart(paid,receipt,jwt('original',99999),cart),true);
 for(const status of ['pending','failed','cancelled','on-hold'])assert.equal(shouldDetachCart({...paid,status},receipt,original,cart),false);
 assert.equal(shouldDetachCart(null,receipt,original,cart),false);
 assert.equal(shouldDetachCart(paid,receipt,jwt('different'),cart),false);
 assert.equal(shouldDetachCart(paid,{...receipt,settled:true},original,cart),false);
 assert.equal(cartSessionDigest('malformed'),'');
});
test('changed quantities, new products and new discounts survive a payment return',()=>{
 for(const changed of [{...cart,items:[{id:11,quantity:3}]},{...cart,items:[...cart.items,{id:12,quantity:1}]},{...cart,coupons:[]}])assert.equal(shouldDetachCart(paid,receipt,original,changed),false);
});
test('pre-upgrade receipts cannot detach carts without checkout binding',()=>{
 assert.equal(shouldDetachCart(paid,{},'original',cart),false);
 assert.equal(shouldDetachCart({...paid,items:[{id:12,quantity:2}]},{},'original',cart),false);
});
