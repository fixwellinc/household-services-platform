'use client';

import React, { forwardRef, ButtonHTMLAttributes } from 'react';
import { useAccessibilityContext } from './AccessibilityProvider';

interface AccessibleButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
}

export const AccessibleButton = forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  ({ 
    variant = 'primary', 
    size = 'md', 
    loading = false, 
    loadingText = 'Loading...', 
    children, 
    className = '', 
    disabled,
    onClick,
    ...props 
  }, ref) => {
    const { announce, isKeyboardUser } = useAccessibilityContext();

    const baseClasses = `
      relative inline-flex items-center justify-center font-medium rounded-md
      transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
      disabled:opacity-50 disabled:cursor-not-allowed
      ${isKeyboardUser ? 'focus:ring-blue-500' : ''}
    `;

    const variantClasses = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
      secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
      ghost: 'text-blue-600 hover:bg-blue-50 focus:ring-blue-500'
    };

    const sizeClasses = {
      sm: 'px-3 py-2 text-sm min-h-[36px]',
      md: 'px-4 py-2 text-base min-h-[44px]',
      lg: 'px-6 py-3 text-lg min-h-[48px]'
    };

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (loading || disabled) return;
      
      if (onClick) {
        onClick(e);
        // Announce action completion for screen readers
        setTimeout(() => {
          announce('Action completed', 'polite');
        }, 100);
      }
    };

    return (
      <button
        ref={ref}
        className={`
          ${baseClasses}
          ${variantClasses[variant]}
          ${sizeClasses[size]}
          ${className}
        `}
        disabled={disabled || loading}
        onClick={handleClick}
        aria-disabled={disabled || loading}
        aria-describedby={loading ? `${props.id}-loading` : undefined}
        {...props}
      >
        {loading && (
          <span className="sr-only" id={`${props.id}-loading`}>
            {loadingText}
          </span>
        )}
        
        {loading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        
        <span className={loading ? 'opacity-0' : ''}>
          {children}
        </span>
      </button>
    );
  }
);

AccessibleButton.displayName = 'AccessibleButton';