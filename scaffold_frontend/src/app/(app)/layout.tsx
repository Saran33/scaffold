import { appConfig } from '@/config/app';
import { getAuth } from '@/server/auth/session';
import { MainNav } from '@/components/layout/main-nav';
import { SiteFooter } from '@/components/layout/site-footer';
import { UserAccountNav } from '@/components/layout/user-account-nav';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AppLayoutProps {
  children?: React.ReactNode;
}

export default async function AppLayout({ children }: AppLayoutProps) {
  // getAuth handles redirect if not authenticated
  const { user } = await getAuth('/dashboard');

  return (
    <div className="flex h-dvh w-dvw flex-col overflow-hidden bg-background">
      <header className="sticky top-0 z-40 h-16 border-b bg-background">
        <div className="container flex h-16 items-center justify-between space-x-4 sm:space-x-0">
          <MainNav
            items={appConfig.mainNav}
            className=""
            menuToggleIcon="logoFull"
          />
          <div className="flex items-center gap-2">
            <UserAccountNav
              user={{ name: user.name, image: user.image, email: user.email }}
              items={appConfig.userNav}
            />
          </div>
        </div>
      </header>
      <ScrollArea className="flex-1">
        <div className="flex min-h-[calc(100dvh-4rem)] flex-col">
          <main className="container flex-1 py-6">{children}</main>
          <SiteFooter className="mt-6 border-t" />
        </div>
      </ScrollArea>
    </div>
  );
}
