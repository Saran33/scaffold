import type { Metadata } from 'next';
import { Suspense } from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import { PasswordResetForm } from '@/components/password-reset-form';

export const metadata: Metadata = {
  title: 'Reset Password',
  description: 'Request a password reset link',
};

export default function ResetPasswordPage() {
  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <Suspense fallback={<Skeleton className="flex-1 overflow-auto" />}>
          <PasswordResetForm />
        </Suspense>
      </div>
    </div>
  );
}
