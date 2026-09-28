'use client';

import { useEffect, useState } from 'react';
import { readFavoriteIds } from '../lib/favorites';

const STORAGE_KEY = 'khanechin-favorites-v1';

export function useFavorites() {
  const [ids, setIds] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setIds(readFavoriteIds(window.localStorage.getItem(STORAGE_KEY)));
    setReady(true);
  }, []);

  function toggle(id) {
    if (!Number.isSafeInteger(id) || id <= 0) return;
    setIds(previous => {
      const next = previous.includes(id) ? previous.filter(item => item !== id) : [...previous, id];
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }

  return { ids, ready, has: id => ids.includes(id), toggle };
}
