import type { Icon } from 'lucide-react';

import type { IconKey } from '@/components/ui/icons';

export type NavItem = {
  title: string;
  href: string;
  disabled?: boolean;
  description?: string;
};

export type MainNavItem = NavItem;

export type SidebarNavItem = {
  title: string;
  disabled?: boolean;
  external?: boolean;
  description?: string;
  icon?: IconKey;
} & (
  | {
      href: string;
      items?: never;
    }
  | {
      href?: string;
      items: NavLink[];
    }
);

export type UserNavItem = {
  title: string;
  href: string;
  icon: IconKey;
  description?: string;
};

export type SiteConfig = {
  name: string;
  tagline: string;
  description: string;
  url: string;
  ogImage: string;
  links: {
    social: {
      twitter: string;
      facebook?: string;
      instagram?: string;
      linkedin?: string;
    };
  };
  owner: string;
};

export type DocsConfig = {
  mainNav: MainNavItem[];
  sidebarNav: SidebarNavItem[];
};

export type MarketingConfig = {
  mainNav: MainNavItem[];
};

export type DashboardConfig = {
  mainNav: MainNavItem[];
  sidebarNav: SidebarNavItem[];
  userNav: UserNavItem[];
};
