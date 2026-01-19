'use client';

import { GoogleAnalytics } from '@next/third-parties/google';
import { useEffect, useState } from 'react';

interface ConsentAwareAnalyticsProps {
  gaId: string;
}

export function ConsentAwareAnalytics({ gaId }: ConsentAwareAnalyticsProps) {
  const [hasConsent, setHasConsent] = useState(false);

  useEffect(() => {
    // Check existing consent on mount
    const checkExistingConsent = () => {
      const consentCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('scaffold-cookie-consent='));

      if (consentCookie) {
        const consentValue = consentCookie.split('=')[1];
        setHasConsent(consentValue === 'true');
      }
    };

    checkExistingConsent();

    // Listen for consent events
    const handleConsentAccepted = () => {
      setHasConsent(true);
    };

    const handleConsentDeclined = () => {
      setHasConsent(false);
    };

    window.addEventListener('cookieConsentAccepted', handleConsentAccepted);
    window.addEventListener('cookieConsentDeclined', handleConsentDeclined);

    return () => {
      window.removeEventListener(
        'cookieConsentAccepted',
        handleConsentAccepted
      );
      window.removeEventListener(
        'cookieConsentDeclined',
        handleConsentDeclined
      );
    };
  }, []);

  // Only render GoogleAnalytics if user has consented
  if (hasConsent) {
    return <GoogleAnalytics gaId={gaId} />;
  }

  return null;
}
