import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public landing page (/), auth pages, and static assets
  if (
    pathname === '/' ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Check for authenticated session cookie on protected workspace routes (/jira/...)
  const sessionCookie = request.cookies.get('spyrobo_session')?.value;

  if (!sessionCookie && pathname.startsWith('/jira')) {
    // Redirect unauthenticated visitors trying to access Jira workspace to login page
    const loginUrl = new URL(`/auth/login?redirect=${encodeURIComponent(pathname)}`, request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api/auth|auth|_next/static|_next/image|favicon.ico).*)',
  ],
};
