'use client';

import { useTheme } from 'next-themes';
import { Toaster as Sonner } from 'sonner';
import { useSidebar } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils/utils';
import { SIDEBAR_WIDTH, SIDEBAR_WIDTH_MOBILE } from '@/components/ui/sidebar';

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme();
  const { open, isMobile } = useSidebar();

  const sidebarWidthVar = isMobile ? SIDEBAR_WIDTH_MOBILE : SIDEBAR_WIDTH;

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      position="top-center"
      closeButton
      className={cn(
        'toaster group !fixed !top-12',
        !open && '!left-[54.5%] !-translate-x-1/2',
        open && !isMobile && '!left-[calc(54.5%+(16rem/2))]'
      )}
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-popover group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg outline-px dark:border-px dark:border-zinc-900 w-auto inline-flex items-center',
          title: 'group-[.toast]:text-primary font-sans font-medium',
          description:
            'group-[.toast]:text-muted-foreground font-sans font-normal',
          closeButton:
            'group-[.toast]:bg-background group-[.toast]:text-foreground cursor-pointer outline-px dark:border-px dark:border-zinc-800 hover:ring-none hover:border-none',
          icon: 'leading-none !mt-[-2px] !p-0 inline-block align-middle',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
