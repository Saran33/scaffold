'use client';

import * as React from 'react';

interface useCopyToClipboardProps {
  timeout?: number;
}

export function useCopyToClipboard({
  timeout = 2000,
}: useCopyToClipboardProps) {
  const [isCopied, setIsCopied] = React.useState<boolean>(false);

  const copyToClipboard = (value: string) => {
    if (typeof window === 'undefined' || !navigator.clipboard?.writeText) {
      console.error('Clipboard API not available - window and HTTPS required');
      return;
    }

    if (!value) {
      console.error('No value to copy to clipboard');
      return;
    }

    navigator.clipboard
      .writeText(value)
      .then(() => {
        setIsCopied(true);

        setTimeout(() => {
          setIsCopied(false);
        }, timeout);
      })
      .catch(() => {
        console.error('Failed to copy to clipboard');
        setIsCopied(false);
      });
  };

  return { isCopied, copyToClipboard };
}
