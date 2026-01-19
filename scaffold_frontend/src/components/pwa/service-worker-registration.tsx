'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const registerServiceWorker = async () => {
        try {
          const registration = await navigator.serviceWorker.register(
            '/sw.js',
            {
              scope: '/',
              updateViaCache: 'none',
            }
          );

          console.log('[PWA] Service worker registered:', registration.scope);

          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (
                  newWorker.state === 'installed' &&
                  navigator.serviceWorker.controller
                ) {
                  console.log('[PWA] New version available');
                }
              });
            }
          });
        } catch (error) {
          console.error('[PWA] Service worker registration failed:', error);
        }
      };

      window.addEventListener('load', () => {
        void registerServiceWorker();
      });
    }
  }, []);

  return null;
}
