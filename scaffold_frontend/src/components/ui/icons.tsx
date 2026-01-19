import React, { type ForwardRefExoticComponent, type RefAttributes } from 'react';
import type { LucideProps, Icon as LucideIcon } from 'lucide-react';

import Image from 'next/image';
import { siteConfig } from '@/config/site';
import { cn } from '@/lib/utils/utils';

import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Command,
  CreditCard,
  File,
  FileText,
  HelpCircle,
  Info,
  Image as ImageIcon,
  Laptop,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  MessageSquare,
  Moon,
  MoreVertical,
  Pizza,
  Plus,
  Settings,
  Store,
  SunMedium,
  Trash,
  User,
  X,
  AppWindow,
  FolderX,
  SunMoon,
  Sparkle,
} from 'lucide-react';
// import LogoSvgWhite from '@/assets/svgs/Eleutheria_logo_white.svg';

type IconComponent =
  | ForwardRefExoticComponent<LucideProps & RefAttributes<SVGSVGElement>>
  | ((props: LucideProps) => React.JSX.Element);

export type IconKey = keyof typeof Icons & string;

export function isKeyOfIcons(key: string): key is IconKey {
  return key in Icons;
}

export const Icons: { [key: string]: IconComponent } = {
  command: Command,
  close: X,
  spinner: Loader2,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  chevronDown: ChevronDown,
  trash: Trash,
  post: FileText,
  page: File,
  media: ImageIcon,
  clearChat: FolderX,
  chat: MessageSquare,
  settings: Settings,
  billing: CreditCard,
  activity: Activity,
  ellipsis: MoreVertical,
  add: Plus,
  warning: AlertTriangle,
  user: User,
  arrowRight: ArrowRight,
  help: HelpCircle,
  info: Info,
  pizza: Pizza,
  sun: SunMedium,
  menu: Menu,
  moon: Moon,
  theme: SunMoon,
  laptop: Laptop,
  logout: LogOut,
  dash: AppWindow,
  view: LayoutDashboard,
  store: Store,
  sparkle: Sparkle,
  gitHub: ({ ...props }: LucideProps) => (
    <svg
      aria-hidden="true"
      focusable="false"
      data-prefix="fab"
      data-icon="github"
      role="img"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 496 512"
      {...props}
    >
      <path
        fill="currentColor"
        d="M165.9 397.4c0 2-2.3 3.6-5.2 3.6-3.3 .3-5.6-1.3-5.6-3.6 0-2 2.3-3.6 5.2-3.6 3-.3 5.6 1.3 5.6 3.6zm-31.1-4.5c-.7 2 1.3 4.3 4.3 4.9 2.6 1 5.6 0 6.2-2s-1.3-4.3-4.3-5.2c-2.6-.7-5.5 .3-6.2 2.3zm44.2-1.7c-2.9 .7-4.9 2.6-4.6 4.9 .3 2 2.9 3.3 5.9 2.6 2.9-.7 4.9-2.6 4.6-4.6-.3-1.9-3-3.2-5.9-2.9zM244.8 8C106.1 8 0 113.3 0 252c0 110.9 69.8 205.8 169.5 239.2 12.8 2.3 17.3-5.6 17.3-12.1 0-6.2-.3-40.4-.3-61.4 0 0-70 15-84.7-29.8 0 0-11.4-29.1-27.8-36.6 0 0-22.9-15.7 1.6-15.4 0 0 24.9 2 38.6 25.8 21.9 38.6 58.6 27.5 72.9 20.9 2.3-16 8.8-27.1 16-33.7-55.9-6.2-112.3-14.3-112.3-110.5 0-27.5 7.6-41.3 23.6-58.9-2.6-6.5-11.1-33.3 2.6-67.9 20.9-6.5 69 27 69 27 20-5.6 41.5-8.5 62.8-8.5s42.8 2.9 62.8 8.5c0 0 48.1-33.6 69-27 13.7 34.7 5.2 61.4 2.6 67.9 16 17.7 25.8 31.5 25.8 58.9 0 96.5-58.9 104.2-114.8 110.5 9.2 7.9 17 22.9 17 46.4 0 33.7-.3 75.4-.3 83.6 0 6.5 4.6 14.4 17.3 12.1C428.2 457.8 496 362.9 496 252 496 113.3 383.5 8 244.8 8zM97.2 352.9c-1.3 1-1 3.3 .7 5.2 1.6 1.6 3.9 2.3 5.2 1 1.3-1 1-3.3-.7-5.2-1.6-1.6-3.9-2.3-5.2-1zm-10.8-8.1c-.7 1.3 .3 2.9 2.3 3.9 1.6 1 3.6 .7 4.3-.7 .7-1.3-.3-2.9-2.3-3.9-2-.6-3.6-.3-4.3 .7zm32.4 35.6c-1.6 1.3-1 4.3 1.3 6.2 2.3 2.3 5.2 2.6 6.5 1 1.3-1.3 .7-4.3-1.3-6.2-2.2-2.3-5.2-2.6-6.5-1zm-11.4-14.7c-1.6 1-1.6 3.6 0 5.9 1.6 2.3 4.3 3.3 5.6 2.3 1.6-1.3 1.6-3.9 0-6.2-1.4-2.3-4-3.3-5.6-2z"
      ></path>
    </svg>
  ),
  google: ({ ...props }: LucideProps) => (
    <svg
      aria-hidden="true"
      focusable="false"
      data-prefix="fab"
      data-icon="google"
      role="img"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      height="24"
      width="24"
      {...props}
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="currentColor"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="currentColor"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="currentColor"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="currentColor"
      />
      <path d="M1 1h22v22H1z" fill="none" />
    </svg>
  ),
  apple: ({ ...props }: LucideProps) => (
    <svg
      aria-hidden="true"
      focusable="false"
      data-prefix="fab"
      data-icon="apple"
      role="img"
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      viewBox="0 0 456.008 560.035"
      {...props}
    >
      <path
        fill="currentColor"
        d="M380.844 297.529c.787 84.752 74.349 112.955 75.164 113.314-.622 1.988-11.754 40.191-38.756 79.652-23.343 34.117-47.568 68.107-85.731 68.811-37.499.691-49.557-22.236-92.429-22.236-42.859 0-56.256 21.533-91.753 22.928-36.837 1.395-64.889-36.891-88.424-70.883-48.093-69.53-84.846-196.475-35.496-282.165 24.516-42.554 68.328-69.501 115.882-70.192 36.173-.69 70.315 24.336 92.429 24.336 22.1 0 63.59-30.096 107.208-25.676 18.26.76 69.517 7.376 102.429 55.552-2.652 1.644-61.159 35.704-60.523 106.559M310.369 89.418C329.926 65.745 343.089 32.79 339.498 0 311.308 1.133 277.22 18.785 257 42.445c-18.121 20.952-33.991 54.487-29.709 86.628 31.421 2.431 63.52-15.967 83.078-39.655"
      />
    </svg>
  ),
  twitter: ({ ...props }: LucideProps) => (
    <svg
      aria-hidden="true"
      focusable="false"
      data-prefix="fab"
      data-icon="x"
      role="img"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1200 1227"
      width="32"
      height="32"
      {...props}
    >
      <path
        d="M714.163 519.284L1160.89 0H1055.03L667.137 450.887L357.328 0H0L468.492 681.821L0 1226.37H105.866L515.491 750.218L842.672 1226.37H1200L714.137 519.284H714.163ZM569.165 687.828L521.697 619.934L144.011 79.6944H306.615L611.412 515.685L658.88 583.579L1055.08 1150.3H892.476L569.165 687.854V687.828Z"
        fill="currentColor"
      />
    </svg>
  ),
  check: Check,
  logoProminant: ({ ...props }) => (
    <>
      <Image
        src="/images/brand/logo_full_760x760.png"
        data-icon="logo-prominant-dark"
        alt="scaffold logo"
        quality={100}
        width={512}
        height={512}
        priority
        loading="eager"
        {...props}
        className={cn('', props.className)}
      />
    </>
  ),
  logo: ({ ...props }) => (
    <>
      <Image
        src="/images/brand/logo_185x185.png"
        data-icon="logo-dark"
        alt="scaffold logo"
        quality={100}
        width={185}
        height={185}
        priority
        loading="eager"
        {...props}
        className={cn('hidden dark:block', props.className)}
      />
      <Image
        src="/images/brand/logo_185x185.png"
        data-icon="logo-light"
        alt="Eleutheria logo"
        quality={100}
        width={185}
        height={185}
        priority
        loading="eager"
        {...props}
        className={cn(' dark:hidden', props.className)}
      />
    </>
  ),
  logoMono: ({ ...props }) => (
    <>
      <Image
        src="/images/brand/logo_mono_dark_185x185.png"
        data-icon="logo-mono-dark"
        alt="Eleutheria logo"
        quality={100}
        width={1126}
        height={1122}
        priority
        loading="eager"
        {...props}
        className={cn('hidden rounded-full dark:block', props.className)}
      />
      <Image
        src="/logo_mono_light_185x185.png"
        data-icon="logo-mono-light"
        alt="Eleutheria logo"
        quality={100}
        width={1126}
        height={1122}
        priority
        loading="eager"
        {...props}
        className={cn('rounded-full dark:hidden', props.className)}
      />
    </>
  ),
  logoFull: ({ ...props }: LucideProps) => (
    <svg
      version="1.1"
      aria-hidden="true"
      focusable="false"
      data-prefix="icon"
      data-icon="logo-full"
      role="img"
      xmlns="http://www.w3.org/2000/svg"
      x="0px"
      y="0px"
      width="150"
      height="24"
      viewBox="0 0 350 60"
      fontSize="33px"
      {...props}
    >
      <image
        href="/images/brand/logo_185x185.png"
        x="-9"
        y="5"
        width="42"
        height="42"
        className={cn('hidden rounded-full dark:block', props.className)}
      />
      <image
        href="/images/brand/logo_185x185.png"
        x="-13"
        y="7"
        width="42"
        height="42"
        className={cn('rounded-full dark:hidden', props.className)}
      />
      <g id={siteConfig.name}>
        <text
          x="39"
          y="38"
          fill="currentColor"
          className={cn('font-brand font-medium', props.className)}
        >
          {siteConfig.name}
        </text>
      </g>
    </svg>
  ),
  logoFullIcon: ({ ...props }: LucideProps) => (
    <svg
      version="1.1"
      aria-hidden="true"
      focusable="false"
      data-prefix="icon"
      data-icon="logo-full-icon"
      role="img"
      xmlns="http://www.w3.org/2000/svg"
      x="0px"
      y="0px"
      width="94.5"
      height="24"
      viewBox="6 0 178.1 60"
      fontSize="33px"
      {...props}
    >
      <defs>
        <clipPath id="circleClip">
          <circle cx="14" cy="28" r="21" />
        </clipPath>
      </defs>
      <image
        href="/logo_185x185.png"
        x="-7"
        y="7"
        width="42"
        height="42"
        className={cn('hidden rounded-full dark:block', props.className)}
      />
      <image
        href="/favicon-32x32.png"
        x="-7"
        y="7"
        width="42"
        height="42"
        preserveAspectRatio="xMidYMid meet"
        clipPath="url(#circleClip)"
        className={cn('rounded-full dark:hidden', props.className)}
      />
      <g id={siteConfig.name}>
        <text
          x="40"
          y="42"
          fill="currentColor"
          className={cn('font-brand font-medium', props.className)}
        >
          {siteConfig.name}
        </text>
      </g>
    </svg>
  ),
  logoFullIconMuted: ({ ...props }: LucideProps) => (
    <svg
      version="1.1"
      aria-hidden="true"
      focusable="false"
      data-prefix="icon"
      data-icon="logo-full-icon-muted"
      role="img"
      xmlns="http://www.w3.org/2000/svg"
      x="0px"
      y="0px"
      width="94.5"
      height="24"
      viewBox="0 0 178.1 60"
      fontSize="33px"
      {...props}
    >
      <defs>
        <clipPath id="circleClip">
          <circle cx="14" cy="28" r="21" />
        </clipPath>
      </defs>
      <image
        href="/favicon-32x32_dark.png"
        x="-7"
        y="7"
        width="42"
        height="42"
        preserveAspectRatio="xMidYMid meet"
        clipPath="url(#circleClip)"
        className={cn('hidden rounded-full dark:block', props.className)}
      />
      <image
        href="/favicon-32x32_dark_50.png"
        x="-7"
        y="7"
        width="42"
        height="42"
        preserveAspectRatio="xMidYMid meet"
        clipPath="url(#circleClip)"
        className={cn('rounded-full dark:hidden', props.className)}
      />
      <g id={siteConfig.name}>
        <text
          x="40"
          y="42"
          fill="currentColor"
          className={cn('font-brand font-medium', props.className)}
        >
          {siteConfig.name}
        </text>
      </g>
    </svg>
  ),
};
