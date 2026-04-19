/**
 * auth.ts — centralised auth state helpers
 *
 * The middleware (Edge) reads cookies to protect routes.
 * Client-side code reads localStorage for the token/user.
 * We always write BOTH in sync so neither is stale.
 */

const TOKEN_KEY = 'alemnypro_token';
const USER_KEY  = 'alemnypro_user';
const MAX_AGE   = 60 * 60 * 24 * 7; // 7 days in seconds

// ─── Cookie helpers ───────────────────────────────────────────────────────────

function setCookie(name: string, value: string, maxAge: number) {
  // SameSite=Lax, no HttpOnly so JS can delete it on logout
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface AuthUser {
  id?: number;
  name: string;
  email: string;
  role: 'tutor' | 'student' | 'admin';
  avatar?: string;
  onboarding_status?: string;
  onboarding_step?: number;
  [key: string]: unknown;
}

/**
 * Persist auth state into BOTH localStorage (for API calls) and cookies
 * (for Next.js middleware route guards).
 */
export function saveAuth(token: string, user: AuthUser) {
  if (typeof window === 'undefined') return;

  // localStorage — used by axios interceptor
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));

  // Cookies — used by middleware (Edge runtime can't read localStorage)
  setCookie(TOKEN_KEY, token, MAX_AGE);
  setCookie(USER_KEY, JSON.stringify(user), MAX_AGE);
}

/**
 * Clear auth state from localStorage AND cookies.
 * Call this on logout or 401 response.
 */
export function clearAuth() {
  if (typeof window === 'undefined') return;

  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);

  deleteCookie(TOKEN_KEY);
  deleteCookie(USER_KEY);
}

/**
 * Read the current user from localStorage (client-side only).
 */
export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Partially update the stored user (e.g. after a role upgrade).
 * Patches both localStorage and cookies so middleware + client stay in sync.
 */
export function updateStoredUser(updates: Partial<AuthUser>) {
  if (typeof window === 'undefined') return;
  const current = getStoredUser();
  if (!current) return;
  const updated = { ...current, ...updates };
  localStorage.setItem(USER_KEY, JSON.stringify(updated));
  setCookie(USER_KEY, JSON.stringify(updated), MAX_AGE);
  // Fire event so Header and other components can re-read
  window.dispatchEvent(new Event('alemnypro-auth-change'));
}

/**
 * Resolve the correct home route for a given role.
 */
export function getRoleHome(role: string): string {
  switch (role) {
    case 'tutor':   return '/dashboard/tutor';
    case 'student': return '/dashboard/student';
    case 'admin':   return '/admin';
    default:        return '/';
  }
}
