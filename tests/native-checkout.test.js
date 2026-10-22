import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {nativeMethods,nativeReady,validSelections,safeNativeGateway,shippingChoices,nativePaymentPlan,nativeFrontend} from '../lib/native-checkout.js';
test('native checkout fails closed without a valid explicit HTTPS frontend origin',()=>{
 const previous=process.env.STORE_FRONTEND_URL;
 try{for(const value of ['', 'http://front.test','https://u:p@front.test','https://front.test/path','https://front.test:8443']){process.env.STORE_FRONTEND_URL=value;assert.equal(nativeFrontend(),null);}process.env.STORE_FRONTEND_URL='https://front.test/';assert.equal(nativeFrontend(),'https://front.test');}
 finally{if(previous===undefined)delete process.env.STORE_FRONTEND_URL;else process.env.STORE_FRONTEND_URL=previous;}
});
test('native shipping uses every live WooCommerce package/rate, not demo pickup',()=>{
 const cart={items_count:1,needs_shipping:true,payment_methods:['WC_ZPal','WC_Gateway_SnappPay'],shipping_rates:[{package_id:0,shipping_rates:[{rate_id:'flat_rate:2',name:'پست تیپاکس',selected:true,price:'125000'}]}]};
 const methods=nativeMethods(cart,{methods:[{id:'cod'},{id:'WC_ZPal',title:'زرین‌پال'}]});
 assert.deepEqual(methods,[{id:'WC_ZPal',title:'زرین‌پال'}]);assert.equal(nativeReady(cart,methods),true);
 assert.equal(validSelections(cart,[{packageId:0,rateId:'flat_rate:2'}]),true);
 for(const selections of [[],[{packageId:0,rateId:'local_pickup:1'}],[{packageId:1,rateId:'flat_rate:2'}],[{packageId:0,rateId:'flat_rate:2'},{packageId:0,rateId:'flat_rate:2'}]])assert.equal(validSelections(cart,selections),false);
 assert.equal(shippingChoices(cart)[0].rates[0].price,'125000');
 cart.shipping_rates[0].shipping_rates[0].selected=false;assert.equal(nativeReady(cart,methods),false);
});
test('gateway direct redirects never initialize another native receipt payment',()=>{
 const order={order_id:7,order_key:'wc_order_123456789',payment_result:{redirect_url:'https://www.zarinpal.com/pg/StartPay/authority'}};
 assert.deepEqual(nativePaymentPlan(order,'https://backend.test'),{direct:order.payment_result.redirect_url});
 order.payment_result.redirect_url='https://backend.test/checkout/order-pay/7/?key=wc_order_123456789';assert.deepEqual(nativePaymentPlan(order,'https://backend.test'),{bridge:true});
 order.payment_result.redirect_url='https://backend.test/checkout/order-pay/8/?key=wc_order_123456789';assert.equal(nativePaymentPlan(order,'https://backend.test'),null);
 order.payment_result.redirect_url='https://backend.test/checkout/order-pay/7/?key=wc_order_wrong123';assert.equal(nativePaymentPlan(order,'https://backend.test'),null);
});
test('native gateways accept only HTTPS provider hosts without credentials or custom ports',()=>{
 for(const host of ['www.zarinpal.com','payment.zarinpal.com','credit.snapppay.ir','gateway.zibal.ir'])assert.equal(safeNativeGateway(`https://${host}/pay`),`https://${host}/pay`);
 for(const url of ['https://evil.snapppay.ir.evil.test/pay','https://zarinpal.com@evil.test/pay','https://u:p@www.zarinpal.com/pay','http://www.zarinpal.com/pay','https://www.zarinpal.com:8443/pay','https://eyn.sharedwp1.paasta.app/cart'])assert.equal(safeNativeGateway(url),null);
 const route=readFileSync('app/order/[id]/pay/route.js','utf8');assert.match(route,/function POST/);assert.doesNotMatch(route,/function GET/);assert.match(route,/sameSiteOrigin/);
});
