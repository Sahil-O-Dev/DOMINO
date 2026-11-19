import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = { title: 'DOMINO', description: 'A fictional underground infrastructure failure simulator.' };
export const viewport: Viewport = { themeColor: '#101818' };

export default function RootLayout({ children }: { readonly children: ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
