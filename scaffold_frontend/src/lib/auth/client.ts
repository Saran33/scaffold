import { type User } from 'next-auth';
import { getSession, signOut } from 'next-auth/react';

async function getCurrentUserClient() {
  const session = await getSession();
  return session?.user;
}

export async function logout() {
  const session = await getSession();
  if (!session) {
    return;
  }
  await signOut({
    callbackUrl: `${window.location.origin}/login?logoutSuccess=true`,
  });
}

export function getBaseAuthProvider(provider: string, user?: Partial<User>) {
  return provider === 'credentials' ? 'credentials' : 'oauth2';
}
