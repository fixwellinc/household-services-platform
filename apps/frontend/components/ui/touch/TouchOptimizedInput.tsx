'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Eye, EyeOff, Check, X, AlertCircle } from 'lucide-react';
import { TouchOptimizedButton } from './TouchOptimizedButton';

export interface TouchOptimizedInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: string;
  hint?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  showPasswordToggle?: boolean;
  loading?: boolean;
  touchFeedback?: boolean;
  hapticFeedback?: boolean;
  autoValidate?: boolean;
  validationRules?: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    email?: boolean;
    phone?: boolean;
  };
}

const TouchOptimizedInput = React.forwardRef<HTMLInputElement, TouchOptimizedInputProps>(
  ({
    className,
    type = 'text',
    label,
    error,
    success,
    hint,
    icon,
    iconPosition = 'left',
    showPasswordToggle = false,
    loading = false,
    touchFeedback = true,
    hapticFeedback = true,
    autoValidate = false,
    validationRules,
    onChange,
    onBlur,
    onFocus,
    ...props
  }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const [isFocused, setIsFocused] = React.useState(false);
    const [internalError, setInternalError] = React.useState<string>('');
    const [internalSuccess, setInternalSuccess] = React.useState<string>('');
    const [hasInteracted, setHasInteracted] = React.useState(false);
    const inputRef = React.useRef<HTMLInputElement>(null);

    // Combine refs
    React.useImperativeHandle(ref, () => inputRef.current!);

    const triggerHapticFeedback = (type: 'success' | 'error' | 'light' = 'light') => {
      if (hapticFeedback && 'vibrate' in navigator) {
        const patterns = {
          success: [10, 50, 10],
          error: [50, 100, 50],
          light: 10,
        };
        navigator.vibrate(patterns[type]);
      }
    };

    const validateInput = (value: string): { isValid: boolean; message: string } => {
      if (!validationRules) return { isValid: true, message: '' };

      const { required, minLength, maxLength, pattern, email, phone } = validationRules;

      if (required && !value.trim()) {
        return { isValid: false, message: 'This field is required' };
      }

      if (minLength && value.length < minLength) {
        return { isValid: false, message: `Minimum ${minLength} characters required` };
      }

      if (maxLength && value.length > maxLength) {
        return { isValid: false, message: `Maximum ${maxLength} characters allowed` };
      }

      if (email && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return { isValid: false, message: 'Please enter a valid email address' };
      }

      if (phone && value && !/^[\+]?[1-9][\d]{0,15}$/.test(value.replace(/[\s\-\(\)]/g, ''))) {
        return { isValid: false, message: 'Please enter a valid phone number' };
      }

      if (pattern && value && !pattern.test(value)) {
        return { isValid: false, message: 'Please enter a valid format' };
      }

      return { isValid: true, message: 'Valid input' };
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      
      if (autoValidate && hasInteracted) {
        const validation = validateInput(value);
        if (validation.isValid && value) {
          setInternalSuccess(validation.message);
          setInternalError('');
          triggerHapticFeedback('success');
        } else if (!validation.isValid) {
          setInternalError(validation.message);
          setInternalSuccess('');
          triggerHapticFeedback('error');
        } else {
          setInternalError('');
          setInternalSuccess('');
        }
      }

      onChange?.(e);
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      triggerHapticFeedback('light');
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      setHasInteracted(true);
      
      if (autoValidate) {
        const validation = validateInput(e.target.value);
        if (validation.isValid && e.target.value) {
          setInternalSuccess(validation.message);
          setInternalError('');
        } else if (!validation.isValid) {
          setInternalError(validation.message);
          setInternalSuccess('');
        }
      }
      
      onBlur?.(e);
    };

    const togglePasswordVisibility = () => {
      setShowPassword(!showPassword);
      triggerHapticFeedback('light');
    };

    const inputType = type === 'password' && showPassword ? 'text' : type;
    const displayError = error || internalError;
    const displaySuccess = success || internalSuccess;
    const hasError = Boolean(displayError);
    const hasSuccess = Boolean(displaySuccess) && !hasError;

    // Determine appropriate input mode for mobile keyboards
    const getInputMode = (): React.HTMLAttributes<HTMLInputElement>['inputMode'] => {
      switch (type) {
        case 'email':
          return 'email';
        case 'tel':
          return 'tel';
        case 'url':
          return 'url';
        case 'number':
          return 'numeric';
        case 'search':
          return 'search';
        default:
          return 'text';
      }
    };

    return (
      <div className="space-y-2">
        {/* Label */}
        {label && (
          <label 
            htmlFor={props.id}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {label}
            {validationRules?.required && (
              <span className="text-red-500 ml-1">*</span>
            )}
          </label>
        )}

        {/* Input Container */}
        <div className="relative">
          {/* Left Icon */}
          {icon && iconPosition === 'left' && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none">
              {icon}
            </div>
          )}

          {/* Input Field */}
          <input
            ref={inputRef}
            type={inputType}
            inputMode={getInputMode()}
            className={cn(
              // Base styles with touch-friendly sizing
              'w-full px-4 py-3 min-h-[48px] text-base rounded-lg border transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-offset-1',
              'placeholder:text-gray-400 dark:placeholder:text-gray-500',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'touch-manipulation', // Optimize for touch
              
              // Icon padding
              icon && iconPosition === 'left' && 'pl-10',
              (icon && iconPosition === 'right') || showPasswordToggle && 'pr-10',
              
              // State-based styling
              hasError && [
                'border-red-300 dark:border-red-700',
                'bg-red-50 dark:bg-red-900/10',
                'text-red-900 dark:text-red-100',
                'focus:border-red-500 focus:ring-red-500/20',
              ],
              hasSuccess && [
                'border-green-300 dark:border-green-700',
                'bg-green-50 dark:bg-green-900/10',
                'text-green-900 dark:text-green-100',
                'focus:border-green-500 focus:ring-green-500/20',
              ],
              !hasError && !hasSuccess && [
                'border-gray-300 dark:border-gray-600',
                'bg-white dark:bg-gray-800',
                'text-gray-900 dark:text-gray-100',
                'focus:border-blue-500 focus:ring-blue-500/20',
              ],
              
              // Focus and interaction states
              isFocused && 'ring-2',
              touchFeedback && 'active:scale-[0.995] transition-transform',
              
              className
            )}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            {...props}
          />

          {/* Right Icon or Password Toggle */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-2">
            {/* Loading Spinner */}
            {loading && (
              <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
            )}

            {/* Success/Error Icons */}
            {!loading && hasSuccess && (
              <Check className="w-5 h-5 text-green-500" />
            )}
            {!loading && hasError && (
              <AlertCircle className="w-5 h-5 text-red-500" />
            )}

            {/* Password Toggle */}
            {showPasswordToggle && type === 'password' && (
              <TouchOptimizedButton
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={togglePasswordVisibility}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                touchFeedback="subtle"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </TouchOptimizedButton>
            )}

            {/* Right Icon */}
            {icon && iconPosition === 'right' && !showPasswordToggle && (
              <div className="text-gray-400 dark:text-gray-500 pointer-events-none">
                {icon}
              </div>
            )}
          </div>
        </div>

        {/* Help Text, Error, or Success Message */}
        <div className="min-h-[20px]">
          {displayError && (
            <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {displayError}
            </p>
          )}
          {displaySuccess && !displayError && (
            <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
              <Check className="w-4 h-4 flex-shrink-0" />
              {displaySuccess}
            </p>
          )}
          {hint && !displayError && !displaySuccess && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {hint}
            </p>
          )}
        </div>
      </div>
    );
  }
);

TouchOptimizedInput.displayName = 'TouchOptimizedInput';

export { TouchOptimizedInput };