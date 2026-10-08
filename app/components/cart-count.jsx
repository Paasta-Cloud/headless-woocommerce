import {cartBadgeLabel} from '../../lib/navigation-ui';

export default function CartCount({count}) {
  const label = cartBadgeLabel(count);
  return label ? <span className="cart-count" aria-hidden="true" dir="ltr">{label}</span> : null;
}
