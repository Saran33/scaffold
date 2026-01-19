'use client';

import { type ErrorResponse, isErrorResponse } from '@/lib/errors';

import { useEffect } from 'react';

import { cn } from '@/lib/utils/utils';
import { buttonVariants } from '@/components/ui/button';

import { toast } from '@/components/ui/use-toast';

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard Error Boundary:', error.message);
    if (isErrorResponse(error)) {
      const errorData: ErrorResponse = JSON.parse(error.message);
      toast({
        title: `${errorData.status.toString()} Error Response`,
        description: errorData.detail,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Something went wrong.',
        description: error.message,
        variant: 'destructive',
      });
    }
  }, [error]);

  return (
    <div className="grid place-items-center justify-center space-y-2 pt-10">
      <h2 className="text-center">Something went wrong</h2>
      <button className={cn(buttonVariants())} onClick={() => reset()}>
        Try again
      </button>
    </div>
  );
}
