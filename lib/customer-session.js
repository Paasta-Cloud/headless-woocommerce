import { cookies } from 'next/headers';
import { SESSION_COOKIE, accountRequest } from './account.js';

// Lives apart from lib/account.js so request-free helpers stay importable by
// the plain-node test suite (next/headers only resolves inside Next).
export async function customerAccount() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  try {
    // Authenticated reads use POST because the WordPress host's public cache
    // incorrectly reused private GET responses despite no-store headers.
    const result = await accountRequest('me', token, 'POST');
    return result?.status === 200 ? result.data : null;
  } catch { return null; }
}
