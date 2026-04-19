/**
 * safeNavigate — wraps Next.js router.push() with a reliable fallback.
 *
 * Background: Next.js 15/16 + Turbopack has a dev-mode bug where
 * router.push() causes "Cannot read properties of null (reading 'dispatchEvent')"
 * via History.pushState. This utility catches that error and falls back to a
 * native browser navigation (window.location.href) which is always reliable.
 *
 * In production the try-block succeeds and we keep SPA benefits.
 * In dev with Turbopack the catch-block handles the crash gracefully.
 */

import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

export function safeNavigate(router: AppRouterInstance, url: string): void {
  try {
    router.push(url);
  } catch {
    window.location.href = url;
  }
}

/**
 * Hook-free version — use when you don't have router in scope.
 * Works anywhere including outside React components.
 */
export function navigate(url: string): void {
  window.location.href = url;
}
