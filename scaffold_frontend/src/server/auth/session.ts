'use server';

import type { UserInfo } from 'next-auth';
import { signInRedirectSchema } from '@/lib/validations/auth';

import { redirect } from 'next/navigation';
import { AuthError } from 'next-auth';

import { authConfig } from '@/auth.config';
import { auth, signIn, signOut } from '@/auth';
import { HOME_URL } from '@/config/site';
import { env } from '@/env/server.mjs';
import { userAuthSchemaServer } from '@/lib/validations/auth';

export async function getServerAuth() {
  const session = await auth();
  const user = session?.user as UserInfo | undefined;
  const accessToken = session?.accessToken;
  return { session, user, accessToken };
}

export async function getAuth(nextUrl?: string) {
  const { session, user, accessToken } = await getServerAuth();
  if (!session || !user || !accessToken) {
    const redirectUrl = authConfig?.pages?.signIn || '/login';
    const next = nextUrl ? `?next=${nextUrl}` : '';
    redirect(`${redirectUrl}${next}`);
  }

  return { session, user, accessToken };
}

export async function getCurrentUser(): Promise<UserInfo> {
  const { user } = await getAuth();
  return user;
}

export async function getAccessToken() {
  const { accessToken } = await getAuth();
  return accessToken;
}

type signInFormState = {
  url?: string;
  error: string;
  fields?: Record<string, string>;
};
export async function signInCredentials(
  prevState: signInFormState | undefined,
  data: FormData
): Promise<signInFormState | undefined> {
  const { from, ...formData } = Object.fromEntries(data);

  let redirectTo = null;
  if (from) {
    const parsedRediectTo = from
      ? await signInRedirectSchema.safeParseAsync(from)
      : null;
    if (!parsedRediectTo?.success) {
      return {
        error: `Invalid redirect URL: ${parsedRediectTo?.data}`,
      };
    }
    redirectTo = parsedRediectTo?.data ?? null;
  }

  const parsed = await userAuthSchemaServer.safeParseAsync(formData);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const key of Object.keys(formData)) {
      const value = formData[key];
      fields[key] = typeof value === 'string' ? value : JSON.stringify(value);
    }
    return {
      error: 'Invalid email or password.',
      fields,
    };
  }

  try {
    const url = await signIn('credentials', {
      email: parsed.data.email.toLowerCase(),
      password: parsed.data.password,
      redirectTo: redirectTo || HOME_URL,
      redirect: false,
    });
    return { url, error: '' };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return { error: 'Invalid email or password.' };
        default:
          return { error: 'Something went wrong.' };
      }
    }
    throw error;
  }
}

export async function signInProvider(
  provider: string,
  redirectTo?: string | null
) {
  return await signIn(provider, {
    redirectTo: redirectTo || HOME_URL,
  });
}

export async function logout({
  nextUrl,
  queryParams = { logoutSuccess: 'true' },
}: {
  nextUrl?: string;
  queryParams?: Record<string, string>;
} = {}) {
  const session = await auth();
  if (!session) {
    return;
  }
  const queryString = new URLSearchParams(queryParams).toString();

  const redirectToBase = `${env.NEXT_PUBLIC_APP_URL}/login?${queryString}`;
  const redirectTo = nextUrl
    ? `${redirectToBase}&next=${encodeURIComponent(nextUrl)}`
    : redirectToBase;

  await signOut({ redirectTo });
}
