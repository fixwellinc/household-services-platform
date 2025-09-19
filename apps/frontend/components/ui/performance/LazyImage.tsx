'use client';

import React from 'react';
import { useLazyImage, UseLazyImageOptions } from '@/hooks/use-lazy-loading';
import { cn } from '@/lib/utils';

export interface LazyImageProps extends Omit<UseLazyImageOptions, 'src' | 'alt'> {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
  style?: React.CSSProperties;
}

/**
 * Optimized lazy loading image component with WebP support
 * Automatically handles loading states, errors, and performance optimization
 */
export function LazyImage({
  src,
  alt,
  className,
  width,
  height,
  priority = false,
  onLoad,
  onError,
  style,
  ...options
}: LazyImageProps) {
  const {
    ref,
    imageProps,
    sources,
    isLoading,
    hasError,
  } = useLazyImage({
    src,
    alt,
    eager: priority,
    ...options,
  });

  const handleLoad = () => {
    imageProps.onLoad();
    onLoad?.();
  };

  const handleError = () => {
    imageProps.onError();
    onError?.();
  };

  return (
    <div
      ref={ref}
      className={cn(
        'relative overflow-hidden',
        isLoading && 'animate-pulse bg-gray-200 dark:bg-gray-800',
        className
      )}
      style={{
        width,
        height,
        ...style,
      }}
    >
      {sources.length > 0 ? (
        <picture>
          {sources.map((source, index) => (
            <source
              key={index}
              srcSet={source.srcSet}
              type={source.type}
              sizes={source.sizes}
            />
          ))}
          <img
            {...imageProps}
            onLoad={handleLoad}
            onError={handleError}
            className={cn(
              'w-full h-full object-cover transition-opacity duration-300',
              isLoading ? 'opacity-0' : 'opacity-100',
              hasError && 'opacity-50'
            )}
            width={width}
            height={height}
          />
        </picture>
      ) : (
        <img
          {...imageProps}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            'w-full h-full object-cover transition-opacity duration-300',
            isLoading ? 'opacity-0' : 'opacity-100',
            hasError && 'opacity-50'
          )}
          width={width}
          height={height}
        />
      )}
      
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-900">
          <div className="loading-dots text-gray-400">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      )}
      
      {/* Error overlay */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-50 dark:bg-red-900/20">
          <div className="text-center text-red-600 dark:text-red-400">
            <svg
              className="w-8 h-8 mx-auto mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <p className="text-xs">Failed to load</p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Lazy image with skeleton loading state
 */
export function LazyImageWithSkeleton({
  className,
  ...props
}: LazyImageProps) {
  return (
    <LazyImage
      {...props}
      className={cn(
        'skeleton-enhanced',
        className
      )}
    />
  );
}

/**
 * Responsive lazy image that adapts to container
 */
export function ResponsiveLazyImage({
  aspectRatio = '16/9',
  className,
  ...props
}: LazyImageProps & {
  aspectRatio?: string;
}) {
  return (
    <div
      className={cn('relative w-full', className)}
      style={{ aspectRatio }}
    >
      <LazyImage
        {...props}
        className="absolute inset-0 w-full h-full"
      />
    </div>
  );
}