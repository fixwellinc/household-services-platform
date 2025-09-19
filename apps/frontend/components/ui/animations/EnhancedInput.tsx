'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';

const enhancedInputVariants = cva(
  'flex w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background transition-all duration-300 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'border-input focus-visible:ring-ring',
        success: 'border-green-300 focus-visible:ring-green-500 bg-green-50/50',
        error: 'border-red-300 focus-visible:ring-red-500 bg-red-50/50 animate-shake',
        warning: 'border-yellow-300 focus-visible:ring-yellow-500 bg-yellow-50/50',
      },
      size: {
        default: 'h-10',
        sm: 'h-9 px-2 text-xs',
        lg: 'h-12 px-4 text-base',
      },
      animation: {
        none: '',
        focus: 'focus:scale-105 focus:shadow-lg',
        glow: 'focus:shadow-glow',
        lift: 'focus:-translate-y-0.5 focus:shadow-md',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      animation: 'focus',
    },
  }
);

export interface ValidationState {
  isValid?: boolean;
  message?: string;
  isValidating?: boolean;
}

export interface EnhancedInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof enhancedInputVariants> {
  label?: string;
  helperText?: string;
  validation?: ValidationState;
  showValidationIcon?: boolean;
  onValidate?: (value: string) => Promise<ValidationState> | ValidationState;
  debounceMs?: number;
  showPasswordToggle?: boolean;
}

