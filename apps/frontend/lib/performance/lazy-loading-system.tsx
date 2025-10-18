/**
 * Component-level lazy loading system
 * Provides intelligent lazy loading for heavy components with fallbacks and error boundaries
 */

import React, { Suspense, ComponentType, ReactNode, ErrorInfo } from 'react';
import { AdminLoadingState } from '@/components/admin/AdminLoadingState';

// =============================================================================
// LOADING FALLBACK COMPONENTS
// =============================================================================

interface LoadingFallbackProps {
    message?: string;
    size?: 'small' | 'medium' | 'large';
    showProgress?: boolean;
}

export const LoadingFallback: React.FC<LoadingFallbackProps> = ({
    message = "Loading component...",
    size = 'medium',
    showProgress = false
}) => {
    const sizeClasses = {
        small: 'h-32',
        medium: 'h-48',
        large: 'h-64'
    };

    return (
        <div className={`flex items-center justify-center ${sizeClasses[size]} bg-gray-50 rounded-lg animate-pulse`}>
            <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600 text-sm">{message}</p>
                {showProgress && (
                    <div className="w-32 bg-gray-200 rounded-full h-2 mx-auto mt-2">
                        <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                    </div>
                )}
            </div>
        </div>
    );
};

// Chart-specific loading fallback
export const ChartLoadingFallback: React.FC<{ title?: string }> = ({ title = "Loading chart..." }) => (
    <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <div className="text-center">
            <div className="animate-pulse">
                <div className="h-4 bg-gray-300 rounded w-24 mx-auto mb-2"></div>
                <div className="h-32 bg-gray-300 rounded w-48 mx-auto mb-2"></div>
                <div className="h-4 bg-gray-300 rounded w-32 mx-auto"></div>
            </div>
            <p className="text-gray-500 text-sm mt-4">{title}</p>
        </div>
    </div>
);

// Form-specific loading fallback
export const FormLoadingFallback: React.FC<{ title?: string }> = ({ title = "Loading form..." }) => (
    <div className="space-y-4 p-6 bg-gray-50 rounded-lg animate-pulse">
        <div className="h-6 bg-gray-300 rounded w-1/3"></div>
        <div className="space-y-3">
            <div className="h-10 bg-gray-300 rounded"></div>
            <div className="h-10 bg-gray-300 rounded"></div>
            <div className="h-24 bg-gray-300 rounded"></div>
        </div>
        <div className="h-10 bg-gray-300 rounded w-1/4"></div>
        <p className="text-gray-500 text-sm text-center">{title}</p>
    </div>
);

// =============================================================================
// ERROR BOUNDARY FOR LAZY COMPONENTS
// =============================================================================

interface LazyErrorBoundaryState {
    hasError: boolean;
    error?: Error;
    errorInfo?: ErrorInfo;
}

interface LazyErrorBoundaryProps {
    children: ReactNode;
    fallback?: ComponentType<{ error?: Error; retry: () => void }>;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

class LazyErrorBoundary extends React.Component<LazyErrorBoundaryProps, LazyErrorBoundaryState> {
    constructor(props: LazyErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): LazyErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        this.setState({ errorInfo });
        this.props.onError?.(error, errorInfo);

        // Log to performance monitoring
        console.error('Lazy component loading error:', error, errorInfo);
    }

    retry = () => {
        this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    };

    render() {
        if (this.state.hasError) {
            const FallbackComponent = this.props.fallback || DefaultErrorFallback;
            return <FallbackComponent error={this.state.error} retry={this.retry} />;
        }

        return this.props.children;
    }
}

// Default error fallback component
const DefaultErrorFallback: React.FC<{ error?: Error; retry: () => void }> = ({ error, retry }) => (
    <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <div className="text-center">
            <div className="text-red-600 mb-4">
                <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
            </div>
            <h3 className="text-lg font-medium text-red-900 mb-2">Component Loading Error</h3>
            <p className="text-red-700 mb-4">
                {error?.message || 'Failed to load component. Please try again.'}
            </p>
            <button
                onClick={retry}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
                Retry Loading
            </button>
        </div>
    </div>
);

// =============================================================================
// LAZY WRAPPER COMPONENT
// =============================================================================

