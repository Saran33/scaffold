import type { DashboardConfig, UserNavItem } from '@/types/config/site';
import { supportEmailHref } from './site';

export const accountPageConfig = {
  title: 'Account',
  description: 'Manage your account and security settings',
  href: '/account/settings',
  icon: 'user',
};

export const userNavItems: UserNavItem[] = [accountPageConfig];

export const dashboardConfig: DashboardConfig = {
  mainNav: [
    {
      title: 'Dashboard',
      href: '/app',
      description: 'Your dashboard',
    },
    {
      title: 'Support',
      href: supportEmailHref,
      description: 'Get help with your account',
    },
  ],
  sidebarNav: [...userNavItems],
  userNav: userNavItems,
};
