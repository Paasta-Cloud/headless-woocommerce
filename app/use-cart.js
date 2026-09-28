'use client';

import { createContext, useContext, useEffect, useState } from 'react';

const CartContext = createContext(null);
export function CartProvider({ mode, children }) {
  const value = useCartState(mode);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error('CartProvider is required');
  return value;
}
function useCartState(mode) {
  const [cart, setCart] = useState({});
  const [entries, setEntries] = useState([]);
  const [subtotal, setSubtotal] = useState(null);
  const [unit, setUnit] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(mode === 'live');

  function sync(payload) {
    const quantities = {};
    for (const item of payload.items || []) {
      quantities[item.id] = (quantities[item.id] || 0) + item.quantity;
    }
    setCart(quantities);
    setEntries(payload.items || []);
    setSubtotal(payload.subtotal);
    setUnit(payload.unit);
  }

  useEffect(() => {
    if (mode === 'demo') {
      try { const saved = JSON.parse(sessionStorage.getItem('khanechin-demo-cart') || '{}'); setCart(Object.fromEntries(Object.entries(saved).filter(([id, qty]) => /^[1-9]\d*$/.test(id) && Number.isInteger(qty) && qty > 0 && qty <= 99))); } catch { /* Empty demo cart is safe. */ }
    }
    if (mode !== 'live') return;
    let active = true;
    fetch('/api/cart', { cache: 'no-store' }).then(async response => {
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error);
      if (active) sync(payload);
    }).catch(reason => { if (active) setError(reason.message || 'سبد بارگذاری نشد. دوباره تلاش کنید.'); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [mode]);

  async function post(action) {
    setBusy(true);
    try {
      const response = await fetch('/api/cart', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(action) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error);
      sync(payload);
      return true;
    } catch (reason) {
      setError(reason.message || 'سبد تغییر نکرد. دوباره تلاش کنید.');
      return false;
    } finally { setBusy(false); }
  }

  // Adds a product; for variable products variation carries the chosen variant
  // ({ id, attributes: [{ name, value }] }) exactly as reported by the product page.
  async function addItem(id, variation) {
    if (busy || loading || !['demo','live'].includes(mode)) return false;
    setError('');
    if (mode === 'demo') {
      const next = { ...cart, [id]: Math.min(99, (cart[id] || 0) + 1) };
      setCart(next); try { sessionStorage.setItem('khanechin-demo-cart', JSON.stringify(next)); } catch { /* Storage may be disabled. */ }
      return true;
    }
    const action = variation ? { action: 'add', id, variation } : { action: 'add', id };
    return post(action);
  }

  // Live mode identifies lines by their unique cart item key (two variations of
  // one product are separate lines); demo mode keeps working with product ids.
  async function changeQuantity(idOrKey, delta) {
    if (busy || loading || !['demo','live'].includes(mode)) return;
    setError('');
    if (mode === 'demo') {
      const id = Number(idOrKey);
      const next = { ...cart, [id]: Math.min(99, Math.max(0, (cart[id] || 0) + delta)) };
      setCart(next); try { sessionStorage.setItem('khanechin-demo-cart', JSON.stringify(next)); } catch { /* Storage may be disabled. */ }
      return;
    }
    const entry = entries.find(item => item.key === idOrKey);
    const quantity = Math.max(0, (entry?.quantity || 0) + delta);
    const action = !entry ? { action: 'add', id: idOrKey } : quantity === 0
      ? { action: 'remove', key: idOrKey } : { action: 'quantity', key: idOrKey, quantity };
    return post(action);
  }

  return { cart, entries, subtotal, unit, busy: busy || loading, loading, error, addItem, changeQuantity, mode };
}
