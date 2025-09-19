'use client';

import { useEffect, useState, useCallback } from 'react';

interface AccessibilityState {
  isKeyboardUser: boolean;
  hasScreenReader: boolean;
  prefersReducedMotion: boolean;
  highContrast: boolean;
  fontSize: 'normal' | 'large' | 'larger';
}

export function useAccessibility() {
  const [state, setState] = useState<AccessibilityState>({
    isKeyboardUser: false,
    hasScreenReader: false,
    prefersReducedMotion: false,
    highContrast: false,
    fontSize: 'normal'
  });

  // Detect keyboard navigation
  useEffect(() => {
    let keyboardTimeout: NodeJS.Timeout;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        setState(prev => ({ ...prev, isKeyboardUser: true }));
        clearTimeout(keyboardTimeout);
        keyboardTimeout = setTimeout(() => {
          setState(prev => ({ ...prev, isKeyboardUser: false }));
        }, 3000);
      }
    };

    const handleMouseDown = () => {
      setState(prev => ({ ...prev, isKeyboardUser: false }));
      clearTimeout(keyboardTimeout);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
      clearTimeout(keyboardTimeout);
    };
  }, []);

  // Detect screen reader
  useEffect(() => {
    const hasScreenReader = 
      'speechSynthesis' in window ||
      navigator.userAgent.includes('NVDA') ||
      navigator.userAgent.includes('JAWS') ||
      navigator.userAgent.includes('VoiceOver');
    
    setState(prev => ({ ...prev, hasScreenReader }));
  }, []);

  // Detect reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setState(prev => ({ ...prev, prefersReducedMotion: e.matches }));
    };

    setState(prev => ({ ...prev, prefersReducedMotion: mediaQuery.matches }));
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Detect high contrast preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setState(prev => ({ ...prev, highContrast: e.matches }));
    };

    setState(prev => ({ ...prev, highContrast: mediaQuery.matches }));
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Announce to screen readers
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }, []);

  return {
    ...state,
    announce
  };
}

// Hook for managing focus
export function useFocusManagement() {
  const [focusedElement, setFocusedElement] = useState<HTMLElement | null>(null);

  const trapFocus = useCallback((container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, []);

  const restoreFocus = useCallback(() => {
    if (focusedElement) {
      focusedElement.focus();
      setFocusedElement(null);
    }
  }, [focusedElement]);

  const saveFocus = useCallback(() => {
    setFocusedElement(document.activeElement as HTMLElement);
  }, []);

  return {
    trapFocus,
    restoreFocus,
    saveFocus
  };
}