'use client';

import React from 'react';
import { 
  StandardErrorBoundary,
  LoadingSpinner,
  LoadingSkeleton,
  ErrorState,
  StandardAlert
} from '@/components/ui/feedback';
import { 
  Stack,
  Grid,
  Box,
  Conditional,
  Switch,
  Case
} from '@/components/patterns';
import { BaseComponentProps } from '@/components/types';

/**
 * Example demonstrating standardized component usage
 */
export function StandardizedComponentsExample() {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid');

  const simulateLoading = () => {
    setLoading(true);
    setError(null);
    setTimeout(() => {
      setLoading(false);
    }, 2000);
  };

  const simulateError = () => {
    setError(new Error('This is a simulated error'));
    setLoading(false);
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <StandardErrorBoundary>
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Standardized Components Example</h1>
        
        {/* Control Panel */}
        <div className="mb-8 p-4 bg-gray-50 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Controls</h2>
          <Stack direction="horizontal" spacing="md">
            <button
              onClick={simulateLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Simulate Loading
            </button>
            <button
              onClick={simulateError}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Simulate Error
            </button>
            <button
              onClick={clearError}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Clear Error
            </button>
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as 'grid' | 'list')}
              className="px-3 py-2 border rounded"
            >
              <option value="grid">Grid View</option>
              <option value="list">List View</option>
            </select>
          </Stack>
        </div>

        {/* Error Display */}
        <Conditional condition={!!error}>
          <StandardAlert
            variant="error"
            title="Error Occurred"
            description={error?.message}
            closable
            onClose={clearError}
            className="mb-6"
          />
        </Conditional>

        {/* Loading States */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Loading States</h2>
          <Grid columns={3} gap="md">
            <div className="p-4 border rounded">
              <h3 className="font-medium mb-2">Spinner Variants</h3>
              <Stack spacing="sm">
                <LoadingSpinner size="sm" text="Small" />
                <LoadingSpinner size="md" variant="pulse" text="Pulse" />
                <LoadingSpinner size="lg" variant="dots" color="success" />
              </Stack>
            </div>
            
            <div className="p-4 border rounded">
              <h3 className="font-medium mb-2">Skeleton Loading</h3>
              <Stack spacing="sm">
                <LoadingSkeleton variant="text" width="80%" />
                <LoadingSkeleton variant="text" width="60%" />
                <LoadingSkeleton variant="rectangular" height="100px" />
                <LoadingSkeleton variant="circular" width="40px" height="40px" />
              </Stack>
            </div>
            
            <div className="p-4 border rounded">
              <h3 className="font-medium mb-2">Conditional Loading</h3>
              <Conditional 
                condition={loading}
                fallback={<p>Content loaded!</p>}
              >
                <LoadingSpinner text="Loading content..." />
              </Conditional>
            </div>
          </Grid>
        </section>

        {/* Error States */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Error States</h2>
          <Grid columns={2} gap="md">
            <ErrorState
              type="network"
              onRetry={() => console.log('Retry network')}
              size="sm"
            />
            <ErrorState
              type="server"
              onRetry={() => console.log('Retry server')}
              onReportBug={() => console.log('Report bug')}
              showReportBug
              size="sm"
            />
          </Grid>
        </section>

        {/* Layout Composition */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Layout Composition</h2>
          
          <Switch value={viewMode}>
            <Case value="grid">
              <Grid columns={3} gap="md">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Box
                    key={i}
                    as="div"
                    className="p-4 border rounded bg-white shadow-sm"
                  >
                    <h3 className="font-medium mb-2">Card {i + 1}</h3>
                    <p className="text-gray-600">Grid layout content</p>
                  </Box>
                ))}
              </Grid>
            </Case>
            
            <Case value="list">
              <Stack spacing="sm">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Box
                    key={i}
                    as="div"
                    className="p-4 border rounded bg-white shadow-sm flex items-center"
                  >
                    <div className="w-10 h-10 bg-blue-100 rounded-full mr-4" />
                    <div>
                      <h3 className="font-medium">Item {i + 1}</h3>
                      <p className="text-gray-600">List layout content</p>
                    </div>
                  </Box>
                ))}
              </Stack>
            </Case>
          </Switch>
        </section>

        {/* Alerts */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Alert Variants</h2>
          <Stack spacing="md">
            <StandardAlert
              variant="info"
              title="Information"
              description="This is an informational message."
            />
            <StandardAlert
              variant="success"
              title="Success"
              description="Operation completed successfully."
            />
            <StandardAlert
              variant="warning"
              title="Warning"
              description="Please review this warning message."
            />
            <StandardAlert
              variant="error"
              title="Error"
              description="An error has occurred."
            />
          </Stack>
        </section>
      </div>
    </StandardErrorBoundary>
  );
}

/**
 * Example of a custom component using standardized patterns
 */
interface CustomCardProps extends BaseComponentProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function CustomCard({ 
  title, 
  description, 
  actions, 
  className, 
  children,
  loading,
  error,
  ...props 
}: CustomCardProps) {
  if (loading) {
    return (
      <div className="p-6 border rounded-lg">
        <LoadingSkeleton variant="text" width="60%" className="mb-2" />
        <LoadingSkeleton variant="text" lines={2} className="mb-4" />
        <LoadingSkeleton variant="rectangular" height="40px" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 border rounded-lg">
        <ErrorState
          type="generic"
          title="Failed to load card"
          message={error.message}
          size="sm"
        />
      </div>
    );
  }

  return (
    <div 
      className={`p-6 border rounded-lg bg-white shadow-sm ${className || ''}`}
      {...props}
    >
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      {description && (
        <p className="text-gray-600 mb-4">{description}</p>
      )}
      {children}
      {actions && (
        <div className="mt-4 flex gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}

export default StandardizedComponentsExample;