interface LazyWrapperProps {
    children: ReactNode;
    fallback?: ReactNode;
    errorFallback?: ComponentType<{ error?: Error; retry: () => void }>;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

export const LazyWrapper: React.FC<LazyWrapperProps> = ({
    children,
    fallback = <LoadingFallback />,
    errorFallback,
    onError
}) => (
    <LazyErrorBoundary fallback={errorFallback} onError={onError}>
        <Suspense fallback={fallback}>
            {children}
        </Suspense>
    </LazyErrorBoundary>
);

// =============================================================================
// HEAVY COMPONENT LAZY LOADERS
// =============================================================================

// Chart components (heavy due to recharts library)
export const LazyLineChart = React.lazy(() =>
    import('recharts').then(module => ({
        default: module.LineChart
    }))
);

export const LazyBarChart = React.lazy(() =>
    import('recharts').then(module => ({
        default: module.BarChart
    }))
);

export const LazyPieChart = React.lazy(() =>
    import('recharts').then(module => ({
        default: module.PieChart
    }))
);

// Rich text editor (heavy due to react-quill)
export const LazyRichTextEditor = React.lazy(() =>
    import('react-quill').then(module => ({
        default: module.default
    }))
);

// Complex form components
export const LazyComplexForm = React.lazy(() =>
    Promise.resolve({
        default: () => null // Fallback component
    })
);

export const LazyDataTable = React.lazy(() =>
    Promise.resolve({
        default: () => null // Fallback component
    })
);

// =============================================================================
// COMPONENT-SPECIFIC LAZY WRAPPERS
// =============================================================================

interface LazyChartProps {
    children: ReactNode;
    title?: string;
}

export const LazyChart: React.FC<LazyChartProps> = ({ children, title }) => (
    <LazyWrapper
        fallback={<ChartLoadingFallback title={title} />}
        errorFallback={({ error, retry }) => (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800 mb-2">Chart failed to load</p>
                <button onClick={retry} className="text-yellow-600 underline">Retry</button>
            </div>
        )}
    >
        {children}
    </LazyWrapper>
);

interface LazyFormProps {
    children: ReactNode;
    title?: string;
}

export const LazyForm: React.FC<LazyFormProps> = ({ children, title }) => (
    <LazyWrapper
        fallback={<FormLoadingFallback title={title} />}
        errorFallback={({ error, retry }) => (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 mb-2">Form failed to load</p>
                <button onClick={retry} className="text-red-600 underline">Retry</button>
            </div>
        )}
    >
        {children}
    </LazyWrapper>
);

// =============================================================================
// INTERSECTION OBSERVER LAZY LOADING
// =============================================================================

interface IntersectionLazyProps {
    children: ReactNode;
    fallback?: ReactNode;
    rootMargin?: string;
    threshold?: number;
    triggerOnce?: boolean;
}

export const IntersectionLazy: React.FC<IntersectionLazyProps> = ({
    children,
    fallback = <LoadingFallback message="Loading..." />,
    rootMargin = '50px',
    threshold = 0.1,
    triggerOnce = true
}) => {
    const [isVisible, setIsVisible] = React.useState(false);
    const [hasTriggered, setHasTriggered] = React.useState(false);
    const ref = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && (!triggerOnce || !hasTriggered)) {
                    setIsVisible(true);
                    if (triggerOnce) {
                        setHasTriggered(true);
                    }
                } else if (!triggerOnce && !entry.isIntersecting) {
                    setIsVisible(false);
                }
            },
            { rootMargin, threshold }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => observer.disconnect();
    }, [rootMargin, threshold, triggerOnce, hasTriggered]);

    return (
        <div ref={ref}>
            {isVisible ? children : fallback}
        </div>
    );
};

// =============================================================================
// USAGE EXAMPLES AND UTILITIES
// =============================================================================

// Utility function to create lazy components with consistent error handling
export function createLazyComponent<T extends ComponentType<any>>(
    importFn: () => Promise<{ default: T }>,
    fallback?: ReactNode,
    errorFallback?: ComponentType<{ error?: Error; retry: () => void }>
) {
    const LazyComponent = React.lazy(importFn);

    return (props: any) => (
        <LazyWrapper fallback={fallback} errorFallback={errorFallback}>
            <LazyComponent {...props} />
        </LazyWrapper>
    );
}

// Performance monitoring for lazy loading
export const useLazyLoadingMetrics = () => {
    const [metrics, setMetrics] = React.useState({
        loadTime: 0,
        errorCount: 0,
        successCount: 0
    });

    const trackLoadStart = React.useCallback(() => {
        return performance.now();
    }, []);

    const trackLoadEnd = React.useCallback((startTime: number, success: boolean) => {
        const loadTime = performance.now() - startTime;
        setMetrics(prev => ({
            ...prev,
            loadTime,
            errorCount: success ? prev.errorCount : prev.errorCount + 1,
            successCount: success ? prev.successCount + 1 : prev.successCount
        }));
    }, []);

    return { metrics, trackLoadStart, trackLoadEnd };
};