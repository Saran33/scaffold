'use client';

import { cn } from '@/lib/utils/utils';
import { Spinner } from '@/components/ui/spinner';

export function LoadingOverlay({
  show,
  className,
}: {
  show: boolean;
  className?: string;
}) {
  if (!show) return null;

  return (
    <div
      className={cn(
        'absolute inset-0 z-10 flex items-center justify-center bg-background/70',
        className
      )}
    >
      <Spinner className="size-6" />
      {/* <div className="size-6 animate-spin rounded-full border-2 border-muted border-t-transparent" /> */}
    </div>
  );
}
