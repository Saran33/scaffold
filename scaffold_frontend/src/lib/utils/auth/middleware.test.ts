import { describe, it, expect, vi } from 'vitest';

// ScopeValidator itself does not touch next/server; stub it so the unit test
// stays hermetic and independent of the Next runtime.
vi.mock('next/server', () => ({
  NextResponse: { redirect: () => ({}) },
}));

import { ScopeValidator } from './middleware';

describe('ScopeValidator.isAuthorized', () => {
  const validator = new ScopeValidator({ '/app/:path*': ['access'] });

  it('authorises a protected sub-path when the user holds the scope', () => {
    expect(validator.isAuthorized(['access'], '/app/dashboard')).toBe(true);
    expect(validator.isAuthorized(['access', 'me'], '/app/a/b/c')).toBe(true);
  });

  it('enforces the required scope on protected paths', () => {
    // Regression guard: the inverted match previously authorised everyone,
    // silently bypassing the `access` scope on every /app path.
    expect(validator.isAuthorized([], '/app/dashboard')).toBe(false);
    expect(validator.isAuthorized(['other'], '/app/dashboard')).toBe(false);
    expect(validator.isAuthorized(undefined, '/app/dashboard')).toBe(false);
  });

  it('matches the base of a :path* pattern', () => {
    expect(validator.isAuthorized(['access'], '/app')).toBe(true);
    expect(validator.isAuthorized([], '/app')).toBe(false);
  });

  it('allows paths that have no configured scope requirement', () => {
    expect(validator.isAuthorized(undefined, '/public')).toBe(true);
    expect(validator.isAuthorized([], '/')).toBe(true);
    // A partial prefix that is not actually under /app must not match.
    expect(validator.isAuthorized([], '/application')).toBe(true);
  });
});
