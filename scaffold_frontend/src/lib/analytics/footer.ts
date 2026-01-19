import { sendGAEvent } from '@next/third-parties/google';

/**
 * Footer analytics tracking - shared across all pages
 */
export const FooterAnalytics = {
  // Footer logo
  clickFooterLogo: () =>
    sendGAEvent('event', 'logo_click', { location: 'footer' }),

  // Legal/support links
  clickFooterSupport: () =>
    sendGAEvent('event', 'support_click', { location: 'footer' }),

  clickFooterTerms: () =>
    sendGAEvent('event', 'legal_click', {
      legal_page: 'terms',
      location: 'footer',
    }),

  clickFooterPrivacy: () =>
    sendGAEvent('event', 'legal_click', {
      legal_page: 'privacy',
      location: 'footer',
    }),

  clickFooterUsage: () =>
    sendGAEvent('event', 'legal_click', {
      legal_page: 'usage',
      location: 'footer',
    }),

  // Theme toggle
  toggleTheme: (newTheme: 'light' | 'dark' | 'system') =>
    sendGAEvent('event', 'theme_toggle', {
      theme: newTheme,
      location: 'footer',
    }),
};
