'use client';

import { useEffect, useState } from 'react';

export function useCart(mode) {
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
    if (busy) return false;
    setError('');
    if (mode === 'demo') {
      setCart(previous => ({ ...previous, [id]: (previous[id] || 0) + 1 }));
      return true;
    }
    const action = variation ? { action: 'add', id, variation } : { action: 'add', id };
    return post(action);
  }

  // Live mode identifies lines by their unique cart item key (two variations of
  // one product are separate lines); demo mode keeps working with product ids.
  async function changeQuantity(idOrKey, delta) {
    if (busy) return;
    setError('');
    if (mode === 'demo') {
      const id = Number(idOrKey);
      setCart(previous => ({ ...previous, [id]: Math.max(0, (previous[id] || 0) + delta) }));
      return;
    }
    const entry = entries.find(item => item.key === idOrKey);
    const quantity = Math.max(0, (entry?.quantity || 0) + delta);
    const action = !entry ? { action: 'add', id: idOrKey } : quantity === 0
      ? { action: 'remove', key: idOrKey } : { action: 'quantity', key: idOrKey, quantity };
    return post(action);
  }

  return { cart, entries, subtotal, unit, busy, loading, error, addItem, changeQuantity };
}
