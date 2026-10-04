'use client';

import { useEffect, useState } from 'react';
import { readFavoriteIds } from '../lib/favorites';

const STORAGE_KEY = 'khanechin-favorites-v1';

export function useFavorites(enabled=true) {
  const [ids, setIds] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if(!enabled)return;
    function sync(event) {
      if(event?.detail) { setIds(event.detail); return; }
      try { setIds(readFavoriteIds(window.localStorage.getItem(STORAGE_KEY))); } catch { /* Keep the current session usable when storage is blocked. */ }
    }
    sync();
    setReady(true);
    window.addEventListener('khanechin-favorites',sync);
    window.addEventListener('storage',sync);
    return ()=>{window.removeEventListener('khanechin-favorites',sync);window.removeEventListener('storage',sync);};
  }, [enabled]);

  function toggle(id) {
    if(!enabled)return;
    if (!Number.isSafeInteger(id) || id <= 0) return;
    const next = ids.includes(id) ? ids.filter(item => item !== id) : [...ids,id];
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* In-memory favorites remain available. */ }
    setIds(next);
    window.dispatchEvent(new CustomEvent('khanechin-favorites',{detail:next}));
  }

  return { ids, ready, has: id => ids.includes(id), toggle };
}
