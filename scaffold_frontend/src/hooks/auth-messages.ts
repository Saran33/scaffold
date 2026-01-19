import type { ClientSafeProviders } from '@/types/auth';
import { useMemo } from 'react';

export function useAuthMessages(providers: ClientSafeProviders) {
  const providerKeys = Object.keys(providers);
  const hasCredentials = providerKeys.includes('credentials');
  const hasMultipleProviders = providerKeys.length > 1;

  const authMessage = useMemo(() => {
    if (!hasCredentials && hasMultipleProviders) {
      return 'Sign in with your preferred identity provider';
    } else {
      return 'Enter your email to sign in to your account';
    }
  }, [hasCredentials, hasMultipleProviders]);

  const continueMessage = hasCredentials ? 'OR CONTINUE WITH' : 'CONTINUE WITH';

  const signUpMessage = useMemo(() => {
    if (!hasCredentials && hasMultipleProviders) {
      return 'Sign up with your preferred identity provider';
    } else {
      return 'Enter your email below to create your account';
    }
  }, [hasCredentials, hasMultipleProviders]);

  return { authMessage, continueMessage, signUpMessage };
}
