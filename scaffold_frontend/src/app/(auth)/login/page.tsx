import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';

import { authProviders } from '@/auth';
import { cn } from '@/lib/utils/utils';
// import { AuthAnalytics } from '@/lib/analytics/auth';

import { buttonVariants } from '@/components/ui/button';
import { Icons } from '@/components/ui/icons';
import { UserAuthForm } from '@/components/user-auth-form';
import { UserAuthHeading } from '@/components/user-auth-heading';
import { UserAuthFormFooter } from '@/components/user-auth-form-footer';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata: Metadata = {
  title: 'Login',
  description: 'Login to your account',
};

export default async function LoginPage() {
  const providers = authProviders;
  if (!providers) {
    throw new Error('Providers not found');
  }

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <Link
        href="/"
        className={cn(
          buttonVariants({ variant: 'ghost' }),
          'absolute left-4 top-4 md:left-8 md:top-8'
        )}
        // onClick={() => AuthAnalytics.clickBackButton('login')}
      >
        <>
          <Icons.chevronLeft className="mr-2 size-4" />
          Back
        </>
      </Link>
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <Suspense fallback={<div className="flex-1 overflow-auto" />}>
          <UserAuthHeading mode="login" providers={providers} />
        </Suspense>
        <Suspense fallback={<Skeleton className="flex-1 overflow-auto" />}>
          <UserAuthForm mode="login" providers={providers} />
        </Suspense>
      </div>
      <UserAuthFormFooter mode="login" />
    </div>
  );
}
