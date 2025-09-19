import { useEffect, useRef, useState } from 'react';

export interface UseIntersectionObserverOptions extends IntersectionObserverInit {
  /**
   * Whether to trigger only once when element enters viewport
   * @default true
   */
  triggerOnce?: boolean;
  /**
   * Whether to start observing immediately
   * @default true
   */
  enabled?: boolean;
}

export interface UseIntersectionObserverReturn {
  /** Reference to attach to the element you want to observe */
  ref: React.RefObject<Element>;
  /** Whether the element is currently intersecting */
  isIntersecting: boolean;
  /** Whether the element has intersected at least once */
  hasIntersected: boolean;
  /** The intersection observer entry */
  entry?: IntersectionObserverEntry;
}

/**
 * Custom hook for efficient intersection observation
 * Optimized for scroll-triggered animations with proper cleanup
 */
export function useIntersectionObserver(
  options: UseIntersectionObserverOptions = {}
): UseIntersectionObserverReturn {
  const {
    threshold = 0.1,
    root = null,
    rootMargin = '0px',
    triggerOnce = true,
    enabled = true,
  } = options;

  const elementRef = useRef<Element>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const [entry, setEntry] = useState<IntersectionObserverEntry>();

  useEffect(() => {
    const element = elementRef.current;
    
    if (!element || !enabled) {
      return;
    }

    // Check if IntersectionObserver is supported
    if (!('IntersectionObserver' in window)) {
      // Fallback: assume element is visible
      setIsIntersecting(true);
      setHasIntersected(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [observerEntry] = entries;
        setEntry(observerEntry);
        setIsIntersecting(observerEntry.isIntersecting);
        
        if (observerEntry.isIntersecting) {
          setHasIntersected(true);
          
          // If triggerOnce is true, stop observing after first intersection
          if (triggerOnce) {
            observer.unobserve(element);
          }
        }
      },
      {
        threshold,
        root,
        rootMargin,
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [threshold, root, rootMargin, triggerOnce, enabled]);

  return {
    ref: elementRef,
    isIntersecting,
    hasIntersected,
    entry,
  };
}