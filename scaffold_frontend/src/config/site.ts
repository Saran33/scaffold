import { env } from '@/env/client.mjs';
import type { SiteConfig } from '@/types/config/site';

export const siteConfig: SiteConfig = {
  name: 'Scaffold App',
  tagline: 'Your App Tagline',
  description: 'Your app description goes here.',
  url: env.NEXT_PUBLIC_APP_URL,
  ogImage: `${env.NEXT_PUBLIC_APP_URL}/opengraph-image.png`,
  links: {
    social: {
      twitter: 'https://twitter.com/your-handle',
    },
  },
  owner: 'Your Company Name',
};

export const HOME_URL = '/';
export const LOGIN_URL = '/login';

export const supportEmail = `support@${env.NEXT_PUBLIC_APP_URL.replace(/^https?:\/\//, '')}`;
export const supportEmailHref = `mailto:${supportEmail}`;

export const legalLinks = [
  { href: supportEmailHref, label: 'Support' },
  { href: '/policies/terms', label: 'Terms' },
  { href: '/policies/privacy', label: 'Privacy' },
] as const;
