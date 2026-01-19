'use client';

import * as React from 'react';
import {
  type ThemeProviderProps,
  ThemeProvider as NextThemesProvider,
} from 'next-themes';
import { TooltipProvider } from '@/components/ui/tooltip';

export function ThemeProviders({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider {...props}>
      <TooltipProvider delayDuration={300}>{children}</TooltipProvider>
    </NextThemesProvider>
  );
}
