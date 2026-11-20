import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { currentUser } from '../../lib/auth/session';

export default async function AccountLayout({ children }: { children: ReactNode }) {
  if (await currentUser()) redirect('/domino');
  return children;
}
