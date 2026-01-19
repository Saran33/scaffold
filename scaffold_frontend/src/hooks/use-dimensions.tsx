'use client';

import type { RefObject } from 'react';
import { useState, useCallback, useLayoutEffect } from 'react';
import { isMobile } from '@/lib/utils/utils';

function useDimensions(ref: RefObject<HTMLElement | null>) {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const handleResize = useCallback(() => {
    if (ref.current) {
      const adjustment = isMobile() ? 1 : 0;
      setDimensions({
        width: ref.current.offsetWidth - adjustment,
        height: ref.current.offsetHeight,
      });
    }
  }, [ref]);

  useLayoutEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [handleResize]);

  return dimensions;
}

export default useDimensions;
