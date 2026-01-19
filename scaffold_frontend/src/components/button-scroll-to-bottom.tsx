'use client';

import * as React from 'react';

import { cn } from '@/lib/utils/utils';
import { ButtonThin, type ButtonProps } from '@/components/ui/button';

interface ButtonScrollToBottomProps extends ButtonProps {
  isAtBottom: boolean;
  scrollToBottom: () => void;
}

export function ButtonScrollToBottom({
  className,
  isAtBottom,
  scrollToBottom,
  ...props
}: ButtonScrollToBottomProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    scrollToBottom();
    (e.target as HTMLElement).blur(); // Remove focus after click/touch
  };
  return (
    <div
      inert={isAtBottom || undefined}
      className={cn(
        'absolute inset-x-0 -top-12 z-10 m-auto flex w-fit items-center justify-center animate-in fade-in slide-in-from-bottom',
        isAtBottom ? 'opacity-0' : 'opacity-100'
      )}
    >
      <ButtonThin
        variant="outline"
        size="icon"
        className="animate-slowBounce flex size-7 items-center justify-center rounded-full border-muted/60 bg-background text-gray-500 shadow-muted/20 hover:bg-muted hover:text-muted-foreground"
        onClick={handleClick}
        type="button"
        {...props}
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 15 15"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="size-5"
        >
          <path
            d="M3.13523 6.15803C3.3241 5.95657 3.64052 5.94637 3.84197 6.13523L7.5 9.56464L11.158 6.13523C11.3595 5.94637 11.6759 5.95657 11.8648 6.15803C12.0536 6.35949 12.0434 6.67591 11.842 6.86477L7.84197 10.6148C7.64964 10.7951 7.35036 10.7951 7.15803 10.6148L3.15803 6.86477C2.95657 6.67591 2.94637 6.35949 3.13523 6.15803Z"
            fill="currentColor"
            fillRule="evenodd"
            clipRule="evenodd"
          />
        </svg>
      </ButtonThin>
    </div>
  );
}
