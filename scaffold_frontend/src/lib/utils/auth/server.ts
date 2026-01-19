import 'server-only';

import type { Profile } from 'next-auth';

import { sign } from 'jsonwebtoken';
import { env } from '@/env/server.mjs';
import { generateKidFromPublicKey, sha256Hash } from '@/lib/utils/crypto';

/**
 * Signs a new JWT for a user with their email and additional profile information.
 * @param profile - The user's profile information.
 * @returns The signed JWT.
 */
export function signJWT(profile: Partial<Profile>) {
  const tokenPayload = {
    email: profile.email,
    name: profile.name,
    image: profile.image ?? profile.picture,
    givenName: profile.given_name,
    familyName: profile.family_name,
    emailVerified: profile.email_verified ?? false,
    locale: profile.locale,
    iat: Math.floor(Date.now() / 1000),
    iss: `${env.NEXTAUTH_URL}/`,
  };

  const kid = generateKidFromPublicKey(env.RSA_PUBLIC_KEY);

  return sign(tokenPayload, env.RSA_PRIVATE_KEY, {
    algorithm: 'RS256',
    expiresIn: '5m',
    header: {
      kid: kid,
      typ: 'JWT',
      alg: 'RS256',
    },
  });
}

/**
 * Generates a cache revalidation token using SHA-256
 * @returns The revalidation token as a hex string
 */
export async function getCacheRevalidationToken(): Promise<string> {
  const hash = await sha256Hash(env.NEXTAUTH_SECRET + ':revalidate');
  return hash.slice(0, 32);
}
