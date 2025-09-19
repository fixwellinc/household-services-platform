/**
 * Image optimization utilities for WebP support and performance
 */

export interface ImageOptimizationOptions {
  /**
   * Quality for WebP conversion (0-100)
   * @default 80
   */
  quality?: number;
  /**
   * Maximum width for responsive images
   */
  maxWidth?: number;
  /**
   * Maximum height for responsive images
   */
  maxHeight?: number;
  /**
   * Whether to generate multiple sizes
   * @default true
   */
  responsive?: boolean;
  /**
   * Sizes for responsive images
   * @default [320, 640, 768, 1024, 1280, 1920]
   */
  sizes?: number[];
  /**
   * Format preference order
   * @default ['webp', 'jpeg', 'png']
   */
  formats?: ('webp' | 'jpeg' | 'png' | 'avif')[];
}

export interface OptimizedImageData {
  src: string;
  webpSrc?: string;
  avifSrc?: string;
  srcSet?: string;
  webpSrcSet?: string;
  avifSrcSet?: string;
  sizes: string;
  width: number;
  height: number;
  aspectRatio: string;
  placeholder: string;
}

/**
 * Check if WebP is supported by the browser
 */
export function supportsWebP(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }

    const webP = new Image();
    webP.onload = webP.onerror = () => {
      resolve(webP.height === 2);
    };
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });
}

/**
 * Check if AVIF is supported by the browser
 */
export function supportsAVIF(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }

    const avif = new Image();
    avif.onload = avif.onerror = () => {
      resolve(avif.height === 2);
    };
    avif.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A=';
  });
}

/**
 * Generate optimized image URLs for different formats and sizes
 */
export function generateOptimizedImageUrls(
  originalSrc: string,
  options: ImageOptimizationOptions = {}
): OptimizedImageData {
  const {
    quality = 80,
    responsive = true,
    sizes = [320, 640, 768, 1024, 1280, 1920],
    formats = ['webp', 'jpeg'],
  } = options;

  // Extract file extension and base URL
  const url = new URL(originalSrc, window.location.origin);
  const pathParts = url.pathname.split('.');
  const extension = pathParts.pop() || 'jpg';
  const basePath = pathParts.join('.');

  // Generate URLs for different formats
  const generateUrl = (format: string, width?: number) => {
    const params = new URLSearchParams();
    params.set('format', format);
    params.set('quality', quality.toString());
    if (width) {
      params.set('width', width.toString());
    }
    return `${basePath}.${extension}?${params.toString()}`;
  };

  // Generate srcSet for different sizes
  const generateSrcSet = (format: string) => {
    if (!responsive) return undefined;
    
    return sizes
      .map(size => `${generateUrl(format, size)} ${size}w`)
      .join(', ');
  };

  // Generate sizes attribute
  const sizesAttribute = responsive
    ? '(max-width: 320px) 280px, (max-width: 640px) 600px, (max-width: 768px) 720px, (max-width: 1024px) 980px, (max-width: 1280px) 1200px, 1800px'
    : '100vw';

  // Generate placeholder (low-quality image placeholder)
  const placeholder = generateUrl('jpeg', 40);

  // Determine dimensions (this would typically come from image metadata)
  const width = options.maxWidth || 1920;
  const height = options.maxHeight || Math.round(width * 0.75); // Default 4:3 aspect ratio
  const aspectRatio = `${width}/${height}`;

  const result: OptimizedImageData = {
    src: generateUrl('jpeg'),
    sizes: sizesAttribute,
    width,
    height,
    aspectRatio,
    placeholder,
  };

  // Add format-specific URLs and srcSets
  if (formats.includes('webp')) {
    result.webpSrc = generateUrl('webp');
    result.webpSrcSet = generateSrcSet('webp');
  }

  if (formats.includes('avif')) {
    result.avifSrc = generateUrl('avif');
    result.avifSrcSet = generateSrcSet('avif');
  }

  if (responsive) {
    result.srcSet = generateSrcSet('jpeg');
  }

  return result;
}

/**
 * Create a low-quality image placeholder (LQIP)
 */
export function generateLQIP(
  src: string,
  width: number = 40,
  quality: number = 20
): string {
  const url = new URL(src, window.location.origin);
  const params = new URLSearchParams();
  params.set('width', width.toString());
  params.set('quality', quality.toString());
  params.set('blur', '2');
  
  return `${url.pathname}?${params.toString()}`;
}

