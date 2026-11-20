import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { Layers3, LogOut } from 'lucide-react';
import { currentUser } from '../lib/auth/session';
import { signOut } from '../lib/auth/actions';
import { AdvisorProvider } from '../components/PanelExplain';
import './globals.css';

export const metadata: Metadata = { title: 'DAYLIGHT / DOMINO', description: 'Explore infrastructure and emergency response in the fictional Hollow district.' };
export const viewport: Viewport = { themeColor: '#101714' };

export default async function RootLayout({ children }: { readonly children: ReactNode }) {
  const user = await currentUser();
  return <html lang="en"><body>
    <a className="skip-link" href="#main-content">Skip to content</a>
    <header className="site-head"><nav className="shell topbar" aria-label="Main navigation">
      <Link href="/" className="brand"><Layers3 aria-hidden="true" /> DAYLIGHT</Link>
      <div className="nav-actions">
        {user ? <><Link href="/domino">Simulator</Link><span className="operator">{user.name}</span><form action={signOut}><button className="quiet"><LogOut size={15} /> Sign out</button></form></>
          : <><Link href="/auth/login">Sign in</Link><Link className="outline-link" href="/auth/signup">Create account</Link></>}
      </div>
    </nav></header><AdvisorProvider available={Boolean(user)}>{children}</AdvisorProvider>
  </body></html>;
}
