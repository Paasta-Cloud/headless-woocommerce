'use client';

import { useEffect, useState } from 'react';

export function useCart(mode) {
  const [cart, setCart] = useState({});
  const [keys, setKeys] = useState({});
  const [entries, setEntries] = useState([]);
  const [subtotal, setSubtotal] = useState(null);
  const [unit, setUnit] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(mode === 'live');

  function sync(payload) {
    const quantities = {};
    const itemKeys = {};
    for (const item of payload.items || []) {
      quantities[item.id] = (quantities[item.id] || 0) + item.quantity;
      itemKeys[item.id] = item.key;
    }
    setCart(quantities);
    setKeys(itemKeys);
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

  async function changeQuantity(id, delta) {
    if (busy) return;
    setError('');
    if (mode === 'demo') {
      setCart(previous => ({ ...previous, [id]: Math.max(0, (previous[id] || 0) + delta) }));
      return;
    }
    const quantity = Math.max(0, (cart[id] || 0) + delta);
    const action = !keys[id] ? { action: 'add', id } : quantity === 0
      ? { action: 'remove', key: keys[id] } : { action: 'quantity', key: keys[id], quantity };
    setBusy(true);
    try {
      const response = await fetch('/api/cart', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(action) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error);
      sync(payload);
    } catch (reason) {
      setError(reason.message || 'سبد تغییر نکرد. دوباره تلاش کنید.');
    } finally { setBusy(false); }
  }

  return { cart, entries, subtotal, unit, busy, loading, error, changeQuantity };
}
