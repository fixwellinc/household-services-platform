'use client';

import React, { useState, useEffect } from 'react';
import { generateOptimizedImageUrls, ImagePerformanceMonitor } from '@/lib/image-optimization';
import { useProgressiveEnhancement } from '@/lib/progressive-enhancement';
import { usePerformanceMonitor } from '@/lib/performance-monitor';
import { useLazyLoading } from '@/hooks/use-lazy-loading';
import { cn } from '@/lib/utils';

export interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  quality?: number;
  sizes?: string;
  placeholder?: 'blur' | 'empty' | string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  style?: React.CSSProperties;
  /**
   * Whether to use progressive enhancement
   * @default true
   */
  progressive?: boolean;
  /**
   * Whether to adapt to performance
   * @default true
   */
  adaptive?: boolean;
}

/**
 * Highly optimized image component with WebP/AVIF support,
 * progressive enhancement, and performance monitoring
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  quality = 80,
  sizes,
  placeholder = 'blur',
  onLoad,
  onError,
  style,
  progressive = true,
  adaptive = true,
}: OptimizedImageProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState<Error | null>(null);
  const [loadStartTime, setLoadStartTime] = useState<number>(0);

  // Progressive enhancement and performance monitoring
  const { featureSupport, enhancementLevel } = useProgressiveEnhancement();
  const { metrics, adaptToPerformance } = usePerformanceMonitor();

  // Lazy loading (disabled for priority images)
  const {
    ref,
    shouldLoad,
  } = useLazyLoading({
    eager: priority,
    threshold: 0.1,
    rootMargin: '50px',
  });

  // Performance adaptation
  const performanceAdaptation = adaptive ? adaptToPerformance() : null;

  // Generate optimized image URLs
  const optimizedImages = React.useMemo(() => {
    if (!shouldLoad) return null;

    const adaptedQuality = performanceAdaptation?.shouldReduceImageQuality 
      ? Math.max(quality - 20, 40) 
      : quality;

    return generateOptimizedImageUrls(src, {
      quality: adaptedQuality,
      maxWidth: width,
      maxHeight: height,
      responsive: true,
      formats: featureSupport ? [
        ...(featureSupport.avif ? ['avif'] : []),
        ...(featureSupport.webp ? ['webp'] : []),
        'jpeg'
      ] : ['jpeg'],
    });
  }, [src, shouldLoad, quality, width, height, featureSupport, performanceAdaptation]);

  // Handle image load
  const handleLoad = () => {
    if (loadStartTime > 0) {
      const loadEndTime = performance.now();
      ImagePerformanceMonitor.getInstance().trackImageLoad(
        src,
        loadStartTime,
        loadEndTime
      );
    }

    setImageLoaded(true);
    onLoad?.();
  };

  // Handle image error
  const handleError = (error: Event) => {
    const errorObj = new Error(`Failed to load image: ${src}`);
    
    ImagePerformanceMonitor.getInstance().trackImageError(src, errorObj);
    setImageError(errorObj);
    onError?.(errorObj);
  };

  // Start load timing when image starts loading
  useEffect(() => {
    if (shouldLoad && !loadStartTime) {
      setLoadStartTime(performance.now());
    }
  }, [shouldLoad, loadStartTime]);

  // Don't render anything if not ready to load
  if (!shouldLoad || !optimizedImages) {
    return (
      <div
        ref={ref}
        className={cn(
          'bg-gray-200 dark:bg-gray-700 animate-pulse',
          className
        )}
        style={{
          width,
          height,
          aspectRatio: width && height ? `${width}/${height}` : undefined,
          ...style,
        }}
      />
    );
  }

  // Fallback for basic enhancement level
  if (progressive && enhancementLevel?.level === 'basic') {
    return (
      <img
        ref={ref}
        src={optimizedImages.src}
        alt={alt}
        width={width}
        height={height}
        className={cn(
          'transition-opacity duration-300',
          imageLoaded ? 'opacity-100' : 'opacity-0',
          className
        )}
        style={style}
        onLoad={handleLoad}
        onError={handleError}
        loading={priority ? 'eager' : 'lazy'}
      />
    );
  }

  // Enhanced image with multiple format support
  return (
    <div
      ref={ref}
      className={cn('relative overflow-hidden', className)}
      style={{
        width,
        height,
        aspectRatio: optimizedImages.aspectRatio,
        ...style,
      }}
    >
      {/* Placeholder */}
      {!imageLoaded && placeholder !== 'empty' && (
        <div className="absolute inset-0">
          {placeholder === 'blur' ? (
            <img
              src={optimizedImages.placeholder}
              alt=""
              className="w-full h-full object-cover filter blur-sm scale-110"
              aria-hidden="true"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
          )}
        </div>
      )}

      {/* Main image with format support */}
      <picture>
        {/* AVIF source */}
        {optimizedImages.avifSrc && (
          <source
            srcSet={optimizedImages.avifSrcSet || optimizedImages.avifSrc}
            type="image/avif"
            sizes={sizes || optimizedImages.sizes}
          />
        )}
        
        {/* WebP source */}
        {optimizedImages.webpSrc && (
          <source
            srcSet={optimizedImages.webpSrcSet || optimizedImages.webpSrc}
            type="image/webp"
            sizes={sizes || optimizedImages.sizes}
          />
        )}
        
        {/* Fallback JPEG */}
        <img
          src={optimizedImages.src}
          srcSet={optimizedImages.srcSet}
          alt={alt}
          width={width}
          height={height}
          sizes={sizes || optimizedImages.sizes}
          className={cn(
            'w-full h-full object-cover transition-opacity duration-300',
            imageLoaded ? 'opacity-100' : 'opacity-0'
          )}
          onLoad={handleLoad}
          onError={handleError}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
        />
      </picture>

      {/* Error state */}
      {imageError && (
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

      {/* Performance indicator (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-2 right-2">
          <div className={cn(
            'w-2 h-2 rounded-full',
            imageLoaded ? 'bg-green-500' : 'bg-yellow-500'
          )} />
        </div>
      )}
    </div>
  );
}

/**
 * Optimized image with aspect ratio container
 */
export interface ResponsiveOptimizedImageProps extends OptimizedImageProps {
  aspectRatio?: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
}

export function ResponsiveOptimizedImage({
  aspectRatio = '16/9',
  objectFit = 'cover',
  className,
  ...props
}: ResponsiveOptimizedImageProps) {
  return (
    <div
      className={cn('relative w-full', className)}
      style={{ aspectRatio }}
    >
      <OptimizedImage
        {...props}
        className={cn(
          'absolute inset-0 w-full h-full',
          `object-${objectFit}`
        )}
      />
    </div>
  );
}

/**
 * Optimized image gallery with performance monitoring
 */
export interface OptimizedImageGalleryProps {
  images: Array<{
    src: string;
    alt: string;
    width?: number;
    height?: number;
  }>;
  className?: string;
  imageClassName?: string;
  columns?: number;
  gap?: string;
  quality?: number;
  priority?: number; // Number of priority images to load immediately
}

export function OptimizedImageGallery({
  images,
  className,
  imageClassName,
  columns = 3,
  gap = '1rem',
  quality = 75,
  priority = 2,
}: OptimizedImageGalleryProps) {
  return (
    <div
      className={cn(
        'grid',
        {
          'grid-cols-1': columns === 1,
          'grid-cols-2': columns === 2,
          'grid-cols-3': columns === 3,
          'grid-cols-4': columns === 4,
        },
        className
      )}
      style={{ gap }}
    >
      {images.map((image, index) => (
        <ResponsiveOptimizedImage
          key={image.src}
          src={image.src}
          alt={image.alt}
          width={image.width}
          height={image.height}
          className={imageClassName}
          quality={quality}
          priority={index < priority}
          aspectRatio="1/1"
        />
      ))}
    </div>
  );
}

/**
 * Hero image with optimized loading
 */
export interface OptimizedHeroImageProps extends OptimizedImageProps {
  overlay?: boolean;
  overlayOpacity?: number;
  children?: React.ReactNode;
}

export function OptimizedHeroImage({
  overlay = false,
  overlayOpacity = 0.4,
  children,
  className,
  ...props
}: OptimizedHeroImageProps) {
  return (
    <div className={cn('relative', className)}>
      <OptimizedImage
        {...props}
        priority={true}
        className="w-full h-full object-cover"
      />
      
      {overlay && (
        <div
          className="absolute inset-0 bg-black"
          style={{ opacity: overlayOpacity }}
        />
      )}
      
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
}