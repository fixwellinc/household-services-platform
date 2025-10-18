'use client';

import React, { ComponentType, forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { BaseComponentProps, ComponentSize, ComponentVariant } from '@/components/types';
import { cn } from '@/lib/utils';
import { StandardErrorBoundary } from '@/components/ui/feedback';

// =============================================================================
// COMPONENT FACTORY TYPES
// =============================================================================

export interface ComponentFactoryOptions {
  displayName: string;
  defaultClassName?: string;
  variants?: Record<string, Record<string, string>>;
  defaultVariants?: Record<string, any>;
  forwardRef?: boolean;
  memo?: boolean;
  errorBoundary?: boolean;
  accessibility?: {
    role?: string;
    ariaLabel?: string;
  };
}

export interface StandardComponentProps extends BaseComponentProps {
  variant?: string;
  size?: ComponentSize;
}

// =============================================================================
// COMPONENT FACTORY FUNCTIONS
// =============================================================================

/**
 * Creates a standardized component with consistent patterns
 */
export function createStandardComponent<P extends StandardComponentProps>(
  baseElement: keyof JSX.IntrinsicElements | ComponentType<any>,
  options: ComponentFactoryOptions
): ComponentType<P> {
  // Create variant styles using class-variance-authority
  const componentVariants = options.variants ? cva(
    options.defaultClassName || '',
    {
      variants: options.variants,
      defaultVariants: options.defaultVariants,
    }
  ) : null;

  // Create the base component
  const BaseComponent: ComponentType<P> = (props: P) => {
    const {
      className,
      variant,
      size,
      children,
      testId,
      loading,
      error,
      'aria-label': ariaLabel,
      ...restProps
    } = props as any;

    // Handle loading state
    if (loading) {
      return (
        <div 
          className={cn('animate-pulse bg-gray-200 rounded', className)}
          data-testid={testId ? `${testId}-loading` : undefined}
          aria-label="Loading"
        >
          <span className="sr-only">Loading...</span>
        </div>
      );
    }

    // Handle error state
    if (error) {
      return (
        <div 
          className={cn('p-2 bg-red-50 border border-red-200 rounded text-red-800', className)}
          data-testid={testId ? `${testId}-error` : undefined}
          role="alert"
        >
          <span className="text-sm">{error.message || 'An error occurred'}</span>
        </div>
      );
    }

    // Calculate final className
    const finalClassName = componentVariants 
      ? cn(componentVariants({ variant, size }), className)
      : cn(options.defaultClassName, className);

    // Prepare props
    const elementProps = {
      ...restProps,
      className: finalClassName,
      'data-testid': testId,
      'aria-label': ariaLabel || options.accessibility?.ariaLabel,
      role: options.accessibility?.role,
    };

    // Render the component
    return React.createElement(baseElement, elementProps, children);
  };

  // Create the final component
  let Component: any = BaseComponent;

  // Apply memoization if needed
  if (options.memo) {
    Component = React.memo(Component);
  }

  // Apply error boundary if needed
  if (options.errorBoundary) {
    const OriginalComponent = Component;
    Component = (props: P) => (
      <StandardErrorBoundary>
        <OriginalComponent {...props} />
      </StandardErrorBoundary>
    );
  }

  // Set display name
  (Component as any).displayName = options.displayName;

  return Component;
}

/**
 * Creates a button component with standard variants
 */
export function createButtonComponent(
  displayName: string,
  customVariants?: Record<string, Record<string, string>>
) {
  const defaultVariants = {
    variant: {
      default: 'bg-primary text-primary-foreground hover:bg-primary/90',
      destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
      outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
      ghost: 'hover:bg-accent hover:text-accent-foreground',
      link: 'text-primary underline-offset-4 hover:underline',
    },
    size: {
      xs: 'h-7 px-2 text-xs',
      sm: 'h-8 px-3 text-sm',
      md: 'h-10 px-4 py-2',
      lg: 'h-11 px-8',
      xl: 'h-12 px-10 text-lg',
    },
  };

  return createStandardComponent('button', {
    displayName,
    defaultClassName: 'inline-flex items-center justify-center rounded-md font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
    variants: { ...defaultVariants, ...customVariants },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
    forwardRef: true,
    accessibility: {
      role: 'button',
    },
  });
}

/**
 * Creates an input component with standard variants
 */
export function createInputComponent(
  displayName: string,
  customVariants?: Record<string, Record<string, string>>
) {
  const defaultVariants = {
    size: {
      xs: 'h-7 px-2 text-xs',
      sm: 'h-8 px-3 text-sm',
      md: 'h-10 px-3',
      lg: 'h-11 px-4',
      xl: 'h-12 px-4 text-lg',
    },
    variant: {
      default: 'border-input bg-background',
      error: 'border-red-500 bg-red-50',
      success: 'border-green-500 bg-green-50',
    },
  };

  return createStandardComponent('input', {
    displayName,
    defaultClassName: 'flex w-full rounded-md border px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
    variants: { ...defaultVariants, ...customVariants },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
    forwardRef: true,
  });
}

/**
 * Creates a card component with standard variants
 */
export function createCardComponent(
  displayName: string,
  customVariants?: Record<string, Record<string, string>>
) {
  const defaultVariants = {
    variant: {
      default: 'bg-card text-card-foreground',
      outlined: 'border-2 bg-card text-card-foreground',
      elevated: 'shadow-lg bg-card text-card-foreground',
      ghost: 'bg-transparent',
    },
    padding: {
      none: 'p-0',
      xs: 'p-2',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
      xl: 'p-10',
    },
  };

  return createStandardComponent('div', {
    displayName,
    defaultClassName: 'rounded-lg border shadow-sm',
    variants: { ...defaultVariants, ...customVariants },
    defaultVariants: {
      variant: 'default',
      padding: 'md',
    },
    forwardRef: true,
  });
}

/**
 * Creates a text component with standard variants
 */
export function createTextComponent(
  displayName: string,
  defaultElement: keyof JSX.IntrinsicElements = 'span',
  customVariants?: Record<string, Record<string, string>>
) {
  const defaultVariants = {
    size: {
      xs: 'text-xs',
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
      xl: 'text-xl',
      '2xl': 'text-2xl',
    },
    weight: {
      light: 'font-light',
      normal: 'font-normal',
      medium: 'font-medium',
      semibold: 'font-semibold',
      bold: 'font-bold',
    },
    color: {
      default: 'text-foreground',
      muted: 'text-muted-foreground',
      primary: 'text-primary',
      secondary: 'text-secondary',
      success: 'text-green-600',
      warning: 'text-yellow-600',
      error: 'text-red-600',
    },
  };

  return createStandardComponent(defaultElement, {
    displayName,
    variants: { ...defaultVariants, ...customVariants },
    defaultVariants: {
      size: 'md',
      weight: 'normal',
      color: 'default',
    },
    forwardRef: true,
  });
}

// =============================================================================
// COMPOUND COMPONENT FACTORY
// =============================================================================

/**
 * Creates a compound component with sub-components
 */
export function createCompoundComponent<
  T extends Record<string, ComponentType<any>>
>(
  RootComponent: ComponentType<any>,
  subComponents: T,
  displayName?: string
): ComponentType<any> & T {
  const CompoundComponent = Object.assign(RootComponent, subComponents);
  
  if (displayName) {
    CompoundComponent.displayName = displayName;
  }
  
  return CompoundComponent;
}

// =============================================================================
// PRESET COMPONENTS
// =============================================================================

/**
 * Pre-configured standard components
 */
export const StandardButton = createButtonComponent('StandardButton');
export const StandardInput = createInputComponent('StandardInput');
export const StandardCard = createCardComponent('StandardCard');
export const StandardText = createTextComponent('StandardText');
export const StandardHeading = createTextComponent('StandardHeading', 'h2');

// =============================================================================
// COMPONENT REGISTRY
// =============================================================================

/**
 * Registry for dynamically created components
 */
class ComponentRegistry {
  private components = new Map<string, ComponentType<any>>();

  register(name: string, component: ComponentType<any>) {
    this.components.set(name, component);
  }

  get(name: string): ComponentType<any> | undefined {
    return this.components.get(name);
  }

  has(name: string): boolean {
    return this.components.has(name);
  }

  getAll(): Record<string, ComponentType<any>> {
    return Object.fromEntries(this.components);
  }

  createComponent<P extends StandardComponentProps>(
    name: string,
    baseElement: keyof JSX.IntrinsicElements | ComponentType<any>,
    options: ComponentFactoryOptions
  ): ComponentType<P> {
    const component = createStandardComponent<P>(baseElement, {
      ...options,
      displayName: name,
    });
    
    this.register(name, component);
    return component;
  }
}

export const componentRegistry = new ComponentRegistry();

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Creates a component with automatic registration
 */
export function defineComponent<P extends StandardComponentProps>(
  name: string,
  baseElement: keyof JSX.IntrinsicElements | ComponentType<any>,
  options: Omit<ComponentFactoryOptions, 'displayName'>
): ComponentType<P> {
  return componentRegistry.createComponent<P>(name, baseElement, {
    ...options,
    displayName: name,
  });
}

/**
 * Gets a component from the registry
 */
export function getComponent(name: string): ComponentType<any> | undefined {
  return componentRegistry.get(name);
}

/**
 * Checks if a component exists in the registry
 */
export function hasComponent(name: string): boolean {
  return componentRegistry.has(name);
}

/**
 * Gets all registered components
 */
export function getAllComponents(): Record<string, ComponentType<any>> {
  return componentRegistry.getAll();
}