const EnhancedInput = React.forwardRef<HTMLInputElement, EnhancedInputProps>(
  ({
    className,
    variant,
    size,
    animation,
    type = 'text',
    label,
    helperText,
    validation,
    showValidationIcon = true,
    onValidate,
    debounceMs = 300,
    showPasswordToggle = false,
    onChange,
    ...props
  }, ref) => {
    const [internalValidation, setInternalValidation] = React.useState<ValidationState>({});
    const [showPassword, setShowPassword] = React.useState(false);
    const [isFocused, setIsFocused] = React.useState(false);
    const debounceRef = React.useRef<NodeJS.Timeout>();
    
    const currentValidation = validation || internalValidation;
    const isPassword = type === 'password';
    const inputType = isPassword && showPassword ? 'text' : type;
    
    // Determine variant based on validation state
    const getVariant = () => {
      if (currentValidation.isValidating) return 'default';
      if (currentValidation.isValid === true) return 'success';
      if (currentValidation.isValid === false) return 'error';
      return variant || 'default';
    };

    const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      
      // Call original onChange
      if (onChange) {
        onChange(e);
      }
      
      // Handle validation
      if (onValidate) {
        // Clear previous debounce
        if (debounceRef.current) {
          clearTimeout(debounceRef.current);
        }
        
        // Set validating state
        setInternalValidation({ isValidating: true });
        
        // Debounce validation
        debounceRef.current = setTimeout(async () => {
          try {
            const result = await onValidate(value);
            setInternalValidation(result);
          } catch (error) {
            setInternalValidation({
              isValid: false,
              message: 'Validation error occurred',
            });
          }
        }, debounceMs);
      }
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      if (props.onFocus) {
        props.onFocus(e);
      }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      if (props.onBlur) {
        props.onBlur(e);
      }
    };

    const togglePasswordVisibility = () => {
      setShowPassword(!showPassword);
    };

    // Cleanup debounce on unmount
    React.useEffect(() => {
      return () => {
        if (debounceRef.current) {
          clearTimeout(debounceRef.current);
        }
      };
    }, []);

    return (
      <div className="space-y-2">
        {/* Label */}
        {label && (
          <label className={cn(
            'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 transition-colors duration-200',
            isFocused && 'text-primary-600',
            currentValidation.isValid === false && 'text-red-600',
            currentValidation.isValid === true && 'text-green-600'
          )}>
            {label}
          </label>
        )}
        
        {/* Input Container */}
        <div className="relative">
          <input
            type={inputType}
            className={cn(
              enhancedInputVariants({ 
                variant: getVariant(), 
                size, 
                animation, 
                className 
              }),
              // Add padding for icons
              (showValidationIcon || isPassword) && 'pr-10'
            )}
            ref={ref}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            {...props}
          />
          
          {/* Validation/Password Icons */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 space-x-1">
            {/* Validation Icon */}
            {showValidationIcon && currentValidation.isValidating && (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-600 border-t-transparent" />
            )}
            
            {showValidationIcon && !currentValidation.isValidating && currentValidation.isValid === true && (
              <CheckCircle className="h-4 w-4 text-green-500 animate-scale-in" />
            )}
            
            {showValidationIcon && !currentValidation.isValidating && currentValidation.isValid === false && (
              <AlertCircle className="h-4 w-4 text-red-500 animate-shake" />
            )}
            
            {/* Password Toggle */}
            {isPassword && showPasswordToggle && (
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200 focus:outline-none"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            )}
          </div>
        </div>
        
        {/* Helper Text / Validation Message */}
        <div className="min-h-[1.25rem]">
          {currentValidation.message && (
            <p className={cn(
              'text-xs transition-all duration-300 animate-fade-in-up',
              currentValidation.isValid === false && 'text-red-600',
              currentValidation.isValid === true && 'text-green-600',
              currentValidation.isValidating && 'text-blue-600'
            )}>
              {currentValidation.message}
            </p>
          )}
          
          {!currentValidation.message && helperText && (
            <p className="text-xs text-muted-foreground">
              {helperText}
            </p>
          )}
        </div>
      </div>
    );
  }
);

EnhancedInput.displayName = 'EnhancedInput';

export { EnhancedInput, enhancedInputVariants };

/**
 * Preset input components for common use cases
 */
export const InputPresets = {
  /**
   * Email input with built-in validation
   */
  Email: React.forwardRef<HTMLInputElement, Omit<EnhancedInputProps, 'type' | 'onValidate'>>(
    (props, ref) => (
      <EnhancedInput
        ref={ref}
        type="email"
        onValidate={(value) => {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          const isValid = emailRegex.test(value);
          return {
            isValid,
            message: isValid ? 'Valid email address' : 'Please enter a valid email address',
          };
        }}
        {...props}
      />
    )
  ),

  /**
   * Password input with strength validation
   */
  Password: React.forwardRef<HTMLInputElement, Omit<EnhancedInputProps, 'type' | 'showPasswordToggle'>>(
    (props, ref) => (
      <EnhancedInput
        ref={ref}
        type="password"
        showPasswordToggle={true}
        onValidate={(value) => {
          const hasLength = value.length >= 8;
          const hasUpper = /[A-Z]/.test(value);
          const hasLower = /[a-z]/.test(value);
          const hasNumber = /\d/.test(value);
          
          const strength = [hasLength, hasUpper, hasLower, hasNumber].filter(Boolean).length;
          
          if (strength === 4) {
            return { isValid: true, message: 'Strong password' };
          } else if (strength >= 2) {
            return { isValid: undefined, message: 'Medium strength password' };
          } else {
            return { isValid: false, message: 'Password too weak' };
          }
        }}
        {...props}
      />
    )
  ),

  /**
   * Phone input with formatting
   */
  Phone: React.forwardRef<HTMLInputElement, Omit<EnhancedInputProps, 'type' | 'onValidate'>>(
    (props, ref) => (
      <EnhancedInput
        ref={ref}
        type="tel"
        onValidate={(value) => {
          const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
          const isValid = phoneRegex.test(value);
          return {
            isValid,
            message: isValid ? 'Valid phone number' : 'Please enter a valid phone number',
          };
        }}
        {...props}
      />
    )
  ),
};

// Add display names for presets
InputPresets.Email.displayName = 'InputPresets.Email';
InputPresets.Password.displayName = 'InputPresets.Password';
InputPresets.Phone.displayName = 'InputPresets.Phone';