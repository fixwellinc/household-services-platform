/**
 * Progressive enhancement utilities for graceful feature degradation
 */

export interface FeatureSupport {
  intersectionObserver: boolean;
  webp: boolean;
  avif: boolean;
  css: {
    grid: boolean;
    flexbox: boolean;
    customProperties: boolean;
    backdropFilter: boolean;
    transforms3d: boolean;
  };
  javascript: {
    es6: boolean;
    modules: boolean;
    asyncAwait: boolean;
  };
  performance: {
    requestAnimationFrame: boolean;
    performanceObserver: boolean;
    webWorkers: boolean;
  };
}

export interface EnhancementLevel {
  level: 'basic' | 'enhanced' | 'premium';
  features: string[];
  fallbacks: Record<string, any>;
}

/**
 * Feature detection and progressive enhancement manager
 */
export class ProgressiveEnhancement {
  private static instance: ProgressiveEnhancement;
  private featureSupport?: FeatureSupport;
  private enhancementLevel?: EnhancementLevel;

  static getInstance(): ProgressiveEnhancement {
    if (!ProgressiveEnhancement.instance) {
      ProgressiveEnhancement.instance = new ProgressiveEnhancement();
    }
    return ProgressiveEnhancement.instance;
  }

  /**
   * Detect all feature support
   */
  async detectFeatures(): Promise<FeatureSupport> {
    if (this.featureSupport) {
      return this.featureSupport;
    }

    if (typeof window === 'undefined') {
      return this.getServerSideFeatures();
    }

    const support: FeatureSupport = {
      intersectionObserver: 'IntersectionObserver' in window,
      webp: await this.supportsWebP(),
      avif: await this.supportsAVIF(),
      css: {
        grid: this.supportsCSSGrid(),
        flexbox: this.supportsCSSFlexbox(),
        customProperties: this.supportsCSSCustomProperties(),
        backdropFilter: this.supportsBackdropFilter(),
        transforms3d: this.supportsTransforms3D(),
      },
      javascript: {
        es6: this.supportsES6(),
        modules: this.supportsModules(),
        asyncAwait: this.supportsAsyncAwait(),
      },
      performance: {
        requestAnimationFrame: 'requestAnimationFrame' in window,
        performanceObserver: 'PerformanceObserver' in window,
        webWorkers: 'Worker' in window,
      },
    };

    this.featureSupport = support;
    return support;
  }

  /**
   * Get enhancement level based on feature support
   */
  async getEnhancementLevel(): Promise<EnhancementLevel> {
    if (this.enhancementLevel) {
      return this.enhancementLevel;
    }

    const features = await this.detectFeatures();
    
    // Determine enhancement level based on feature support
    const premiumFeatures = [
      features.css.grid,
      features.css.backdropFilter,
      features.css.transforms3d,
      features.webp,
      features.intersectionObserver,
      features.performance.requestAnimationFrame,
    ];

    const enhancedFeatures = [
      features.css.flexbox,
      features.css.customProperties,
      features.javascript.es6,
      features.performance.requestAnimationFrame,
    ];

    const premiumSupport = premiumFeatures.filter(Boolean).length;
    const enhancedSupport = enhancedFeatures.filter(Boolean).length;

    let level: EnhancementLevel;

    if (premiumSupport >= 5) {
      level = {
        level: 'premium',
        features: [
          'css-grid',
          'backdrop-filter',
          'transforms-3d',
          'webp-images',
          'intersection-observer',
          'hardware-acceleration',
          'advanced-animations',
        ],
        fallbacks: {},
      };
    } else if (enhancedSupport >= 3) {
      level = {
        level: 'enhanced',
        features: [
          'css-flexbox',
          'custom-properties',
          'es6-javascript',
          'basic-animations',
          'responsive-images',
        ],
        fallbacks: {
          'css-grid': 'flexbox-layout',
          'backdrop-filter': 'solid-background',
          'webp-images': 'jpeg-fallback',
        },
      };
    } else {
      level = {
        level: 'basic',
        features: [
          'basic-css',
          'basic-javascript',
          'static-layout',
        ],
        fallbacks: {
          'css-grid': 'table-layout',
          'css-flexbox': 'float-layout',
          'custom-properties': 'static-values',
          'animations': 'static-states',
          'webp-images': 'jpeg-fallback',
          'intersection-observer': 'immediate-load',
        },
      };
    }

    this.enhancementLevel = level;
    return level;
  }

  /**
   * Check if a specific feature is supported
   */
  async supportsFeature(feature: string): Promise<boolean> {
    const features = await this.detectFeatures();
    
    switch (feature) {
      case 'intersection-observer':
        return features.intersectionObserver;
      case 'webp':
        return features.webp;
      case 'avif':
        return features.avif;
      case 'css-grid':
        return features.css.grid;
      case 'css-flexbox':
        return features.css.flexbox;
      case 'backdrop-filter':
        return features.css.backdropFilter;
      case 'transforms-3d':
        return features.css.transforms3d;
      case 'request-animation-frame':
        return features.performance.requestAnimationFrame;
      default:
        return false;
    }
  }

  /**
   * Get fallback for unsupported feature
   */
  async getFallback(feature: string): Promise<any> {
    const level = await this.getEnhancementLevel();
    return level.fallbacks[feature] || null;
  }

