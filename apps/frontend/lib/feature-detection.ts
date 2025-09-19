/**
 * Feature detection utilities for progressive enhancement
 */

export interface FeatureSupport {
  // CSS Features
  cssGrid: boolean;
  cssFlexbox: boolean;
  cssCustomProperties: boolean;
  cssBackdropFilter: boolean;
  cssClipPath: boolean;
  cssTransforms3d: boolean;
  cssAnimations: boolean;
  cssTransitions: boolean;
  
  // JavaScript Features
  intersectionObserver: boolean;
  resizeObserver: boolean;
  webGL: boolean;
  webGL2: boolean;
  
  // Browser Features
  touchEvents: boolean;
  pointerEvents: boolean;
  deviceMotion: boolean;
  
  // Performance Features
  hardwareAcceleration: boolean;
  reducedMotion: boolean;
  
  // Accessibility Features
  screenReader: boolean;
  highContrast: boolean;
}

class FeatureDetector {
  private cache: Partial<FeatureSupport> = {};
  
  /**
   * Detect CSS Grid support
   */
  detectCSSGrid(): boolean {
    if (this.cache.cssGrid !== undefined) return this.cache.cssGrid;
    
    if (typeof window === 'undefined') return false;
    
    const testElement = document.createElement('div');
    testElement.style.display = 'grid';
    this.cache.cssGrid = testElement.style.display === 'grid';
    return this.cache.cssGrid;
  }

  /**
   * Detect CSS Flexbox support
   */
  detectCSSFlexbox(): boolean {
    if (this.cache.cssFlexbox !== undefined) return this.cache.cssFlexbox;
    
    if (typeof window === 'undefined') return false;
    
    const testElement = document.createElement('div');
    testElement.style.display = 'flex';
    this.cache.cssFlexbox = testElement.style.display === 'flex';
    return this.cache.cssFlexbox;
  }

  /**
   * Detect CSS Custom Properties (CSS Variables) support
   */
  detectCSSCustomProperties(): boolean {
    if (this.cache.cssCustomProperties !== undefined) return this.cache.cssCustomProperties;
    
    if (typeof window === 'undefined') return false;
    
    this.cache.cssCustomProperties = window.CSS && window.CSS.supports && window.CSS.supports('--test', 'red');
    return this.cache.cssCustomProperties;
  }

  /**
   * Detect CSS backdrop-filter support
   */
  detectCSSBackdropFilter(): boolean {
    if (this.cache.cssBackdropFilter !== undefined) return this.cache.cssBackdropFilter;
    
    if (typeof window === 'undefined') return false;
    
    this.cache.cssBackdropFilter = 
      window.CSS && window.CSS.supports && 
      (window.CSS.supports('backdrop-filter', 'blur(1px)') || 
       window.CSS.supports('-webkit-backdrop-filter', 'blur(1px)'));
    return this.cache.cssBackdropFilter;
  }

  /**
   * Detect CSS clip-path support
   */
  detectCSSClipPath(): boolean {
    if (this.cache.cssClipPath !== undefined) return this.cache.cssClipPath;
    
    if (typeof window === 'undefined') return false;
    
    this.cache.cssClipPath = 
      window.CSS && window.CSS.supports && 
      window.CSS.supports('clip-path', 'circle(50%)');
    return this.cache.cssClipPath;
  }

  /**
   * Detect 3D transforms support
   */
  detectCSS3DTransforms(): boolean {
    if (this.cache.cssTransforms3d !== undefined) return this.cache.cssTransforms3d;
    
    if (typeof window === 'undefined') return false;
    
    const testElement = document.createElement('div');
    testElement.style.transform = 'translateZ(0)';
    this.cache.cssTransforms3d = testElement.style.transform !== '';
    return this.cache.cssTransforms3d;
  }

