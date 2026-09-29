import {createHash} from 'node:crypto';

export const tokenDigest = token => createHash('sha256').update(token).digest('hex');
// Only call after WooCommerce accepted this signed Cart Token. Its expiration
// rotates on reads; the user_id identifies the stable cart session.
export function cartSessionDigest(token){
 try{
  if(typeof token!=='string'||token.length>4096||token.split('.').length!==3)return '';
  const payload=JSON.parse(Buffer.from(token.split('.')[1],'base64url').toString());
  return payload.iss==='store-api'&&typeof payload.user_id==='string'&&payload.user_id.length>0&&payload.user_id.length<=200?tokenDigest(payload.user_id):'';
 }catch{return '';}
}
export function cartDigest(cart) {
  const items = (cart.items || []).map(item => [Number(item.id), Number(item.quantity)]).sort((a,b)=>a[0]-b[0]);
  const coupons = (cart.coupons || []).map(coupon => typeof coupon === 'string' ? coupon : coupon.code).sort();
  return tokenDigest(JSON.stringify({items,coupons}));
}
// Never clear a failed/pending purchase or a cart changed while at the gateway.
export function shouldDetachCart(order, receipt, token, cart) {
  if (!order || !['processing','completed'].includes(order.status) || receipt.settled || !token || !cart) return false;
  if (!receipt.cartDigest || !receipt.cartSession || receipt.cartSession !== cartSessionDigest(token)) return false;
  return cartDigest(cart) === receipt.cartDigest;
}