/**
 * Preload critical images
 */
export function preloadImage(src: string, options: { as?: string; crossorigin?: string } = {}): void {
  if (typeof window === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = options.as || 'image';
  link.href = src;
  
  if (options.crossorigin) {
    link.crossOrigin = options.crossorigin;
  }

  document.head.appendChild(link);
}

/**
 * Preload critical images with multiple formats
 */
export function preloadOptimizedImage(
  src: string,
  options: ImageOptimizationOptions = {}
): void {
  const optimized = generateOptimizedImageUrls(src, options);
  
  // Preload the most appropriate format
  Promise.all([supportsAVIF(), supportsWebP()]).then(([avif, webp]) => {
    let preloadSrc = optimized.src;
    
    if (avif && optimized.avifSrc) {
      preloadSrc = optimized.avifSrc;
    } else if (webp && optimized.webpSrc) {
      preloadSrc = optimized.webpSrc;
    }
    
    preloadImage(preloadSrc);
  });
}

/**
 * Image loading performance monitor
 */
export class ImagePerformanceMonitor {
  private static instance: ImagePerformanceMonitor;
  private loadTimes: Map<string, number> = new Map();
  private loadErrors: Map<string, Error> = new Map();

  static getInstance(): ImagePerformanceMonitor {
    if (!ImagePerformanceMonitor.instance) {
      ImagePerformanceMonitor.instance = new ImagePerformanceMonitor();
    }
    return ImagePerformanceMonitor.instance;
  }

  /**
   * Track image loading performance
   */
  trackImageLoad(src: string, startTime: number, endTime: number): void {
    const loadTime = endTime - startTime;
    this.loadTimes.set(src, loadTime);
    
    // Log slow loading images
    if (loadTime > 3000) {
      console.warn(`Slow image load detected: ${src} took ${loadTime}ms`);
    }
  }

  /**
   * Track image loading errors
   */
  trackImageError(src: string, error: Error): void {
    this.loadErrors.set(src, error);
    console.error(`Image load error: ${src}`, error);
  }

  /**
   * Get performance statistics
   */
  getStats(): {
    averageLoadTime: number;
    slowImages: Array<{ src: string; loadTime: number }>;
    errorCount: number;
    totalImages: number;
  } {
    const loadTimes = Array.from(this.loadTimes.values());
    const averageLoadTime = loadTimes.length > 0 
      ? loadTimes.reduce((sum, time) => sum + time, 0) / loadTimes.length 
      : 0;

    const slowImages = Array.from(this.loadTimes.entries())
      .filter(([, time]) => time > 2000)
      .map(([src, loadTime]) => ({ src, loadTime }))
      .sort((a, b) => b.loadTime - a.loadTime);

    return {
      averageLoadTime,
      slowImages,
      errorCount: this.loadErrors.size,
      totalImages: this.loadTimes.size,
    };
  }

  /**
   * Clear performance data
   */
  clear(): void {
    this.loadTimes.clear();
    this.loadErrors.clear();
  }
}

/**
 * Utility to convert images to WebP format (client-side)
 */
export function convertToWebP(
  imageFile: File,
  quality: number = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to convert image to WebP'));
            }
          },
          'image/webp',
          quality
        );
      } else {
        reject(new Error('Failed to get canvas context'));
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = URL.createObjectURL(imageFile);
  });
}

/**
 * Responsive image breakpoints
 */
export const RESPONSIVE_BREAKPOINTS = {
  xs: 320,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1920,
} as const;

/**
 * Generate responsive image sizes string
 */
export function generateSizesString(
  breakpoints: Partial<Record<keyof typeof RESPONSIVE_BREAKPOINTS, string>>
): string {
  const entries = Object.entries(breakpoints) as Array<[keyof typeof RESPONSIVE_BREAKPOINTS, string]>;
  
  const mediaQueries = entries
    .map(([breakpoint, size]) => {
      const width = RESPONSIVE_BREAKPOINTS[breakpoint];
      return `(max-width: ${width}px) ${size}`;
    })
    .join(', ');

  // Add default size at the end
  return `${mediaQueries}, 100vw`;
}