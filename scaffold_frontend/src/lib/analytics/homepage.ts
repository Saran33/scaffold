import { sendGAEvent } from '@next/third-parties/google';
import { FooterAnalytics } from './footer';

/**
 * Homepage analytics tracking - comprehensive coverage of all interactive elements
 */
export const HomepageAnalytics = {
  // Header navigation
  clickLogo: () => sendGAEvent('event', 'logo_click', { location: 'header' }),

  clickMainNavFeatures: () =>
    sendGAEvent('event', 'nav_click', {
      nav_item: 'features',
      location: 'header',
    }),

  clickMainNavPricing: () =>
    sendGAEvent('event', 'nav_click', {
      nav_item: 'pricing',
      location: 'header',
    }),

  clickMainNavBlog: () =>
    sendGAEvent('event', 'nav_click', { nav_item: 'blog', location: 'header' }),

  clickMainNavDocs: () =>
    sendGAEvent('event', 'nav_click', {
      nav_item: 'documentation',
      location: 'header',
    }),

  clickHeaderLogin: () =>
    sendGAEvent('event', 'login_initiate', { location: 'header' }),

  // Hero section CTAs
  clickGetStarted: () =>
    sendGAEvent('event', 'get_started_click', { location: 'hero_cta_primary' }),

  clickEl1: () =>
    sendGAEvent('event', 'el1_click', { location: 'hero_cta_secondary' }),

  // Features section
  clickFeatureCard: (featureName: string) =>
    sendGAEvent('event', 'feature_click', {
      feature_name: featureName,
      location: 'features_section',
    }),

  // Bottom CTA section
  clickEnterEleutheria: () =>
    sendGAEvent('event', 'enter_eleutheria_click', { location: 'bottom_cta' }),

  // Footer elements (imported from shared footer analytics)
  ...FooterAnalytics,

  // Scroll-based engagement
  scrollToFeatures: () =>
    sendGAEvent('event', 'scroll_engagement', { section: 'features' }),

  scrollToEl1: () =>
    sendGAEvent('event', 'scroll_engagement', { section: 'el1' }),

  scrollToEleuthesia: () =>
    sendGAEvent('event', 'scroll_engagement', { section: 'eleuthesia' }),

  scrollToEleutheria: () =>
    sendGAEvent('event', 'scroll_engagement', {
      section: 'eleutheria_platform',
    }),

  // Time-based engagement
  engagementMilestone: (seconds: number) =>
    sendGAEvent('event', 'engagement_time', {
      engagement_time_msec: seconds * 1000,
    }),
};
