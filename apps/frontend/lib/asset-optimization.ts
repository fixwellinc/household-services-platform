/**
 * Asset Optimization Utilities
 * Provides utilities for optimizing images, fonts, and other assets
 */

import { ImageProps } from 'next/image';

/**
 * Image optimization configuration
 */
export const imageOptimization = {
  // Supported formats in order of preference
  formats: ['avif', 'webp', 'jpeg', 'png'] as const,
  
  // Quality settings for different use cases
  quality: {
    thumbnail: 60,
    standard: 75,
    high: 85,
    lossless: 100,
  },
  
  // Size breakpoints for responsive images
  breakpoints: [640, 768, 1024, 1280, 1536, 1920],
  
  // Lazy loading configuration
  lazyLoading: {
    rootMargin: '50px',
    threshold: 0.1,
  },
} as const;

/**
 * Generate optimized image props for Next.js Image component
 */
export function getOptimizedImageProps(
  src: string,
  alt: string,
  options: {
    priority?: boolean;
    quality?: keyof typeof imageOptimization.quality;
    sizes?: string;
    fill?: boolean;
    width?: number;
    height?: number;
  } = {}
): Partial<ImageProps> {
  const {
    priority = false,
    quality = 'standard',
    sizes,
    fill = false,
    width,
    height,
  } = options;

  const baseProps: Partial<ImageProps> = {
    src,
    alt,
    priority,
    quality: imageOptimization.quality[quality],
    placeholder: 'blur',
    blurDataURL: generateBlurDataURL(),
  };

  if (fill) {
    baseProps.fill = true;
    baseProps.sizes = sizes || '100vw';
  } else if (width && height) {
    baseProps.width = width;
    baseProps.height = height;
    baseProps.sizes = sizes;
  }

  return baseProps;
}

/**
 * Generate a blur data URL for placeholder
 */
function generateBlurDataURL(): string {
  // Simple 1x1 transparent pixel as base64
  return 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q==';
}

/**
 * Font optimization configuration
 */
export const fontOptimization = {
  // Preload critical fonts
  preloadFonts: [
    {
      href: '/fonts/inter-var.woff2',
      as: 'font',
      type: 'font/woff2',
      crossOrigin: 'anonymous',
    },
  ],
  
  // Font display strategy
  fontDisplay: 'swap' as const,
  
  // Font loading optimization
  loadingStrategy: {
    critical: 'preload',
    important: 'prefetch',
    optional: 'lazy',
  },
} as const;

/**
 * CSS optimization utilities
 */
export const cssOptimization = {
  // Critical CSS extraction
  extractCriticalCSS: true,
  
  // Unused CSS removal
  removeUnusedCSS: true,
  
  // CSS minification
  minify: true,
  
  // Inline critical CSS threshold (bytes)
  inlineCriticalThreshold: 14 * 1024, // 14KB
} as const;

/**
 * JavaScript optimization utilities
 */
export const jsOptimization = {
  // Code splitting strategies
  codeSplitting: {
    vendor: true,
    async: true,
    dynamic: true,
  },
  
  // Tree shaking configuration
  treeShaking: {
    enabled: true,
    sideEffects: false,
  },
  
  // Minification settings
  minification: {
    removeConsole: true,
    removeDebugger: true,
    dropUnused: true,
  },
} as const;

/**
 * Asset loading strategies
 */
export const assetLoadingStrategies = {
  // Critical resources (load immediately)
  critical: [
    'framework',
    'main',
    'polyfills',
  ],
  
  // Important resources (preload)
  important: [
    'commons',
    'shared',
  ],
  
  // Optional resources (lazy load)
  optional: [
    'admin',
    'dashboard',
    'analytics',
  ],
} as const;

/**
 * Performance monitoring for assets
 */
export class AssetPerformanceMonitor {
  private static instance: AssetPerformanceMonitor;
  private metrics: Map<string, AssetMetric> = new Map();

  static getInstance(): AssetPerformanceMonitor {
    if (!AssetPerformanceMonitor.instance) {
      AssetPerformanceMonitor.instance = new AssetPerformanceMonitor();
    }
    return AssetPerformanceMonitor.instance;
  }

  /**
   * Track asset loading performance
   */
  trackAssetLoad(url: string, startTime: number, endTime: number, size?: number): void {
    const loadTime = endTime - startTime;
    
    this.metrics.set(url, {
      url,
      loadTime,
      size,
      timestamp: Date.now(),
    });
  }

  /**
   * Get asset performance metrics
   */
  getMetrics(): AssetMetric[] {
    return Array.from(this.metrics.values());
  }

  /**
   * Get slow loading assets
   */
  getSlowAssets(threshold: number = 1000): AssetMetric[] {
    return this.getMetrics().filter(metric => metric.loadTime > threshold);
  }

  /**
   * Get large assets
   */
  getLargeAssets(threshold: number = 100 * 1024): AssetMetric[] {
    return this.getMetrics().filter(metric => 
      metric.size && metric.size > threshold
    );
  }
}

interface AssetMetric {
  url: string;
  loadTime: number;
  size?: number;
  timestamp: number;
}

/**
 * Resource hints utilities
 */
export const resourceHints = {
  /**
   * Generate preload link for critical resources
   */
  preload: (href: string, as: string, type?: string): string => {
    const typeAttr = type ? ` type="${type}"` : '';
    return `<link rel="preload" href="${href}" as="${as}"${typeAttr} crossorigin="anonymous">`;
  },

  /**
   * Generate prefetch link for future resources
   */
  prefetch: (href: string): string => {
    return `<link rel="prefetch" href="${href}" crossorigin="anonymous">`;
  },

  /**
   * Generate DNS prefetch for external domains
   */
  dnsPrefetch: (domain: string): string => {
    return `<link rel="dns-prefetch" href="//${domain}">`;
  },

  /**
   * Generate preconnect for critical external resources
   */
  preconnect: (href: string): string => {
    return `<link rel="preconnect" href="${href}" crossorigin="anonymous">`;
  },
} as const;

/**
 * Compression utilities
 */
export const compressionUtils = {
  /**
   * Check if browser supports Brotli compression
   */
  supportsBrotli: (): boolean => {
    if (typeof window === 'undefined') return false;
    return 'CompressionStream' in window;
  },

  /**
   * Check if browser supports WebP images
   */
  supportsWebP: (): Promise<boolean> => {
    if (typeof window === 'undefined') return Promise.resolve(false);
    
    return new Promise((resolve) => {
      const webP = new Image();
      webP.onload = webP.onerror = () => {
        resolve(webP.height === 2);
      };
      webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
    });
  },

  /**
   * Check if browser supports AVIF images
   */
  supportsAVIF: (): Promise<boolean> => {
    if (typeof window === 'undefined') return Promise.resolve(false);
    
    return new Promise((resolve) => {
      const avif = new Image();
      avif.onload = avif.onerror = () => {
        resolve(avif.height === 2);
      };
      avif.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A=';
    });
  },
} as const;

export default {
  imageOptimization,
  fontOptimization,
  cssOptimization,
  jsOptimization,
  assetLoadingStrategies,
  AssetPerformanceMonitor,
  resourceHints,
  compressionUtils,
  getOptimizedImageProps,
};