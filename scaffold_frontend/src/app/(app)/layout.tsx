import { cookies } from 'next/headers';
import { getAuth } from '@/server/auth/session';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app/app-sidebar';
import { Separator } from '@/components/ui/separator';
import { MainNav } from '@/components/layout/main-nav';
import { UserAccountNav } from '@/components/layout/user-account-nav';
import { appConfig } from '@/config/app';
import type { ReactNode } from 'react';

export default async function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [{ user }, cookieStore] = await Promise.all([
    getAuth('/app'),
    cookies(),
  ]);

  const isCollapsed = cookieStore.get('sidebar_state')?.value !== 'true';

  return (
    <SidebarProvider defaultOpen={!isCollapsed} mobileBreakpoint={1024}>
      <AppSidebar
        user={{
          name: user.name || user.email,
          email: user.email,
          avatar: user.image || undefined,
        }}
      />
      <SidebarInset>
        <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between gap-2 border-b bg-background px-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1 lg:hidden" />
            <Separator orientation="vertical" className="mr-2 h-4 lg:hidden" />
            {/* <MainNav items={appConfig.mainNav} menuToggleIcon="logoFull" /> */}
          </div>
          <UserAccountNav
            user={{ name: user.name, image: user.image, email: user.email }}
            items={appConfig.userNav}
          />
        </header>
        <main className="flex-1 p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
