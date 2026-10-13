'use client';
export default function PrintOrder() {
  return <button type="button" className="customer-order-print" onClick={() => window.print()}>چاپ خلاصهٔ سفارش</button>;
}
