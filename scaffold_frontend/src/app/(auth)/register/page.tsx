import Link from 'next/link';
import { Suspense } from 'react';

import { cn } from '@/lib/utils/utils';
import { authProviders } from '@/auth';
// import { AuthAnalytics } from '@/lib/analytics/auth';

import { buttonVariants } from '@/components/ui/button';
import { UserAuthForm } from '@/components/user-auth-form';
import { UserAuthHeading } from '@/components/user-auth-heading';
import { UserAuthFormFooter } from '@/components/user-auth-form-footer';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = {
  title: 'Create an account',
  description: 'Create an account to get started.',
};

export default async function RegisterPage() {
  const providers = authProviders;
  if (!providers) {
    throw new Error('Providers not found');
  }

  return (
    <div className="container grid h-screen w-screen flex-col items-center justify-center lg:max-w-none lg:grid-cols-2 lg:px-0">
      <Link
        href="/login"
        className={cn(
          buttonVariants({ variant: 'ghost' }),
          'absolute right-4 top-4 z-10 md:right-8 md:top-8'
        )}
        // onClick={AuthAnalytics.clickLoginFromRegister}
      >
        Login
      </Link>
      <div
        className="relative hidden h-full bg-cover bg-no-repeat lg:block"
        style={{
          backgroundImage: "url('/Eleutheria_logo_initial.jpeg')",
          backgroundPosition: 'center',
          backgroundSize: '80%',
        }}
      >
        <div className="absolute inset-0 z-0 bg-black opacity-0 dark:opacity-60"></div>
      </div>
      <div className="z-10 lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <Suspense fallback={<div className="flex-1 overflow-auto" />}>
            <UserAuthHeading mode="register" providers={providers} />
          </Suspense>
          <Suspense fallback={<Skeleton className="flex-1 overflow-auto" />}>
            <UserAuthForm mode="register" providers={providers} />
          </Suspense>
          <UserAuthFormFooter mode="register" />
        </div>
      </div>
    </div>
  );
}
