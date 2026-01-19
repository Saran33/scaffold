import type { DefaultSession } from 'next-auth';
import type { ClientSafeProvider } from 'next-auth/lib/client';
import type { BuiltInProviderType } from 'next-auth/providers';
import type { LiteralUnion } from 'next-auth/react';

declare module 'next-auth' {
  interface Profile {
    // the fields we require from the profile
    name?: string | null;
    nickname?: string | null;
    locale?: string | null;
    email_verified?: boolean | null;
  }
  interface User {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    // Added fields
    user_id?: string;
    sub: string;
    role: string;
    nickname?: string | null;
    locale?: string | null;
    active: boolean;
    emailVerified: boolean;
    accessToken?: string;
  }
  interface UserInfo {
    id: string;
    sub: string;
    email: string;
    name?: string | null;
    image?: string | null;
    role: string;
    nickname?: string | null;
    locale?: string | null;
    active: boolean;
    emailVerified: boolean;
    accessToken?: string;
  }
  interface Session extends DefaultSession {
    user: User;
    provider: string;
    accessToken?: string;
    scopes: string[];
    error?: string;
    scopesUpdate?: { add?: string[]; remove?: string[] };
  }
}

import type { User } from 'next-auth';
import type { DefaultJWT } from 'next-auth/jwt';

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    user: User;
    provider: string;
    scopes: string[];
    accessToken?: string;
    error?: string;
    exp: number;
  }
}

export type ClientSafeProviders = Record<
  LiteralUnion<BuiltInProviderType>,
  ClientSafeProvider
>;
