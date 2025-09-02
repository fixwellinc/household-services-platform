'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { Moon, Sun } from 'lucide-react';
import { Button } from './shared';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="relative w-10 h-10 rounded-full transition-all duration-300 hover:scale-110 hover:bg-gray-100 dark:hover:bg-gray-800"
      aria-label="Toggle theme"
    >
      <Sun className="h-5 w-5 text-gray-900 dark:text-gray-100 rotate-0 scale-100 transition-all duration-300 dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 text-gray-900 dark:text-gray-100 rotate-90 scale-0 transition-all duration-300 dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}

// Alternative: Compact toggle for mobile
export function ThemeToggleCompact() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800"
    >
      {theme === 'light' ? (
        <>
          <Moon className="h-4 w-4 text-gray-900 dark:text-gray-100" />
          <span className="text-sm text-gray-900 dark:text-gray-100">Dark</span>
        </>
      ) : (
        <>
          <Sun className="h-4 w-4 text-gray-900 dark:text-gray-100" />
          <span className="text-sm text-gray-900 dark:text-gray-100">Light</span>
        </>
      )}
    </Button>
  );
}
