import { cookies } from 'next/headers';
import {cache} from 'react';
import { SESSION_COOKIE, accountRequest } from './account.js';
import { loadCustomerAccount } from './customer-account.js';

// Lives apart from lib/account.js so request-free helpers stay importable by
// the plain-node test suite (next/headers only resolves inside Next).
export const customerAccountState=cache(async function customerAccountState() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  // POST avoids the host's public GET cache. React cache only deduplicates
  // within this request; failures must not be mistaken for an absent session.
  return loadCustomerAccount(token, accountRequest);
});

// Preserve the existing nullable contract for layout and checkout callers.
export const customerAccount=cache(async function customerAccount() {
  return (await customerAccountState()).account;
});
