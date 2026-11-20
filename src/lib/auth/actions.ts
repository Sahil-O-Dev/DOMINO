'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { accounts, COOKIE } from './session';
import { SESSION_SECONDS } from './store';

export async function submitAccount(mode: 'signup' | 'login', _previous: string, form: FormData) {
  if (mode !== 'signup' && mode !== 'login') return 'Choose sign in or create account.';
  const jar = await cookies();
  try {
    const result = await accounts().authenticate(mode, form);
    if (result.error !== undefined) return result.error;
    const previousToken = jar.get(COOKIE)?.value;
    if (previousToken) accounts().revoke(previousToken);
    jar.set(COOKIE, result.token, {
      httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production',
      path: '/', maxAge: SESSION_SECONDS,
    });
  } catch (error) {
    console.error('Account service unavailable', error instanceof Error ? error.name : 'Unknown error');
    return 'The account service is unavailable. Please try again shortly.';
  }
  redirect('/domino');
}

export async function signOut() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) accounts().revoke(token);
  jar.delete(COOKIE);
  redirect('/auth/login');
}
