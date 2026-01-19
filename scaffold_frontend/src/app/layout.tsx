import type { Metadata } from 'next';
import { Suspense } from 'react';
import Script from 'next/script';

import '@/styles/globals.css';
import { SessionProvider } from 'next-auth/react';
import { SWRProvider } from '@/providers/swr-provider';
import { TailwindIndicator } from '@/components/tailwind-indicator';
import { ThemeProviders } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { GoogleAnalyticsProvider } from '@/components/google-analytics-provider';
import CookieConsentBanner from '@/components/cookie-consent-banner';
import { siteConfig } from '@/config/site';
import { getServerAuth } from '@/server/auth/session';
import { env } from '@/env/client.mjs';
import {
  fontBrandClass,
  fontExoClass,
  fontNunitoClass,
  fontSansClass,
  fontMonoClass,
} from '@/lib/fonts';
import { cn } from '@/lib/utils/utils';
import { ServiceWorkerRegistration } from '@/components/pwa/service-worker-registration';
import { InstallPrompt } from '@/components/pwa/install-prompt';

interface RootLayoutProps {
  children: React.ReactNode;
}

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: ['Scaffold', 'Template', 'Starter'],
  creator: 'Scaffold',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.name,
    description: siteConfig.description,
    images: [`${siteConfig.url}/opengraph-image.png`],
    creator: '@scaffold',
  },
  icons: {
    icon: [
      {
        url: '/favicon-96x96.png',
        sizes: '96x96',
        type: 'image/png',
      },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  robots: env.NEXT_PUBLIC_IS_DEV_SITE
    ? { index: false, follow: false }
    : { index: true, follow: true },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Scaffold',
  },
  formatDetection: {
    telephone: false,
  },
};

// const LIGHT_THEME_COLOR = 'hsl(0 0% 100%)';
// const DARK_THEME_COLOR = 'hsl(240deg 10% 3.92%)';
const LIGHT_THEME_COLOR = 'white';
const DARK_THEME_COLOR = '#09090b';
const THEME_COLOR_SCRIPT = `\
(function() {
  var html = document.documentElement;
  var meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    document.head.appendChild(meta);
  }
  function updateThemeColor() {
    var isDark = html.classList.contains('dark');
    meta.setAttribute('content', isDark ? '${DARK_THEME_COLOR}' : '${LIGHT_THEME_COLOR}');
  }
  var observer = new MutationObserver(updateThemeColor);
  observer.observe(html, { attributes: true, attributeFilter: ['class'] });
  updateThemeColor();
})();`;

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: LIGHT_THEME_COLOR },
    { media: '(prefers-color-scheme: dark)', color: DARK_THEME_COLOR },
  ],
  // viewportFit: 'cover',
  // width: 'device-width',
  // initialScale: 1,
  maximumScale: 1, // Disable auto-zoom on mobile Safari
  // userScalable: false,
} as const;

async function ProvidersWrapper({ children }: { children: React.ReactNode }) {
  const { session } = await getServerAuth();

  return (
    <SessionProvider session={session}>
      <ThemeProviders
        attribute="class"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange
      >
        <SWRProvider>{children}</SWRProvider>
        <Toaster />
        <TailwindIndicator />
      </ThemeProviders>
    </SessionProvider>
  );
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html
      lang="en"
      // `next-themes` injects an extra classname to the body element to avoid
      // visual flicker before hydration. Hence the `suppressHydrationWarning`
      // prop is necessary to avoid the React hydration mismatch warning.
      // https://github.com/pacocoursey/next-themes?tab=readme-ov-file#with-app
      suppressHydrationWarning
    >
      <head>
        {/* Google Consent Mode V2 Initialization */}
        <Script id="google-consent-mode-init" strategy="beforeInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){window.dataLayer.push(arguments);}

            // Global default: granted for non-EU regions
            gtag('consent', 'default', {
              ad_storage: 'granted',
              analytics_storage: 'granted',
              ad_user_data: 'granted',
              ad_personalization: 'granted',
              functionality_storage: 'granted',
              personalization_storage: 'granted',
              security_storage: 'granted',
              wait_for_update: 500
            });

            // EU/EEA/UK override: denied by default
            gtag('consent', 'default', {
              ad_storage: 'denied',
              analytics_storage: 'denied',
              ad_user_data: 'denied',
              ad_personalization: 'denied',
              functionality_storage: 'granted',
              personalization_storage: 'denied',
              security_storage: 'granted',
              wait_for_update: 500
            }, ['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE','IS','LI','NO','CH','GB']);
          `}
        </Script>
        {/* <script
          dangerouslySetInnerHTML={{
            __html: THEME_COLOR_SCRIPT,
          }}
        /> */}
      </head>
      <body
        className={cn(
          'font-nunito antialiased',
          fontBrandClass,
          fontExoClass,
          fontNunitoClass,
          fontSansClass,
          fontMonoClass
        )}
      >
        <Suspense fallback={null}>
          <ProvidersWrapper>{children}</ProvidersWrapper>
        </Suspense>
        {env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <Suspense fallback={null}>
            <GoogleAnalyticsProvider gaId={env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
          </Suspense>
        )}
        <CookieConsentBanner />
        <ServiceWorkerRegistration />
        <InstallPrompt />
      </body>
    </html>
  );
}
