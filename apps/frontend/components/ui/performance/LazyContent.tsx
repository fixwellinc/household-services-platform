'use client';

import React, { Suspense, lazy, ComponentType } from 'react';
import { useLazyLoading } from '@/hooks/use-lazy-loading';
import { PerformanceOptimizedAnimation } from './PerformanceOptimizedAnimation';
import { cn } from '@/lib/utils';

export interface LazyContentProps {
  children: React.ReactNode;
  /**
   * Loading placeholder component
   */
  fallback?: React.ComponentType;
  /**
   * Error boundary component
   */
  errorBoundary?: React.ComponentType<{ error: Error; retry: () => void }>;
  /**
   * Whether to animate content when it loads
   * @default true
   */
  animate?: boolean;
  /**
   * Animation type for content reveal
   * @default 'fade-in'
   */
  animation?: 'fade-in' | 'slide-up' | 'scale-in';
  /**
   * Intersection observer options
   */
  intersectionOptions?: {
    threshold?: number;
    rootMargin?: string;
  };
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Default loading skeleton component
 */
const DefaultSkeleton = () => (
  <div className="animate-pulse space-y-4">
    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
  </div>
);

/**
 * Default error boundary component
 */
const DefaultErrorBoundary = ({ 
  error, 
  retry 
}: { 
  error: Error; 
  retry: () => void; 
}) => (
  <div className="p-4 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-900/20">
    <h3 className="text-red-800 dark:text-red-200 font-medium mb-2">
      Failed to load content
    </h3>
    <p className="text-red-600 dark:text-red-400 text-sm mb-3">
      {error.message}
    </p>
    <button
      onClick={retry}
      className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
    >
      Try again
    </button>
  </div>
);

/**
 * Lazy content component with intersection observer and animations
 */
export function LazyContent({
  children,
  fallback: Fallback = DefaultSkeleton,
  errorBoundary: ErrorBoundary = DefaultErrorBoundary,
  animate = true,
  animation = 'fade-in',
  intersectionOptions = {},
  className,
}: LazyContentProps) {
  const {
    ref,
    shouldLoad,
    isLoading,
    hasError,
    reset,
  } = useLazyLoading({
    threshold: intersectionOptions.threshold || 0.1,
    rootMargin: intersectionOptions.rootMargin || '50px',
  });

  if (hasError) {
    return (
      <div ref={ref} className={className}>
        <ErrorBoundary error={new Error('Content failed to load')} retry={reset} />
      </div>
    );
  }

  if (!shouldLoad || isLoading) {
    return (
      <div ref={ref} className={cn('lazy-content-loading', className)}>
        <Fallback />
      </div>
    );
  }

  const content = (
    <div className={cn('lazy-content-loaded', className)}>
      {children}
    </div>
  );

  if (animate) {
    return (
      <PerformanceOptimizedAnimation
        animation={animation}
        triggerOnScroll={false}
        immediate={true}
      >
        {content}
      </PerformanceOptimizedAnimation>
    );
  }

  return content;
}

/**
 * Higher-order component for lazy loading React components
 */
export function withLazyLoading<P extends object>(
  Component: ComponentType<P>,
  options: Omit<LazyContentProps, 'children'> = {}
) {
  return function LazyWrappedComponent(props: P) {
    return (
      <LazyContent {...options}>
        <Component {...props} />
      </LazyContent>
    );
  };
}

/**
 * Lazy section component for heavy content sections
 */
export interface LazySectionProps extends LazyContentProps {
  /**
   * Section title for accessibility
   */
  title?: string;
  /**
   * Minimum height to prevent layout shift
   */
  minHeight?: string | number;
}

export function LazySection({
  title,
  minHeight = '200px',
  className,
  children,
  ...lazyProps
}: LazySectionProps) {
  return (
    <section
      className={cn('lazy-section', className)}
      style={{ minHeight }}
      aria-label={title}
    >
      <LazyContent {...lazyProps}>
        {children}
      </LazyContent>
    </section>
  );
}

/**
 * Lazy image gallery component
 */
export interface LazyImageGalleryProps {
  images: Array<{
    src: string;
    alt: string;
    webpSrc?: string;
  }>;
  className?: string;
  imageClassName?: string;
  columns?: number;
}

export function LazyImageGallery({
  images,
  className,
  imageClassName,
  columns = 3,
}: LazyImageGalleryProps) {
  return (
    <div
      className={cn(
        'grid gap-4',
        {
          'grid-cols-1': columns === 1,
          'grid-cols-2': columns === 2,
          'grid-cols-3': columns === 3,
          'grid-cols-4': columns === 4,
        },
        className
      )}
    >
      {images.map((image, index) => (
        <LazyContent
          key={image.src}
          animation="scale-in"
          intersectionOptions={{ threshold: 0.1, rootMargin: '100px' }}
          fallback={() => (
            <div className={cn(
              'aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse',
              imageClassName
            )} />
          )}
        >
          <img
            src={image.src}
            alt={image.alt}
            className={cn(
              'w-full h-full object-cover rounded-lg transition-transform duration-300 hover:scale-105',
              imageClassName
            )}
            loading="lazy"
          />
        </LazyContent>
      ))}
    </div>
  );
}

/**
 * Lazy video component with poster and controls
 */
export interface LazyVideoProps {
  src: string;
  poster?: string;
  className?: string;
  controls?: boolean;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
}

export function LazyVideo({
  src,
  poster,
  className,
  controls = true,
  autoPlay = false,
  muted = false,
  loop = false,
}: LazyVideoProps) {
  return (
    <LazyContent
      animation="fade-in"
      intersectionOptions={{ threshold: 0.2, rootMargin: '50px' }}
      fallback={() => (
        <div className={cn(
          'aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse flex items-center justify-center',
          className
        )}>
          <svg
            className="w-12 h-12 text-gray-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M8 5v10l7-5-7-5z" />
          </svg>
        </div>
      )}
    >
      <video
        src={src}
        poster={poster}
        controls={controls}
        autoPlay={autoPlay}
        muted={muted}
        loop={loop}
        className={cn(
          'w-full h-full rounded-lg',
          className
        )}
        preload="metadata"
      />
    </LazyContent>
  );
}