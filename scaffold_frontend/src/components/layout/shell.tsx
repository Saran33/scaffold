import * as React from 'react';

import { cn } from '@/lib/utils/utils';

type DashboardShellProps = React.HTMLAttributes<HTMLDivElement>;

export function DashboardShell({
  children,
  className,
  ...props
}: DashboardShellProps) {
  return (
    <div className={cn('grid min-w-0 items-start gap-8', className)} {...props}>
      {children}
    </div>
  );
}
