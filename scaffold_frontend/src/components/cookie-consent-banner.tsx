'use client';

import React from 'react';
import CookieConsent from 'react-cookie-consent';
import Link from 'next/link';

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

const CookieConsentBanner = () => {
  return (
    <CookieConsent
      disableStyles={true}
      location="bottom"
      buttonText="Accept All"
      declineButtonText="Decline"
      enableDeclineButton
      cookieName="scaffold-cookie-consent"
      cookieSecurity={process.env.NODE_ENV === 'production'}
      sameSite="Lax"
      containerClasses="fixed bottom-4 z-50 bg-background border border-border rounded-lg shadow-lg p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 max-w-lg mx-auto sm:max-w-3xl lg:bottom-6 lg:left-1/2 lg:right-auto lg:-translate-x-1/2"
      contentClasses=""
      buttonClasses="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap"
      declineButtonClasses="bg-transparent text-muted-foreground border border-border hover:bg-muted px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap"
      buttonWrapperClasses="flex gap-2 justify-end"
      expires={365}
      onAccept={() => {
        try {
          if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('consent', 'update', {
              ad_storage: 'granted',
              analytics_storage: 'granted',
              ad_user_data: 'granted',
              ad_personalization: 'granted',
            });
          }
        } catch (error) {
          console.warn('Error updating consent:', error);
        }
        console.log('Analytics cookies accepted');
        window.dispatchEvent(new CustomEvent('cookieConsentAccepted'));
      }}
      onDecline={() => {
        try {
          if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('consent', 'update', {
              ad_storage: 'denied',
              analytics_storage: 'denied',
              ad_user_data: 'denied',
              ad_personalization: 'denied',
            });
          }
        } catch (error) {
          console.warn('Error updating consent:', error);
        }
        console.log('Analytics cookies declined');
        window.dispatchEvent(new CustomEvent('cookieConsentDeclined'));
      }}
    >
      <span className="text-sm text-foreground sm:flex-1">
        We use cookies to enhance your experience and analyze site usage.{' '}
        <Link
          href="/privacy"
          className="underline underline-offset-2 transition-colors hover:text-primary"
        >
          <span className="ml-px">Privacy Policy</span>
        </Link>
      </span>
    </CookieConsent>
  );
};

export default CookieConsentBanner;
