'use client';

import { useCallback, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

import {
  isErrorResponse,
  isUnauthorizedError,
  parseErrorResponse,
} from '@/lib/errors';
import { cn, redirectWithQuery } from '@/lib/utils/utils';
import { buttonVariants } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleUnauthorized = useCallback(() => {
    const params = searchParams.toString();
    const destination = redirectWithQuery(
      '/login?signInAgain=true',
      pathname,
      params ? `?${params}` : ''
    );
    router.push(destination);
  }, [router, pathname, searchParams]);

  useEffect(() => {
    if (isUnauthorizedError(error)) {
      console.log('Redirecting to login due to unauthorized error');
      handleUnauthorized();
      return;
    }

    if (isErrorResponse(error)) {
      const errorData = parseErrorResponse(error.message);
      if (errorData) {
        toast({
          title: `${errorData.status} Error`,
          description: errorData.detail,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      }
    } else {
      toast({
        title: 'Something went wrong',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  }, [error, handleUnauthorized]);

  // Don't render anything for unauthorized errors since we're redirecting
  if (isUnauthorizedError(error)) {
    return null;
  }

  return (
    <div className="absolute inset-0 flex flex-col place-items-center justify-center space-y-2 pb-12">
      <h2 className="text-center">Something went wrong</h2>
      <button className={cn(buttonVariants())} onClick={() => reset()}>
        Try again
      </button>
    </div>
  );
}
