'use client';

import React from 'react';

import { cn } from '@/lib/utils/utils';
import { logout } from '@/lib/auth/client';
import { Button, buttonVariants } from '@/components/ui/button';

export const SignOutButton = () => {
  return (
    <Button
      onClick={async event => {
        event.preventDefault();
        await logout();
      }}
      className={cn(
        buttonVariants({ variant: 'secondary', size: 'sm' }),
        'px-4'
      )}
    >
      Sign Out
    </Button>
  );
};
