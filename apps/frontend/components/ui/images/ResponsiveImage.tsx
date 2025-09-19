'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useIntersectionObserver } from '@/hooks/use-intersection-observer';
import { useResponsiveImageSize, useResponsiveAspectRatio } from '@/hooks/use-container-query';

interface ResponsiveImageProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  sizes?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  aspectRatio?: string;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  objectPosition?: string;
  loading?: 'lazy' | 'eager';
  onLoad?: () => void;
  onError?: () => void;
  fallbackSrc?: string;
  responsive?: {
    xs?: { width: number; height: number };
    sm?: { width: number; height: number };
    md?: { width: number; height: number };
    lg?: { width: number; height: number };
    xl?: { width: number; height: number };
    '2xl'?: { width: number; height: number };
  };
  aspectRatios?: {
    xs?: string;
    sm?: string;
    md?: string;
    lg?: string;
    xl?: string;
    '2xl'?: string;
  };
}

export function ResponsiveImage({
  src,
  alt,
  className,
  priority = false,
  quality = 75,
  placeholder = 'empty',
  blurDataURL,
  sizes,
  fill = false,
  width,
  height,
  aspectRatio,
  objectFit = 'cover',
  objectPosition = 'center',
  loading = 'lazy',
  onLoad,
  onError,
  fallbackSrc,
  responsive,
  aspectRatios,
}: ResponsiveImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);
  const imageRef = useRef<HTMLDivElement>(null);

  // Use intersection observer for lazy loading
  const { isIntersecting } = useIntersectionObserver(imageRef, {
    threshold: 0.1,
    rootMargin: '50px',
  });

  // Get responsive dimensions
  const responsiveDimensions = useResponsiveImageSize(responsive || {});
  const responsiveAspectRatio = useResponsiveAspectRatio(aspectRatios || {});

  // Determine if image should load
  const shouldLoad = priority || loading === 'eager' || isIntersecting;

  // Handle image load
  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  // Handle image error
  const handleError = () => {
    setHasError(true);
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      setHasError(false);
    }
    onError?.();
  };

  // Calculate dimensions
  const finalWidth = width || responsiveDimensions.width;
  const finalHeight = height || responsiveDimensions.height;
  const finalAspectRatio = aspectRatio || responsiveAspectRatio;

  // Generate responsive sizes if not provided
  const responsiveSizes = sizes || `
    (max-width: 640px) ${Math.round(finalWidth * 0.9)}px,
    (max-width: 768px) ${Math.round(finalWidth * 0.8)}px,
    (max-width: 1024px) ${Math.round(finalWidth * 0.7)}px,
    ${finalWidth}px
  `;

  const containerStyle = {
    aspectRatio: finalAspectRatio,
  };

  const imageClasses = cn(
    'transition-all duration-300',
    isLoaded ? 'opacity-100' : 'opacity-0',
    className
  );

  return (
    <div
      ref={imageRef}
      className={cn(
        'relative overflow-hidden bg-gray-100',
        'smooth-breakpoint',
        !fill && 'inline-block'
      )}
      style={!fill ? containerStyle : undefined}
    >
      {/* Loading placeholder */}
      {!isLoaded && shouldLoad && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="animate-pulse">
            <div className="w-8 h-8 bg-gray-300 rounded-full animate-bounce"></div>
          </div>
        </div>
      )}

      {/* Skeleton placeholder when not in view */}
      {!shouldLoad && (
        <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-shimmer bg-size-200 bg-pos-0"></div>
      )}

      {/* Error state */}
      {hasError && !fallbackSrc && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      )}

      {/* Actual image */}
      {shouldLoad && !hasError && (
        <Image
          src={currentSrc}
          alt={alt}
          fill={fill}
          width={!fill ? finalWidth : undefined}
          height={!fill ? finalHeight : undefined}
          sizes={responsiveSizes}
          quality={quality}
          priority={priority}
          placeholder={placeholder}
          blurDataURL={blurDataURL}
          className={cn(
            imageClasses,
            fill && `object-${objectFit}`,
            objectPosition && `object-${objectPosition}`
          )}
          style={!fill ? { objectFit, objectPosition } : undefined}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
    </div>
  );
}

interface ResponsiveImageGridProps {
  images: Array<{
    src: string;
    alt: string;
    caption?: string;
  }>;
  columns?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    '2xl'?: number;
  };
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  aspectRatio?: string;
  className?: string;
  onImageClick?: (index: number) => void;
}

