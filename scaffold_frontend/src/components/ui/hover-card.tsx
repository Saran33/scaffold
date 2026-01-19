'use client';

import React, { useState, useCallback } from 'react';
import * as HoverCardPrimitive from '@radix-ui/react-hover-card';

import { cn } from '@/lib/utils/utils';

const HoverCard = HoverCardPrimitive.Root;

const HoverCardTrigger = HoverCardPrimitive.Trigger;

const HoverCardContent = React.forwardRef<
  React.ElementRef<typeof HoverCardPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof HoverCardPrimitive.Content>
>(({ className, align = 'center', sideOffset = 4, ...props }, ref) => (
  <HoverCardPrimitive.Content
    ref={ref}
    align={align}
    sideOffset={sideOffset}
    className={cn(
      'z-50 w-64 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
      className
    )}
    {...props}
  />
));
HoverCardContent.displayName = HoverCardPrimitive.Content.displayName;

interface WithClickToHoverProps {
  children: React.ReactNode;
  className?: string;
  enabled?: boolean;
}
function WithClickToHover({
  children,
  className,
  enabled = false,
}: WithClickToHoverProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleInteraction = useCallback(
    (e: React.MouseEvent | React.KeyboardEvent) => {
      if (enabled) {
        setIsOpen(prev => !prev);
      }
    },
    [enabled]
  );

  const child = React.Children.only(children);
  if (!React.isValidElement(child)) {
    return children;
  }

  const childProps = child.props as { children?: React.ReactNode };
  return React.cloneElement(
    child as React.ReactElement<{
      open?: boolean;
      onOpenChange?: (open: boolean) => void;
      children?: React.ReactNode;
    }>,
    {
      open: enabled ? isOpen : undefined,
      onOpenChange: enabled ? setIsOpen : undefined,
      children: (
        <div
          onClick={handleInteraction}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              handleInteraction(e);
            }
          }}
          className={cn(enabled && 'cursor-pointer', className)}
          role="button"
          tabIndex={enabled ? 0 : undefined}
          aria-expanded={isOpen}
        >
          {childProps.children}
        </div>
      ),
    }
  );
}

export { HoverCard, HoverCardTrigger, HoverCardContent };
