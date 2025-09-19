'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

const enhancedButtonVariants = cva(
  'relative inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 overflow-hidden group',
  {
    variants: {
      variant: {
        default: 'bg-gradient-to-r from-primary-600 to-primary-700 text-white hover:from-primary-700 hover:to-primary-800 hover:shadow-lg hover:shadow-primary-500/25 hover:-translate-y-0.5 active:translate-y-0 active:shadow-md',
        destructive: 'bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 hover:shadow-lg hover:shadow-red-500/25 hover:-translate-y-0.5 active:translate-y-0',
        outline: 'border-2 border-primary-200 bg-white text-primary-700 hover:border-primary-300 hover:bg-primary-50 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0',
        secondary: 'bg-gradient-to-r from-secondary-100 to-secondary-200 text-secondary-800 hover:from-secondary-200 hover:to-secondary-300 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0',
        ghost: 'text-primary-700 hover:bg-primary-50 hover:text-primary-800 hover:shadow-sm',
        premium: 'bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 text-white hover:shadow-xl hover:shadow-purple-500/25 hover:-translate-y-1 hover:scale-105 active:translate-y-0 active:scale-100 bg-size-200 hover:bg-pos-0',
        glow: 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-glow-lg hover:-translate-y-0.5 active:translate-y-0',
        glass: 'bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 hover:border-white/30 hover:shadow-glass hover:-translate-y-0.5 active:translate-y-0',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3 text-xs',
        lg: 'h-12 rounded-lg px-8 text-base',
        xl: 'h-14 rounded-xl px-10 text-lg',
        icon: 'h-10 w-10',
      },
      animation: {
        none: '',
        subtle: 'hover:scale-105 active:scale-95',
        bounce: 'hover:animate-pulse active:animate-bounce',
        glow: 'hover:animate-glow-pulse',
        shimmer: 'before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-700',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      animation: 'subtle',
    },
  }
);

export interface EnhancedButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof enhancedButtonVariants> {
  asChild?: boolean;
  loading?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  ripple?: boolean;
}

const EnhancedButton = React.forwardRef<HTMLButtonElement, EnhancedButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    animation,
    asChild = false, 
    loading = false,
    loadingText,
    icon,
    iconPosition = 'left',
    ripple = true,
    children,
    onClick,
    disabled,
    ...props 
  }, ref) => {
    const [ripples, setRipples] = React.useState<Array<{ id: number; x: number; y: number }>>([]);
    const rippleId = React.useRef(0);

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (ripple && !disabled && !loading) {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const newRipple = { id: rippleId.current++, x, y };
        setRipples(prev => [...prev, newRipple]);
        
        // Remove ripple after animation
        setTimeout(() => {
          setRipples(prev => prev.filter(r => r.id !== newRipple.id));
        }, 600);
      }
      
      if (onClick && !disabled && !loading) {
        onClick(e);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if ((e.key === 'Enter' || e.key === ' ') && !disabled && !loading) {
        e.preventDefault();
        if (onClick) {
          onClick(e as any);
        }
      }
    };

    const Comp = asChild ? Slot : 'button';
    
    const isDisabled = disabled || loading;
    
    return (
      <Comp
        className={cn(enhancedButtonVariants({ variant, size, animation, className }))}
        ref={ref}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        aria-describedby={loading ? `${props.id}-loading` : undefined}
        role={asChild ? undefined : "button"}
        tabIndex={asChild ? undefined : 0}
        {...props}
      >
        {/* Ripple effect */}
        {ripples.map(ripple => (
          <span
            key={ripple.id}
            className="absolute rounded-full bg-white/30 animate-ping pointer-events-none"
            style={{
              left: ripple.x - 10,
              top: ripple.y - 10,
              width: 20,
              height: 20,
            }}
            aria-hidden="true"
          />
        ))}
        
        {/* Screen reader loading announcement */}
        {loading && (
          <span className="sr-only" id={`${props.id}-loading`}>
            {loadingText || 'Loading, please wait'}
          </span>
        )}

        {/* Loading state */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-inherit rounded-md">
            <LoadingSpinner className="w-4 h-4 mr-2" aria-hidden="true" />
            {loadingText && <span aria-hidden="true">{loadingText}</span>}
          </div>
        )}
        
        {/* Content */}
        <div className={cn(
          'flex items-center justify-center gap-2 transition-opacity duration-200',
          loading && 'opacity-0'
        )}>
          {icon && iconPosition === 'left' && (
            <span className="flex-shrink-0">{icon}</span>
          )}
          {children}
          {icon && iconPosition === 'right' && (
            <span className="flex-shrink-0">{icon}</span>
          )}
        </div>
      </Comp>
    );
  }
);

EnhancedButton.displayName = 'EnhancedButton';

export { EnhancedButton, enhancedButtonVariants };

/**
 * Preset button components for common use cases
 */
export const ButtonPresets = {
  /**
   * Call-to-action button with premium styling
   */
  CTA: React.forwardRef<HTMLButtonElement, Omit<EnhancedButtonProps, 'variant' | 'animation'>>(
    (props, ref) => (
      <EnhancedButton 
        ref={ref} 
        variant="premium" 
        animation="shimmer" 
        size="lg"
        {...props} 
      />
    )
  ),

  /**
   * Primary action button with glow effect
   */
  Primary: React.forwardRef<HTMLButtonElement, Omit<EnhancedButtonProps, 'variant'>>(
    (props, ref) => (
      <EnhancedButton 
        ref={ref} 
        variant="glow" 
        {...props} 
      />
    )
  ),

  /**
   * Glass morphism button for modern interfaces
   */
  Glass: React.forwardRef<HTMLButtonElement, Omit<EnhancedButtonProps, 'variant'>>(
    (props, ref) => (
      <EnhancedButton 
        ref={ref} 
        variant="glass" 
        {...props} 
      />
    )
  ),

  /**
   * Subtle button for secondary actions
   */
  Subtle: React.forwardRef<HTMLButtonElement, Omit<EnhancedButtonProps, 'variant' | 'animation'>>(
    (props, ref) => (
      <EnhancedButton 
        ref={ref} 
        variant="ghost" 
        animation="none" 
        {...props} 
      />
    )
  ),
};

// Add display names for presets
ButtonPresets.CTA.displayName = 'ButtonPresets.CTA';
ButtonPresets.Primary.displayName = 'ButtonPresets.Primary';
ButtonPresets.Glass.displayName = 'ButtonPresets.Glass';
ButtonPresets.Subtle.displayName = 'ButtonPresets.Subtle';