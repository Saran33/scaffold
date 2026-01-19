'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import type { SidebarNavItem } from '@/types/config/site';
import { cn } from '@/lib/utils/utils';

interface DocsSidebarNavProps {
  items: SidebarNavItem[];
}

export function DocsSidebarNav({ items }: DocsSidebarNavProps) {
  const pathname = usePathname();

  return items.length ? (
    <div className="mb-20 w-full grid-cols-2 md:mb-0">
      {items.map((item, index) => (
        <div key={index} className={cn('pb-8')}>
          <h4 className="mb-1 rounded-md px-2 py-1 text-sm font-medium">
            {item.title}
          </h4>
          {item.items ? (
            <DocsSidebarNavItems items={item.items} pathname={pathname} />
          ) : null}
        </div>
      ))}
    </div>
  ) : null;
}

interface DocsSidebarNavItemsProps {
  items: SidebarNavItem[];
  pathname: string | null;
}

function DocsSidebarNavItems({ items, pathname }: DocsSidebarNavItemsProps) {
  return items?.length ? (
    <div className="grid grid-flow-row auto-rows-max text-sm">
      <ul>
        {items.map((item, index) => (
          <li key={index}>
            {!item.disabled && item.href ? (
              <Link
                href={item.href}
                className={cn(
                  'block w-full select-none items-center space-y-1 rounded-md p-3 leading-none hover:underline',
                  {
                    'bg-muted': pathname === item.href,
                  }
                )}
                target={item.external ? '_blank' : ''}
                rel={item.external ? 'noreferrer' : ''}
              >
                {item.title}
              </Link>
            ) : (
              <span className="block w-full select-none items-center space-y-1 rounded-md p-3 leading-none opacity-60">
                {item.title}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  ) : null;
}
