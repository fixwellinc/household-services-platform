'use client';

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { cn } from '@/lib/utils';
import { useAccessibility } from './AccessibilityProvider';

// Keyboard Navigation Hook
export function useKeyboardNavigation(
  items: Array<{ id: string; element?: HTMLElement | null }>,
  options: {
    loop?: boolean;
    orientation?: 'horizontal' | 'vertical' | 'both';
    onSelect?: (id: string) => void;
    onEscape?: () => void;
  } = {}
) {
  const { loop = true, orientation = 'vertical', onSelect, onEscape } = options;
  const [activeIndex, setActiveIndex] = useState(0);
  const { announce } = useAccessibility();

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const isHorizontal = orientation === 'horizontal' || orientation === 'both';
    const isVertical = orientation === 'vertical' || orientation === 'both';

    switch (e.key) {
      case 'ArrowDown':
        if (isVertical) {
          e.preventDefault();
          setActiveIndex(prev => {
            const next = prev + 1;
            return next >= items.length ? (loop ? 0 : prev) : next;
          });
        }
        break;
      
      case 'ArrowUp':
        if (isVertical) {
          e.preventDefault();
          setActiveIndex(prev => {
            const next = prev - 1;
            return next < 0 ? (loop ? items.length - 1 : prev) : next;
          });
        }
        break;
      
      case 'ArrowRight':
        if (isHorizontal) {
          e.preventDefault();
          setActiveIndex(prev => {
            const next = prev + 1;
            return next >= items.length ? (loop ? 0 : prev) : next;
          });
        }
        break;
      
      case 'ArrowLeft':
        if (isHorizontal) {
          e.preventDefault();
          setActiveIndex(prev => {
            const next = prev - 1;
            return next < 0 ? (loop ? items.length - 1 : prev) : next;
          });
        }
        break;
      
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (items[activeIndex]) {
          onSelect?.(items[activeIndex].id);
          announce(`Selected ${items[activeIndex].id}`);
        }
        break;
      
      case 'Escape':
        e.preventDefault();
        onEscape?.();
        break;
      
      case 'Home':
        e.preventDefault();
        setActiveIndex(0);
        break;
      
      case 'End':
        e.preventDefault();
        setActiveIndex(items.length - 1);
        break;
    }
  }, [items, activeIndex, loop, orientation, onSelect, onEscape, announce]);

  // Focus the active element
  useEffect(() => {
    const activeItem = items[activeIndex];
    if (activeItem?.element) {
      activeItem.element.focus();
    }
  }, [activeIndex, items]);

  return {
    activeIndex,
    setActiveIndex,
    handleKeyDown
  };
}

// Keyboard Navigation Container
interface KeyboardNavigationContainerProps {
  children: React.ReactNode;
  className?: string;
  orientation?: 'horizontal' | 'vertical' | 'both';
  loop?: boolean;
  onSelect?: (id: string) => void;
  onEscape?: () => void;
}

export function KeyboardNavigationContainer({
  children,
  className,
  orientation = 'vertical',
  loop = true,
  onSelect,
  onEscape
}: KeyboardNavigationContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<Array<{ id: string; element: HTMLElement | null }>>([]);

  const { handleKeyDown } = useKeyboardNavigation(items, {
    orientation,
    loop,
    onSelect,
    onEscape
  });

  // Collect focusable elements
  useEffect(() => {
    if (!containerRef.current) return;

    const focusableElements = containerRef.current.querySelectorAll(
      '[data-keyboard-nav], button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    const itemsArray = Array.from(focusableElements).map((element, index) => ({
      id: element.getAttribute('data-keyboard-nav') || `item-${index}`,
      element: element as HTMLElement
    }));

    setItems(itemsArray);
  }, [children]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div
      ref={containerRef}
      className={cn('focus-within:outline-none', className)}
      role="group"
      tabIndex={-1}
    >
      {children}
    </div>
  );
}

// Roving Tab Index Component
interface RovingTabIndexProps {
  children: React.ReactNode;
  className?: string;
  defaultIndex?: number;
  orientation?: 'horizontal' | 'vertical';
}

