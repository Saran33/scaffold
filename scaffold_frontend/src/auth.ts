import type { ClientSafeProviders } from '@/types/auth';

import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

import { env } from '@/env/server.mjs';
import credentialsProvider from '@/server/auth/providers/credentials';
import appleProvider from '@/server/auth/providers/apple';
import googleProvider from '@/server/auth/providers/google';

const getAuthProviders = () => {
  const AUTH_FLOW = env.NEXT_PUBLIC_AUTH_FLOW;
  console.debug('AUTH_FLOW', AUTH_FLOW);
  switch (AUTH_FLOW) {
    case 'oauth2':
      return [credentialsProvider, googleProvider, appleProvider];
    default:
      return [credentialsProvider];
  }
};
const providers = getAuthProviders();

// workaround for https://github.com/nextauthjs/next-auth/issues/6171
export const authProviders = providers.reduce<ClientSafeProviders>(
  (acc, provider) => {
    acc[provider.id] = {
      id: provider.id,
      name: provider.name,
      type: provider.type,
      signinUrl: `${env.NEXT_PUBLIC_APP_URL}/api/auth/signin/${provider.id}`,
      callbackUrl: `${env.NEXT_PUBLIC_APP_URL}/api/auth/callback/${provider.id}`,
      redirectTo: `${env.NEXT_PUBLIC_APP_URL}/api/auth/callback/${provider.id}`,
    };
    return acc;
  },
  {} as ClientSafeProviders
);

export const {
  auth,
  signIn,
  signOut,
  handlers,
  unstable_update: updateSession,
} = NextAuth({
  ...authConfig,
  providers,
});
