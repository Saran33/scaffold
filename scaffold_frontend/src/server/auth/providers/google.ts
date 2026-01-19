import type { User } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { env } from '@/env/server.mjs';
import { getUserDetails, handleUserProfile } from '@/lib/auth/server';

const googleProvider = GoogleProvider({
  clientId: env.GOOGLE_CLIENT_ID,
  clientSecret: env.GOOGLE_CLIENT_SECRET,

  async profile(profile, tokens): Promise<User> {
    const { user, isActive, accessToken } = await getUserDetails(
      profile,
      tokens
    );
    const sessionUser = await handleUserProfile(
      user,
      profile,
      isActive,
      accessToken
    );
    console.debug('SESSION_USER:', sessionUser);
    return sessionUser;
  },
});

export default googleProvider;
