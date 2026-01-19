import type { User, Profile } from 'next-auth';
import AppleProvider, {
  type AppleNonConformUser,
} from 'next-auth/providers/apple';
import { env } from '@/env/server.mjs';
import { getUserDetails, handleUserProfile } from '@/lib/auth/server';
import { parseBoolean } from '@/lib/utils/utils';

const appleProvider = AppleProvider({
  clientId: env.APPLE_CLIENT_ID || '',
  clientSecret: env.APPLE_CLIENT_SECRET || '',

  async profile(profile, tokens): Promise<User> {
    const standardProfile: Profile = {
      ...profile,
      name: extractAppleUserName(profile),
      email_verified: parseBoolean(profile.email_verified) || false,
    };

    const { user, isActive, accessToken } = await getUserDetails(
      standardProfile,
      tokens
    );
    const sessionUser = await handleUserProfile(
      user,
      standardProfile,
      isActive,
      accessToken
    );
    return sessionUser;
  },
});

export default appleProvider;

/**
 * Extracts and formats the user's name from an Apple profile
 * @param profile Profile object that may contain an Apple user
 * @returns Formatted name string or undefined if no name data exists
 */
function extractAppleUserName(profile: {
  user?: AppleNonConformUser;
}): string | undefined {
  if (!profile.user?.name) {
    return undefined;
  }
  const { firstName, lastName } = profile.user.name;
  if (firstName && lastName) {
    return `${firstName} ${lastName}`.trim();
  }
  return firstName || lastName;
}
