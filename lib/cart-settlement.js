import {createHash} from 'node:crypto';

export const tokenDigest = token => createHash('sha256').update(token).digest('hex');
export function cartDigest(cart) {
  const items = (cart.items || []).map(item => [Number(item.id), Number(item.quantity)]).sort((a,b)=>a[0]-b[0]);
  const coupons = (cart.coupons || []).map(coupon => typeof coupon === 'string' ? coupon : coupon.code).sort();
  return tokenDigest(JSON.stringify({items,coupons}));
}
// Never clear a failed/pending purchase or a cart changed while at the gateway.
export function shouldDetachCart(order, receipt, token, cart) {
  if (!order || !['processing','completed'].includes(order.status) || receipt.settled || !token || !cart) return false;
  if (receipt.cartToken && receipt.cartToken !== tokenDigest(token)) return false;
  return cartDigest(cart) === (receipt.cartDigest || cartDigest(order));
}
