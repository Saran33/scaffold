import { cookies } from 'next/headers';
import Script from 'next/script';
import { GoogleAnalytics } from '@next/third-parties/google';
import { ConsentAwareAnalytics } from './consent-aware-analytics';

interface GoogleAnalyticsProviderProps {
  gaId: string;
}

export async function GoogleAnalyticsProvider({
  gaId,
}: GoogleAnalyticsProviderProps) {
  const cookieStore = await cookies();
  const hasConsent =
    cookieStore.get('scaffold-cookie-consent')?.value === 'true';

  return (
    <>
      {hasConsent ? (
        <>
          {/* Update consent to granted for returning consented users */}
          <Script id="google-consent-update-ssr" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){window.dataLayer.push(arguments);}
              gtag('consent', 'update', {
                ad_storage: 'granted',
                analytics_storage: 'granted',
                ad_user_data: 'granted',
                ad_personalization: 'granted'
              });
            `}
          </Script>
          <GoogleAnalytics gaId={gaId} />
        </>
      ) : (
        <ConsentAwareAnalytics gaId={gaId} />
      )}
    </>
  );
}
