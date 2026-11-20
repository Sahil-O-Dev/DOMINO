import 'server-only';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { openAccounts } from './store';

export const COOKIE = 'domino_session';
let store: ReturnType<typeof openAccounts>;

export function accounts() {
  if (!store) {
    const file = resolve(/* turbopackIgnore: true */ process.env.DOMINO_AUTH_DB || '.data/accounts.sqlite');
    mkdirSync(dirname(file), { recursive: true, mode: 0o700 });
    store = openAccounts(file);
  }
  return store;
}

export const currentUser = cache(async () => {
  const token = (await cookies()).get(COOKIE)?.value;
  return token ? accounts().user(token) : null;
});
