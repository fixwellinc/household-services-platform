import { useEffect, useRef, useState } from 'react';
import { useIntersectionObserver } from './use-intersection-observer';

export interface UseLazyLoadingOptions {
  /**
   * Root margin for intersection observer
   * @default '50px'
   */
  rootMargin?: string;
  /**
   * Threshold for intersection observer
   * @default 0.1
   */
  threshold?: number;
  /**
   * Whether to start loading immediately
   * @default false
   */
  eager?: boolean;
  /**
   * Placeholder image URL while loading
   */
  placeholder?: string;
  /**
   * Error fallback image URL
   */
  fallback?: string;
}

export interface UseLazyLoadingReturn {
  /** Reference to attach to the element */
  ref: React.RefObject<HTMLElement>;
  /** Whether the element should start loading */
  shouldLoad: boolean;
  /** Whether the element is currently loading */
  isLoading: boolean;
  /** Whether loading failed */
  hasError: boolean;
  /** Function to trigger loading manually */
  load: () => void;
  /** Function to reset loading state */
  reset: () => void;
}

/**
 * Hook for lazy loading content with intersection observer
 * Optimized for images and heavy content with proper error handling
 */
export function useLazyLoading(
  options: UseLazyLoadingOptions = {}
): UseLazyLoadingReturn {
  const {
    rootMargin = '50px',
    threshold = 0.1,
    eager = false,
  } = options;

  const [shouldLoad, setShouldLoad] = useState(eager);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  const { ref, hasIntersected } = useIntersectionObserver({
    rootMargin,
    threshold,
    triggerOnce: true,
    enabled: !eager,
  });

  useEffect(() => {
    if (hasIntersected && !shouldLoad) {
      setShouldLoad(true);
    }
  }, [hasIntersected, shouldLoad]);

  const load = () => {
    if (!shouldLoad) {
      setShouldLoad(true);
    }
  };

  const reset = () => {
    setShouldLoad(false);
    setIsLoading(false);
    setHasError(false);
  };

  return {
    ref,
    shouldLoad,
    isLoading,
    hasError,
    load,
    reset,
  };
}

/**
 * Hook specifically for lazy loading images with WebP support
 */
export interface UseLazyImageOptions extends UseLazyLoadingOptions {
  /**
   * Image source URL
   */
  src: string;
  /**
   * WebP source URL for better performance
   */
  webpSrc?: string;
  /**
   * Alt text for accessibility
   */
  alt: string;
  /**
   * Sizes attribute for responsive images
   */
  sizes?: string;
  /**
   * Srcset for responsive images
   */
  srcSet?: string;
}

export interface UseLazyImageReturn extends UseLazyLoadingReturn {
  /** Image props to spread on img element */
  imageProps: {
    src: string;
    alt: string;
    loading: 'lazy' | 'eager';
    onLoad: () => void;
    onError: () => void;
    sizes?: string;
    srcSet?: string;
  };
  /** Source elements for picture element with WebP support */
  sources: Array<{
    srcSet: string;
    type: string;
    sizes?: string;
  }>;
}

export function useLazyImage(
  options: UseLazyImageOptions
): UseLazyImageReturn {
  const {
    src,
    webpSrc,
    alt,
    sizes,
    srcSet,
    placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2Y3ZjhmOSIvPjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmaWxsPSIjYTFhMWFhIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5Mb2FkaW5nLi4uPC90ZXh0Pjwvc3ZnPg==',
    fallback = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2ZlZjJmMiIvPjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjEyIiBmaWxsPSIjZWY0NDQ0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5FcnJvcjwvdGV4dD48L3N2Zz4=',
    ...lazyOptions
  } = options;

  const lazyLoading = useLazyLoading(lazyOptions);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleLoad = () => {
    setImageLoaded(true);
    lazyLoading.reset();
  };

  const handleError = () => {
    setImageError(true);
  };

  // Determine which source to use
  const currentSrc = imageError ? fallback : 
                    !lazyLoading.shouldLoad ? placeholder : src;

  // Generate sources for picture element
  const sources = [];
  if (webpSrc && lazyLoading.shouldLoad && !imageError) {
    sources.push({
      srcSet: webpSrc,
      type: 'image/webp',
      sizes,
    });
  }

  const imageProps = {
    src: currentSrc,
    alt,
    loading: (lazyLoading.shouldLoad ? 'eager' : 'lazy') as 'lazy' | 'eager',
    onLoad: handleLoad,
    onError: handleError,
    ...(sizes && { sizes }),
    ...(srcSet && lazyLoading.shouldLoad && !imageError && { srcSet }),
  };

  return {
    ...lazyLoading,
    isLoading: lazyLoading.shouldLoad && !imageLoaded && !imageError,
    hasError: imageError,
    imageProps,
    sources,
  };
}