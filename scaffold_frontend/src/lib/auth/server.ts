import 'server-only';

import type { Profile, User } from 'next-auth';
import type { TokenSet } from '@auth/core/types';
import type { UserProfile } from '@/types/user';

import userApi from '@/api/user-api';
import { ErrorResponse } from '@/lib/errors';
import { parseBoolean } from '@/lib/utils/utils';
import { signJWT } from '@/lib/utils/auth/server';

/**
 * Sign a JWT and exchange it for an access token from the API server.
 * @param profile - The user's OIDC profile
 * @returns An access token from the API server
 */
async function getAccessTokenForExternalIdpProfile(profile: Partial<Profile>) {
  const tempJWT = signJWT(profile);
  const accessToken = await userApi.exchangeToken(tempJWT);
  if (!accessToken) {
    throw new Error('Authentication failed');
  }
  return accessToken;
}

export async function refreshAccessToken(accessToken: string) {
  const newAccessToken = await userApi.exchangeToken(accessToken);
  if (!newAccessToken) {
    throw new Error('Token refresh failed');
  }
  return newAccessToken;
}

/**
 * Get or create user details in the db from an external IDP profile.
 * @param profile - The user's OIDC profile
 * @param tokens - The user's NextAuth tokens
 * @returns The user from the db, whether they are active, and their access token
 */
export async function getUserDetails(profile: Profile, tokens?: TokenSet) {
  console.debug('PROFILE:', profile);
  if (!profile?.email) {
    return { user: undefined, isActive: false, accessToken: '' };
  }

  const accessToken = await getAccessTokenForExternalIdpProfile(profile);
  let user;
  let isActive = false;

  try {
    user = await userApi.getMe(accessToken);
  } catch (error) {
    if (error instanceof ErrorResponse) {
      if (error.status === 403 && error.detail === 'Email not verified') {
        console.debug(error.status, error.detail);
        isActive = true;
      } else if (error.status === 400 && error.detail === 'Inactive user') {
        console.debug(error.status, error.detail);
      }
    } else {
      throw error;
    }
  }

  return { user, isActive, accessToken };
}

/**
 * Merge the user's details from the db and the external IDP for the session.
 * Send an email to verify the user's email if it is unverified and provided.
 * @param user - The user from the db
 * @param profile - The user's OIDC profile
 * @param isActive - Whether the user is active
 * @param accessToken - The user's access token
 * @returns The user profile for inclusion in the NextAuth session
 */
export async function handleUserProfile(
  user: UserProfile | undefined,
  profile: Profile,
  isActive: boolean,
  accessToken: string
): Promise<User> {
  if (!profile.sub) {
    throw new Error('Missing sub in profile');
  }
  const emailVerified =
    user?.emailVerified || parseBoolean(profile.email_verified) || false;
  if (!emailVerified && profile.email) {
    try {
      const res = await userApi.requestEmailVerificationEmail(profile.email);
      // console.log(res.data.msg);
    } catch (error) {
      console.error('Error requesting email verification:', error);
      throw error;
    }
  }
  if (user) {
    return {
      // id is being overridden by the Oauth provider id
      // so we are using user_id instead and setting it in the JWT callback
      user_id: user.id.toString(),
      sub: profile.sub,
      email: user.email,
      name: user.fullName ?? null,
      nickname: user.nickname ?? null,
      image: user.image ?? null,
      locale: user.locale ?? null,
      active: user.active,
      emailVerified: emailVerified,
      role: user.role || 'user',
      accessToken,
    };
  } else {
    return {
      user_id: profile.sub,
      sub: profile.sub,
      email: profile.email ?? '',
      name: profile.name ?? null,
      nickname: profile.nickname ?? null,
      image: profile.picture ?? null,
      locale: profile.locale ?? null,
      active: isActive,
      emailVerified: emailVerified,
      role: 'user',
      accessToken,
    };
  }
}
