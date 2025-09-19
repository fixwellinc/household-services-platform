'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useAccessibility } from '@/hooks/use-accessibility';

interface AccessibilityContextType {
  isKeyboardUser: boolean;
  hasScreenReader: boolean;
  prefersReducedMotion: boolean;
  highContrast: boolean;
  fontSize: 'normal' | 'large' | 'larger';
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

interface AccessibilityProviderProps {
  children: ReactNode;
}

export function AccessibilityProvider({ children }: AccessibilityProviderProps) {
  const accessibility = useAccessibility();

  return (
    <AccessibilityContext.Provider value={accessibility}>
      <div 
        className={`
          ${accessibility.isKeyboardUser ? 'keyboard-navigation' : ''}
          ${accessibility.highContrast ? 'high-contrast' : ''}
          ${accessibility.prefersReducedMotion ? 'reduced-motion' : ''}
        `}
        data-keyboard-user={accessibility.isKeyboardUser}
        data-screen-reader={accessibility.hasScreenReader}
        data-reduced-motion={accessibility.prefersReducedMotion}
        data-high-contrast={accessibility.highContrast}
      >
        {children}
      </div>
    </AccessibilityContext.Provider>
  );
}

export function useAccessibilityContext() {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibilityContext must be used within an AccessibilityProvider');
  }
  return context;
}