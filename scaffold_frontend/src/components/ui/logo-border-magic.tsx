'use client';

import { Icons } from '@/components/ui/icons';

export function LogoBorderMagic() {
  return (
    <div className="relative inline-flex min-h-8 overflow-hidden rounded-2xl bg-muted text-sm font-medium dark:p-px">
      <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] dark:bg-[conic-gradient(from_90deg_at_50%_50%,#f8fafc_0%,#829c81_50%,#f8fafc_100%)]" />
      <span className="inline-flex size-full items-center justify-center rounded-2xl bg-muted px-4 py-1.5 text-sm font-medium backdrop-blur-3xl">
        <Icons.logoFull />
      </span>
    </div>
  );
}
