import type { MainNavItem } from '@/types/config/site';

import * as React from 'react';
import Link from 'next/link';

import { cn } from '@/lib/utils/utils';
import { siteConfig } from '@/config/site';

import { Icons, isKeyOfIcons } from '@/components/ui/icons';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';

interface DropdownNavProps {
  items?: MainNavItem[];
  children?: React.ReactNode;
  className?: string;
  mobileOnly?: boolean;
  menuToggleIcon?: string;
  menuToggleText?: string;
  inSideBar?: boolean;
}

export function DropdownNav({
  items,
  children,
  className,
  mobileOnly = true,
  menuToggleIcon,
  menuToggleText,
  inSideBar = false,
  ...props
}: DropdownNavProps) {
  return (
    <NavigationMenu
      {...props}
      className={cn(
        className,
        mobileOnly && '-ml-2 flex-1 md:hidden',
        inSideBar && 'bg-sidebar'
      )}
    >
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger
            className={cn(
              'group flex h-9 items-center space-x-1 pl-0 pr-2',
              mobileOnly && 'md:hidden',
              inSideBar && 'bg-sidebar'
            )}
          >
            <div className="ml-0 flex items-center space-x-1">
              {!menuToggleIcon && (
                <Icons.logo width={31} height={31} className="ml-2" />
              )}
              {menuToggleIcon && isKeyOfIcons(menuToggleIcon) ? (
                <>
                  {React.createElement(Icons[menuToggleIcon], {
                    className: '-mr-1.5',
                  })}
                </>
              ) : (
                <Icons.menu className="-mr-1.5" />
              )}
              {menuToggleText && (
                <span className="-mr-1.5 font-medium">{menuToggleText}</span>
              )}
            </div>
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <nav>
              <ul className="relative grid max-h-screen gap-3 overflow-auto p-4 md:w-[179px] md:overflow-hidden lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                <li className="row-span-3">
                  <NavigationMenuLink asChild>
                    <Link
                      data-testid="home-link"
                      href="/"
                      className="flex size-full select-none flex-col items-center justify-center rounded-md bg-gradient-to-b from-muted/50 to-muted p-4 no-underline outline-none focus:shadow-md"
                    >
                      <div className="flex flex-col items-center">
                        <Icons.logoFullIconMuted className="-ml-2 lg:-ml-4 lg:-mt-4" />
                        <p className="-mt-1 text-center text-sm leading-tight text-muted-foreground">
                          {siteConfig.tagline}
                        </p>
                      </div>
                    </Link>
                  </NavigationMenuLink>
                </li>
                {items &&
                  items.map(item => (
                    <DropdownNavItem
                      key={item.title}
                      title={item.title}
                      href={item.href}
                      disabled={item.disabled}
                    >
                      {item.description}
                    </DropdownNavItem>
                  ))}
                {children}
              </ul>
            </nav>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}

interface DropdownNavItemProps {
  title: string;
  disabled?: boolean;
  href: string;
  className?: string;
  children?: React.ReactNode;
}

const DropdownNavItem = React.forwardRef<
  HTMLAnchorElement,
  DropdownNavItemProps
>(({ className, title, disabled, children, href, ...props }, ref) => {
  return (
    <li className={cn(disabled && 'cursor-not-allowed')}>
      <NavigationMenuLink asChild>
        <Link
          ref={ref}
          href={href}
          aria-disabled={disabled}
          className={cn(
            'block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors',
            disabled
              ? 'pointer-events-none opacity-60'
              : 'hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
            className
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </Link>
      </NavigationMenuLink>
    </li>
  );
});
DropdownNavItem.displayName = 'DropdownNavItem';
