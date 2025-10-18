/**
 * Higher-Order Component for Error Boundaries
 * Provides consistent error handling across components
 */

import React, { ComponentType, ErrorInfo } from 'react';
import { ErrorBoundaryProps, ErrorFallbackProps, WithErrorBoundaryHOC } from '../types/base';

// Default error fallback component
const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({ 
  error, 
  resetError, 
  componentStack 
}) => (
  <div className="p-4 border border-red-200 rounded-lg bg-red-50">
    <h3 className="text-lg font-semibold text-red-800 mb-2">
      Something went wrong
    </h3>
    <p className="text-red-600 mb-4">
      {error.message}
    </p>
    <button
      onClick={resetError}
      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
    >
      Try again
    </button>
    {process.env.NODE_ENV === 'development' && componentStack && (
      <details className="mt-4">
        <summary className="cursor-pointer text-red-700">
          Component Stack (Development)
        </summary>
        <pre className="mt-2 text-xs text-red-600 overflow-auto">
          {componentStack}
        </pre>
      </details>
    )}
  </div>
);

/**
 * Error Boundary Class Component
 */
class ErrorBoundary extends React.Component<
  {
    children: React.ReactNode;
    fallback?: ComponentType<ErrorFallbackProps>;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
    resetOnPropsChange?: boolean;
  },
  {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
  }
> {
  constructor(props: any) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error) {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by ErrorBoundary:', error);
      console.error('Component stack:', errorInfo.componentStack);
    }
  }

  componentDidUpdate(prevProps: any) {
    // Reset error state when props change (if enabled)
    if (this.props.resetOnPropsChange && this.state.hasError) {
      const propsChanged = Object.keys(this.props).some(
        key => key !== 'children' && this.props[key] !== prevProps[key]
      );
      
      if (propsChanged) {
        this.setState({
          hasError: false,
          error: null,
          errorInfo: null,
        });
      }
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      
      return (
        <FallbackComponent
          error={this.state.error}
          resetError={this.resetError}
          componentStack={this.state.errorInfo?.componentStack}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * HOC that wraps components with error boundary
 */
export const withErrorBoundary: WithErrorBoundaryHOC = <P extends object>(
  WrappedComponent: ComponentType<P>
) => {
  const WithErrorBoundaryComponent = (props: P & Partial<ErrorBoundaryProps>) => {
    const { 
      fallback, 
      onError, 
      resetOnPropsChange,
      ...restProps 
    } = props;

    return (
      <ErrorBoundary
        fallback={fallback}
        onError={onError}
        resetOnPropsChange={resetOnPropsChange}
      >
        <WrappedComponent {...(restProps as P)} />
      </ErrorBoundary>
    );
  };

  WithErrorBoundaryComponent.displayName = `withErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name})`;

  return WithErrorBoundaryComponent;
};

export { ErrorBoundary };
export default withErrorBoundary;