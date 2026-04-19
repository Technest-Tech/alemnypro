import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ─── Route Groups ─────────────────────────────────────────────────────────────

/** Pages that should redirect to dashboard if user IS logged in */
const AUTH_ROUTES = [
  '/auth/login',
  '/auth/register',
  '/auth/tutor-register',
];

/** Pages that require authentication (redirect to login if NOT logged in) */
const PROTECTED_PREFIXES = [
  '/dashboard/tutor',
  '/dashboard/student',
  '/admin',
];

/** Role-to-home mapping */
const ROLE_HOME: Record<string, string> = {
  tutor:   '/dashboard/tutor',
  student: '/dashboard/student',
  admin:   '/admin',
};

// ─── Middleware ───────────────────────────────────────────────────────────────

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Read the token from cookies (set by the app after login)
  const token    = request.cookies.get('alemnypro_token')?.value;
  const userJson = request.cookies.get('alemnypro_user')?.value;

  const isLoggedIn = !!token;
  let userRole: string | null = null;

  if (userJson) {
    try {
      const parsed = JSON.parse(decodeURIComponent(userJson));
      userRole = parsed?.role ?? null;
    } catch {
      // malformed cookie — treat as logged out
    }
  }

  // ── 1. Auth pages: redirect logged-in users to their dashboard ──────────────
  const isAuthPage = AUTH_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'));
  // Allow students to access /auth/tutor-register for the upgrade flow
  const isUpgradePage = pathname === '/auth/tutor-register';
  if (isAuthPage && isLoggedIn && userRole && !(isUpgradePage && userRole === 'student')) {
    const home = ROLE_HOME[userRole] ?? '/';
    return NextResponse.redirect(new URL(home, request.url));
  }

  // ── 2. Protected pages: redirect unauthenticated users to login ─────────────
  const isProtected = PROTECTED_PREFIXES.some(p => pathname.startsWith(p));
  if (isProtected && !isLoggedIn) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── 3. Role-based dashboard guard ───────────────────────────────────────────
  // Prevent a student from accessing /dashboard/tutor and vice-versa
  if (isLoggedIn && userRole) {
    if (pathname.startsWith('/dashboard/tutor') && userRole !== 'tutor' && userRole !== 'admin') {
      return NextResponse.redirect(new URL(ROLE_HOME[userRole] ?? '/', request.url));
    }
    if (pathname.startsWith('/dashboard/student') && userRole !== 'student' && userRole !== 'admin') {
      return NextResponse.redirect(new URL(ROLE_HOME[userRole] ?? '/', request.url));
    }
    if (pathname.startsWith('/admin') && userRole !== 'admin') {
      return NextResponse.redirect(new URL(ROLE_HOME[userRole] ?? '/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public files (images, fonts etc.)
     * - API routes
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|otf|css|js)|api/).*)',
  ],
};