  /**
   * Apply progressive enhancement to CSS
   */
  async enhanceCSS(baseCSS: string): Promise<string> {
    const features = await this.detectFeatures();
    let enhancedCSS = baseCSS;

    // Add feature-specific enhancements
    if (features.css.grid) {
      enhancedCSS += `
        @supports (display: grid) {
          .enhanced-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1rem;
          }
        }
      `;
    }

    if (features.css.backdropFilter) {
      enhancedCSS += `
        @supports (backdrop-filter: blur(10px)) {
          .glass-effect {
            backdrop-filter: blur(10px);
            background: rgba(255, 255, 255, 0.1);
          }
        }
      `;
    }

    if (features.css.transforms3d) {
      enhancedCSS += `
        @supports (transform: translateZ(0)) {
          .hw-accelerated {
            transform: translateZ(0);
            will-change: transform;
          }
        }
      `;
    }

    return enhancedCSS;
  }

  /**
   * Create feature-aware component props
   */
  async getComponentProps(baseProps: Record<string, any>): Promise<Record<string, any>> {
    const level = await this.getEnhancementLevel();
    const features = await this.detectFeatures();

    const enhancedProps = { ...baseProps };

    // Adjust props based on feature support
    if (!features.intersectionObserver) {
      enhancedProps.lazy = false;
      enhancedProps.eager = true;
    }

    if (!features.performance.requestAnimationFrame) {
      enhancedProps.animate = false;
      enhancedProps.transitions = false;
    }

    if (level.level === 'basic') {
      enhancedProps.complexity = 'minimal';
      enhancedProps.effects = false;
    } else if (level.level === 'enhanced') {
      enhancedProps.complexity = 'standard';
      enhancedProps.effects = 'basic';
    } else {
      enhancedProps.complexity = 'full';
      enhancedProps.effects = 'advanced';
    }

    return enhancedProps;
  }

  // Feature detection methods

  private async supportsWebP(): Promise<boolean> {
    return new Promise((resolve) => {
      const webP = new Image();
      webP.onload = webP.onerror = () => resolve(webP.height === 2);
      webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
    });
  }

  private async supportsAVIF(): Promise<boolean> {
    return new Promise((resolve) => {
      const avif = new Image();
      avif.onload = avif.onerror = () => resolve(avif.height === 2);
      avif.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A=';
    });
  }

  private supportsCSSGrid(): boolean {
    return CSS.supports('display', 'grid');
  }

  private supportsCSSFlexbox(): boolean {
    return CSS.supports('display', 'flex');
  }

  private supportsCSSCustomProperties(): boolean {
    return CSS.supports('--custom', 'property');
  }

  private supportsBackdropFilter(): boolean {
    return CSS.supports('backdrop-filter', 'blur(10px)') ||
           CSS.supports('-webkit-backdrop-filter', 'blur(10px)');
  }

  private supportsTransforms3D(): boolean {
    return CSS.supports('transform', 'translateZ(0)');
  }

  private supportsES6(): boolean {
    try {
      return typeof Symbol !== 'undefined' && 
             typeof Promise !== 'undefined' &&
             typeof Map !== 'undefined';
    } catch {
      return false;
    }
  }

  private supportsModules(): boolean {
    const script = document.createElement('script');
    return 'noModule' in script;
  }

  private supportsAsyncAwait(): boolean {
    try {
      return (async () => {})().constructor === Promise;
    } catch {
      return false;
    }
  }

  private getServerSideFeatures(): FeatureSupport {
    // Conservative defaults for server-side rendering
    return {
      intersectionObserver: false,
      webp: false,
      avif: false,
      css: {
        grid: false,
        flexbox: true,
        customProperties: false,
        backdropFilter: false,
        transforms3d: false,
      },
      javascript: {
        es6: false,
        modules: false,
        asyncAwait: false,
      },
      performance: {
        requestAnimationFrame: false,
        performanceObserver: false,
        webWorkers: false,
      },
    };
  }
}

/**
 * React hook for progressive enhancement
 */
export function useProgressiveEnhancement() {
  const [enhancementLevel, setEnhancementLevel] = React.useState<EnhancementLevel | null>(null);
  const [featureSupport, setFeatureSupport] = React.useState<FeatureSupport | null>(null);

  React.useEffect(() => {
    const pe = ProgressiveEnhancement.getInstance();
    
    Promise.all([
      pe.detectFeatures(),
      pe.getEnhancementLevel(),
    ]).then(([features, level]) => {
      setFeatureSupport(features);
      setEnhancementLevel(level);
    });
  }, []);

  const supportsFeature = React.useCallback(async (feature: string) => {
    const pe = ProgressiveEnhancement.getInstance();
    return pe.supportsFeature(feature);
  }, []);

  const getFallback = React.useCallback(async (feature: string) => {
    const pe = ProgressiveEnhancement.getInstance();
    return pe.getFallback(feature);
  }, []);

  return {
    enhancementLevel,
    featureSupport,
    supportsFeature,
    getFallback,
    isLoading: !enhancementLevel || !featureSupport,
  };
}

/**
 * Higher-order component for progressive enhancement
 */
export function withProgressiveEnhancement<P extends object>(
  Component: React.ComponentType<P>,
  options: {
    fallback?: React.ComponentType<P>;
    requiredFeatures?: string[];
  } = {}
) {
  return function EnhancedComponent(props: P) {
    const { enhancementLevel, featureSupport, isLoading } = useProgressiveEnhancement();
    
    if (isLoading) {
      return options.fallback ? React.createElement(options.fallback, props) : null;
    }

    // Check if required features are supported
    if (options.requiredFeatures && featureSupport) {
      const hasRequiredFeatures = options.requiredFeatures.every(feature => {
        switch (feature) {
          case 'intersection-observer':
            return featureSupport.intersectionObserver;
          case 'css-grid':
            return featureSupport.css.grid;
          case 'webp':
            return featureSupport.webp;
          default:
            return false;
        }
      });

      if (!hasRequiredFeatures && options.fallback) {
        return React.createElement(options.fallback, props);
      }
    }

    return React.createElement(Component, props);
  };
}

// Import React for hooks
import React from 'react';