import {publicRead} from './public-cache.js';

// A tiny shared WordPress generation keeps independent frontend processes in
// sync, without a public purge endpoint or a new infrastructure dependency.
export async function publicRevision(origin) {
  try {
    return await publicRead(`revision:${origin}`, async () => {
      const response = await fetch(`${origin}/wp-json/paasta-cache/v1/revision`, {
        cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(2000),
      });
      if (!response.ok) throw Error('Revision unavailable');
      const data = await response.json();
      if (!/^[a-f0-9]{32}$/.test(data.revision || '')) throw Error('Invalid revision');
      return data.revision;
    }, 15000);
  } catch { return null; }
}

export async function publicVersionedRead(origin, key, load, fallbackTtl = 15000) {
  const revision = await publicRevision(origin);
  return publicRead(`${origin}:${key}:${revision || 'legacy'}`, load, revision ? 60000 : fallbackTtl);
}
