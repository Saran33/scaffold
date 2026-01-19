import { type NextRequest, NextResponse } from 'next/server';
export class ScopeValidator {
  private pathScopes: { [key: string]: string[] };

  constructor(pathScopes: { [key: string]: string[] }) {
    this.pathScopes = pathScopes;
  }

  isAuthorized(scopes: string[] | undefined, path: string): boolean {
    console.log('path:', path);

    // TODO: Improve path matching
    // console.log(Object.keys(this.pathScopes));
    const pattern = Object.keys(this.pathScopes).find(p => {
      return p.includes(path);
    });

    if (!pattern) {
      // console.log('No specific scopes required for this path');
      return true;
    }
    // console.log('Scope required:', this.pathScopes[pattern]);
    // console.log('user scopes:', scopes);
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
