/**
 * Higher-Order Component for Loading States
 * Provides consistent loading state management across components
 */

import React, { ComponentType } from 'react';
import { LoadingStateProps, WithLoadingHOC } from '../types/base';
import LoadingSpinner from '../ui/LoadingSpinner';

/**
 * HOC that adds loading state functionality to any component
 */
export const withLoading: WithLoadingHOC = <P extends object>(
  WrappedComponent: ComponentType<P>
) => {
  const WithLoadingComponent = (props: P & LoadingStateProps) => {
    const { 
      isLoading, 
      skeleton: SkeletonComponent, 
      fallback, 
      delay = 0,
      ...restProps 
    } = props;

    // Handle delayed loading
    const [showLoading, setShowLoading] = React.useState(!delay);

    React.useEffect(() => {
      if (delay && isLoading) {
        const timer = setTimeout(() => setShowLoading(true), delay);
        return () => clearTimeout(timer);
      }
      setShowLoading(isLoading);
    }, [isLoading, delay]);

    if (isLoading && showLoading) {
      if (SkeletonComponent) {
        return <SkeletonComponent />;
      }
      
      if (fallback) {
        return <>{fallback}</>;
      }
      
      return <LoadingSpinner />;
    }

    return <WrappedComponent {...(restProps as P)} />;
  };

  WithLoadingComponent.displayName = `withLoading(${WrappedComponent.displayName || WrappedComponent.name})`;

  return WithLoadingComponent;
};

export default withLoading;