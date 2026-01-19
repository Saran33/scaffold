import React from 'react';

const useShouldAnimate = (
  animationPlayedKey: string,
  shouldAnimateInitially: boolean,
  sessionStorageDuration: number = 30000
): [boolean, () => void] => {
  const [shouldAnimate, setShouldAnimate] = React.useState(
    shouldAnimateInitially && !sessionStorage.getItem(animationPlayedKey)
  );

  const onAnimationComplete = React.useCallback(() => {
    if (!shouldAnimate) return;

    setShouldAnimate(false);
    sessionStorage.setItem(animationPlayedKey, JSON.stringify(Date.now()));
    setTimeout(() => {
      sessionStorage.removeItem(animationPlayedKey);
    }, sessionStorageDuration);
  }, [animationPlayedKey, sessionStorageDuration, shouldAnimate]);

  React.useEffect(() => {
    const stampStr = sessionStorage.getItem(animationPlayedKey);
    const storedTimestamp = stampStr ? JSON.parse(stampStr) : null;
    if (storedTimestamp) {
      const timeElapsed = Date.now() - storedTimestamp;
      if (timeElapsed >= sessionStorageDuration) {
        sessionStorage.removeItem(animationPlayedKey);
      } else {
        const timeout = setTimeout(() => {
          sessionStorage.removeItem(animationPlayedKey);
        }, sessionStorageDuration - timeElapsed);

        return () => clearTimeout(timeout);
      }
    }
  }, [animationPlayedKey, sessionStorageDuration]);

  return [shouldAnimate, onAnimationComplete];
};

export default useShouldAnimate;
