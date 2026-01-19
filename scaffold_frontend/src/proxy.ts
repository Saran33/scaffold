import { NextResponse } from 'next/server';

import NextAuth from 'next-auth';
import { authConfig } from '@/auth.config';
import { HOME_URL } from '@/config/site';
import { ScopeValidator, redirectWithQuery } from '@/lib/utils/auth/middleware';

const scopeValidator = new ScopeValidator({
  '/app/:path*': ['access'],
});

const auth = NextAuth(authConfig).auth;

export default auth(async req => {
  const pathname = req.nextUrl.pathname;

  const authenticated = !!req.auth;
  const isTokenExpired =
    (req.auth?.expires && new Date(req.auth.expires) < new Date()) ||
    req.nextUrl.searchParams.has('signInAgain');

  // Handle authenticated redirects from auth pages
  if (pathname.startsWith('/login') || pathname.startsWith('/register')) {
    if (authenticated && !isTokenExpired) {
      // Check for redirect parameter and use it, otherwise default to HOME_URL
      const from = req.nextUrl.searchParams.get('from');
      const redirectTo = from || HOME_URL;
      return NextResponse.redirect(new URL(redirectTo, req.url));
    }
    return NextResponse.next();
  }

  // Handle unauthenticated access
  if (!authenticated) return redirectWithQuery(req, '/login');
  if (isTokenExpired) return redirectWithQuery(req, '/login?signInAgain=true');

  const scopes = req.auth?.scopes ?? [];
  const isAuthorized = scopeValidator.isAuthorized(scopes, pathname);

  // handle authorized redirects from signup page
  if (pathname.startsWith('/signup')) {
    if (isAuthorized) return NextResponse.redirect(new URL(HOME_URL, req.url));
    return NextResponse.next();
  }

  // Check if path requires specific scopes
  if (!isAuthorized) {
    return NextResponse.redirect(new URL('/signup', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/app/:path*',
    '/login',
    '/register',
    '/docs/:path*',
    '/guides/:path*',
  ],
};
