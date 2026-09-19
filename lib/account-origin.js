export function sameAccountOrigin(request) {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const source = origin || referer;
  if (!source) return false;
  try {
    const supplied = new URL(source);
    const url = new URL(request.url);
    const host = request.headers.get('host') || url.host;
    const protocol = (request.headers.get('x-forwarded-proto') || url.protocol.slice(0, -1)).split(',')[0].trim();
    return supplied.host.toLowerCase() === host.toLowerCase() && supplied.protocol === `${protocol}:`;
  } catch { return false; }
}
