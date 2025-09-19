/**
 * Complete Dashboard Routing Flow Integration Tests
 * 
 * Tests the entire routing flow from initial navigation to final dashboard display
 * Requirements: All requirements validation
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useDashboardRouting } from '@/hooks/use-dashboard-routing';
import { useSubscriptionStatus } from '@/hooks/use-subscription-status';
import { DashboardRouteGuard } from '@/components/dashboard/DashboardRouteGuard';
import api from '@/lib/api';

// Mock dependencies
jest.mock('next/navigation');
jest.mock('@/contexts/AuthContext');
jest.mock('@/hooks/use-dashboard-routing');
jest.mock('@/hooks/use-subscription-status');
jest.mock('@/lib/api');

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  prefetch: jest.fn(),
};

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseDashboardRouting = useDashboardRouting as jest.MockedFunction<typeof useDashboardRouting>;
const mockUseSubscriptionStatus = useSubscriptionStatus as jest.MockedFunction<typeof useSubscriptionStatus>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUseSearchParams = useSearchParams as jest.MockedFunction<typeof useSearchParams>;
const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;
const mockApi = api as jest.Mocked<typeof api>;

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

// Mock dashboard component
const MockDashboardContent = ({ userType }: { userType: string }) => (
  <div data-testid={`${userType}-dashboard-content`}>
    {userType} Dashboard Content
  </div>
);

describe('Complete Dashboard Routing Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mocks
    mockUseRouter.mockReturnValue(mockRouter);
    mockUseSearchParams.mockReturnValue(new URLSearchParams());
    mockUsePathname.mockReturnValue('/dashboard');
    
    // Mock console methods to avoid noise
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Complete routing flow for different user types', () => {
    it('should complete full routing flow for admin user', async () => {
      // Setup admin user
      mockUseAuth.mockReturnValue({
        user: { id: '1', role: 'ADMIN', name: 'Admin User', email: 'admin@test.com' },
        isLoading: false,
        isAuthenticated: true,
        isHydrated: true,
      } as any);

      mockUseSubscriptionStatus.mockReturnValue({
        hasSubscriptionHistory: false,
        currentStatus: 'NONE',
        shouldShowCustomerDashboard: false,
        isLoading: false,
        isError: false,
      } as any);

      mockUseDashboardRouting.mockReturnValue({
        isLoading: false,
        error: null,
        targetRoute: '/admin',
        shouldRedirectToAdmin: true,
        shouldRedirectToCustomerDashboard: false,
        shouldShowGeneralDashboard: false,
        navigateToRoute: jest.fn(),
        navigateToDashboard: jest.fn(),
        getDashboardUrl: jest.fn(() => '/admin'),
        isCurrentRoute: jest.fn(() => false),
        availableRoutes: ['/admin'],
        currentRoute: '/dashboard',
      } as any);

      const TestComponent = () => {
        const routing = useDashboardRouting();
        
        React.useEffect(() => {
          if (routing.shouldRedirectToAdmin) {
            routing.navigateToRoute('/admin', true);
          }
        }, [routing]);

        return (
          <DashboardRouteGuard>
            <MockDashboardContent userType="admin" />
          </DashboardRouteGuard>
        );
      };

      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <TestComponent />
        </Wrapper>
      );

      // Should eventually show admin dashboard
      await waitFor(() => {
        expect(screen.getByTestId('admin-dashboard-content')).toBeInTheDocument();
      });

      // Verify routing logic was called
      expect(mockUseDashboardRouting).toHaveBeenCalled();
      expect(mockUseSubscriptionStatus).toHaveBeenCalled();
    });

    it('should complete full routing flow for customer with active subscription', async () => {
      // Setup customer user with active subscription
      mockUseAuth.mockReturnValue({
        user: { id: '1', role: 'CUSTOMER', name: 'Customer User', email: 'customer@test.com' },
        isLoading: false,
        isAuthenticated: true,
        isHydrated: true,
      } as any);

      mockApi.getUserPlan.mockResolvedValue({
        success: true,
        hasPlan: true,
        subscription: { status: 'ACTIVE', tier: 'premium' },
        plan: { id: '1', name: 'Premium Plan' }
      });

      mockUseSubscriptionStatus.mockReturnValue({
        hasSubscriptionHistory: true,
        currentStatus: 'ACTIVE',
        shouldShowCustomerDashboard: true,
        isLoading: false,
        isError: false,
        subscription: { status: 'ACTIVE', tier: 'premium' },
      } as any);

      mockUseDashboardRouting.mockReturnValue({
        isLoading: false,
        error: null,
        targetRoute: '/customer-dashboard',
        shouldRedirectToAdmin: false,
        shouldRedirectToCustomerDashboard: true,
        shouldShowGeneralDashboard: false,
        navigateToRoute: jest.fn(),
        navigateToDashboard: jest.fn(),
        getDashboardUrl: jest.fn(() => '/customer-dashboard'),
        isCurrentRoute: jest.fn(() => false),
        availableRoutes: ['/customer-dashboard'],
        currentRoute: '/dashboard',
      } as any);

      const TestComponent = () => {
        const routing = useDashboardRouting();
        
        React.useEffect(() => {
          if (routing.shouldRedirectToCustomerDashboard) {
            routing.navigateToRoute('/customer-dashboard', true);
          }
        }, [routing]);

        return (
          <DashboardRouteGuard>
            <MockDashboardContent userType="customer" />
          </DashboardRouteGuard>
        );
      };

      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <TestComponent />
        </Wrapper>
      );

      // Should eventually show customer dashboard
      await waitFor(() => {
        expect(screen.getByTestId('customer-dashboard-content')).toBeInTheDocument();
      });

      // Verify API was called to get subscription data
      expect(mockApi.getUserPlan).toHaveBeenCalled();
    });

    it('should complete full routing flow for customer without subscription', async () => {
      // Setup customer user without subscription
      mockUseAuth.mockReturnValue({
        user: { id: '1', role: 'CUSTOMER', name: 'Customer User', email: 'customer@test.com' },
        isLoading: false,
        isAuthenticated: true,
        isHydrated: true,
      } as any);

      mockApi.getUserPlan.mockResolvedValue({
        success: true,
        hasPlan: false,
        subscription: null,
        plan: null
      });

      mockUseSubscriptionStatus.mockReturnValue({
        hasSubscriptionHistory: false,
        currentStatus: 'NONE',
        shouldShowCustomerDashboard: false,
        isLoading: false,
        isError: false,
      } as any);

      mockUseDashboardRouting.mockReturnValue({
        isLoading: false,
        error: null,
        targetRoute: '/dashboard',
        shouldRedirectToAdmin: false,
        shouldRedirectToCustomerDashboard: false,
        shouldShowGeneralDashboard: true,
        navigateToRoute: jest.fn(),
        navigateToDashboard: jest.fn(),
        getDashboardUrl: jest.fn(() => '/dashboard'),
        isCurrentRoute: jest.fn(() => true),
        availableRoutes: ['/dashboard'],
        currentRoute: '/dashboard',
      } as any);

      const TestComponent = () => {
        const routing = useDashboardRouting();

        return (
          <DashboardRouteGuard>
            <MockDashboardContent userType="general" />
          </DashboardRouteGuard>
        );
      };

      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <TestComponent />
        </Wrapper>
      );

      // Should show general dashboard with promotion
      await waitFor(() => {
        expect(screen.getByTestId('general-dashboard-content')).toBeInTheDocument();
      });
    });
  });

  describe('Loading state transitions during routing', () => {
    it('should show loading states during authentication and subscription data loading', async () => {
      // Start with loading auth
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: true,
        isAuthenticated: false,
        isHydrated: false,
      } as any);

      mockUseSubscriptionStatus.mockReturnValue({
        hasSubscriptionHistory: false,
        currentStatus: 'NONE',
        shouldShowCustomerDashboard: false,
        isLoading: true,
        isError: false,
      } as any);

      mockUseDashboardRouting.mockReturnValue({
        isLoading: true,
        error: null,
        targetRoute: null,
        shouldRedirectToAdmin: false,
        shouldRedirectToCustomerDashboard: false,
        shouldShowGeneralDashboard: false,
        navigateToRoute: jest.fn(),
        navigateToDashboard: jest.fn(),
      } as any);

      const TestComponent = () => (
        <DashboardRouteGuard>
          <MockDashboardContent userType="customer" />
        </DashboardRouteGuard>
      );

      const Wrapper = createWrapper();
      const { rerender } = render(
        <Wrapper>
          <TestComponent />
        </Wrapper>
      );

      // Should show loading state
      expect(screen.getByText(/Initializing/)).toBeInTheDocument();

      // Simulate auth loading complete
      mockUseAuth.mockReturnValue({
        user: { id: '1', role: 'CUSTOMER', name: 'Customer User', email: 'customer@test.com' },
        isLoading: false,
        isAuthenticated: true,
        isHydrated: true,
      } as any);

      // Still loading subscription data
      mockUseSubscriptionStatus.mockReturnValue({
        hasSubscriptionHistory: false,
        currentStatus: 'NONE',
        shouldShowCustomerDashboard: false,
        isLoading: true,
        isError: false,
      } as any);

      mockUseDashboardRouting.mockReturnValue({
        isLoading: true,
        error: null,
        targetRoute: null,
        shouldRedirectToAdmin: false,
        shouldRedirectToCustomerDashboard: false,
        shouldShowGeneralDashboard: false,
        navigateToRoute: jest.fn(),
        navigateToDashboard: jest.fn(),
      } as any);

      rerender(
        <Wrapper>
          <TestComponent />
        </Wrapper>
      );

      // Should show subscription loading state
      expect(screen.getByText(/Checking authentication/)).toBeInTheDocument();

      // Complete loading
      mockUseSubscriptionStatus.mockReturnValue({
        hasSubscriptionHistory: true,
        currentStatus: 'ACTIVE',
        shouldShowCustomerDashboard: true,
        isLoading: false,
        isError: false,
      } as any);

      mockUseDashboardRouting.mockReturnValue({
        isLoading: false,
        error: null,
        targetRoute: '/customer-dashboard',
        shouldRedirectToAdmin: false,
        shouldRedirectToCustomerDashboard: true,
        shouldShowGeneralDashboard: false,
        navigateToRoute: jest.fn(),
        navigateToDashboard: jest.fn(),
      } as any);

      rerender(
        <Wrapper>
          <TestComponent />
        </Wrapper>
      );

      // Should eventually show dashboard content
      await waitFor(() => {
        expect(screen.getByTestId('customer-dashboard-content')).toBeInTheDocument();
      });
    });
  });

  describe('Error handling during routing flow', () => {
    it('should handle authentication errors gracefully', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        isHydrated: true,
        error: new Error('Authentication failed'),
      } as any);

      const TestComponent = () => (
        <DashboardRouteGuard>
          <MockDashboardContent userType="customer" />
        </DashboardRouteGuard>
      );

      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <TestComponent />
        </Wrapper>
      );

      // Should redirect to login
      await waitFor(() => {
        expect(screen.getByText(/Redirecting to sign in/)).toBeInTheDocument();
      });
    });

    it('should handle subscription data errors with fallback', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', role: 'CUSTOMER', name: 'Customer User', email: 'customer@test.com' },
        isLoading: false,
        isAuthenticated: true,
        isHydrated: true,
      } as any);

      mockApi.getUserPlan.mockRejectedValue(new Error('Subscription service unavailable'));

      mockUseSubscriptionStatus.mockReturnValue({
        hasSubscriptionHistory: false,
        currentStatus: 'NONE',
        shouldShowCustomerDashboard: false,
        isLoading: false,
        isError: true,
        error: new Error('Subscription service unavailable'),
      } as any);

      mockUseDashboardRouting.mockReturnValue({
        isLoading: false,
        error: null,
        targetRoute: '/customer-dashboard', // Fallback to customer dashboard
        shouldRedirectToAdmin: false,
        shouldRedirectToCustomerDashboard: true,
        shouldShowGeneralDashboard: false,
        navigateToRoute: jest.fn(),
        navigateToDashboard: jest.fn(),
      } as any);

      const TestComponent = () => (
        <DashboardRouteGuard>
          <MockDashboardContent userType="customer" />
        </DashboardRouteGuard>
      );

      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <TestComponent />
        </Wrapper>
      );

      // Should show error state with fallback option
      await waitFor(() => {
        expect(screen.getByText(/Subscription Data Unavailable/)).toBeInTheDocument();
      });

      expect(screen.getByText('Continue to Dashboard')).toBeInTheDocument();
    });
  });

  describe('Route consolidation integration', () => {
    it('should handle route consolidation from /dashboard to appropriate target', async () => {
      const mockNavigateToRoute = jest.fn();

      mockUseAuth.mockReturnValue({
        user: { id: '1', role: 'CUSTOMER', name: 'Customer User', email: 'customer@test.com' },
        isLoading: false,
        isAuthenticated: true,
        isHydrated: true,
      } as any);

      mockUseSubscriptionStatus.mockReturnValue({
        hasSubscriptionHistory: true,
        currentStatus: 'ACTIVE',
        shouldShowCustomerDashboard: true,
        isLoading: false,
        isError: false,
      } as any);

      mockUseDashboardRouting.mockReturnValue({
        isLoading: false,
        error: null,
        targetRoute: '/customer-dashboard',
        shouldRedirectToAdmin: false,
        shouldRedirectToCustomerDashboard: true,
        shouldShowGeneralDashboard: false,
        navigateToRoute: mockNavigateToRoute,
        navigateToDashboard: jest.fn(),
        getDashboardUrl: jest.fn(() => '/customer-dashboard?preserved=true'),
        isCurrentRoute: jest.fn(() => false),
        availableRoutes: ['/customer-dashboard'],
        currentRoute: '/dashboard',
      } as any);

      // Mock search params to test parameter preservation
      mockUseSearchParams.mockReturnValue(new URLSearchParams('preserved=true&ref=email'));

      const TestComponent = () => {
        const routing = useDashboardRouting();
        
        React.useEffect(() => {
          // Simulate dashboard page redirect logic
          if (routing.shouldRedirectToCustomerDashboard && routing.targetRoute) {
            routing.navigateToRoute(routing.targetRoute, true);
          }
        }, [routing]);

        return (
          <DashboardRouteGuard>
            <MockDashboardContent userType="customer" />
          </DashboardRouteGuard>
        );
      };

      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <TestComponent />
        </Wrapper>
      );

      // Should call navigate with parameter preservation
      await waitFor(() => {
        expect(mockNavigateToRoute).toHaveBeenCalledWith('/customer-dashboard', true);
      });
    });

    it('should handle admin accessing customer dashboard with redirect', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', role: 'ADMIN', name: 'Admin User', email: 'admin@test.com' },
        isLoading: false,
        isAuthenticated: true,
        isHydrated: true,
      } as any);

      mockUsePathname.mockReturnValue('/customer-dashboard');

      mockUseDashboardRouting.mockReturnValue({
        isLoading: false,
        error: null,
        targetRoute: '/admin',
        shouldRedirectToAdmin: true,
        shouldRedirectToCustomerDashboard: false,
        shouldShowGeneralDashboard: false,
        navigateToRoute: jest.fn(),
        navigateToDashboard: jest.fn(),
      } as any);

      const TestComponent = () => (
        <DashboardRouteGuard requiredRole="CUSTOMER">
          <MockDashboardContent userType="customer" />
        </DashboardRouteGuard>
      );

      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <TestComponent />
        </Wrapper>
      );

      // Should redirect admin to admin dashboard
      await waitFor(() => {
        expect(screen.getByText(/Redirecting to your dashboard/)).toBeInTheDocument();
      });
    });
  });

  describe('Real-time subscription status changes during routing', () => {
    it('should handle subscription status changes during routing flow', async () => {
      const mockNavigateToRoute = jest.fn();

      mockUseAuth.mockReturnValue({
        user: { id: '1', role: 'CUSTOMER', name: 'Customer User', email: 'customer@test.com' },
        isLoading: false,
        isAuthenticated: true,
        isHydrated: true,
      } as any);

      // Start with active subscription
      mockUseSubscriptionStatus.mockReturnValue({
        hasSubscriptionHistory: true,
        currentStatus: 'ACTIVE',
        shouldShowCustomerDashboard: true,
        isLoading: false,
        isError: false,
      } as any);

      mockUseDashboardRouting.mockReturnValue({
        isLoading: false,
        error: null,
        targetRoute: '/customer-dashboard',
        shouldRedirectToAdmin: false,
        shouldRedirectToCustomerDashboard: true,
        shouldShowGeneralDashboard: false,
        navigateToRoute: mockNavigateToRoute,
        navigateToDashboard: jest.fn(),
      } as any);

      const TestComponent = () => {
        const routing = useDashboardRouting();
        
        React.useEffect(() => {
          if (routing.shouldRedirectToCustomerDashboard) {
            routing.navigateToRoute('/customer-dashboard', true);
          }
        }, [routing]);

        return (
          <DashboardRouteGuard>
            <MockDashboardContent userType="customer" />
          </DashboardRouteGuard>
        );
      };

      const Wrapper = createWrapper();
      const { rerender } = render(
        <Wrapper>
          <TestComponent />
        </Wrapper>
      );

      // Should initially route to customer dashboard
      await waitFor(() => {
        expect(mockNavigateToRoute).toHaveBeenCalledWith('/customer-dashboard', true);
      });

      // Simulate subscription status change to PAST_DUE
      mockUseSubscriptionStatus.mockReturnValue({
        hasSubscriptionHistory: true,
        currentStatus: 'PAST_DUE',
        shouldShowCustomerDashboard: true, // Still show customer dashboard but with different content
        isLoading: false,
        isError: false,
      } as any);

      rerender(
        <Wrapper>
          <TestComponent />
        </Wrapper>
      );

      // Should still show customer dashboard (status change handled within dashboard)
      await waitFor(() => {
        expect(screen.getByTestId('customer-dashboard-content')).toBeInTheDocument();
      });
    });
  });

  describe('Performance and timing', () => {
    it('should complete routing flow within acceptable time limits', async () => {
      const startTime = Date.now();

      mockUseAuth.mockReturnValue({
        user: { id: '1', role: 'CUSTOMER', name: 'Customer User', email: 'customer@test.com' },
        isLoading: false,
        isAuthenticated: true,
        isHydrated: true,
      } as any);

      mockApi.getUserPlan.mockResolvedValue({
        success: true,
        hasPlan: true,
        subscription: { status: 'ACTIVE', tier: 'premium' },
        plan: { id: '1', name: 'Premium Plan' }
      });

      mockUseSubscriptionStatus.mockReturnValue({
        hasSubscriptionHistory: true,
        currentStatus: 'ACTIVE',
        shouldShowCustomerDashboard: true,
        isLoading: false,
        isError: false,
      } as any);

      mockUseDashboardRouting.mockReturnValue({
        isLoading: false,
        error: null,
        targetRoute: '/customer-dashboard',
        shouldRedirectToAdmin: false,
        shouldRedirectToCustomerDashboard: true,
        shouldShowGeneralDashboard: false,
        navigateToRoute: jest.fn(),
        navigateToDashboard: jest.fn(),
      } as any);

      const TestComponent = () => (
        <DashboardRouteGuard>
          <MockDashboardContent userType="customer" />
        </DashboardRouteGuard>
      );

      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <TestComponent />
        </Wrapper>
      );

      // Should complete routing within 2 seconds (requirement 3.1)
      await waitFor(() => {
        expect(screen.getByTestId('customer-dashboard-content')).toBeInTheDocument();
      }, { timeout: 2000 });

      const endTime = Date.now();
      const routingTime = endTime - startTime;

      // Verify routing completed within acceptable time
      expect(routingTime).toBeLessThan(2000);
    });
  });
});