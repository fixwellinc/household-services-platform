/**
 * Animation utility functions and timing controls
 * Provides consistent animation timing and easing across the application
 */

export const ANIMATION_DURATIONS = {
  fast: 150,
  normal: 300,
  slow: 600,
  slower: 800,
  slowest: 1000,
} as const;

export const ANIMATION_DELAYS = {
  none: 0,
  short: 100,
  medium: 200,
  long: 400,
  longer: 600,
} as const;

export const EASING_FUNCTIONS = {
  // Standard easing
  ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  
  // Custom easing for premium feel
  smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
  bounceIn: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  elastic: 'cubic-bezier(0.68, -0.6, 0.32, 1.6)',
  
  // Reveal animations
  reveal: 'cubic-bezier(0.16, 1, 0.3, 1)',
  
  // Micro-interactions
  button: 'cubic-bezier(0.4, 0, 0.2, 1)',
  hover: 'cubic-bezier(0.4, 0, 0.2, 1)',
} as const;

export type AnimationDuration = keyof typeof ANIMATION_DURATIONS;
export type AnimationDelay = keyof typeof ANIMATION_DELAYS;
export type EasingFunction = keyof typeof EASING_FUNCTIONS;

/**
 * Generate CSS transition string with consistent timing
 */
export function createTransition(
  properties: string | string[],
  duration: AnimationDuration = 'normal',
  easing: EasingFunction = 'smooth',
  delay: AnimationDelay = 'none'
): string {
  const props = Array.isArray(properties) ? properties.join(', ') : properties;
  const durationMs = ANIMATION_DURATIONS[duration];
  const easingFunc = EASING_FUNCTIONS[easing];
  const delayMs = ANIMATION_DELAYS[delay];
  
  return `${props} ${durationMs}ms ${easingFunc} ${delayMs}ms`;
}

/**
 * Generate staggered animation delays for multiple items
 */
export function createStaggeredDelays(
  itemCount: number,
  staggerDelay: number = 100,
  baseDelay: number = 0
): number[] {
  return Array.from({ length: itemCount }, (_, index) => 
    baseDelay + (index * staggerDelay)
  );
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Create a media query listener for reduced motion preference
 */
export function createReducedMotionListener(
  callback: (prefersReduced: boolean) => void
): () => void {
  if (typeof window === 'undefined') return () => {};
  
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  
  const handleChange = (e: MediaQueryListEvent) => {
    callback(e.matches);
  };
  
  mediaQuery.addEventListener('change', handleChange);
  
  // Return cleanup function
  return () => mediaQuery.removeEventListener('change', handleChange);
}

/**
 * Animation timing presets for common use cases
 */
export const ANIMATION_PRESETS = {
  // Micro-interactions
  buttonHover: {
    duration: ANIMATION_DURATIONS.fast,
    easing: EASING_FUNCTIONS.button,
  },
  
  // Page transitions
  pageTransition: {
    duration: ANIMATION_DURATIONS.normal,
    easing: EASING_FUNCTIONS.smooth,
  },
  
  // Scroll reveals
  scrollReveal: {
    duration: ANIMATION_DURATIONS.slow,
    easing: EASING_FUNCTIONS.reveal,
  },
  
  // Staggered animations
  staggeredReveal: {
    duration: ANIMATION_DURATIONS.slow,
    easing: EASING_FUNCTIONS.reveal,
    staggerDelay: 100,
  },
  
  // Loading states
  loading: {
    duration: ANIMATION_DURATIONS.normal,
    easing: EASING_FUNCTIONS.ease,
  },
  
  // Modal/dialog animations
  modal: {
    duration: ANIMATION_DURATIONS.normal,
    easing: EASING_FUNCTIONS.smooth,
  },
  
  // Bounce effects
  bounce: {
    duration: ANIMATION_DURATIONS.slow,
    easing: EASING_FUNCTIONS.bounceIn,
  },
} as const;

/**
 * Generate CSS custom properties for animation timing
 */
export function generateAnimationCSSVars(preset: keyof typeof ANIMATION_PRESETS): Record<string, string> {
  const config = ANIMATION_PRESETS[preset];
  
  return {
    '--animation-duration': `${config.duration}ms`,
    '--animation-easing': config.easing,
    ...(('staggerDelay' in config) && {
      '--stagger-delay': `${config.staggerDelay}ms`,
    }),
  };
}

/**
 * Intersection Observer options for different animation triggers
 */
export const INTERSECTION_OPTIONS = {
  // Trigger when element is barely visible
  immediate: {
    threshold: 0.01,
    rootMargin: '0px',
  },
  
  // Trigger when element is partially visible (default)
  partial: {
    threshold: 0.1,
    rootMargin: '0px',
  },
  
  // Trigger when element is mostly visible
  majority: {
    threshold: 0.5,
    rootMargin: '0px',
  },
  
  // Trigger slightly before element enters viewport
  early: {
    threshold: 0.1,
    rootMargin: '50px',
  },
  
  // Trigger when element is fully visible
  complete: {
    threshold: 1.0,
    rootMargin: '0px',
  },
} as const;

/**
 * Performance optimization utilities
 */
export const PERFORMANCE_UTILS = {
  /**
   * Check if device supports hardware acceleration
   */
  supportsHardwareAcceleration(): boolean {
    if (typeof window === 'undefined') return false;
    
    const testElement = document.createElement('div');
    testElement.style.transform = 'translateZ(0)';
    return testElement.style.transform !== '';
  },
  
  /**
   * Check if device has sufficient performance for complex animations
   */
  hasGoodPerformance(): boolean {
    if (typeof navigator === 'undefined') return true;
    
    // Check for mobile devices or low-end hardware
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const hasLowMemory = 'deviceMemory' in navigator && (navigator as any).deviceMemory < 4;
    
    return !isMobile && !hasLowMemory;
  },
  
  /**
   * Get recommended animation complexity based on device capabilities
   */
  getRecommendedComplexity(): 'minimal' | 'standard' | 'enhanced' {
    if (prefersReducedMotion()) return 'minimal';
    if (!this.hasGoodPerformance()) return 'standard';
    return 'enhanced';
  },
} as const;