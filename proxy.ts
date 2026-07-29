import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicApiPaths = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/logout',
  '/api/chatbot',
  '/api/contact',
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/api')) {
    if (publicApiPaths.some(path => pathname === path)) {
      return NextResponse.next();
    }

    const sessionCookie = request.cookies.get('session');
    const isAuthenticated = !!sessionCookie?.value;

    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get('session');
  const isAuthenticated = !!sessionCookie?.value;

  const authPaths = ['/login', '/register'];
  const isAuthPage = authPaths.some(path => pathname.startsWith(path));
  const isDashboard = pathname.startsWith('/dashboard') || pathname === '/';

  if (isDashboard && !isAuthenticated) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isAuthPage && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/dashboard/:path*', '/login', '/register', '/api/:path*'],
};
