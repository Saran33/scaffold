import type { UserInfo } from 'next-auth';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';

/**
 * Hook for required authentication - redirects to login if not authenticated
 * Use this in components that require the user to be logged in
 */
export function useAuth() {
  const { data: session, status, update } = useSession();

  useEffect(() => {
    if (status === 'loading' || !session) {
      void update();
    }
  }, [session, status, update]);

  const user = session?.user as UserInfo;
  const accessToken = session?.accessToken as string;

  if (status !== 'loading' && (!session || !user || !accessToken)) {
    const redirectUrl = '/login';
    const from = `?from=${encodeURIComponent(window.location.pathname)}`;
    redirect(`${redirectUrl}${from}`);
  }

  return { session, user, accessToken, update };
}

/**
 * Hook for optional authentication - does not redirect if not authenticated
 * Use this in components that work for both authenticated and unauthenticated users
 */
export function useOptionalAuth() {
  const { data: session, status, update } = useSession();

  useEffect(() => {
    if (status === 'loading' || !session) {
      void update();
    }
  }, [session, status, update]);

  const user = session?.user as UserInfo | undefined;
  const accessToken = session?.accessToken;

  return { session, user, accessToken, update, status };
}
