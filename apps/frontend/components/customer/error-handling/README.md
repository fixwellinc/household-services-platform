# Customer Dashboard Error Handling & Loading States

This directory contains comprehensive error handling and loading state components for the customer dashboard.

## Components Overview

### Error Boundaries

#### `CustomerErrorBoundary`
The main error boundary component with retry mechanisms and error reporting.

```tsx
import { CustomerErrorBoundary } from './error-handling';

<CustomerErrorBoundary
  section="Subscription Overview"
  maxRetries={3}
  onError={(error, errorInfo) => {
    // Custom error handling
  }}
>
  <YourComponent />
</CustomerErrorBoundary>
```

#### Section-Specific Error Boundaries
Pre-configured error boundaries for different dashboard sections:

- `SubscriptionErrorBoundary` - For subscription-related components
- `PerksErrorBoundary` - For perks and benefits components  
- `ServicesErrorBoundary` - For services components
- `UsageAnalyticsErrorBoundary` - For usage analytics components
- `NotificationsErrorBoundary` - For notifications components
- `SectionErrorBoundary` - Generic configurable error boundary

```tsx
import { SubscriptionErrorBoundary } from './error-handling';

<SubscriptionErrorBoundary>
  <SubscriptionOverview />
</SubscriptionErrorBoundary>
```

### Loading States

#### Skeleton Components
Animated placeholder components that match the structure of actual content:

```tsx
import { SubscriptionOverviewSkeleton, PerksListSkeleton } from './loading';

// Show skeleton while loading
{isLoading ? <SubscriptionOverviewSkeleton /> : <SubscriptionOverview />}
```

#### Loading Indicators
Various loading indicators for different use cases:

```tsx
import { LoadingSpinner, InlineLoader, SectionLoader } from './loading';

// Basic spinner
<LoadingSpinner size="lg" />

// Inline loading with text
<InlineLoader text="Loading subscription..." />

// Section-level loading
<SectionLoader message="Loading dashboard data..." />
```

#### Progressive Loading
Smooth transitions between loading and loaded states:

```tsx
import { ProgressiveLoader } from './loading';

<ProgressiveLoader
  isLoading={isLoading}
  skeleton={<SubscriptionOverviewSkeleton />}
  delay={200}
>
  <SubscriptionOverview />
</ProgressiveLoader>
```

### Hooks

#### `useErrorHandler`
Hook for handling errors with retry logic:

```tsx
import { useErrorHandler } from './error-handling';

const { error, retry, canRetry, executeWithRetry } = useErrorHandler({
  maxRetries: 3,
  retryDelay: 1000,
  onError: (error) => console.error(error)
});

// Execute operation with automatic error handling
const loadData = async () => {
  try {
    await executeWithRetry(async () => {
      const response = await fetch('/api/data');
      if (!response.ok) throw new Error('Failed to load');
      return response.json();
    });
  } catch (error) {
    // Error is automatically handled by the hook
  }
};
```

#### `useLoadingState`
Hook for managing loading states:

```tsx
import { useLoadingState } from './loading';

const { 
  isLoading, 
  progress, 
  message, 
  startLoading, 
  stopLoading, 
  executeWithLoading 
} = useLoadingState({
  minLoadingTime: 500,
  timeout: 10000
});

// Execute with loading state
const loadData = async () => {
  await executeWithLoading(
    async () => {
      const response = await fetch('/api/data');
      return response.json();
    },
    'Loading data...'
  );
};
```

#### `useApiErrorHandler`
Specialized hook for API error handling:

```tsx
import { useApiErrorHandler } from './error-handling';

const { error, executeApiCall } = useApiErrorHandler({
  maxRetries: 3,
  onError: (error) => {
    // Handle API-specific errors
  }
});

const fetchData = async () => {
  try {
    const data = await executeApiCall(async () => {
      const response = await fetch('/api/customer/subscription');
      if (!response.ok) throw new Error('API request failed');
      return response.json();
    });
    return data;
  } catch (error) {
    // Error is handled by the hook
  }
};
```

## Integration Examples

### Basic Integration

```tsx
import { 
  SubscriptionErrorBoundary,
  ProgressiveLoader,
  SubscriptionOverviewSkeleton
} from './error-handling';
import { useLoadingState } from './loading';

function SubscriptionSection() {
  const { isLoading, executeWithLoading } = useLoadingState();
  const [data, setData] = useState(null);

  const loadData = async () => {
    const result = await executeWithLoading(
      async () => {
        const response = await fetch('/api/subscription');
        return response.json();
      },
      'Loading subscription...'
    );
    setData(result);
  };

  return (
    <SubscriptionErrorBoundary>
      <ProgressiveLoader
        isLoading={isLoading}
        skeleton={<SubscriptionOverviewSkeleton />}
      >
        <SubscriptionOverview data={data} />
      </ProgressiveLoader>
    </SubscriptionErrorBoundary>
  );
}
```

### Advanced Integration with Multiple States

```tsx
import { 
  useMultipleLoadingStates,
  useApiErrorHandler
} from './error-handling';

function Dashboard() {
  const loadingStates = useMultipleLoadingStates();
  const errorHandler = useApiErrorHandler();

  const loadSubscription = async () => {
    loadingStates.startLoading('subscription', 'Loading subscription...');
    try {
      const data = await errorHandler.executeApiCall(
        () => fetch('/api/subscription').then(r => r.json())
      );
      // Handle success
    } catch (error) {
      // Error handled by errorHandler
    } finally {
      loadingStates.stopLoading('subscription');
    }
  };

  const subscriptionState = loadingStates.getLoadingState('subscription');

  return (
    <div>
      {subscriptionState.isLoading ? (
        <SubscriptionOverviewSkeleton />
      ) : (
        <SubscriptionOverview />
      )}
    </div>
  );
}
```

## Best Practices

### Error Boundaries
1. **Wrap major sections** - Use section-specific error boundaries around major dashboard sections
2. **Provide fallbacks** - Always provide meaningful fallback UI for errors
3. **Enable retry** - Allow users to retry failed operations
4. **Log errors** - Implement proper error logging for debugging

### Loading States
1. **Use skeletons** - Prefer skeleton loading over spinners for better UX
2. **Progressive loading** - Use progressive loading for smooth transitions
3. **Minimum loading time** - Set minimum loading times to prevent flashing
4. **Staggered loading** - Use staggered loading for lists and grids

### Performance
1. **Lazy loading** - Implement lazy loading for non-critical sections
2. **Debounced loading** - Use debounced loading for rapid state changes
3. **Caching** - Cache loading states to prevent unnecessary re-renders
4. **Cleanup** - Always cleanup timeouts and subscriptions

## Error Types

The system handles different types of errors:

- **Network errors** - Connection issues, timeouts
- **API errors** - HTTP status codes, server errors
- **Client errors** - Validation errors, user input errors
- **Component errors** - React component crashes

Each error type has appropriate handling strategies and user messaging.

## Accessibility

All components include proper accessibility features:

- **ARIA labels** - Screen reader support
- **Focus management** - Proper focus handling for interactive elements
- **Status announcements** - Live regions for status updates
- **Keyboard navigation** - Full keyboard accessibility

## Testing

Components include comprehensive testing utilities:

```tsx
import { render, screen } from '@testing-library/react';
import { CustomerErrorBoundary } from './error-handling';

// Test error boundary
const ThrowError = () => {
  throw new Error('Test error');
};

test('error boundary catches errors', () => {
  render(
    <CustomerErrorBoundary>
      <ThrowError />
    </CustomerErrorBoundary>
  );
  
  expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
});
```