import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { openAccounts, SESSION_SECONDS } from '../store';

function credentials() {
  const form = new FormData();
  for (const [key, value] of Object.entries({
    email: ' Person@Example.TEST ', username: 'Operator', password: 'a long password', confirmPassword: 'a long password',
  })) form.set(key, value);
  return form;
}

describe('accounts and sessions', () => {
  let store: ReturnType<typeof openAccounts>;
  beforeEach(() => { store = openAccounts(':memory:'); });
  afterEach(() => { store.close(); vi.useRealTimers(); });

  it('registers unique accounts, normalizes email, rejects bad credentials and revokes individual sessions', async () => {
    const form = credentials();
    const registered = await store.authenticate('signup', form);
    expect(store.user(registered.token!)).toEqual({ name: 'Operator' });
    form.set('email', 'person@example.test');
    expect((await store.authenticate('signup', form)).error).toBeTruthy();
    const login = await store.authenticate('login', form);
    expect(login.token).not.toBe(registered.token);
    store.revoke(registered.token!);
    expect(store.user(registered.token!)).toBeNull();
    expect(store.user(login.token!)).toEqual({ name: 'Operator' });
    form.set('password', 'wrong password');
    expect((await store.authenticate('login', form)).token).toBeUndefined();
    expect(store.user('unknown')).toBeNull();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(Date.now() + SESSION_SECONDS * 1000 + 1);
    expect(store.user(login.token!)).toBeNull();
  });

  it('rejects mismatched passwords before creating the account', async () => {
    const form = credentials();
    form.set('confirmPassword', 'different');
    expect((await store.authenticate('signup', form)).error).toMatch(/match/);
    expect((await store.authenticate('login', form)).token).toBeUndefined();
  });
});

it('retains an account and its revocation across database reopens', async () => {
  const { mkdtempSync, rmSync } = await import('node:fs');
  const { join } = await import('node:path');
  const { tmpdir } = await import('node:os');
  const directory = mkdtempSync(join(tmpdir(), 'domino-auth-'));
  const filename = join(directory, 'accounts.sqlite');
  let store = openAccounts(filename);
  try {
    const form = credentials();
    const { token } = await store.authenticate('signup', form);
    store.close();
    store = openAccounts(filename);
    expect(store.user(token!)).toEqual({ name: 'Operator' });
    store.revoke(token!);
    store.close();
    store = openAccounts(filename);
    expect(store.user(token!)).toBeNull();
    expect((await store.authenticate('login', form)).token).toBeTruthy();
  } finally {
    store.close();
    rmSync(directory, { recursive: true, force: true });
  }
});
