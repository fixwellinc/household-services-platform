"use client";

import React, { createContext, useContext, useEffect, useCallback, useState } from 'react';
import { useAdminNavigation } from '../hooks/use-admin-navigation';

interface KeyboardNavigationContextType {
  isKeyboardMode: boolean;
  focusedElement: string | null;
  setFocusedElement: (element: string | null) => void;
  registerShortcut: (key: string, callback: () => void, description: string) => void;
  unregisterShortcut: (key: string) => void;
  getShortcuts: () => Array<{ key: string; description: string }>;
}

const KeyboardNavigationContext = createContext<KeyboardNavigationContextType | undefined>(undefined);

interface KeyboardNavigationProviderProps {
  children: React.ReactNode;
}

interface Shortcut {
  callback: () => void;
  description: string;
}

export function KeyboardNavigationProvider({ children }: KeyboardNavigationProviderProps) {
  const [isKeyboardMode, setIsKeyboardMode] = useState(false);
  const [focusedElement, setFocusedElement] = useState<string | null>(null);
  const [shortcuts, setShortcuts] = useState<Map<string, Shortcut>>(new Map());
  
  const { navigateWithKeyboard, setActiveTab, navigationItems } = useAdminNavigation();

  // Detect keyboard usage
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        setIsKeyboardMode(true);
      }
    };

    const handleMouseDown = () => {
      setIsKeyboardMode(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const key = `${e.ctrlKey ? 'ctrl+' : ''}${e.altKey ? 'alt+' : ''}${e.shiftKey ? 'shift+' : ''}${e.key.toLowerCase()}`;
      
      // Check for registered shortcuts
      const shortcut = shortcuts.get(key);
      if (shortcut) {
        e.preventDefault();
        shortcut.callback();
        return;
      }

      // Built-in navigation shortcuts
      switch (key) {
        case 'arrowup':
          if (e.altKey) {
            e.preventDefault();
            navigateWithKeyboard('up');
          }
          break;
        case 'arrowdown':
          if (e.altKey) {
            e.preventDefault();
            navigateWithKeyboard('down');
          }
          break;
        case 'home':
          if (e.altKey) {
            e.preventDefault();
            navigateWithKeyboard('home');
          }
          break;
        case 'end':
          if (e.altKey) {
            e.preventDefault();
            navigateWithKeyboard('end');
          }
          break;
        case '/':
          if (!e.ctrlKey && !e.altKey) {
            e.preventDefault();
            // Focus search input
            const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
            if (searchInput) {
              searchInput.focus();
            }
          }
          break;
        case 'escape':
          // Clear focus and close modals
          setFocusedElement(null);
          const activeElement = document.activeElement as HTMLElement;
          if (activeElement && activeElement.blur) {
            activeElement.blur();
          }
          break;
        case '?':
          if (e.shiftKey) {
            e.preventDefault();
            showKeyboardShortcuts();
          }
          break;
      }

      // Number shortcuts for quick navigation (1-9)
      if (/^[1-9]$/.test(e.key) && e.altKey) {
        e.preventDefault();
        const index = parseInt(e.key) - 1;
        if (navigationItems[index]) {
          setActiveTab(navigationItems[index].id, 'keyboard');
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, navigateWithKeyboard, setActiveTab, navigationItems]);

  const registerShortcut = useCallback((key: string, callback: () => void, description: string) => {
    setShortcuts(prev => new Map(prev).set(key, { callback, description }));
  }, []);

  const unregisterShortcut = useCallback((key: string) => {
    setShortcuts(prev => {
      const newMap = new Map(prev);
      newMap.delete(key);
      return newMap;
    });
  }, []);

  const getShortcuts = useCallback(() => {
    const builtInShortcuts = [
      { key: 'Alt + ↑/↓', description: 'Navigate between menu items' },
      { key: 'Alt + Home/End', description: 'Go to first/last menu item' },
      { key: 'Alt + 1-9', description: 'Quick navigate to menu item' },
      { key: '/', description: 'Focus search' },
      { key: 'Escape', description: 'Clear focus/close modals' },
      { key: 'Shift + ?', description: 'Show keyboard shortcuts' }
    ];

    const customShortcuts = Array.from(shortcuts.entries()).map(([key, shortcut]) => ({
      key,
      description: shortcut.description
    }));

    return [...builtInShortcuts, ...customShortcuts];
  }, [shortcuts]);

  const showKeyboardShortcuts = useCallback(() => {
    // Create and show keyboard shortcuts modal
    const shortcuts = getShortcuts();
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold">Keyboard Shortcuts</h3>
          <button class="text-gray-400 hover:text-gray-600" onclick="this.closest('.fixed').remove()">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        <div class="space-y-2 max-h-64 overflow-y-auto">
          ${shortcuts.map(shortcut => `
            <div class="flex justify-between items-center py-1">
              <span class="text-sm text-gray-600">${shortcut.description}</span>
              <kbd class="px-2 py-1 text-xs font-mono bg-gray-100 rounded">${shortcut.key}</kbd>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Close on click outside or escape
    const handleClose = (e: KeyboardEvent | MouseEvent) => {
      if (e instanceof KeyboardEvent && e.key === 'Escape') {
        modal.remove();
        document.removeEventListener('keydown', handleClose);
        document.removeEventListener('click', handleClose);
      } else if (e instanceof MouseEvent && e.target === modal) {
        modal.remove();
        document.removeEventListener('keydown', handleClose);
        document.removeEventListener('click', handleClose);
      }
    };

    document.addEventListener('keydown', handleClose);
    document.addEventListener('click', handleClose);
  }, [getShortcuts]);

  // Add keyboard mode class to body
  useEffect(() => {
    if (isKeyboardMode) {
      document.body.classList.add('keyboard-navigation');
    } else {
      document.body.classList.remove('keyboard-navigation');
    }
  }, [isKeyboardMode]);

  const value: KeyboardNavigationContextType = {
    isKeyboardMode,
    focusedElement,
    setFocusedElement,
    registerShortcut,
    unregisterShortcut,
    getShortcuts
  };

  return (
    <KeyboardNavigationContext.Provider value={value}>
      {children}
    </KeyboardNavigationContext.Provider>
  );
}

export function useKeyboardNavigation() {
  const context = useContext(KeyboardNavigationContext);
  if (context === undefined) {
    throw new Error('useKeyboardNavigation must be used within a KeyboardNavigationProvider');
  }
  return context;
}