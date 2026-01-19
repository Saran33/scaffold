'use client';

import { memo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { dashboardConfig } from '@/config/account';
import { useIsMobile } from '@/hooks/use-mobile';
import { siteConfig } from '@/config/site';
import equal from 'fast-deep-equal';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { Icons } from '@/components/ui/icons';

/**
 * Dashboard specific sidebar that collapses to an icon-only rail on `md`
 * breakpoints, expands on `lg`, and becomes an off-canvas sheet on mobile.
 */
function PureDashSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const navItems = dashboardConfig.sidebarNav;

  const isMedium = useIsMobile(1024, false);

  const { setOpenMobile, open, setOpen, isMobile } = useSidebar();

  useEffect(() => {
    // Reset states when switching between mobile and desktop
    if (isMedium) {
      setOpen(false);
    } else {
      setOpen(true);
    }
  }, [isMedium, setOpen]);

  const closeMobileSideBar = useCallback(() => {
    setOpenMobile(false);
  }, [setOpenMobile]);

  return (
    <Sidebar
      collapsible="icon"
      variant="sidebar"
      {...props}
      wrapperClassName="-mb-[46px]"
      className="min-h-auto relative mt-[-23px] size-full"
      data-testid="dash-nav"
    >
      <SidebarHeader className="pb-0" />

      <SidebarContent className="mt-2 md:mt-3">
        <SidebarGroup>
          <SidebarGroupLabel asChild className="md:hidden">
            <span>{siteConfig.name}</span>
          </SidebarGroupLabel>
          <SidebarMenu>
            {navItems.map(item => {
              if (!item.href) return null;
              const Icon = Icons[item.icon ?? 'arrowRight'];
              const isActive = pathname === item.href;
              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    isActive={isActive}
                    onClick={closeMobileSideBar}
                  >
                    <Link
                      href={item.href}
                      aria-disabled={item.disabled ?? false}
                    >
                      {Icon ? <Icon /> : null}
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter />
    </Sidebar>
  );
}

export const DashSidebar = memo(PureDashSidebar, (prevProps, nextProps) => {
  return equal(prevProps, nextProps);
});
DashSidebar.displayName = 'DashSidebar';
