import Link from 'next/link';
import { marketingConfig } from '@/config/marketing';
import { cn } from '@/lib/utils/utils';
import { MainNav } from '@/components/layout/main-nav';
import { SiteFooter } from '@/components/layout/site-footer';
import { buttonVariants } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface MarketingLayoutProps {
  children: React.ReactNode;
}
export default async function MarketingLayout({
  children,
}: MarketingLayoutProps) {
  return (
    <>
      <div className="flex h-dvh flex-col">
        <header className="container z-40 bg-background pl-6 pr-1 md:px-8">
          <div className="flex h-16 items-center justify-between py-6">
            <MainNav items={marketingConfig.mainNav} />
            <nav>
              <Link
                href="/login"
                className={cn(
                  buttonVariants({ variant: 'secondary', size: 'sm' }),
                  'px-4'
                )}
              >
                Log in
              </Link>
            </nav>
          </div>
        </header>
        <ScrollArea className="flex-1">
          <div className="flex min-h-[calc(100dvh-4rem)] flex-col">
            <main className="flex-1">{children}</main>
            <SiteFooter />
          </div>
        </ScrollArea>
      </div>
    </>
  );
}
