import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DashboardErrorBoundary from '../../../components/dashboard/DashboardErrorBoundary';

// Mock Next.js router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Test component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

// Test component that throws specific error types
const ThrowSpecificError = ({ errorType }: { errorType: string }) => {
  const errors = {
    network: new Error('Network error: Unable to connect'),
    auth: new Error('Authentication required'),
    subscription: new Error('Subscription data unavailable'),
    routing: new Error('Route navigation failed'),
    unknown: new Error('Unknown error occurred')
  };
  
  throw errors[errorType as keyof typeof errors] || new Error('Default error');
};

describe('DashboardErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console.error to avoid noise in tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('error-free rendering', () => {
    it('should render children when no error occurs', () => {
      render(
        <DashboardErrorBoundary>
          <ThrowError shouldThrow={false} />
        </DashboardErrorBoundary>
      );

      expect(screen.getByText('No error')).toBeInTheDocument();
    });
  });

  describe('error boundary functionality', () => {
    it('should catch and display error when child component throws', () => {
      render(
        <DashboardErrorBoundary>
          <ThrowError shouldThrow={true} />
        </DashboardErrorBoundary>
      );

      expect(screen.getByText('Something Went Wrong')).toBeInTheDocument();
      expect(screen.getByText(/We encountered an unexpected error/)).toBeInTheDocument();
    });

    it('should call onError callback when error occurs', () => {
      const onError = jest.fn();
      
      render(
        <DashboardErrorBoundary onError={onError}>
          <ThrowError shouldThrow={true} />
        </DashboardErrorBoundary>
      );

      expect(onError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.any(String)
        })
      );
    });

    it('should use custom fallback component when provided', () => {
      const CustomFallback = ({ error, resetError }: any) => (
        <div>
          <span>Custom Error: {error.message}</span>
          <button onClick={resetError}>Custom Reset</button>
        </div>
      );

      render(
        <DashboardErrorBoundary fallback={CustomFallback}>
          <ThrowError shouldThrow={true} />
        </DashboardErrorBoundary>
      );

      expect(screen.getByText('Custom Error: Test error')).toBeInTheDocument();
      expect(screen.getByText('Custom Reset')).toBeInTheDocument();
    });
  });

  describe('error type classification', () => {
    it('should display network error UI for network errors', () => {
      render(
        <DashboardErrorBoundary>
          <ThrowSpecificError errorType="network" />
        </DashboardErrorBoundary>
      );

      expect(screen.getByText('Connection Problem')).toBeInTheDocument();
      expect(screen.getByText(/check your internet connection/)).toBeInTheDocument();
    });

    it('should display authentication error UI for auth errors', () => {
      render(
        <DashboardErrorBoundary>
          <ThrowSpecificError errorType="auth" />
        </DashboardErrorBoundary>
      );

      expect(screen.getByText('Authentication Required')).toBeInTheDocument();
      expect(screen.getByText(/Please sign in to access/)).toBeInTheDocument();
      expect(screen.getByText('Sign In')).toBeInTheDocument();
    });

    it('should display subscription error UI for subscription errors', () => {
      render(
        <DashboardErrorBoundary>
          <ThrowSpecificError errorType="subscription" />
        </DashboardErrorBoundary>
      );

      expect(screen.getByText('Subscription Data Unavailable')).toBeInTheDocument();
      expect(screen.getByText(/trouble loading your subscription/)).toBeInTheDocument();
      expect(screen.getByText('Billing Settings')).toBeInTheDocument();
    });

    it('should display routing error UI for routing errors', () => {
      render(
        <DashboardErrorBoundary>
          <ThrowSpecificError errorType="routing" />
        </DashboardErrorBoundary>
      );

      expect(screen.getByText('Navigation Error')).toBeInTheDocument();
      expect(screen.getByText(/problem while navigating/)).toBeInTheDocument();
    });
  });

  describe('retry functionality', () => {
    it('should allow retry when under max retry limit', () => {
      render(
        <DashboardErrorBoundary maxRetries={3}>
          <ThrowError shouldThrow={true} />
        </DashboardErrorBoundary>
      );

      const retryButton = screen.getByText('Try Again');
      expect(retryButton).toBeInTheDocument();
      expect(retryButton).not.toBeDisabled();
    });

    it('should increment retry count when retry button is clicked', async () => {
      const TestComponent = () => {
        const [shouldThrow, setShouldThrow] = React.useState(true);
        
        React.useEffect(() => {
          // Simulate fixing the error after first retry
          const timer = setTimeout(() => setShouldThrow(false), 100);
          return () => clearTimeout(timer);
        }, []);

        return <ThrowError shouldThrow={shouldThrow} />;
      };

      render(
        <DashboardErrorBoundary maxRetries={3}>
          <TestComponent />
        </DashboardErrorBoundary>
      );

      // Should show error initially
      expect(screen.getByText('Something Went Wrong')).toBeInTheDocument();

      // Click retry
      fireEvent.click(screen.getByText('Try Again'));

      // Should show retry count
      await waitFor(() => {
        expect(screen.getByText(/Retry attempt 1 of 3/)).toBeInTheDocument();
      });
    });

    it('should call onMaxRetriesReached when max retries exceeded', () => {
      const onMaxRetriesReached = jest.fn();
      
      render(
        <DashboardErrorBoundary maxRetries={1} onMaxRetriesReached={onMaxRetriesReached}>
          <ThrowError shouldThrow={true} />
        </DashboardErrorBoundary>
      );

      // First retry
      fireEvent.click(screen.getByText('Try Again'));
      
      // Second retry should trigger max retries
      fireEvent.click(screen.getByText('Try Again'));

      expect(onMaxRetriesReached).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should disable retry button when max retries reached', () => {
      render(
        <DashboardErrorBoundary maxRetries={0}>
          <ThrowError shouldThrow={true} />
        </DashboardErrorBoundary>
      );

      expect(screen.queryByText('Try Again')).not.toBeInTheDocument();
      expect(screen.getByText('Contact Support')).toBeInTheDocument();
    });
  });

  describe('navigation actions', () => {
    it('should navigate to sign in for auth errors', () => {
      // Mock window.location
      delete (window as any).location;
      window.location = { href: '' } as any;

      render(
        <DashboardErrorBoundary>
          <ThrowSpecificError errorType="auth" />
        </DashboardErrorBoundary>
      );

      fireEvent.click(screen.getByText('Sign In'));
      expect(window.location.href).toBe('/login');
    });

    it('should navigate to fallback route when fallback button clicked', () => {
      // Mock window.location
      delete (window as any).location;
      window.location = { href: '' } as any;

      render(
        <DashboardErrorBoundary fallbackRoute="/custom-fallback">
          <ThrowError shouldThrow={true} />
        </DashboardErrorBoundary>
      );

      fireEvent.click(screen.getByText('Go to Dashboard'));
      expect(window.location.href).toBe('/custom-fallback');
    });

    it('should navigate to billing settings for subscription errors', () => {
      // Mock window.location
      delete (window as any).location;
      window.location = { href: '' } as any;

      render(
        <DashboardErrorBoundary>
          <ThrowSpecificError errorType="subscription" />
        </DashboardErrorBoundary>
      );

      fireEvent.click(screen.getByText('Billing Settings'));
      expect(window.location.href).toBe('/billing');
    });

    it('should navigate to contact support when max retries reached', () => {
      // Mock window.location
      delete (window as any).location;
      window.location = { href: '' } as any;

      render(
        <DashboardErrorBoundary maxRetries={0}>
          <ThrowError shouldThrow={true} />
        </DashboardErrorBoundary>
      );

      fireEvent.click(screen.getByText('Contact Support'));
      expect(window.location.href).toBe('/contact');
    });
  });

  describe('development mode', () => {
    const originalEnv = process.env.NODE_ENV;

    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('should show error details in development mode', () => {
      render(
        <DashboardErrorBoundary>
          <ThrowError shouldThrow={true} />
        </DashboardErrorBoundary>
      );

      expect(screen.getByText('Error Details (Development)')).toBeInTheDocument();
      
      // Click to expand details
      fireEvent.click(screen.getByText('Error Details (Development)'));
      
      expect(screen.getByText('Error Message:')).toBeInTheDocument();
      expect(screen.getByText('Test error')).toBeInTheDocument();
    });
  });

  describe('error logging', () => {
    it('should log errors to console in development', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      
      render(
        <DashboardErrorBoundary>
          <ThrowError shouldThrow={true} />
        </DashboardErrorBoundary>
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        'Dashboard error logged:',
        expect.objectContaining({
          message: 'Test error',
          context: 'dashboard-routing'
        })
      );

      consoleSpy.mockRestore();
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      render(
        <DashboardErrorBoundary>
          <ThrowError shouldThrow={true} />
        </DashboardErrorBoundary>
      );

      // Check for proper button accessibility
      const retryButton = screen.getByText('Try Again');
      expect(retryButton).toHaveAttribute('type', 'button');
      
      const dashboardButton = screen.getByText('Go to Dashboard');
      expect(dashboardButton).toHaveAttribute('type', 'button');
    });

    it('should have proper focus management', () => {
      render(
        <DashboardErrorBoundary>
          <ThrowError shouldThrow={true} />
        </DashboardErrorBoundary>
      );

      const retryButton = screen.getByText('Try Again');
      retryButton.focus();
      expect(document.activeElement).toBe(retryButton);
    });
  });
});