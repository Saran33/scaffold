import { decodeJwtPayload } from '@/lib/utils/utils';

export function getSecurityScopes(accessToken?: string): string[] {
  if (!accessToken) {
    return [];
  }
  const payload = decodeJwtPayload(accessToken);
  const scopes = payload.scope.split(' ');
  return scopes;
}

/**
 * Updates the list of scopes by adding new scopes and removing specified scopes.
 * @param currentScopes The current list of scopes.
 * @param scopesUpdate An object containing arrays of scopes to add and remove.
 * @returns A new list of scopes after additions and removals, with no duplicates.
 */
export function updateScopes(
  currentScopes: string[],
  scopesUpdate: { add?: string[]; remove?: string[] }
): string[] {
  const scopeSet = new Set(currentScopes);

  if (scopesUpdate.add && scopesUpdate.add.length) {
    scopesUpdate.add.forEach(scope => scopeSet.add(scope));
  }
  if (scopesUpdate.remove && scopesUpdate.remove.length) {
    scopesUpdate.remove.forEach(scope => scopeSet.delete(scope));
  }
  return Array.from(scopeSet);
}

export const getTokenExp = (token: string): number => {
  const payload = decodeJwtPayload(token);
  return payload.exp;
};

export const isProUser = (scopes: string[]): boolean => scopes.includes('pro');
