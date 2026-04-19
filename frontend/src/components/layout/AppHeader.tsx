'use client';

import { usePathname } from 'next/navigation';
import Header from './Header';

/**
 * AppHeader — renders the public site header on all pages EXCEPT
 * dashboard, admin, and auth-redirect routes which have their own layouts.
 */
export default function AppHeader() {
  const pathname = usePathname();

  // Skip the public header on these route prefixes
  const hiddenPrefixes = [
    '/dashboard',
    '/admin',
  ];

  const shouldHide = hiddenPrefixes.some(prefix => pathname?.startsWith(prefix));

  if (shouldHide) return null;

  return <Header />;
}
