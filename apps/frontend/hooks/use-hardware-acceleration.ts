import { useEffect, useState } from 'react';
import { PERFORMANCE_UTILS } from '@/lib/animation-utils';

export interface UseHardwareAccelerationOptions {
  /**
   * Whether to force hardware acceleration
   * @default false
   */
  force?: boolean;
  /**
   * Fallback behavior when hardware acceleration is not available
   * @default 'disable'
   */
  fallback?: 'disable' | 'software' | 'minimal';
  /**
   * Monitor performance and adapt complexity
   * @default true
   */
  adaptive?: boolean;
}

export interface UseHardwareAccelerationReturn {
  /** Whether hardware acceleration is supported and enabled */
  isSupported: boolean;
  /** Whether to use hardware-accelerated animations */
  useHardwareAcceleration: boolean;
  /** Recommended animation complexity level */
  complexityLevel: 'minimal' | 'standard' | 'enhanced';
  /** CSS transform properties for hardware acceleration */
  accelerationStyles: React.CSSProperties;
  /** Performance monitoring data */
  performance: {
    frameRate: number;
    isGoodPerformance: boolean;
  };
}

/**
 * Hook for managing hardware-accelerated animations
 * Automatically detects capabilities and adapts animation complexity
 */
export function useHardwareAcceleration(
  options: UseHardwareAccelerationOptions = {}
): UseHardwareAccelerationReturn {
  const {
    force = false,
    fallback = 'disable',
    adaptive = true,
  } = options;

  const [isSupported, setIsSupported] = useState(false);
  const [frameRate, setFrameRate] = useState(60);
  const [isGoodPerformance, setIsGoodPerformance] = useState(true);

  useEffect(() => {
    // Check hardware acceleration support
    const supported = force || PERFORMANCE_UTILS.supportsHardwareAcceleration();
    setIsSupported(supported);

    // Check overall device performance
    const goodPerformance = PERFORMANCE_UTILS.hasGoodPerformance();
    setIsGoodPerformance(goodPerformance);

    // Performance monitoring
    if (adaptive && supported) {
      let frameCount = 0;
      let lastTime = performance.now();
      let animationId: number;

      const measureFrameRate = () => {
        frameCount++;
        const currentTime = performance.now();
        
        if (currentTime - lastTime >= 1000) {
          const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
          setFrameRate(fps);
          
          // Update performance status based on frame rate
          setIsGoodPerformance(fps >= 30);
          
          frameCount = 0;
          lastTime = currentTime;
        }
        
        animationId = requestAnimationFrame(measureFrameRate);
      };

      // Start monitoring after a delay to avoid initial load impact
      const timeoutId = setTimeout(() => {
        animationId = requestAnimationFrame(measureFrameRate);
      }, 2000);

      return () => {
        clearTimeout(timeoutId);
        if (animationId) {
          cancelAnimationFrame(animationId);
        }
      };
    }
  }, [force, adaptive]);

  // Determine if we should use hardware acceleration
  const useHardwareAcceleration = isSupported && (
    force || 
    isGoodPerformance || 
    fallback !== 'disable'
  );

  // Determine complexity level
  const complexityLevel = (() => {
    if (!useHardwareAcceleration) return 'minimal';
    if (frameRate < 30) return 'minimal';
    if (frameRate < 45) return 'standard';
    return 'enhanced';
  })();

  // Generate acceleration styles
  const accelerationStyles: React.CSSProperties = useHardwareAcceleration ? {
    transform: 'translateZ(0)', // Force hardware layer
    willChange: 'transform, opacity', // Hint to browser
    backfaceVisibility: 'hidden', // Prevent flickering
  } : {};

  return {
    isSupported,
    useHardwareAcceleration,
    complexityLevel,
    accelerationStyles,
    performance: {
      frameRate,
      isGoodPerformance,
    },
  };
}

/**
 * Hook for creating hardware-accelerated CSS animations
 */
export interface UseHardwareAnimationOptions extends UseHardwareAccelerationOptions {
  /**
   * Animation duration in milliseconds
   * @default 300
   */
  duration?: number;
  /**
   * Animation easing function
   * @default 'ease-out'
   */
  easing?: string;
  /**
   * Animation delay in milliseconds
   * @default 0
   */
  delay?: number;
}

export interface UseHardwareAnimationReturn extends UseHardwareAccelerationReturn {
  /** CSS properties for hardware-accelerated animations */
  animationStyles: React.CSSProperties;
  /** Function to trigger animation */
  animate: (properties: Partial<CSSStyleDeclaration>) => void;
  /** Function to reset animation */
  reset: () => void;
}

export function useHardwareAnimation(
  options: UseHardwareAnimationOptions = {}
): UseHardwareAnimationReturn {
  const {
    duration = 300,
    easing = 'ease-out',
    delay = 0,
    ...accelerationOptions
  } = options;

  const acceleration = useHardwareAcceleration(accelerationOptions);
  const [animationStyles, setAnimationStyles] = useState<React.CSSProperties>({});

  const animate = (properties: Partial<CSSStyleDeclaration>) => {
    if (!acceleration.useHardwareAcceleration) {
      // Fallback to basic animations
      setAnimationStyles({
        transition: `all ${duration}ms ${easing} ${delay}ms`,
        ...properties,
      });
      return;
    }

    // Use hardware-accelerated transforms
    const transformProperties = [];
    const otherProperties: React.CSSProperties = {};

    Object.entries(properties).forEach(([key, value]) => {
      if (key.startsWith('translate') || key.startsWith('scale') || key.startsWith('rotate')) {
        transformProperties.push(`${key}(${value})`);
      } else {
        otherProperties[key as keyof React.CSSProperties] = value;
      }
    });

    setAnimationStyles({
      ...acceleration.accelerationStyles,
      transition: `transform ${duration}ms ${easing} ${delay}ms, opacity ${duration}ms ${easing} ${delay}ms`,
      transform: transformProperties.length > 0 
        ? `translateZ(0) ${transformProperties.join(' ')}`
        : 'translateZ(0)',
      ...otherProperties,
    });
  };

  const reset = () => {
    setAnimationStyles({});
  };

  return {
    ...acceleration,
    animationStyles: {
      ...acceleration.accelerationStyles,
      ...animationStyles,
    },
    animate,
    reset,
  };
}