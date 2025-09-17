'use client';

import { useEffect } from 'react';

// Component to initialize accessibility features on page load
export default function AccessibilityInit() {
  useEffect(() => {
    // Initialize high contrast mode from localStorage
    const initHighContrast = () => {
      const isHighContrast = localStorage.getItem('high-contrast') === 'true';
      if (isHighContrast) {
        document.documentElement.classList.add('high-contrast');
      }
    };

    // Initialize reduced motion preference
    const initReducedMotion = () => {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) {
        document.documentElement.classList.add('reduce-motion');
      }
    };

    // Initialize focus-visible polyfill for older browsers
    const initFocusVisible = () => {
      // Add focus-visible class to body for CSS targeting
      document.body.classList.add('js-focus-visible');
    };

    // Initialize all accessibility features
    initHighContrast();
    initReducedMotion();
    initFocusVisible();

    // Listen for changes in reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleReducedMotionChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        document.documentElement.classList.add('reduce-motion');
      } else {
        document.documentElement.classList.remove('reduce-motion');
      }
    };

    mediaQuery.addEventListener('change', handleReducedMotionChange);

    // Cleanup
    return () => {
      mediaQuery.removeEventListener('change', handleReducedMotionChange);
    };
  }, []);

  return null; // This component doesn't render anything
}