export function RovingTabIndex({
  children,
  className,
  defaultIndex = 0,
  orientation = 'horizontal'
}: RovingTabIndexProps) {
  const [activeIndex, setActiveIndex] = useState(defaultIndex);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!containerRef.current) return;

    const items = Array.from(
      containerRef.current.querySelectorAll('[role="tab"], [data-roving-tab]')
    ) as HTMLElement[];

    if (items.length === 0) return;

    let nextIndex = activeIndex;

    switch (e.key) {
      case 'ArrowRight':
        if (orientation === 'horizontal') {
          e.preventDefault();
          nextIndex = (activeIndex + 1) % items.length;
        }
        break;
      
      case 'ArrowLeft':
        if (orientation === 'horizontal') {
          e.preventDefault();
          nextIndex = activeIndex === 0 ? items.length - 1 : activeIndex - 1;
        }
        break;
      
      case 'ArrowDown':
        if (orientation === 'vertical') {
          e.preventDefault();
          nextIndex = (activeIndex + 1) % items.length;
        }
        break;
      
      case 'ArrowUp':
        if (orientation === 'vertical') {
          e.preventDefault();
          nextIndex = activeIndex === 0 ? items.length - 1 : activeIndex - 1;
        }
        break;
      
      case 'Home':
        e.preventDefault();
        nextIndex = 0;
        break;
      
      case 'End':
        e.preventDefault();
        nextIndex = items.length - 1;
        break;
    }

    if (nextIndex !== activeIndex) {
      setActiveIndex(nextIndex);
      items[nextIndex]?.focus();
    }
  }, [activeIndex, orientation]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Set initial tab indices
    const items = Array.from(
      container.querySelectorAll('[role="tab"], [data-roving-tab]')
    ) as HTMLElement[];

    items.forEach((item, index) => {
      item.tabIndex = index === activeIndex ? 0 : -1;
    });

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, handleKeyDown]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}

// Keyboard Shortcut Component
interface KeyboardShortcutProps {
  keys: string[];
  onTrigger: () => void;
  description?: string;
  global?: boolean;
  disabled?: boolean;
}

export function KeyboardShortcut({
  keys,
  onTrigger,
  description,
  global = false,
  disabled = false
}: KeyboardShortcutProps) {
  const { announce } = useAccessibility();

  useEffect(() => {
    if (disabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const pressedKeys = [];
      
      if (e.ctrlKey) pressedKeys.push('ctrl');
      if (e.altKey) pressedKeys.push('alt');
      if (e.shiftKey) pressedKeys.push('shift');
      if (e.metaKey) pressedKeys.push('meta');
      
      pressedKeys.push(e.key.toLowerCase());

      const normalizedKeys = keys.map(key => key.toLowerCase());
      
      if (pressedKeys.length === normalizedKeys.length &&
          pressedKeys.every(key => normalizedKeys.includes(key))) {
        e.preventDefault();
        onTrigger();
        
        if (description) {
          announce(`Keyboard shortcut activated: ${description}`);
        }
      }
    };

    const target = global ? document : document.activeElement;
    target?.addEventListener('keydown', handleKeyDown as EventListener);
    
    return () => {
      target?.removeEventListener('keydown', handleKeyDown as EventListener);
    };
  }, [keys, onTrigger, description, global, disabled, announce]);

  return null;
}

// Keyboard Shortcuts Help Component
interface KeyboardShortcutsHelpProps {
  shortcuts: Array<{
    keys: string[];
    description: string;
    category?: string;
  }>;
  isOpen: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsHelp({
  shortcuts,
  isOpen,
  onClose
}: KeyboardShortcutsHelpProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && dialogRef.current) {
      dialogRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    const category = shortcut.category || 'General';
    if (!acc[category]) acc[category] = [];
    acc[category].push(shortcut);
    return acc;
  }, {} as Record<string, typeof shortcuts>);

  const formatKeys = (keys: string[]) => {
    return keys.map(key => {
      switch (key.toLowerCase()) {
        case 'ctrl': return '⌃';
        case 'alt': return '⌥';
        case 'shift': return '⇧';
        case 'meta': return '⌘';
        default: return key.toUpperCase();
      }
    }).join(' + ');
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div
        ref={dialogRef}
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
        role="dialog"
        aria-labelledby="shortcuts-title"
        aria-modal="true"
        tabIndex={-1}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 id="shortcuts-title" className="text-xl font-semibold">
              Keyboard Shortcuts
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Close shortcuts help"
            >
              ✕
            </button>
          </div>

          <div className="space-y-6">
            {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
              <div key={category}>
                <h3 className="text-lg font-medium mb-3 text-gray-900">
                  {category}
                </h3>
                <div className="space-y-2">
                  {categoryShortcuts.map((shortcut, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded"
                    >
                      <span className="text-gray-700">
                        {shortcut.description}
                      </span>
                      <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-sm font-mono">
                        {formatKeys(shortcut.keys)}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t">
            <p className="text-sm text-gray-600">
              Press <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">Escape</kbd> to close this dialog
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Focus Indicator Component
interface FocusIndicatorProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'prominent' | 'subtle';
}

export function FocusIndicator({
  children,
  className,
  variant = 'default'
}: FocusIndicatorProps) {
  const { keyboardNavigation } = useAccessibility();

  const variantClasses = {
    default: 'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
    prominent: 'focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-offset-2',
    subtle: 'focus:outline-none focus:ring-1 focus:ring-blue-500 focus:ring-offset-1'
  };

  return (
    <div
      className={cn(
        keyboardNavigation && variantClasses[variant],
        className
      )}
    >
      {children}
    </div>
  );
}