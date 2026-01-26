import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ADMIN_COOKIE_NAME = 'diyshows_admin_session';

// Routes that require admin authentication
const PROTECTED_PATHS = [
  '/admin',
  '/api/admin/staged',
  '/api/admin/discovery',
];

// Routes that should NOT be protected (allow access for login)
const EXCLUDED_PATHS = [
  '/admin/login',
  '/api/admin/auth',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if this is a protected admin route
  const isProtectedPath = PROTECTED_PATHS.some(path => pathname.startsWith(path));
  const isExcludedPath = EXCLUDED_PATHS.some(path => pathname.startsWith(path));

  // If not a protected path, or is excluded, allow through
  if (!isProtectedPath || isExcludedPath) {
    return NextResponse.next();
  }

  // Check for admin session cookie
  const adminSession = request.cookies.get(ADMIN_COOKIE_NAME);

  if (!adminSession?.value) {
    // No session - redirect to login page (for pages) or return 401 (for API)
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Admin authentication required' },
        { status: 401 }
      );
    }

    // Redirect to login page with return URL
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('returnTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Session exists - allow through
  return NextResponse.next();
}

// Configure which routes the middleware runs on
export const config = {
  matcher: [
    // Match all admin routes
    '/admin/:path*',
    '/api/admin/:path*',
  ],
};
