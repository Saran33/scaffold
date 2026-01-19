import * as React from 'react';
import Link from 'next/link';

import { siteConfig, legalLinks } from '@/config/site';
import { cn } from '@/lib/utils/utils';
import { Icons } from '@/components/ui/icons';
import { ModeToggle } from '@/components/layout/mode-toggle';

export async function SiteFooter({ className }: React.HTMLAttributes<HTMLElement>) {
  'use cache';
  return (
    <footer className={cn(className, 'border-t border-border')}>
      <div className="container flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0">
        <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
          <Icons.logo width={16} height={16} />
          <p className="text-center text-xs leading-loose md:text-left">
            <span className="font-brand font-medium text-muted-foreground underline underline-offset-4">
              {siteConfig.name}
            </span>{' '}
            <span className="font-thin text-muted-foreground">©</span>{' '}
            {/* <span className="text-muted-foreground underline underline-offset-4">
              {siteConfig.owner}
            </span>{' '} */}
            <span className="dark:font-thin">{new Date().getFullYear()}.</span>
          </p>
        </div>

        <div className=" flex flex-col items-center justify-end gap-4 md:flex-row">
          {/* legal nav */}
          <nav className="flex flex-wrap items-center justify-center gap-4 text-xs md:text-sm">
            {legalLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-muted-foreground hover:text-primary hover:underline"
              >
                {label}
              </Link>
            ))}
          </nav>

          <ModeToggle />
        </div>
      </div>
    </footer>
  );
}
