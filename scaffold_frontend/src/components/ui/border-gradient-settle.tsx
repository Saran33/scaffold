'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils/utils';

export function BorderGradientSettle({
  children,
  containerClassName,
  className,
  as: Tag = 'div',
  duration = 1.382,
  ...props
}: React.PropsWithChildren<
  {
    as?: React.ElementType;
    containerClassName?: string;
    className?: string;
    duration?: number;
  } & React.HTMLAttributes<HTMLElement>
>) {
  const initialHighlight =
    'conic-gradient(from 800deg at 50% 50%, hsl(0, 0%, 61.8) 0%, rgba(255, 255, 255, 0) 0%)';
  const midHighlight =
    'conic-gradient(from 450deg at 50% 50%, hsl(0, 0%, 61.8) 100%, rgba(255, 255, 255, 0) 0%)';
  const finalHighlight =
    'conic-gradient(from 390deg at 50% 50%, hsl(0, 0%, 61.8) 38%, rgba(255, 255, 255, 0) 0%)';

  return (
    <Tag
      className={cn(
        'relative flex h-min w-fit flex-col flex-nowrap place-content-center items-center overflow-visible rounded-full bg-black/10 box-decoration-clone transition duration-500 hover:bg-black/20 dark:bg-white/20',
        containerClassName
      )}
      {...props}
    >
      <div className={cn('z-10 w-auto rounded-[inherit] bg-black', className)}>
        {children}
      </div>
      <motion.div
        className={cn(
          'absolute inset-0 z-0 flex-none overflow-hidden rounded-[inherit]'
        )}
        style={{
          filter: 'blur(2px)',
          position: 'absolute',
          width: '100%',
          height: '100%',
          background: initialHighlight,
        }}
        initial={{ background: '', opacity: 1 }}
        animate={{
          background: [initialHighlight, midHighlight, finalHighlight],
          opacity: [0, 0.618, 0],
        }}
        transition={{
          ease: 'linear',
          delay: duration,
          duration: duration * 1.618,
        }}
      />
      <motion.div
        className={cn(
          'absolute inset-0 z-0 flex-none overflow-hidden rounded-[inherit]'
        )}
        style={{
          filter: 'blur(1px)',
          position: 'absolute',
          width: '100%',
          height: '100%',
          background: finalHighlight,
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0] }}
        transition={{
          ease: 'easeIn',
          delay: duration,
          duration: duration * 0.5,
        }}
      />
      <div className="absolute inset-0 z-0 flex-none rounded-[inherit] bg-black" />
    </Tag>
  );
}
