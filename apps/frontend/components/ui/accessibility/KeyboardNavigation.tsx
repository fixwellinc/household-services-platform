'use client';

import React, { useEffect, useRef, ReactNode } from 'react';
import { useFocusManagement } from '@/hooks/use-accessibility';

interface KeyboardNavigationProps {
  children: ReactNode;
  trapFocus?: boolean;
  restoreFocus?: boolean;
  className?: string;
}

export function KeyboardNavigation({ 
  children, 
  trapFocus = false, 
  restoreFocus = false,
  className = '' 
}: KeyboardNavigationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { trapFocus: enableFocusTrap, restoreFocus: restorePreviousFocus, saveFocus } = useFocusManagement();

  useEffect(() => {
    if (!containerRef.current) return;

    let cleanup: (() => void) | undefined;

    if (trapFocus) {
      if (restoreFocus) {
        saveFocus();
      }
      cleanup = enableFocusTrap(containerRef.current);
    }

    return () => {
      if (cleanup) {
        cleanup();
      }
      if (restoreFocus) {
        restorePreviousFocus();
      }
    };
  }, [trapFocus, restoreFocus, enableFocusTrap, restorePreviousFocus, saveFocus]);

  return (
    <div 
      ref={containerRef}
      className={className}
      role="region"
    >
      {children}
    </div>
  );
}

// Enhanced navigation for complex components
interface NavigationMenuProps {
  children: ReactNode;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export function NavigationMenu({ 
  children, 
  orientation = 'horizontal',
  className = '' 
}: NavigationMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const menu = menuRef.current;
    if (!menu) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const focusableElements = Array.from(
        menu.querySelectorAll('[role="menuitem"], button, [href]')
      ) as HTMLElement[];

      const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);
      
      let nextIndex = currentIndex;

      switch (e.key) {
        case 'ArrowDown':
          if (orientation === 'vertical') {
            e.preventDefault();
            nextIndex = (currentIndex + 1) % focusableElements.length;
          }
          break;
        case 'ArrowUp':
          if (orientation === 'vertical') {
            e.preventDefault();
            nextIndex = currentIndex === 0 ? focusableElements.length - 1 : currentIndex - 1;
          }
          break;
        case 'ArrowRight':
          if (orientation === 'horizontal') {
            e.preventDefault();
            nextIndex = (currentIndex + 1) % focusableElements.length;
          }
          break;
        case 'ArrowLeft':
          if (orientation === 'horizontal') {
            e.preventDefault();
            nextIndex = currentIndex === 0 ? focusableElements.length - 1 : currentIndex - 1;
          }
          break;
        case 'Home':
          e.preventDefault();
          nextIndex = 0;
          break;
        case 'End':
          e.preventDefault();
          nextIndex = focusableElements.length - 1;
          break;
        case 'Escape':
          e.preventDefault();
          (document.activeElement as HTMLElement)?.blur();
          break;
      }

      if (nextIndex !== currentIndex && focusableElements[nextIndex]) {
        focusableElements[nextIndex].focus();
      }
    };

    menu.addEventListener('keydown', handleKeyDown);
    return () => menu.removeEventListener('keydown', handleKeyDown);
  }, [orientation]);

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-orientation={orientation}
      className={className}
    >
      {children}
    </div>
  );
}