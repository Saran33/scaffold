'use client';

import { useRef, useEffect, useCallback } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

/**
 * Hook to prevent keyboard autofocus on mobile devices for command inputs
 * while still allowing manual focus when users tap the input.
 */
export function useMobileCommandInput(isOpen: boolean) {
  const inputRef = useRef<HTMLInputElement>(null);
  const hasUserInteracted = useRef(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    // Only prevent autofocus on mobile devices
    if (isOpen && isMobile && !hasUserInteracted.current) {
      // Prevent keyboard on mobile by removing autofocus on first open
      // This allows the dropdown to be searchable when user manually taps the input
      const timer = setTimeout(() => {
        if (inputRef.current && document.activeElement === inputRef.current) {
          inputRef.current.blur();
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isMobile]);

  const handleInputFocus = useCallback(() => {
    // Mark that user has interacted with the input
    hasUserInteracted.current = true;
  }, []);

  const handleOpenChange = useCallback(
    (newOpen: boolean, setOpen: (open: boolean) => void) => {
      setOpen(newOpen);
      if (!newOpen) {
        // Reset interaction flag when closing
        hasUserInteracted.current = false;
      }
    },
    []
  );

  return {
    inputRef,
    handleInputFocus,
    handleOpenChange,
  };
}
