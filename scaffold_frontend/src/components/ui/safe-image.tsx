'use client';

import { useState, useCallback, memo } from 'react';
import type { ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/utils/utils';

interface SafeImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  width?: number;
  height?: number;
  priority?: boolean;
  aspectRatio?: 'square' | 'video' | 'auto';
  showSkeleton?: boolean;
}

const SafeImageComponent = ({
  className = '',
  width,
  height,
  aspectRatio = 'auto',
  showSkeleton = true,
  onLoad,
  onError,
  ...props
}: SafeImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      setIsLoaded(true);
      onLoad?.(e);
    },
    [onLoad]
  );

  const handleError = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      setHasError(true);
      onError?.(e);
    },
    [onError]
  );

  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case 'square':
        return 'aspect-square';
      case 'video':
        return 'aspect-video';
      default:
        return '';
    }
  };

  return (
    <div className={cn('relative overflow-hidden', getAspectRatioClass())}>
      {/* Skeleton loader */}
      {showSkeleton && !isLoaded && !hasError && (
        <div className="absolute inset-0 animate-pulse bg-muted/80 backdrop-blur-sm" />
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground">
          <div className="text-center">
            <div className="text-sm">Failed to load image</div>
          </div>
        </div>
      )}

      {/* Actual image */}
      {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text -- User-generated images, avoiding server-side caching */}
      <img
        {...props}
        className={cn(
          'transition-all duration-500 ease-out',
          isLoaded ? 'scale-100 opacity-100' : 'scale-95 opacity-0',
          className
        )}
        onLoad={handleLoad}
        onError={handleError}
        loading={props.priority ? 'eager' : 'lazy'}
      />
    </div>
  );
};

export const SafeImage = memo(SafeImageComponent);
