'use client';

import type { ComponentProps } from 'react';
import { type SidebarTrigger, useSidebar } from '@/components/ui/sidebar';

import { memo } from 'react';
import { cn } from '@/lib/utils/utils';

import { IconSidebarLeft } from '@/components/ui/icons-2';
import { ButtonThin } from '@/components/ui/button';

function PureSidebarToggle({
  className,
}: ComponentProps<typeof SidebarTrigger>) {
  const { toggleSidebar } = useSidebar();

  return (
    <ButtonThin
      onClick={toggleSidebar}
      variant="ghost"
      className={cn('px-2 md:h-fit', className)}
      aria-label="Toggle Sidebar"
    >
      <IconSidebarLeft size={16} />
    </ButtonThin>
  );
}

export const SidebarToggle = memo(PureSidebarToggle);
SidebarToggle.displayName = 'SidebarToggle';
