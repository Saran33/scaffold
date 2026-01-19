'use client';

import { type HTMLAttributes } from 'react';
import Link from 'next/link';

import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils/utils';

interface LoginFormFooterProps extends HTMLAttributes<HTMLDivElement> {
  mode: 'login' | 'register';
}

export function UserAuthFormFooter({
  mode,
  className,
  ...props
}: LoginFormFooterProps) {
  return (
    <AnimatePresence initial={true}>
      {mode == 'login' ? (
        <div className={cn('mt-4', className)}>
          <div
            className={cn('flex justify-center space-x-3', className)}
            {...props}
          >
            <motion.p
              key="p-sign-up"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ ease: 'easeIn', duration: 0.3 }}
              className="text-center text-xs text-muted-foreground sm:text-sm"
            >
              <Link
                href="/register"
                className="hover:text-brand underline underline-offset-4"
              >
                Don&apos;t have an account? Sign Up
              </Link>
            </motion.p>
            <motion.p
              key="p-forgot-password"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ ease: 'easeIn', duration: 0.4 }}
              className="text-center text-xs text-muted-foreground sm:text-sm"
            >
              <Link
                href="/reset-password"
                className="hover:text-brand underline underline-offset-4"
              >
                Forgot password?
              </Link>
            </motion.p>
          </div>
        </div>
      ) : mode == 'register' ? (
        <motion.p
          key="p-sign-up"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ ease: 'easeIn', duration: 0.4 }}
          className="px-8 text-center text-xs text-muted-foreground sm:text-sm"
        >
          By clicking to continue, you agree to our{' '}
          <Link
            href="/terms"
            className="hover:text-brand underline underline-offset-4"
          >
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link
            href="/privacy"
            className="hover:text-brand underline underline-offset-4"
          >
            Privacy Policy
          </Link>
          .
        </motion.p>
      ) : null}
    </AnimatePresence>
  );
}