  /**
   * Detect CSS animations support
   */
  detectCSSAnimations(): boolean {
    if (this.cache.cssAnimations !== undefined) return this.cache.cssAnimations;
    
    if (typeof window === 'undefined') return false;
    
    const testElement = document.createElement('div');
    const animationProperties = ['animation', 'webkitAnimation', 'mozAnimation', 'oAnimation'];
    
    this.cache.cssAnimations = animationProperties.some(prop => prop in testElement.style);
    return this.cache.cssAnimations;
  }

  /**
   * Detect CSS transitions support
   */
  detectCSSTransitions(): boolean {
    if (this.cache.cssTransitions !== undefined) return this.cache.cssTransitions;
    
    if (typeof window === 'undefined') return false;
    
    const testElement = document.createElement('div');
    const transitionProperties = ['transition', 'webkitTransition', 'mozTransition', 'oTransition'];
    
    this.cache.cssTransitions = transitionProperties.some(prop => prop in testElement.style);
    return this.cache.cssTransitions;
  }

  /**
   * Detect Intersection Observer support
   */
  detectIntersectionObserver(): boolean {
    if (this.cache.intersectionObserver !== undefined) return this.cache.intersectionObserver;
    
    if (typeof window === 'undefined') return false;
    
    this.cache.intersectionObserver = 'IntersectionObserver' in window;
    return this.cache.intersectionObserver;
  }

  /**
   * Detect Resize Observer support
   */
  detectResizeObserver(): boolean {
    if (this.cache.resizeObserver !== undefined) return this.cache.resizeObserver;
    
    if (typeof window === 'undefined') return false;
    
    this.cache.resizeObserver = 'ResizeObserver' in window;
    return this.cache.resizeObserver;
  }

  /**
   * Detect WebGL support
   */
  detectWebGL(): boolean {
    if (this.cache.webGL !== undefined) return this.cache.webGL;
    
    if (typeof window === 'undefined') return false;
    
    try {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      this.cache.webGL = !!context;
    } catch (e) {
      this.cache.webGL = false;
    }
    
    return this.cache.webGL;
  }

  /**
   * Detect WebGL2 support
   */
  detectWebGL2(): boolean {
    if (this.cache.webGL2 !== undefined) return this.cache.webGL2;
    
    if (typeof window === 'undefined') return false;
    
    try {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('webgl2');
      this.cache.webGL2 = !!context;
    } catch (e) {
      this.cache.webGL2 = false;
    }
    
    return this.cache.webGL2;
  }

  /**
   * Detect touch events support
   */
  detectTouchEvents(): boolean {
    if (this.cache.touchEvents !== undefined) return this.cache.touchEvents;
    
    if (typeof window === 'undefined') return false;
    
    this.cache.touchEvents = 
      'ontouchstart' in window || 
      navigator.maxTouchPoints > 0 || 
      (navigator as any).msMaxTouchPoints > 0;
    return this.cache.touchEvents;
  }

  /**
   * Detect pointer events support
   */
  detectPointerEvents(): boolean {
    if (this.cache.pointerEvents !== undefined) return this.cache.pointerEvents;
    
    if (typeof window === 'undefined') return false;
    
    this.cache.pointerEvents = 'onpointerdown' in window;
    return this.cache.pointerEvents;
  }

  /**
   * Detect device motion support
   */
  detectDeviceMotion(): boolean {
    if (this.cache.deviceMotion !== undefined) return this.cache.deviceMotion;
    
    if (typeof window === 'undefined') return false;
    
    this.cache.deviceMotion = 'DeviceMotionEvent' in window;
    return this.cache.deviceMotion;
  }

  /**
   * Detect hardware acceleration support
   */
  detectHardwareAcceleration(): boolean {
    if (this.cache.hardwareAcceleration !== undefined) return this.cache.hardwareAcceleration;
    
    if (typeof window === 'undefined') return false;
    
    // Test for hardware acceleration by checking for 3D transform support
    // and WebGL availability
    this.cache.hardwareAcceleration = this.detectCSS3DTransforms() && this.detectWebGL();
    return this.cache.hardwareAcceleration;
  }

