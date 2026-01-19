import Link from 'next/link';

import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils/utils';
import { MarketingHeading } from '@/components/marketing/marketing-heading';
import { MarketingIntroText } from '@/components/marketing/marketing-intro-text';
import { FeatureCards } from '@/components/marketing/feature-cards';

export default async function IndexPage() {
  return (
    <>
      <section className="min-h-80 space-y-6 pb-8 pt-6 md:pb-12 md:pt-10 lg:py-32">
        <div className="container flex max-w-[74rem] flex-col items-center gap-4 text-center">
          <div className="container flex min-h-24 flex-col items-center gap-4 p-0 text-center">
            <MarketingHeading />
          </div>
          <div className="pb-24">
            <MarketingIntroText />
          </div>
          <div className="space-x-4">
            <Link
              href="/register"
              className={cn(buttonVariants({ size: 'lg' }))}
            >
              Get Started
            </Link>
            <Link
              href="/login"
              className={cn(buttonVariants({ variant: 'outline', size: 'lg' }))}
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>
      <section
        id="features"
        className="container space-y-6 bg-slate-50 py-8 dark:bg-transparent md:py-12 lg:py-16"
      >
        <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
          <h2 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-6xl">
            Features
          </h2>
          <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
            This scaffold provides a starting point for building your Next.js
            application with authentication, a FastAPI backend, and more.
          </p>
        </div>
        <FeatureCards />
        <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 pt-4 text-center">
          <Link
            href="/register"
            className={cn(buttonVariants({ size: 'lg', variant: 'default' }))}
          >
            Get Started
          </Link>
        </div>
      </section>
    </>
  );
}
