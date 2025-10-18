/**
 * Component Composition Utilities
 * Utilities for component composition and enhancement
 */

import React, { ComponentType, forwardRef } from 'react';
import { ComposableComponentProps, BaseComponentProps } from '../types/base';

/**
 * Creates a composable component that can render as different elements
 */
export function createComposableComponent<P extends BaseComponentProps>(
  defaultElement: keyof JSX.IntrinsicElements | ComponentType<any> = 'div',
  displayName?: string
) {
  const ComposableComponent = forwardRef<any, P & ComposableComponentProps>(
    ({ as: Element = defaultElement, children, className, ...props }, ref) => {
      return (
        <Element ref={ref} className={className} {...props}>
          {children}
        </Element>
      );
    }
  );

  ComposableComponent.displayName = displayName || 'ComposableComponent';
  
  return ComposableComponent;
}

/**
 * Combines multiple HOCs into a single HOC
 */
export function composeHOCs<P extends object>(
  ...hocs: Array<(component: ComponentType<any>) => ComponentType<any>>
) {
  return (WrappedComponent: ComponentType<P>) => {
    return hocs.reduceRight(
      (acc, hoc) => hoc(acc),
      WrappedComponent
    );
  };
}

/**
 * Creates a compound component pattern
 */
export function createCompoundComponent<T extends Record<string, ComponentType<any>>>(
  MainComponent: ComponentType<any>,
  subComponents: T
): ComponentType<any> & T {
  const CompoundComponent = MainComponent as ComponentType<any> & T;
  
  Object.keys(subComponents).forEach(key => {
    CompoundComponent[key as keyof T] = subComponents[key as keyof T];
  });

  return CompoundComponent;
}

/**
 * Creates a polymorphic component that can render as different elements
 */
export function createPolymorphicComponent<P extends BaseComponentProps>(
  render: (props: P & ComposableComponentProps, ref: React.Ref<any>) => React.ReactElement
) {
  return forwardRef(render);
}

/**
 * Utility to merge class names conditionally
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Creates a variant-based component system
 */
export function createVariantComponent<
  P extends BaseComponentProps,
  V extends Record<string, string>
>(
  baseClassName: string,
  variants: V,
  defaultVariant?: keyof V
) {
  return forwardRef<any, P & { variant?: keyof V }>(
    ({ variant = defaultVariant, className, ...props }, ref) => {
      const variantClassName = variant ? variants[variant] : '';
      const combinedClassName = cn(baseClassName, variantClassName, className);
      
      return <div ref={ref} className={combinedClassName} {...props} />;
    }
  );
}

/**
 * Creates a size-based component system
 */
export function createSizeComponent<P extends BaseComponentProps>(
  baseClassName: string,
  sizes: Record<string, string>,
  defaultSize?: string
) {
  return forwardRef<any, P & { size?: string }>(
    ({ size = defaultSize, className, ...props }, ref) => {
      const sizeClassName = size ? sizes[size] : '';
      const combinedClassName = cn(baseClassName, sizeClassName, className);
      
      return <div ref={ref} className={combinedClassName} {...props} />;
    }
  );
}

/**
 * Utility for conditional rendering
 */
export const ConditionalRender: React.FC<{
  condition: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ condition, children, fallback = null }) => {
  return condition ? <>{children}</> : <>{fallback}</>;
};

/**
 * Utility for rendering with error boundaries
 */
export const SafeRender: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error) => void;
}> = ({ children, fallback = null, onError }) => {
  try {
    return <>{children}</>;
  } catch (error) {
    if (onError && error instanceof Error) {
      onError(error);
    }
    return <>{fallback}</>;
  }
};

/**
 * Utility for lazy rendering
 */
export const LazyRender: React.FC<{
  children: React.ReactNode;
  when: boolean;
  fallback?: React.ReactNode;
}> = ({ children, when, fallback = null }) => {
  const [hasRendered, setHasRendered] = React.useState(false);

  React.useEffect(() => {
    if (when && !hasRendered) {
      setHasRendered(true);
    }
  }, [when, hasRendered]);

  if (!when && !hasRendered) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};