'use client';

import { HoverEffectSvgCards } from '@/components/ui/card-svg-hover-effect';
import { IconLock, IconArrowRight, IconCheckCircle } from '@/components/ui/icons-2';

export function FeatureCards() {
  return <HoverEffectSvgCards items={features} />;
}

const features = [
  {
    title: 'Authentication',
    svg: <IconLock size={48} />,
    description:
      'Built-in authentication with NextAuth.js supporting email/password, Google, and Apple OAuth.',
    link: '/register',
  },
  {
    title: 'FastAPI Backend',
    svg: <IconArrowRight size={48} />,
    description:
      'Python FastAPI backend with async SQLAlchemy, Alembic migrations, and comprehensive authentication.',
    link: '/register',
  },
  {
    title: 'Modern Stack',
    svg: <IconCheckCircle size={48} />,
    description:
      'Next.js 16, React 19, TypeScript, Tailwind CSS, and shadcn/ui components.',
    link: '/register',
  },
];
