/**
 * Component Structure Example
 * Demonstrates the new component organization and usage patterns
 */

'use client';

import React from 'react';
import { 
  Button, 
  Card, 
  Input 
} from '../ui/core';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { withLoading, withErrorBoundary } from '../hoc';
import { createComposableComponent, cn } from '../utils';
import type { BaseComponentProps } from '../types/base';

// Example of creating a composable component
const ExampleBox = createComposableComponent('div', 'ExampleBox');

// Example component with base props
interface ExampleCardProps extends BaseComponentProps {
  title: string;
  description: string;
  onAction?: () => void;
}

const ExampleCard: React.FC<ExampleCardProps> = ({
  title,
  description,
  onAction,
  className,
  loading,
  error,
  testId,
  children
}) => {
  if (error) {
    return (
      <Card className={cn('border-red-200 bg-red-50', className)} data-testid={testId}>
        <div className="p-4">
          <h3 className="text-red-800 font-semibold">Error</h3>
          <p className="text-red-600">{error.message}</p>
        </div>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className={cn('p-4', className)} data-testid={testId}>
        <LoadingSpinner size="md" text="Loading..." />
      </Card>
    );
  }

  return (
    <Card className={cn('p-6', className)} data-testid={testId}>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-gray-600 mb-4">{description}</p>
      {children}
      {onAction && (
        <Button onClick={onAction} className="mt-4">
          Take Action
        </Button>
      )}
    </Card>
  );
};

// Enhanced component with HOCs
const EnhancedExampleCard = withErrorBoundary(
  withLoading(ExampleCard)
);

// Main example component
const ComponentStructureExample: React.FC = () => {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const handleLoadingDemo = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  const handleErrorDemo = () => {
    setError(new Error('This is a demo error'));
    setTimeout(() => setError(null), 3000);
  };

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold mb-6">Component Structure Example</h1>
      
      {/* Basic component usage */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Basic Component Usage</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ExampleCard
            title="Basic Card"
            description="This demonstrates the basic component structure with consistent props."
            testId="basic-card"
          />
          
          <ExampleCard
            title="Interactive Card"
            description="This card has an action button to demonstrate interactivity."
            onAction={() => alert('Action clicked!')}
            testId="interactive-card"
          />
        </div>
      </section>

      {/* Composable component usage */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Composable Components</h2>
        <ExampleBox 
          as="section" 
          className="p-4 border rounded-lg bg-blue-50"
        >
          <p>This box can render as any HTML element or React component.</p>
          <ExampleBox as="article" className="mt-2 p-2 bg-white rounded">
            <p>Nested composable component rendered as an article.</p>
          </ExampleBox>
        </ExampleBox>
      </section>

      {/* HOC usage */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Higher-Order Components</h2>
        <div className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={handleLoadingDemo}>Demo Loading State</Button>
            <Button onClick={handleErrorDemo} variant="destructive">
              Demo Error State
            </Button>
          </div>
          
          <EnhancedExampleCard
            title="Enhanced Card"
            description="This card is enhanced with loading and error boundary HOCs."
            isLoading={loading}
            error={error}
            testId="enhanced-card"
          />
        </div>
      </section>

      {/* Form example */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Form Components</h2>
        <Card className="p-6">
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Example Input
              </label>
              <Input 
                placeholder="Enter some text..."
                className="w-full"
              />
            </div>
            <Button type="submit">Submit</Button>
          </form>
        </Card>
      </section>
    </div>
  );
};

export default ComponentStructureExample;