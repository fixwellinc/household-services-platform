'use client';

import React, { ComponentType, forwardRef } from 'react';
import { BaseComponentProps } from '@/components/types';
import { cn } from '@/lib/utils';

/**
 * Higher-Order Component that adds standardized props to any component
 * 
 * This HOC ensures all components follow the same prop patterns:
 * - className merging
 * - testId support
 * - loading states
 * - error handling
 * - accessibility attributes
 */
export function withStandardizedProps<P extends object>(
  WrappedComponent: ComponentType<P>,
  options?: {
    displayName?: string;
    defaultClassName?: string;
    forwardRef?: boolean;
  }
) {
  type StandardizedProps = P & BaseComponentProps;

  const StandardizedComponent = (props: StandardizedProps, ref?: any) => {
    const {
      className,
      testId,
      loading,
      error,
      id,
      'aria-label': ariaLabel,
      children,
      ...restProps
    } = props;

    // Handle loading state
    if (loading) {
      return (
        <div 
          className={cn('animate-pulse bg-gray-200 rounded', className)}
          data-testid={testId ? `${testId}-loading` : undefined}
          aria-label={ariaLabel || 'Loading'}
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

    // Merge className with default
    const mergedClassName = cn(options?.defaultClassName, className);

    // Prepare standardized props
    const standardizedProps = {
      ...restProps,
      className: mergedClassName,
      'data-testid': testId,
      id,
      'aria-label': ariaLabel,
      ref: options?.forwardRef ? ref : undefined,
    } as P;

    return React.createElement(WrappedComponent, standardizedProps, children);
  };

  // Set display name
  StandardizedComponent.displayName = 
    options?.displayName || 
    `withStandardizedProps(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  // Return with or without forwardRef
  if (options?.forwardRef) {
    return forwardRef(StandardizedComponent) as ComponentType<StandardizedProps>;
  }

  return StandardizedComponent as ComponentType<StandardizedProps>;
}

/**
 * HOC for adding loading state management
 */
export function withLoadingState<P extends object>(
  WrappedComponent: ComponentType<P>,
  LoadingComponent?: ComponentType<any>
) {
  return function WithLoadingStateComponent(props: P & { isLoading?: boolean }) {
    const { isLoading, ...restProps } = props;

    if (isLoading) {
      if (LoadingComponent) {
        return React.createElement(LoadingComponent);
      }
      return (
        <div className="animate-pulse bg-gray-200 rounded h-20 w-full">
          <span className="sr-only">Loading...</span>
        </div>
      );
    }

    return React.createElement(WrappedComponent, restProps as P);
  };
}

/**
 * HOC for adding error boundary functionality
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: ComponentType<P>,
  ErrorFallback?: ComponentType<{ error: Error; resetError: () => void }>
) {
  return class WithErrorBoundaryComponent extends React.Component<
    P,
    { hasError: boolean; error: Error | null }
  > {
    constructor(props: P) {
      super(props);
      this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error) {
      return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
      console.error('Component error:', error, errorInfo);
    }

    resetError = () => {
      this.setState({ hasError: false, error: null });
    };

    render() {
      if (this.state.hasError) {
        if (ErrorFallback) {
          return React.createElement(ErrorFallback, {
            error: this.state.error!,
            resetError: this.resetError,
          });
        }
        return (
          <div className="p-4 bg-red-50 border border-red-200 rounded">
            <p className="text-red-800">Something went wrong</p>
            <button
              onClick={this.resetError}
              className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
            >
              Try again
            </button>
          </div>
        );
      }

      return React.createElement(WrappedComponent, this.props);
    }

    static displayName = `withErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;
  };
}

/**
 * HOC for adding accessibility enhancements
 */
export function withAccessibility<P extends object>(
  WrappedComponent: ComponentType<P>,
  options?: {
    role?: string;
    ariaLabel?: string;
    focusable?: boolean;
  }
) {
  return function WithAccessibilityComponent(props: P & BaseComponentProps) {
    const enhancedProps = {
      ...props,
      role: options?.role,
      'aria-label': props['aria-label'] || options?.ariaLabel,
      tabIndex: options?.focusable ? 0 : undefined,
    };

    return React.createElement(WrappedComponent, enhancedProps);
  };
}

/**
 * HOC for adding responsive behavior
 */
export function withResponsive<P extends object>(
  WrappedComponent: ComponentType<P>,
  breakpoints?: {
    sm?: ComponentType<P>;
    md?: ComponentType<P>;
    lg?: ComponentType<P>;
  }
) {
  return function WithResponsiveComponent(props: P) {
    const [screenSize, setScreenSize] = React.useState<'sm' | 'md' | 'lg'>('md');

    React.useEffect(() => {
      const updateScreenSize = () => {
        if (window.innerWidth < 640) setScreenSize('sm');
        else if (window.innerWidth < 1024) setScreenSize('md');
        else setScreenSize('lg');
      };

      updateScreenSize();
      window.addEventListener('resize', updateScreenSize);
      return () => window.removeEventListener('resize', updateScreenSize);
    }, []);

    const ResponsiveComponent = breakpoints?.[screenSize] || WrappedComponent;
    return React.createElement(ResponsiveComponent, props);
  };
}

/**
 * HOC for adding performance optimizations
 */
export function withPerformanceOptimization<P extends object>(
  WrappedComponent: ComponentType<P>,
  options?: {
    memo?: boolean;
    lazy?: boolean;
    shouldUpdate?: (prevProps: P, nextProps: P) => boolean;
  }
) {
  let OptimizedComponent = WrappedComponent;

  // Apply memoization
  if (options?.memo) {
    OptimizedComponent = React.memo(OptimizedComponent, options.shouldUpdate);
  }

  // Apply lazy loading
  if (options?.lazy) {
    const LazyComponent = React.lazy(() => Promise.resolve({ default: OptimizedComponent }));
    
    return function WithPerformanceOptimizationComponent(props: P) {
      return (
        <React.Suspense fallback={<div className="animate-pulse bg-gray-200 rounded h-20" />}>
          <LazyComponent {...props} />
        </React.Suspense>
      );
    };
  }

  return OptimizedComponent;
}

/**
 * Compose multiple HOCs together
 */
export function compose<P extends object>(...hocs: Array<(component: ComponentType<any>) => ComponentType<any>>) {
  return (WrappedComponent: ComponentType<P>) => {
    return hocs.reduceRight((acc, hoc) => hoc(acc), WrappedComponent);
  };
}

/**
 * Create a standardized component with all common enhancements
 */
export function createStandardComponent<P extends object>(
  WrappedComponent: ComponentType<P>,
  options?: {
    displayName?: string;
    defaultClassName?: string;
    forwardRef?: boolean;
    memo?: boolean;
    errorBoundary?: boolean;
    accessibility?: {
      role?: string;
      ariaLabel?: string;
      focusable?: boolean;
    };
  }
) {
  let EnhancedComponent = WrappedComponent;

  // Apply standardized props
  EnhancedComponent = withStandardizedProps(EnhancedComponent, {
    displayName: options?.displayName,
    defaultClassName: options?.defaultClassName,
    forwardRef: options?.forwardRef,
  });

  // Apply accessibility enhancements
  if (options?.accessibility) {
    EnhancedComponent = withAccessibility(EnhancedComponent, options.accessibility);
  }

  // Apply error boundary
  if (options?.errorBoundary) {
    EnhancedComponent = withErrorBoundary(EnhancedComponent);
  }

  // Apply memoization
  if (options?.memo) {
    EnhancedComponent = withPerformanceOptimization(EnhancedComponent, { memo: true });
  }

  return EnhancedComponent;
}