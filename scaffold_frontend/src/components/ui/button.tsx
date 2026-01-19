import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils/utils';

type SizeVariants = {
  default: string;
  sm: string;
  lg: string;
  icon?: string;
};

function createButtonVariants(sizes: SizeVariants) {
  return cva(
    'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
    {
      variants: {
        variant: {
          default:
            'bg-primary text-primary-foreground shadow hover:bg-primary/90 active:bg-primary/90',
          destructive:
            'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 active:bg-destructive/90',
          outline:
            'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground active:bg-accent active:text-accent-foreground',
          secondary:
            'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 active:bg-secondary/80',
          ghost:
            'hover:bg-accent hover:text-accent-foreground active:bg-accent active:text-accent-foreground',
          link: 'text-primary underline-offset-4 hover:underline',
        },
        size: sizes,
      },
      defaultVariants: {
        variant: 'default',
        size: 'default',
      },
    }
  );
}

const defaultSizes = {
  default: 'h-10 py-2 px-4',
  sm: 'h-9 px-3 rounded-md',
  lg: 'h-11 px-8 rounded-md',
};

const thinSizes = {
  default: 'h-9 py-2 px-4',
  sm: 'h-8 px-3 rounded-md text-xs',
  lg: 'h-10 px-8 rounded-md',
  icon: 'size-9',
};

const buttonVariants = createButtonVariants(defaultSizes);
const buttonThinVariants = createButtonVariants(thinSizes);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  noFocusRing?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      noFocusRing = false,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(
          buttonThinVariants({ variant, size, className }),
          noFocusRing && 'focus-visible:ring-0'
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

const ButtonThin = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      noFocusRing = false,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(
          buttonThinVariants({ variant, size, className }),
          noFocusRing && 'focus-visible:ring-0'
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
ButtonThin.displayName = 'ButtonThin';

export { Button, buttonVariants, ButtonThin, buttonThinVariants };
