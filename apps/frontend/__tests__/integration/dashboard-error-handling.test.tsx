import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DashboardRouteGuard } from '../../components/dashboard/DashboardRouteGuard';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';

// Mock dependencies
jest.mock('../../contexts/AuthContext');
jest.mock('../../lib/api');

// Mock Next.js router
const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/dashboard',
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockApi = api as jest.Mocked<typeof api>;

// Test component
const TestDashboardContent = () => (
  <div data-testid="dashboard-content">Dashboard Content</div>
);

// Test wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('Dashboard Error Handling Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console methods to avoid noise in tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('authentication errors', () => {
    it('should redirect to login when user is not authenticated', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        isHydrated: true,
      } as any);

      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <DashboardRouteGuard>
            <TestDashboardContent />
          </DashboardRouteGuard>
        </Wrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Redirecting to sign in/)).toBeInTheDocument();
      });

      // Should not show dashboard content
      expect(screen.queryByTestId('dashboard-content')).not.toBeInTheDocument();
    });

    it('should show loading state while authentication is being checked', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: true,
        isAuthenticated: false,
        isHydrated: false,
      } as any);

      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <DashboardRouteGuard>
            <TestDashboardContent />
          </DashboardRouteGuard>
        </Wrapper>
      );

      expect(screen.getByText(/Initializing/)).toBeInTheDocument();
      expect(screen.queryByTestId('dashboard-content')).not.toBeInTheDocument();
    });
  });

  describe('subscription data errors', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', role: 'CUSTOMER' },
        isLoading: false,
        isAuthenticated: true,
        isHydrated: true,
      } as any);
    });

    it('should handle subscription service unavailable', async () => {
      const subscriptionError = new Error('Subscription service unavailable');
      mockApi.getUserPlan.mockRejectedValue(subscriptionError);

      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <DashboardRouteGuard>
            <TestDashboardContent />
          </DashboardRouteGuard>
        </Wrapper>
      );

      // Should show error state
      await waitFor(() => {
        expect(screen.getByText(/Subscription Data Unavailable/)).toBeInTheDocument();
      });

      expect(screen.getByText(/trouble loading your subscription/)).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
      expect(screen.getByText('Continue to Dashboard')).toBeInTheDocument();
    });

    it('should allow retry when subscription data fails', async () => {
      const subscriptionError = new Error('Network timeout');
      mockApi.getUserPlan
        .mockRejectedValueOnce(subscriptionError)
        .mockResolvedValueOnce({
          success: true,
          hasPlan: true,
          subscription: { status: 'ACTIVE', tier: 'premium' },
          plan: { id: '1', name: 'Premium Plan' }
        });

      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <DashboardRouteGuard>
            <TestDashboardContent />
          </DashboardRouteGuard>
        </Wrapper>
      );

      // Should show error initially
      await waitFor(() => {
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });

      // Click retry
      fireEvent.click(screen.getByText('Try Again'));

      // Should eventually show dashboard content
      await waitFor(() => {
        expect(screen.getByTestId('dashboard-content')).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should provide fallback navigation when subscription data is unavailable', async () => {
      const subscriptionError = new Error('Service unavailable');
      mockApi.getUserPlan.mockRejectedValue(subscriptionError);

      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <DashboardRouteGuard>
            <TestDashboardContent />
          </DashboardRouteGuard>
        </Wrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Continue to Dashboard')).toBeInTheDocument();
      });

      // Mock window.location for navigation test
      delete (window as any).location;
      window.location = { href: '' } as any;

      fireEvent.click(screen.getByText('Continue to Dashboard'));
      
      // Should navigate to fallback route
      await waitFor(() => {
        expect(window.location.href).toBe('/customer-dashboard');
      });
    });
  });

  describe('network errors', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', role: 'CUSTOMER' },
        isLoading: false,
        isAuthenticated: true,
        isHydrated: true,
      } as any);
    });

    it('should handle network connectivity issues', async () => {
      const networkError = new Error('Network error: Unable to connect');
      mockApi.getUserPlan.mockRejectedValue(networkError);

      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <DashboardRouteGuard>
            <TestDashboardContent />
          </DashboardRouteGuard>
        </Wrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Connection Problem')).toBeInTheDocument();
      });

      expect(screen.getByText(/check your internet connection/)).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });

    it('should show appropriate retry options for network errors', async () => {
      const networkError = new Error('fetch failed');
      mockApi.getUserPlan.mockRejectedValue(networkError);

      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <DashboardRouteGuard>
            <TestDashboardContent />
          </DashboardRouteGuard>
        </Wrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });

      expect(screen.getByText('Go to Dashboard')).toBeInTheDocument();
    });
  });

  describe('role-based access control with errors', () => {
    it('should handle admin user with subscription errors gracefully', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', role: 'ADMIN' },
        isLoading: false,
        isAuthenticated: true,
        isHydrated: true,
      } as any);

      const subscriptionError = new Error('Subscription service down');
      mockApi.getUserPlan.mockRejectedValue(subscriptionError);

      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <DashboardRouteGuard requiredRole="CUSTOMER">
            <TestDashboardContent />
          </DashboardRouteGuard>
        </Wrapper>
      );

      // Should redirect admin to admin dashboard instead of showing error
      await waitFor(() => {
        expect(screen.getByText(/Redirecting to your dashboard/)).toBeInTheDocument();
      });
    });

    it('should handle customer user accessing admin-only content', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', role: 'CUSTOMER' },
        isLoading: false,
        isAuthenticated: true,
        isHydrated: true,
      } as any);

      mockApi.getUserPlan.mockResolvedValue({
        success: true,
        hasPlan: true,
        subscription: { status: 'ACTIVE' }
      });

      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <DashboardRouteGuard requiredRole="ADMIN">
            <TestDashboardContent />
          </DashboardRouteGuard>
        </Wrapper>
      );

      // Should redirect to customer dashboard
      await waitFor(() => {
        expect(screen.getByText(/Redirecting to your dashboard/)).toBeInTheDocument();
      });
    });
  });

  describe('error recovery flows', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', role: 'CUSTOMER' },
        isLoading: false,
        isAuthenticated: true,
        isHydrated: true,
      } as any);
    });

    it('should recover from temporary errors', async () => {
      const temporaryError = new Error('Temporary service error');
      mockApi.getUserPlan
        .mockRejectedValueOnce(temporaryError)
        .mockRejectedValueOnce(temporaryError)
        .mockResolvedValueOnce({
          success: true,
          hasPlan: true,
          subscription: { status: 'ACTIVE', tier: 'premium' },
          plan: { id: '1', name: 'Premium Plan' }
        });

      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <DashboardRouteGuard>
            <TestDashboardContent />
          </DashboardRouteGuard>
        </Wrapper>
      );

      // Should show error initially
      await waitFor(() => {
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });

      // First retry
      fireEvent.click(screen.getByText('Try Again'));

      // Should show retry count
      await waitFor(() => {
        expect(screen.getByText(/Retry attempt 1 of 3/)).toBeInTheDocument();
      });

      // Second retry
      fireEvent.click(screen.getByText('Try Again'));

      // Should eventually recover and show content
      await waitFor(() => {
        expect(screen.getByTestId('dashboard-content')).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should handle max retries reached', async () => {
      const persistentError = new Error('Persistent error');
      mockApi.getUserPlan.mockRejectedValue(persistentError);

      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <DashboardRouteGuard>
            <TestDashboardContent />
          </DashboardRouteGuard>
        </Wrapper>
      );

      // Should show error initially
      await waitFor(() => {
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });

      // Exhaust retries
      for (let i = 0; i < 3; i++) {
        fireEvent.click(screen.getByText('Try Again'));
        await waitFor(() => {
          expect(screen.getByText(`Retry attempt ${i + 1} of 3`)).toBeInTheDocument();
        });
      }

      // Should show contact support option
      await waitFor(() => {
        expect(screen.getByText('Contact Support')).toBeInTheDocument();
      });

      expect(screen.queryByText('Try Again')).not.toBeInTheDocument();
    });
  });

  describe('loading states during error recovery', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', role: 'CUSTOMER' },
        isLoading: false,
        isAuthenticated: true,
        isHydrated: true,
      } as any);
    });

    it('should show loading overlay during error recovery', async () => {
      const slowError = new Error('Slow error');
      mockApi.getUserPlan.mockImplementation(() => 
        new Promise((_, reject) => setTimeout(() => reject(slowError), 100))
      );

      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <DashboardRouteGuard showLoadingOverlay={true}>
            <TestDashboardContent />
          </DashboardRouteGuard>
        </Wrapper>
      );

      // Should show loading state initially
      expect(screen.getByText(/Checking authentication/)).toBeInTheDocument();

      // Should eventually show error
      await waitFor(() => {
        expect(screen.getByText('Something Went Wrong')).toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });

  describe('accessibility during error states', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', role: 'CUSTOMER' },
        isLoading: false,
        isAuthenticated: true,
        isHydrated: true,
      } as any);
    });

    it('should maintain proper focus management during errors', async () => {
      const error = new Error('Test error');
      mockApi.getUserPlan.mockRejectedValue(error);

      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <DashboardRouteGuard>
            <TestDashboardContent />
          </DashboardRouteGuard>
        </Wrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });

      const retryButton = screen.getByText('Try Again');
      retryButton.focus();
      expect(document.activeElement).toBe(retryButton);
    });

    it('should have proper ARIA labels for error states', async () => {
      const error = new Error('Test error');
      mockApi.getUserPlan.mockRejectedValue(error);

      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <DashboardRouteGuard>
            <TestDashboardContent />
          </DashboardRouteGuard>
        </Wrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });

      const retryButton = screen.getByText('Try Again');
      expect(retryButton).toHaveAttribute('type', 'button');
    });
  });
});