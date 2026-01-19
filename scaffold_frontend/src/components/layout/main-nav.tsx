'use client';

import type { MainNavItem } from '@/types/config/site';

import * as React from 'react';
import Link from 'next/link';
import { useSelectedLayoutSegment } from 'next/navigation';

import { cn } from '@/lib/utils/utils';
import { Icons } from '@/components/ui/icons';
import { DropdownNav } from '@/components/layout/dropdown-nav';

interface MainNavProps {
  items?: MainNavItem[];
  children?: React.ReactNode;
  className?: string;
  menuToggleIcon?: string;
  menuToggleText?: string;
}

export function MainNav({
  items,
  children,
  className,
  menuToggleIcon,
  menuToggleText,
}: MainNavProps) {
  const segment = useSelectedLayoutSegment();

  return (
    <div className={cn(className, 'flex gap-6 sm:ml-0 md:gap-10')}>
      <Link href="/" className="hidden items-center space-x-2 md:flex">
        <Icons.logoFull />
      </Link>
      {items?.length ? (
        <nav className="hidden gap-6 md:flex">
          {items?.map((item, index) =>
            item.disabled ? (
              <button
                key={index}
                className={cn(
                  'flex cursor-not-allowed items-center text-lg font-medium text-foreground/80 opacity-75 transition-colors hover:text-foreground/60 sm:text-sm'
                )}
                disabled
              >
                {item.title}
              </button>
            ) : (
              <Link
                key={index}
                href={item.href}
                className={cn(
                  'flex items-center text-lg font-medium transition-colors hover:text-foreground/80 sm:text-sm',
                  segment && item.href.startsWith(`/${segment}`)
                    ? 'text-foreground'
                    : 'text-foreground/60'
                )}
              >
                {item.title}
              </Link>
            )
          )}
        </nav>
      ) : null}
      <DropdownNav {...{ items, children, menuToggleIcon, menuToggleText }} />
    </div>
  );
}
