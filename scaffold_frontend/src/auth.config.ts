import type { NextAuthConfig, User, Session } from 'next-auth';

import { env } from '@/env/server.mjs';
import {
  getSecurityScopes,
  updateScopes,
  getTokenExp,
} from '@/lib/utils/auth/client';
import { refreshAccessToken } from '@/lib/auth/server';

export const authConfig = {
  session: {
    strategy: 'jwt',
  },
  secret: env.NEXTAUTH_SECRET,
  pages: {
    signIn: `${env.NEXT_PUBLIC_APP_URL}/login`,
  },
  debug: true,
  trustHost: true,
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      // console.debug('SIGN-IN callback');
      // console.debug('account', account);
      if (user.active && user.emailVerified) {
        // console.debug('SIGN-IN callback success');
        return true;
      } else if (!user.email) {
        // console.debug('No email in user profile');
        return `${env.NEXT_PUBLIC_APP_URL}/login?error=No+email+in+profile`;
      } else if (!user.active) {
        // console.debug(`User ${user.email} not active`);
        return `${env.NEXT_PUBLIC_APP_URL}/login?error=Account+not+active`;
      } else if (!user.emailVerified) {
        // console.debug(`Email ${user.email} not verified`);
        return `${env.NEXT_PUBLIC_APP_URL}/login?error=Email+not+verified`;
      } else {
        // console.debug('SIGN-IN FAILED:', user);
        return false;
      }
    },
    async authorized({ auth, request: { nextUrl } }) {
      return !!auth?.user;
    },
    async jwt({ token, user, account, trigger, session }) {
      if (user) {
        const { accessToken, ...userinfo } = user;
        token.accessToken = accessToken;
        token.exp = getTokenExp(accessToken!);
        token.user = userinfo as User;
        // auth.js v5 is not respecting the user.id we are setting in the profile cb result
        // it is being overridden by the Oauth provider id
        token.user.id = userinfo.user_id;
        delete token.user.user_id;
        if (account) {
          token.provider = account?.provider;
        }
        token.scopes = getSecurityScopes(accessToken);
      }

      // TODO: Add a token refresh mechanism at the fastAPI backend and here
      // https://authjs.dev/guides/refresh-token-rotation
      if (token.exp < Math.floor(Date.now() / 1000)) {
        // console.log('access_token_expired');
        return {
          ...token,
          error: 'RefreshAccessTokenError',
        };
      } else if (token.error && token.error === 'RefreshAccessTokenError') {
        // console.log('access_token_refreshed');
        delete token.error;
      }

      if (trigger === 'update') {
        // console.debug('JWT_update_trigger');
        if (session.userUpdate) {
          token.user = {
            ...token.user,
            ...session.userUpdate,
          };
        }
        if (session.scopesUpdate) {
          token.scopes = updateScopes(
            (token.scopes as string[] | undefined) || [],
            session.scopesUpdate
          );
          // console.log('session.scopesUpdate:', session.scopesUpdate);
          // console.log('new token.scopes:', token.scopes);
          const newAccessToken = await refreshAccessToken(
            token.accessToken as string
          );
          token.accessToken = newAccessToken;
        }
      }
      return token;
    },
    async session({ session, token }) {
      const _session: Session = session;
      if (token) {
        if (session) {
          _session.provider = token.provider;
          _session.accessToken = token.accessToken;
          _session.scopes = token.scopes;
          _session.user = token.user;
          _session.error = token.error;
          _session.expires = new Date(token.exp * 1000).toISOString();
        }
      }
      return _session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
