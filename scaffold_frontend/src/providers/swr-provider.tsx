'use client';

import { SWRConfig, type SWRConfiguration } from 'swr';
import type { ReactNode } from 'react';

const SWR_CONFIG: SWRConfiguration = {
  // Retry Configuration
  errorRetryCount: 3,
  errorRetryInterval: 5000, // Base retry interval: 5 seconds
  onErrorRetry: (error, _key, _config, revalidate, { retryCount }) => {
    // Don't retry on 4xx errors except 429 (rate limit)
    if (error?.status >= 400 && error?.status < 500 && error?.status !== 429) {
      return;
    }

    // Don't retry on authentication errors
    if (error?.status === 401 || error?.status === 403) {
      return;
    }

    // Only retry server errors and network issues
    if (error?.status < 500 && error?.status) {
      return;
    }

    // Exponential backoff: 1s, 2s, 4s, max 8s
    const delay = Math.min(1000 * Math.pow(2, retryCount), 8000);

    setTimeout(() => {
      void revalidate({ retryCount });
    }, delay);
  },
  shouldRetryOnError: (error: any) => {
    // Don't retry client errors
    if (error?.status >= 400 && error?.status < 500) return false;

    // Don't retry authentication errors
    if (error?.status === 401 || error?.status === 403) return false;

    // Retry server errors and network issues
    return error?.status >= 500 || !error?.status;
  },

  // Focus Behavior (Fix for wasteful fetching)
  revalidateOnFocus: false, // Disable focus refetching
  revalidateOnReconnect: true, // Keep reconnect behavior
  revalidateIfStale: true, // Only revalidate if data is stale

  // Performance Optimizations
  dedupingInterval: 5000, // 5 seconds for chat data
  focusThrottleInterval: 10000, // If focus revalidation needed, throttle to 10s

  // Cache Behavior
  keepPreviousData: true, // Better UX during refetches
  refreshWhenHidden: false, // Don't refresh when tab hidden
  refreshWhenOffline: false, // Don't refresh when offline

  // Error Handling
  onError: (error, key) => {
    console.error('SWR Error:', error, 'Key:', key);
  },
} satisfies SWRConfiguration;

export function SWRProvider({ children }: { children: ReactNode }) {
  return <SWRConfig value={SWR_CONFIG}>{children}</SWRConfig>;
}
