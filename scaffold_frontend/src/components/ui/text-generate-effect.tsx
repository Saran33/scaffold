'use client';

import { useEffect } from 'react';
import { motion, stagger, useAnimate } from 'framer-motion';

import { cn } from '@/lib/utils/utils';

export const TextGenerateEffect = ({
  words,
  startDelay,
  className,
}: {
  words: string;
  startDelay?: number;
  className?: string;
}) => {
  const [scope, animate] = useAnimate();
  const wordsArray = words.split(' ');
  const delayOptions = () =>
    startDelay ? stagger(0.1, { startDelay }) : stagger(0.1);
  useEffect(() => {
    void animate(
      'span',
      {
        opacity: 1,
      },
      {
        duration: 2,
        delay: delayOptions(),
      }
    );
    // TODO: we may want to remove scope.current from the dependency array
    // but this isn't testable at the moment until we use RSC for chat
  }, [scope.current, animate, delayOptions]); // eslint-disable-line

  const renderWords = () => {
    return (
      <motion.div ref={scope}>
        {wordsArray.map((word, idx) => {
          return (
            <motion.span key={word + idx} className="opacity-0">
              {word}{' '}
            </motion.span>
          );
        })}
      </motion.div>
    );
  };

  return (
    <div className={cn('', className)}>
      <div>
        <div className="tracking-wide">{renderWords()}</div>
      </div>
    </div>
  );
};