  /**
   * Detect reduced motion preference
   */
  detectReducedMotion(): boolean {
    if (this.cache.reducedMotion !== undefined) return this.cache.reducedMotion;
    
    if (typeof window === 'undefined') return false;
    
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.cache.reducedMotion = mediaQuery.matches;
    return this.cache.reducedMotion;
  }

  /**
   * Detect screen reader usage
   */
  detectScreenReader(): boolean {
    if (this.cache.screenReader !== undefined) return this.cache.screenReader;
    
    if (typeof window === 'undefined') return false;
    
    // Multiple heuristics for screen reader detection
    const hasScreenReader = 
      'speechSynthesis' in window ||
      navigator.userAgent.includes('NVDA') ||
      navigator.userAgent.includes('JAWS') ||
      navigator.userAgent.includes('VoiceOver') ||
      navigator.userAgent.includes('Orca') ||
      navigator.userAgent.includes('TalkBack');
    
    this.cache.screenReader = hasScreenReader;
    return this.cache.screenReader;
  }

  /**
   * Detect high contrast preference
   */
  detectHighContrast(): boolean {
    if (this.cache.highContrast !== undefined) return this.cache.highContrast;
    
    if (typeof window === 'undefined') return false;
    
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    this.cache.highContrast = mediaQuery.matches;
    return this.cache.highContrast;
  }

  /**
   * Get all feature support information
   */
  getAllFeatures(): FeatureSupport {
    return {
      cssGrid: this.detectCSSGrid(),
      cssFlexbox: this.detectCSSFlexbox(),
      cssCustomProperties: this.detectCSSCustomProperties(),
      cssBackdropFilter: this.detectCSSBackdropFilter(),
      cssClipPath: this.detectCSSClipPath(),
      cssTransforms3d: this.detectCSS3DTransforms(),
      cssAnimations: this.detectCSSAnimations(),
      cssTransitions: this.detectCSSTransitions(),
      intersectionObserver: this.detectIntersectionObserver(),
      resizeObserver: this.detectResizeObserver(),
      webGL: this.detectWebGL(),
      webGL2: this.detectWebGL2(),
      touchEvents: this.detectTouchEvents(),
      pointerEvents: this.detectPointerEvents(),
      deviceMotion: this.detectDeviceMotion(),
      hardwareAcceleration: this.detectHardwareAcceleration(),
      reducedMotion: this.detectReducedMotion(),
      screenReader: this.detectScreenReader(),
      highContrast: this.detectHighContrast(),
    };
  }

  /**
   * Clear the feature detection cache
   */
  clearCache(): void {
    this.cache = {};
  }
}

// Export singleton instance
export const featureDetector = new FeatureDetector();

// Convenience functions
export const supportsCSS = {
  grid: () => featureDetector.detectCSSGrid(),
  flexbox: () => featureDetector.detectCSSFlexbox(),
  customProperties: () => featureDetector.detectCSSCustomProperties(),
  backdropFilter: () => featureDetector.detectCSSBackdropFilter(),
  clipPath: () => featureDetector.detectCSSClipPath(),
  transforms3d: () => featureDetector.detectCSS3DTransforms(),
  animations: () => featureDetector.detectCSSAnimations(),
  transitions: () => featureDetector.detectCSSTransitions(),
};

export const supportsJS = {
  intersectionObserver: () => featureDetector.detectIntersectionObserver(),
  resizeObserver: () => featureDetector.detectResizeObserver(),
  webGL: () => featureDetector.detectWebGL(),
  webGL2: () => featureDetector.detectWebGL2(),
};

export const supportsInput = {
  touch: () => featureDetector.detectTouchEvents(),
  pointer: () => featureDetector.detectPointerEvents(),
  deviceMotion: () => featureDetector.detectDeviceMotion(),
};

export const userPreferences = {
  reducedMotion: () => featureDetector.detectReducedMotion(),
  highContrast: () => featureDetector.detectHighContrast(),
  screenReader: () => featureDetector.detectScreenReader(),
};