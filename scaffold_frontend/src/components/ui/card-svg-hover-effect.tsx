'use client';

import { useState } from 'react';
import Link from 'next/link';

import { cn } from '@/lib/utils/utils';
import { AnimatePresence, motion } from 'framer-motion';

export const HoverEffectSvgCards = ({
  items,
  className,
}: {
  items: {
    svg: React.ReactNode;
    title: string;
    description: string;
    link: string;
  }[];
  className?: string;
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div
      className={cn(
        'grid grid-cols-1 py-10 pt-0 md:grid-cols-3  lg:grid-cols-3',
        className
      )}
    >
      {items.map((item, idx) => (
        <Link
          href={item?.link}
          key={item.title}
          className="group relative  block size-full p-2"
          onMouseEnter={() => setHoveredIndex(idx)}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <AnimatePresence>
            {hoveredIndex === idx && (
              <motion.span
                className="absolute inset-0 block size-full rounded-3xl bg-neutral-200 dark:bg-slate-800/[0.8]"
                layoutId="hoverBackground"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: 1,
                  transition: { duration: 0.15 },
                }}
                exit={{
                  opacity: 0,
                  transition: { duration: 0.15, delay: 0.2 },
                }}
              />
            )}
          </AnimatePresence>
          <Card
            title={item.title}
            description={item.description}
            svg={item.svg}
          />
        </Link>
      ))}
    </div>
  );
};

export const Card = ({
  className,
  svg,
  title,
  description,
}: {
  className?: string;
  svg: React.ReactNode;
  title: string;
  description: string;
}) => {
  return (
    <div
      className={cn(
        'relative z-20 size-full overflow-hidden rounded-2xl border bg-background p-2 group-hover:border-slate-700 dark:border-white/[0.2]',
        className
      )}
    >
      <div className="flex h-[180px] flex-col justify-between rounded-md p-6">
        {svg}
        <div className="space-y-2">
          <h3 className="font-bold">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
  );
};
