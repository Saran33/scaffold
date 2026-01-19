import * as React from 'react';

const MOBILE_BREAKPOINT = 768;
const MOBILE_USER_AGENT_REGEX =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;

export function useIsMobile(
  breakpoint: number = MOBILE_BREAKPOINT,
  checkTouch = true
) {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(
    undefined
  );

  React.useEffect(() => {
    // Static checks that don't change during session
    const isTouchDevice =
      'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isMobileUA = MOBILE_USER_AGENT_REGEX.test(navigator.userAgent);

    const checkMobileStatus = () => {
      const viewportWidth = window.innerWidth;

      // If checkTouch is false, only check viewport width
      if (!checkTouch) {
        return viewportWidth < breakpoint;
      }

      // Otherwise use the original logic
      return (
        // Mobile user agent takes priority
        isMobileUA ||
        // Small screen or touch capability
        isTouchDevice ||
        viewportWidth < breakpoint
      );
    };

    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);

    const updateMobileStatus = () => {
      setIsMobile(checkMobileStatus());
    };

    // Initial check
    updateMobileStatus();

    // Add responsive listeners
    mql.addEventListener('change', updateMobileStatus);
    window.addEventListener('orientationchange', updateMobileStatus);

    return () => {
      mql.removeEventListener('change', updateMobileStatus);
      window.removeEventListener('orientationchange', updateMobileStatus);
    };
  }, [breakpoint, checkTouch]);

  return isMobile ?? false;
}
