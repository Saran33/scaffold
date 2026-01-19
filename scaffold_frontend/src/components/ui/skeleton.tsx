import { cn } from '@/lib/utils/utils';

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      // className={cn('animate-pulse rounded-md bg-muted', className)}
      className={cn('animate-pulse bg-muted opacity-20', className)}
      {...props}
    />
  );
}

export { Skeleton };
