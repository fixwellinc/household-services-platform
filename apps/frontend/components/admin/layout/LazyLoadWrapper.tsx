/**
 * Lazy load wrapper component with loading states and error boundaries
 */

import React, { Suspense } from 'react';
import { LoadingSpinner } from '../LoadingSpinner';
import { AdminErrorBoundary } from '../ErrorBoundary';

interface LazyLoadWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
  className?: string;
}

export const LazyLoadWrapper: React.FC<LazyLoadWrapperProps> = ({
  children,
  fallback,
  errorFallback,
  className = ''
}) => {
  const defaultFallback = fallback || <LoadingSpinner size="md" text="Loading..." />;
  
  return (
    <div className={className}>
      <AdminErrorBoundary fallback={errorFallback}>
        <Suspense fallback={defaultFallback}>
          {children}
        </Suspense>
      </AdminErrorBoundary>
    </div>
  );
};

// Specialized lazy load wrappers for different admin sections
export const DashboardLazyWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <LazyLoadWrapper
    fallback={
      <div className="p-6">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 h-32 rounded-lg"></div>
            ))}
          </div>
          <div className="bg-gray-200 h-96 rounded-lg"></div>
        </div>
      </div>
    }
  >
    {children}
  </LazyLoadWrapper>
);

export const TableLazyWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <LazyLoadWrapper
    fallback={
      <div className="p-6">
        <div className="animate-pulse">
          <div className="bg-gray-200 h-12 rounded mb-4"></div>
          <div className="space-y-3">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="bg-gray-200 h-16 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    }
  >
    {children}
  </LazyLoadWrapper>
);

export const FormLazyWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <LazyLoadWrapper
    fallback={
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="bg-gray-200 h-8 w-1/3 rounded"></div>
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-200 h-12 rounded"></div>
            ))}
          </div>
          <div className="bg-gray-200 h-10 w-32 rounded"></div>
        </div>
      </div>
    }
  >
    {children}
  </LazyLoadWrapper>
);

export const ChartLazyWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <LazyLoadWrapper
    fallback={
      <div className="p-6">
        <div className="animate-pulse">
          <div className="bg-gray-200 h-8 w-1/4 rounded mb-4"></div>
          <div className="bg-gray-200 h-64 rounded"></div>
        </div>
      </div>
    }
  >
    {children}
  </LazyLoadWrapper>
);