import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';

import { dashboardConfig } from '@/config/account';
import { getCurrentUser } from '@/server/auth/session';
import { MainNav } from '@/components/layout/main-nav';
import { SiteFooter } from '@/components/layout/site-footer';
import { UserAccountNav } from '@/components/layout/user-account-nav';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { DashSidebar } from '@/components/dashboard/dash-sidebar';
import '@/styles/dashboard.css';

interface DashboardLayoutProps {
  children?: React.ReactNode;
}

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const user = await getCurrentUser();

  if (!user) {
    return notFound();
  }

  const cookieStore = await cookies();
  const isCollapsed = cookieStore.get('sidebar_state')?.value !== 'true';

  return (
    <SidebarProvider defaultOpen={!isCollapsed} mobileBreakpoint={768}>
      <div className="flex h-dvh  w-dvw flex-col overflow-hidden bg-background">
        <header className="sticky top-0 z-40 h-16 border-b bg-background">
          <div className="container flex h-16 items-center justify-between space-x-4 sm:space-x-0">
            <SidebarTrigger className="-ml-2 md:hidden" />
            <MainNav
              items={dashboardConfig.mainNav}
              className="-ml-10"
              menuToggleIcon="logoFull"
            />
            <UserAccountNav
              user={{ name: user.name, image: user.image, email: user.email }}
              items={dashboardConfig.userNav}
            />
          </div>
        </header>
        <ScrollArea className="flex-1">
          <div className="flex min-h-[calc(100dvh-4rem)] flex-col">
            <div className="container ml-0 grid flex-1 pt-6 md:grid-cols-[60px_1fr] md:gap-4 md:pl-0 lg:grid-cols-[224px_1fr] lg:gap-6">
              <DashSidebar />
              <SidebarInset className="flex w-full flex-1 flex-col md:pl-0">
                {children}
              </SidebarInset>
            </div>
            <SiteFooter className="mt-6 border-t" />
          </div>
        </ScrollArea>
      </div>
    </SidebarProvider>
  );
}
