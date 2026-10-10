// Query-form REST works with both plain and pretty WordPress permalinks.
export function wordpressRestUrl(origin, path) {
  const url=new URL(path, origin);
  if(!path.startsWith('/')||path.startsWith('//')||url.origin!==new URL(origin).origin||url.hash)throw Error('Invalid REST path');
  const route=url.pathname;
  url.pathname='/';
  url.searchParams.set('rest_route',route);
  return url.href;
}
