'use client';

import type { User } from 'next-auth';
import type { UserNavItem } from '@/types/config/site';

import Link from 'next/link';
import { createElement, memo } from 'react';
import { logout } from '@/server/auth/session';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Icons } from '@/components/ui/icons';
import { UserAvatar } from '@/components/user-avatar';

interface UserAccountNavProps extends React.HTMLAttributes<HTMLDivElement> {
  user: Pick<User, 'name' | 'image' | 'email'>;
  items?: UserNavItem[];
}

function PureUserAccountNav({ user, items }: UserAccountNavProps) {
  return (
    <div className="flex items-center justify-between">
      <DropdownMenu>
        <DropdownMenuTrigger
          data-testid="user-menu-trigger"
          className="ring-0 focus:bg-none focus-visible:outline-none data-[state=open]:bg-none"
        >
          <UserAvatar
            user={{ name: user.name || null, image: user.image || null }}
            className="size-8"
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" data-testid="user-menu-content">
          <div className="flex items-center justify-start gap-2 p-2">
            <div className="flex flex-col space-y-1 text-xs leading-none">
              {user.name && <p className="font-medium">{user.name}</p>}
              {user.email && (
                <p className="w-[200px] truncate text-muted-foreground">
                  {user.email}
                </p>
              )}
            </div>
          </div>
          <DropdownMenuSeparator />
          {items?.map(item => (
            <DropdownMenuItem
              key={item.title}
              asChild
              className="cursor-pointer"
            >
              <Link
                href={item.href}
                className="flex items-center gap-2"
                data-testid={`${item.title.toLowerCase()}-link`}
              >
                {createElement(Icons[item.icon || 'arrowRight'], {
                  className: 'size-4',
                })}
                {item.title}
              </Link>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            data-testid="logout-btn"
            className="flex cursor-pointer items-center gap-2 text-sm/4"
            onSelect={async event => {
              event.preventDefault();
              await logout();
            }}
          >
            <Icons.logout className="size-[15px]" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export const UserAccountNav = memo(
  PureUserAccountNav,
  (prevProps, nextProps) =>
    prevProps.user.email === nextProps.user.email &&
    prevProps.user.name === nextProps.user.name &&
    prevProps.user.image === nextProps.user.image
);
UserAccountNav.displayName = 'UserAccountNav';
