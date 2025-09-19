'use client';

import React, { forwardRef, InputHTMLAttributes, useState } from 'react';
import { useAccessibilityContext } from './AccessibilityProvider';

interface AccessibleInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
  showLabel?: boolean;
}

export const AccessibleInput = forwardRef<HTMLInputElement, AccessibleInputProps>(
  ({ 
    label, 
    error, 
    helperText, 
    showLabel = true, 
    className = '', 
    id,
    onChange,
    onBlur,
    ...props 
  }, ref) => {
    const { announce, isKeyboardUser } = useAccessibilityContext();
    const [isFocused, setIsFocused] = useState(false);
    
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const errorId = error ? `${inputId}-error` : undefined;
    const helperId = helperText ? `${inputId}-helper` : undefined;

    const baseClasses = `
      w-full px-3 py-2 border rounded-md transition-all duration-200
      focus:outline-none focus:ring-2 focus:ring-offset-1
      disabled:opacity-50 disabled:cursor-not-allowed
      ${isKeyboardUser ? 'focus:ring-blue-500' : ''}
      ${error 
        ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
      }
    `;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (onChange) {
        onChange(e);
      }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      if (onBlur) {
        onBlur(e);
      }
      
      // Announce validation errors
      if (error) {
        announce(`Error: ${error}`, 'assertive');
      }
    };

    const handleFocus = () => {
      setIsFocused(true);
    };

    return (
      <div className="space-y-1">
        <label 
          htmlFor={inputId}
          className={`
            block text-sm font-medium text-gray-700
            ${showLabel ? '' : 'sr-only'}
          `}
        >
          {label}
          {props.required && (
            <span className="text-red-500 ml-1" aria-label="required">
              *
            </span>
          )}
        </label>
        
        <input
          ref={ref}
          id={inputId}
          className={`${baseClasses} ${className}`}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={[errorId, helperId].filter(Boolean).join(' ') || undefined}
          {...props}
        />
        
        {helperText && (
          <p 
            id={helperId}
            className="text-sm text-gray-600"
          >
            {helperText}
          </p>
        )}
        
        {error && (
          <p 
            id={errorId}
            className="text-sm text-red-600"
            role="alert"
            aria-live="polite"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

AccessibleInput.displayName = 'AccessibleInput';