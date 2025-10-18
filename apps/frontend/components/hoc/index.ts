/**
 * Higher-Order Components
 * Reusable component enhancement patterns
 */

export { default as withLoading, withLoading } from './withLoading';
export { default as withErrorBoundary, withErrorBoundary, ErrorBoundary } from './withErrorBoundary';

// Export types
export type { 
  WithLoadingHOC, 
  WithErrorBoundaryHOC,
  ErrorBoundaryProps,
  ErrorFallbackProps,
  LoadingStateProps
} from '../types/base';