import { type NextRequest, NextResponse } from 'next/server';

/**
 * Converts a Next.js matcher pattern (e.g. `/app/:path*`) into a RegExp that
 * tests whether a request path falls under it. `:param*` matches the segment
 * and any nested sub-path; `:param` matches a single segment.
 */
function patternToRegExp(pattern: string): RegExp {
  const source = pattern
    .replace(/\/:[^/]+\*/g, '(?:/.*)?')
    .replace(/\/:[^/]+/g, '/[^/]+');
  return new RegExp(`^${source}$`);
}

export class ScopeValidator {
  private pathScopes: { [key: string]: string[] };

  constructor(pathScopes: { [key: string]: string[] }) {
    this.pathScopes = pathScopes;
  }

  isAuthorized(scopes: string[] | undefined, path: string): boolean {
    const pattern = Object.keys(this.pathScopes).find(p =>
      patternToRegExp(p).test(path)
    );

    if (!pattern) {
      // No scopes are configured for this path.
      return true;
    }
    return this.pathScopes[pattern].every(scope => scopes?.includes(scope));
  }
}

export function redirectWithQuery(req: NextRequest, destination: string) {
  let from = req.nextUrl.pathname;
  if (req.nextUrl.search) from += req.nextUrl.search;
  // if the destination contains a query string, append the from query
  if (destination.includes('?')) {
    destination += `&from=${encodeURIComponent(from)}`;
  } else {
    destination += `?from=${encodeURIComponent(from)}`;
  }
  return NextResponse.redirect(new URL(destination, req.url));
}