export function ResponsiveImageGrid({
  images,
  columns = { xs: 1, sm: 2, md: 3, lg: 4 },
  gap = 'md',
  aspectRatio = '1 / 1',
  className,
  onImageClick,
}: ResponsiveImageGridProps) {
  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8',
  };

  const getGridColumns = () => {
    const breakpoints = Object.entries(columns)
      .map(([breakpoint, cols]) => {
        if (breakpoint === 'xs') return `grid-cols-${cols}`;
        return `${breakpoint}:grid-cols-${cols}`;
      })
      .join(' ');
    
    return breakpoints;
  };

  return (
    <div className={cn(
      'grid',
      getGridColumns(),
      gapClasses[gap],
      'smooth-breakpoint',
      className
    )}>
      {images.map((image, index) => (
        <div
          key={index}
          className={cn(
            'group cursor-pointer',
            onImageClick && 'hover:scale-105 transition-transform duration-300'
          )}
          onClick={() => onImageClick?.(index)}
        >
          <ResponsiveImage
            src={image.src}
            alt={image.alt}
            aspectRatio={aspectRatio}
            className="rounded-lg group-hover:shadow-lg transition-shadow duration-300"
            loading="lazy"
          />
          {image.caption && (
            <p className="mt-2 text-sm text-gray-600 text-center">
              {image.caption}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

interface ResponsiveHeroImageProps {
  src: string;
  alt: string;
  className?: string;
  overlay?: boolean;
  overlayColor?: string;
  overlayOpacity?: number;
  children?: React.ReactNode;
  height?: {
    xs?: string;
    sm?: string;
    md?: string;
    lg?: string;
    xl?: string;
    '2xl'?: string;
  };
}

export function ResponsiveHeroImage({
  src,
  alt,
  className,
  overlay = false,
  overlayColor = 'black',
  overlayOpacity = 0.4,
  children,
  height = { xs: '50vh', md: '60vh', lg: '70vh' },
}: ResponsiveHeroImageProps) {
  const getHeightClasses = () => {
    return Object.entries(height)
      .map(([breakpoint, h]) => {
        if (breakpoint === 'xs') return `h-[${h}]`;
        return `${breakpoint}:h-[${h}]`;
      })
      .join(' ');
  };

  return (
    <div className={cn(
      'relative overflow-hidden',
      getHeightClasses(),
      'smooth-breakpoint',
      className
    )}>
      <ResponsiveImage
        src={src}
        alt={alt}
        fill
        priority
        objectFit="cover"
        className="absolute inset-0"
      />
      
      {overlay && (
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: overlayColor,
            opacity: overlayOpacity,
          }}
        />
      )}
      
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative z-10 text-center text-white">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

interface AdaptiveImageProps {
  src: string;
  alt: string;
  className?: string;
  breakpointSources?: {
    xs?: string;
    sm?: string;
    md?: string;
    lg?: string;
    xl?: string;
    '2xl'?: string;
  };
  aspectRatio?: string;
  loading?: 'lazy' | 'eager';
}

export function AdaptiveImage({
  src,
  alt,
  className,
  breakpointSources = {},
  aspectRatio = '16 / 9',
  loading = 'lazy',
}: AdaptiveImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src);

  useEffect(() => {
    const updateImageSource = () => {
      const width = window.innerWidth;
      
      let newSrc = src;
      
      if (width >= 1536 && breakpointSources['2xl']) {
        newSrc = breakpointSources['2xl'];
      } else if (width >= 1280 && breakpointSources.xl) {
        newSrc = breakpointSources.xl;
      } else if (width >= 1024 && breakpointSources.lg) {
        newSrc = breakpointSources.lg;
      } else if (width >= 768 && breakpointSources.md) {
        newSrc = breakpointSources.md;
      } else if (width >= 640 && breakpointSources.sm) {
        newSrc = breakpointSources.sm;
      } else if (breakpointSources.xs) {
        newSrc = breakpointSources.xs;
      }
      
      setCurrentSrc(newSrc);
    };

    updateImageSource();
    window.addEventListener('resize', updateImageSource);
    
    return () => window.removeEventListener('resize', updateImageSource);
  }, [src, breakpointSources]);

  return (
    <ResponsiveImage
      src={currentSrc}
      alt={alt}
      aspectRatio={aspectRatio}
      loading={loading}
      className={className}
    />
  );
}