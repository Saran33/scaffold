'use client';

import React from 'react';
import {
  type MotionValue,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from 'framer-motion';

export function useCheckmarkProgress() {
  const progress = useMotionValue(0);
  const progressSpring = useSpring(progress, { stiffness: 40 });
  const progressValue = useTransform(progressSpring, [0, 100], [0, 100]);
  const successMsgProgress = useTransform(progress, [0, 100], [0, 1]);

  const setProgress = (value: number) => {
    progress.set(value);
  };

  return { progress, progressValue, successMsgProgress, setProgress };
}

interface CheckmarkProgressProps {
  progress: MotionValue<number>;
  height?: number;
  width?: number;
  strokeWidth?: number;
}

export default function CheckmarkProgress({
  progress,
  width = 33,
  height = 33,
  strokeWidth = 12,
}: CheckmarkProgressProps) {
  const circleLength = useTransform(progress, [0, 100], [0, 1]);
  const checkmarkPathLength = useTransform(progress, [0, 95, 100], [0, 0, 1]);
  const circleColor = useTransform(
    progress,
    [0, 95, 100],
    ['#FFCC66', '#FFCC66', '#66BB66']
  );

  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox="0 0 258 258"
      data-test-id="checkmark-progress"
    >
      {/* Check mark  */}
      <motion.path
        transform="translate(60 85)"
        d="M3 50L45 92L134 3"
        fill="transparent"
        stroke="#7BB86F"
        strokeWidth={strokeWidth}
        style={{ pathLength: checkmarkPathLength }}
      />
      {/* Circle */}
      <motion.path
        d="M 130 6 C 198.483 6 254 61.517 254 130 C 254 198.483 198.483 254 130 254 C 61.517 254 6 198.483 6 130 C 6 61.517 61.517 6 130 6 Z"
        fill="transparent"
        strokeWidth={strokeWidth}
        stroke={circleColor}
        style={{
          pathLength: circleLength,
        }}
      />
    </motion.svg>
  );
}
