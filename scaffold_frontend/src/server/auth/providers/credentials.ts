import type { User } from 'next-auth';
import type { UserProfile } from '@/types/user';

import { CredentialsError } from '@/lib/errors';
import Credentials from 'next-auth/providers/credentials';
import userApi from '@/api/user-api';
import { isErrorResponse } from '@/lib/errors';

const credentialsProvider = Credentials({
  id: 'credentials',
  name: 'Credentials',
  credentials: {
    email: { label: 'Email', type: 'text', placeholder: 'email address' },
    password: { label: 'Password', type: 'password' },
  },
  async authorize(credentials): Promise<User | null> {
    if (!credentials?.email || !credentials?.password) {
      throw new Error('No credentials provided');
    }
    let accessToken: string;
    let user: UserProfile;
    try {
      accessToken = await userApi.getAccessToken(
        credentials.email as string,
        credentials.password as string
      );
      user = await userApi.getMe(accessToken);
    } catch (error) {
      if (isErrorResponse(error)) {
        throw new CredentialsError(error.detail);
      }
      return null;
    }

    return {
      user_id: user.id.toString(),
      sub: `fapi|${user.id}`,
      email: user.email,
      name: user.fullName ?? null,
      nickname: user.nickname ?? null,
      image: user.image ?? null,
      locale: user.locale ?? null,
      active: user.active,
      emailVerified: user.emailVerified,
      role: user.role || 'user',
      accessToken,
    };
  },
});

export default credentialsProvider;
