'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

// Accessibility Context
interface AccessibilityContextValue {
  // Preferences
  highContrast: boolean;
  reducedMotion: boolean;
  largeText: boolean;
  screenReaderMode: boolean;
  keyboardNavigation: boolean;
  
  // Actions
  toggleHighContrast: () => void;
  toggleReducedMotion: () => void;
  toggleLargeText: () => void;
  toggleScreenReaderMode: () => void;
  toggleKeyboardNavigation: () => void;
  
  // Focus management
  focusedElement: string | null;
  setFocusedElement: (id: string | null) => void;
  
  // Announcements
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
}

const AccessibilityContext = createContext<AccessibilityContextValue>({
  highContrast: false,
  reducedMotion: false,
  largeText: false,
  screenReaderMode: false,
  keyboardNavigation: false,
  toggleHighContrast: () => {},
  toggleReducedMotion: () => {},
  toggleLargeText: () => {},
  toggleScreenReaderMode: () => {},
  toggleKeyboardNavigation: () => {},
  focusedElement: null,
  setFocusedElement: () => {},
  announce: () => {}
});

export function useAccessibility() {
  return useContext(AccessibilityContext);
}

// Accessibility Provider
interface AccessibilityProviderProps {
  children: React.ReactNode;
}

export function AccessibilityProvider({ children }: AccessibilityProviderProps) {
  const [highContrast, setHighContrast] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [screenReaderMode, setScreenReaderMode] = useState(false);
  const [keyboardNavigation, setKeyboardNavigation] = useState(false);
  const [focusedElement, setFocusedElement] = useState<string | null>(null);

  // Load preferences from localStorage
  useEffect(() => {
    const preferences = localStorage.getItem('accessibility-preferences');
    if (preferences) {
      const parsed = JSON.parse(preferences);
      setHighContrast(parsed.highContrast || false);
      setReducedMotion(parsed.reducedMotion || false);
      setLargeText(parsed.largeText || false);
      setScreenReaderMode(parsed.screenReaderMode || false);
      setKeyboardNavigation(parsed.keyboardNavigation || false);
    }

    // Detect system preferences
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
    
    if (prefersReducedMotion) setReducedMotion(true);
    if (prefersHighContrast) setHighContrast(true);
  }, []);

  // Save preferences to localStorage
  const savePreferences = useCallback(() => {
    const preferences = {
      highContrast,
      reducedMotion,
      largeText,
      screenReaderMode,
      keyboardNavigation
    };
    localStorage.setItem('accessibility-preferences', JSON.stringify(preferences));
  }, [highContrast, reducedMotion, largeText, screenReaderMode, keyboardNavigation]);

  useEffect(() => {
    savePreferences();
  }, [savePreferences]);

  // Apply CSS classes to document
  useEffect(() => {
    const classes = [];
    if (highContrast) classes.push('high-contrast');
    if (reducedMotion) classes.push('reduced-motion');
    if (largeText) classes.push('large-text');
    if (screenReaderMode) classes.push('screen-reader-mode');
    if (keyboardNavigation) classes.push('keyboard-navigation');

    document.documentElement.className = classes.join(' ');

    return () => {
      document.documentElement.className = '';
    };
  }, [highContrast, reducedMotion, largeText, screenReaderMode, keyboardNavigation]);

  // Keyboard navigation detection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        setKeyboardNavigation(true);
      }
    };

    const handleMouseDown = () => {
      setKeyboardNavigation(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  // Screen reader announcements
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

  const value: AccessibilityContextValue = {
    highContrast,
    reducedMotion,
    largeText,
    screenReaderMode,
    keyboardNavigation,
    toggleHighContrast: () => setHighContrast(!highContrast),
    toggleReducedMotion: () => setReducedMotion(!reducedMotion),
    toggleLargeText: () => setLargeText(!largeText),
    toggleScreenReaderMode: () => setScreenReaderMode(!screenReaderMode),
    toggleKeyboardNavigation: () => setKeyboardNavigation(!keyboardNavigation),
    focusedElement,
    setFocusedElement,
    announce
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
}

// Screen Reader Only Component
interface ScreenReaderOnlyProps {
  children: React.ReactNode;
  className?: string;
}

export function ScreenReaderOnly({ children, className }: ScreenReaderOnlyProps) {
  return (
    <span className={cn('sr-only', className)}>
      {children}
    </span>
  );
}

// Skip Link Component
interface SkipLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export function SkipLink({ href, children, className }: SkipLinkProps) {
  return (
    <a
      href={href}
      className={cn(
        'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded focus:shadow-lg',
        className
      )}
    >
      {children}
    </a>
  );
}

// Focus Trap Component
interface FocusTrapProps {
  children: React.ReactNode;
  active?: boolean;
  className?: string;
}

export function FocusTrap({ children, active = true, className }: FocusTrapProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [active]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}

// Live Region Component
interface LiveRegionProps {
  children: React.ReactNode;
  priority?: 'polite' | 'assertive';
  atomic?: boolean;
  className?: string;
}

export function LiveRegion({ 
  children, 
  priority = 'polite', 
  atomic = true, 
  className 
}: LiveRegionProps) {
  return (
    <div
      aria-live={priority}
      aria-atomic={atomic}
      className={cn('sr-only', className)}
    >
      {children}
    </div>
  );
}

// Accessible Button Component
interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  loadingText?: string;
  describedBy?: string;
}

export function AccessibleButton({
  children,
  variant = 'default',
  size = 'md',
  loading = false,
  loadingText = 'Loading',
  describedBy,
  className,
  disabled,
  ...props
}: AccessibleButtonProps) {
  const { announce } = useAccessibility();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (loading) {
      e.preventDefault();
      return;
    }
    
    props.onClick?.(e);
    
    // Announce button action to screen readers
    if (typeof children === 'string') {
      announce(`${children} button activated`);
    }
  };

  return (
    <button
      {...props}
      onClick={handleClick}
      disabled={disabled || loading}
      aria-disabled={disabled || loading}
      aria-describedby={describedBy}
      className={cn(
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
    >
      {loading ? (
        <>
          <span aria-hidden="true" className="animate-spin mr-2">⟳</span>
          <span className="sr-only">{loadingText}</span>
          {loadingText}
        </>
      ) : (
        children
      )}
    </button>
  );
}

// Accessible Form Field Component
interface AccessibleFormFieldProps {
  children: React.ReactNode;
  label: string;
  error?: string;
  description?: string;
  required?: boolean;
  className?: string;
}

export function AccessibleFormField({
  children,
  label,
  error,
  description,
  required = false,
  className
}: AccessibleFormFieldProps) {
  const fieldId = React.useId();
  const errorId = error ? `${fieldId}-error` : undefined;
  const descriptionId = description ? `${fieldId}-description` : undefined;

  return (
    <div className={cn('space-y-2', className)}>
      <label
        htmlFor={fieldId}
        className="block text-sm font-medium text-gray-700"
      >
        {label}
        {required && (
          <span className="text-red-500 ml-1" aria-label="required">
            *
          </span>
        )}
      </label>
      
      {description && (
        <p id={descriptionId} className="text-sm text-gray-600">
          {description}
        </p>
      )}
      
      {React.cloneElement(children as React.ReactElement, {
        id: fieldId,
        'aria-invalid': !!error,
        'aria-describedby': [descriptionId, errorId].filter(Boolean).join(' ') || undefined,
        'aria-required': required
      })}
      
      {error && (
        <p id={errorId} className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}