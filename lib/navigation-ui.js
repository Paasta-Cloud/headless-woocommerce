// Presentation only: preserve the actual cart quantity in the control's accessible name.
export function cartBadgeLabel(count) {
  if (!Number.isFinite(count) || count <= 0) return null;
  return count > 99 ? '۹۹+' : Math.floor(count).toLocaleString('fa-IR');
}

export function isNavigationCurrent(pathname, href) {
  if (!pathname || typeof href !== 'string' || !href.startsWith('/') || href.startsWith('//') || /[?#]/.test(href)) return false;
  const route = pathname.replace(/\/$/, '') || '/';
  const target = href.replace(/\/$/, '') || '/';
  if (route === target) return true;
  if (target === '/account') return ['/login', '/register', '/forgot', '/reset', '/verify'].includes(route) || route.startsWith('/account/');
  if (target === '/categories') return route.startsWith('/category/');
  return target !== '/' && route.startsWith(target + '/');
}
