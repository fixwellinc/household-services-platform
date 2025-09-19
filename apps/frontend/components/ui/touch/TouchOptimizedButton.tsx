'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

const touchOptimizedButtonVariants = cva(
  'relative inline-flex items-center justify-center rounded-md font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 overflow-hidden group select-none',
  {
    variants: {
      variant: {
        default: 'bg-gradient-to-r from-primary-600 to-primary-700 text-white hover:from-primary-700 hover:to-primary-800 active:from-primary-800 active:to-primary-900 hover:shadow-lg hover:shadow-primary-500/25 active:shadow-md',
        destructive: 'bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 active:from-red-800 active:to-red-900 hover:shadow-lg hover:shadow-red-500/25',
        outline: 'border-2 border-primary-200 bg-white text-primary-700 hover:border-primary-300 hover:bg-primary-50 active:bg-primary-100 hover:shadow-md',
        secondary: 'bg-gradient-to-r from-secondary-100 to-secondary-200 text-secondary-800 hover:from-secondary-200 hover:to-secondary-300 active:from-secondary-300 active:to-secondary-400 hover:shadow-md',
        ghost: 'text-primary-700 hover:bg-primary-50 hover:text-primary-800 active:bg-primary-100 hover:shadow-sm',
        premium: 'bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 text-white hover:shadow-xl hover:shadow-purple-500/25 active:shadow-lg bg-size-200 hover:bg-pos-0',
      },
      size: {
        // Touch-optimized sizes with minimum 44px touch targets
        default: 'h-12 px-6 py-3 text-base min-w-[44px]', // 48px height
        sm: 'h-11 px-4 py-2.5 text-sm min-w-[44px]', // 44px height
        lg: 'h-14 px-8 py-4 text-lg min-w-[56px]', // 56px height
        xl: 'h-16 px-10 py-5 text-xl min-w-[64px]', // 64px height
        icon: 'h-12 w-12 min-w-[48px]', // 48px square
        'icon-sm': 'h-11 w-11 min-w-[44px]', // 44px square
        'icon-lg': 'h-14 w-14 min-w-[56px]', // 56px square
      },
      touchFeedback: {
        none: '',
        subtle: 'active:scale-95 transition-transform duration-150',
        medium: 'active:scale-90 transition-transform duration-150',
        strong: 'active:scale-85 transition-transform duration-150',
        lift: 'hover:-translate-y-1 active:translate-y-0 transition-transform duration-200',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      touchFeedback: 'subtle',
    },
  }
);

export interface TouchOptimizedButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof touchOptimizedButtonVariants> {
  asChild?: boolean;
  loading?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  hapticFeedback?: boolean;
  touchRipple?: boolean;
}

const TouchOptimizedButton = React.forwardRef<HTMLButtonElement, TouchOptimizedButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    touchFeedback,
    asChild = false, 
    loading = false,
    loadingText,
    icon,
    iconPosition = 'left',
    hapticFeedback = true,
    touchRipple = true,
    children,
    onClick,
    onTouchStart,
    onTouchEnd,
    disabled,
    ...props 
  }, ref) => {
    const [ripples, setRipples] = React.useState<Array<{ id: number; x: number; y: number }>>([]);
    const [isPressed, setIsPressed] = React.useState(false);
    const rippleId = React.useRef(0);
    const buttonRef = React.useRef<HTMLButtonElement>(null);

    // Combine refs
    React.useImperativeHandle(ref, () => buttonRef.current!);

    const triggerHapticFeedback = () => {
      if (hapticFeedback && 'vibrate' in navigator) {
        // Light haptic feedback for touch devices
        navigator.vibrate(10);
      }
    };

    const createRipple = (e: React.TouchEvent<HTMLButtonElement> | React.MouseEvent<HTMLButtonElement>) => {
      if (!touchRipple || disabled || loading) return;

      const rect = e.currentTarget.getBoundingClientRect();
      let x: number, y: number;

      if ('touches' in e) {
        // Touch event
        const touch = e.touches[0] || e.changedTouches[0];
        x = touch.clientX - rect.left;
        y = touch.clientY - rect.top;
      } else {
        // Mouse event
        x = e.clientX - rect.left;
        y = e.clientY - rect.top;
      }
      
      const newRipple = { id: rippleId.current++, x, y };
      setRipples(prev => [...prev, newRipple]);
      
      // Remove ripple after animation
      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== newRipple.id));
      }, 600);
    };

    const handleTouchStart = (e: React.TouchEvent<HTMLButtonElement>) => {
      if (!disabled && !loading) {
        setIsPressed(true);
        triggerHapticFeedback();
        createRipple(e);
      }
      onTouchStart?.(e);
    };

    const handleTouchEnd = (e: React.TouchEvent<HTMLButtonElement>) => {
      setIsPressed(false);
      onTouchEnd?.(e);
    };

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!disabled && !loading) {
        // Create ripple for mouse clicks too
        createRipple(e);
        triggerHapticFeedback();
        onClick?.(e);
      }
    };

    const Comp = asChild ? Slot : 'button';
    
    const isDisabled = disabled || loading;
    
    return (
      <Comp
        ref={buttonRef}
        className={cn(
          touchOptimizedButtonVariants({ variant, size, touchFeedback, className }),
          isPressed && 'brightness-90'
        )}
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        disabled={isDisabled}
        {...props}
      >
        {/* Ripple effects */}
        {ripples.map(ripple => (
          <span
            key={ripple.id}
            className="absolute rounded-full bg-white/30 animate-ping pointer-events-none"
            style={{
              left: ripple.x - 15,
              top: ripple.y - 15,
              width: 30,
              height: 30,
            }}
          />
        ))}
        
        {/* Loading state */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-inherit rounded-md">
            <LoadingSpinner className="w-5 h-5 mr-2" />
            {loadingText && <span className="text-sm">{loadingText}</span>}
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

TouchOptimizedButton.displayName = 'TouchOptimizedButton';

export { TouchOptimizedButton, touchOptimizedButtonVariants };