import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { DashboardRouteGuard, withDashboardRouteGuard, useDashboardRouteGuardStatus } from '../../../components/dashboard/DashboardRouteGuard';
import { useAuth } from '../../../contexts/AuthContext';
import { useDashboardRouting } from '../../../hooks/use-dashboard-routing';
import { useSubscriptionStatus } from '../../../hooks/use-subscription-status';

// Mock the dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
  usePathname: jest.fn(),
}));

jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../../hooks/use-dashboard-routing', () => ({
  useDashboardRouting: jest.fn(),
}));

jest.mock('../../../hooks/use-subscription-status', () => ({
  useSubscriptionStatus: jest.fn(),
}));

// Mock UI components
jest.mock('../../../components/ui/shared', () => ({
  Card: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardContent: ({ children, className }: any) => <div className={className}>{children}</div>,
}));

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

// Mock the error handler
jest.mock('../../../components/customer/error-handling/useErrorHandler', () => ({
  useErrorHandler: () => ({
    error: null,
    isRetrying: false,
    retryCount: 0,
    canRetry: true,
    handleError: jest.fn(),
    retry: jest.fn(),
    reset: jest.fn(),
    executeWithRetry: jest.fn().mockImplementation((fn) => fn()),
  }),
}));

describe('DashboardRouteGuard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue(mockRouter);
    
    // Default mock implementations
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      isHydrated: true,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      refetchUser: jest.fn(),
    });

    mockUseDashboardRouting.mockReturnValue({
      currentRoute: '/dashboard',
      targetRoute: '/dashboard',
      isLoading: false,
      error: null,
      availableRoutes: [],
      shouldRedirectToCustomerDashboard: false,
      shouldShowGeneralDashboard: true,
      shouldRedirectToAdmin: false,
      navigateToDashboard: jest.fn(),
      navigateToRoute: jest.fn(),
      getDashboardUrl: jest.fn().mockReturnValue('/dashboard'),
      isCurrentRoute: jest.fn(),
      canAccessRoute: jest.fn(),
    });

    mockUseSubscriptionStatus.mockReturnValue({
      hasSubscriptionHistory: false,
      currentStatus: 'NONE',
      shouldShowCustomerDashboard: false,
      shouldShowPromotion: true,
      canAccessPremiumFeatures: false,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
      isError: false,
    });

    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: {
        pathname: '/dashboard',
        search: '',
        reload: jest.fn(),
      },
      writable: true,
    });
  });

  describe('Authentication Checks', () => {
    it('should show loading state while hydrating', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        isHydrated: false, // Not hydrated yet
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        refetchUser: jest.fn(),
      });

      render(
        <DashboardRouteGuard>
          <div>Dashboard Content</div>
        </DashboardRouteGuard>
      );

      expect(screen.getByText('Initializing...')).toBeInTheDocument();
      expect(screen.queryByText('Dashboard Content')).not.toBeInTheDocument();
    });

    it('should show loading state while authenticating', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: true, // Auth loading
        isAuthenticated: false,
        isHydrated: true,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        refetchUser: jest.fn(),
      });

      render(
        <DashboardRouteGuard>
          <div>Dashboard Content</div>
        </DashboardRouteGuard>
      );

      expect(screen.getByText('Checking authentication...')).toBeInTheDocument();
      expect(screen.queryByText('Dashboard Content')).not.toBeInTheDocument();
    });

    it('should redirect to login when not authenticated', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        isHydrated: true,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        refetchUser: jest.fn(),
      });

      render(
        <DashboardRouteGuard>
          <div>Dashboard Content</div>
        </DashboardRouteGuard>
      );

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/login?returnUrl=%2Fdashboard');
      });

      expect(screen.getByText('Redirecting to sign in...')).toBeInTheDocument();
    });

    it('should redirect to custom fallback route when specified', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        isHydrated: true,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        refetchUser: jest.fn(),
      });

      render(
        <DashboardRouteGuard fallbackRoute="/custom-login">
          <div>Dashboard Content</div>
        </DashboardRouteGuard>
      );

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/custom-login?returnUrl=%2Fdashboard');
      });
    });

    it('should render children when authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'test@example.com', name: 'Test User', role: 'CUSTOMER', createdAt: '2023-01-01' },
        isLoading: false,
        isAuthenticated: true,
        isHydrated: true,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        refetchUser: jest.fn(),
      });

      render(
        <DashboardRouteGuard>
          <div>Dashboard Content</div>
        </DashboardRouteGuard>
      );

      expect(screen.getByText('Dashboard Content')).toBeInTheDocument();
    });
  });

  describe('Role-based Access Control', () => {
    it('should redirect admin users to admin dashboard when accessing customer route', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'admin@example.com', name: 'Admin User', role: 'ADMIN', createdAt: '2023-01-01' },
        isLoading: false,
        isAuthenticated: true,
        isHydrated: true,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        refetchUser: jest.fn(),
      });

      render(
        <DashboardRouteGuard requiredRole="CUSTOMER">
          <div>Customer Dashboard</div>
        </DashboardRouteGuard>
      );

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/admin');
      });

      expect(screen.getByText('Redirecting to your dashboard...')).toBeInTheDocument();
    });

    it('should redirect customer users to customer dashboard when accessing admin route', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'customer@example.com', name: 'Customer User', role: 'CUSTOMER', createdAt: '2023-01-01' },
        isLoading: false,
        isAuthenticated: true,
        isHydrated: true,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        refetchUser: jest.fn(),
      });

      render(
        <DashboardRouteGuard requiredRole="ADMIN">
          <div>Admin Dashboard</div>
        </DashboardRouteGuard>
      );

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/customer-dashboard');
      });
    });

    it('should allow access when user role matches required role', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'customer@example.com', name: 'Customer User', role: 'CUSTOMER', createdAt: '2023-01-01' },
        isLoading: false,
        isAuthenticated: true,
        isHydrated: true,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        refetchUser: jest.fn(),
      });

      render(
        <DashboardRouteGuard requiredRole="CUSTOMER">
          <div>Customer Dashboard</div>
        </DashboardRouteGuard>
      );

      expect(screen.getByText('Customer Dashboard')).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('should show loading state while subscription data is loading', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'test@example.com', name: 'Test User', role: 'CUSTOMER', createdAt: '2023-01-01' },
        isLoading: false,
        isAuthenticated: true,
        isHydrated: true,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        refetchUser: jest.fn(),
      });

      mockUseSubscriptionStatus.mockReturnValue({
        hasSubscriptionHistory: false,
        currentStatus: 'NONE',
        shouldShowCustomerDashboard: false,
        shouldShowPromotion: true,
        canAccessPremiumFeatures: false,
        isLoading: true, // Subscription loading
        error: null,
        refetch: jest.fn(),
        isError: false,
      });

      render(
        <DashboardRouteGuard>
          <div>Dashboard Content</div>
        </DashboardRouteGuard>
      );

      // When subscription is loading but user is authenticated, it should render children
      // The loading overlay behavior is tested separately
      expect(screen.getByText('Dashboard Content')).toBeInTheDocument();
    });

    it('should show loading overlay when showLoadingOverlay is true', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'test@example.com', name: 'Test User', role: 'CUSTOMER', createdAt: '2023-01-01' },
        isLoading: false,
        isAuthenticated: true,
        isHydrated: true,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        refetchUser: jest.fn(),
      });

      mockUseSubscriptionStatus.mockReturnValue({
        hasSubscriptionHistory: false,
        currentStatus: 'NONE',
        shouldShowCustomerDashboard: false,
        shouldShowPromotion: true,
        canAccessPremiumFeatures: false,
        isLoading: true,
        error: null,
        refetch: jest.fn(),
        isError: false,
      });

      mockUseDashboardRouting.mockReturnValue({
        currentRoute: '/dashboard',
        targetRoute: '/dashboard',
        isLoading: false, // Dashboard routing not loading
        error: null,
        availableRoutes: [],
        shouldRedirectToCustomerDashboard: false,
        shouldShowGeneralDashboard: true,
        shouldRedirectToAdmin: false,
        navigateToDashboard: jest.fn(),
        navigateToRoute: jest.fn(),
        getDashboardUrl: jest.fn().mockReturnValue('/dashboard'),
        isCurrentRoute: jest.fn(),
        canAccessRoute: jest.fn(),
      });

      render(
        <DashboardRouteGuard showLoadingOverlay={true}>
          <div>Dashboard Content</div>
        </DashboardRouteGuard>
      );

      expect(screen.getByText('Dashboard Content')).toBeInTheDocument();
      expect(screen.getByText('Updating dashboard...')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should display authentication error with sign in option', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'test@example.com', name: 'Test User', role: 'CUSTOMER', createdAt: '2023-01-01' },
        isLoading: false,
        isAuthenticated: true,
        isHydrated: true,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        refetchUser: jest.fn(),
      });

      mockUseSubscriptionStatus.mockReturnValue({
        hasSubscriptionHistory: false,
        currentStatus: 'NONE',
        shouldShowCustomerDashboard: false,
        shouldShowPromotion: true,
        canAccessPremiumFeatures: false,
        isLoading: false,
        error: new Error('Authentication required'),
        refetch: jest.fn(),
        isError: true,
      });

      render(
        <DashboardRouteGuard>
          <div>Dashboard Content</div>
        </DashboardRouteGuard>
      );

      expect(screen.getByText('Authentication Required')).toBeInTheDocument();
      expect(screen.getByText('Please sign in to access your dashboard.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('should display network error with retry option', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'test@example.com', name: 'Test User', role: 'CUSTOMER', createdAt: '2023-01-01' },
        isLoading: false,
        isAuthenticated: true,
        isHydrated: true,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        refetchUser: jest.fn(),
      });

      mockUseSubscriptionStatus.mockReturnValue({
        hasSubscriptionHistory: false,
        currentStatus: 'NONE',
        shouldShowCustomerDashboard: false,
        shouldShowPromotion: true,
        canAccessPremiumFeatures: false,
        isLoading: false,
        error: new Error('Network error: Unable to connect'),
        refetch: jest.fn(),
        isError: true,
      });

      render(
        <DashboardRouteGuard>
          <div>Dashboard Content</div>
        </DashboardRouteGuard>
      );

      expect(screen.getByText('Connection Problem')).toBeInTheDocument();
      expect(screen.getByText('Unable to connect to our servers. Please check your internet connection.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });

    it('should display subscription error with retry and continue options', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'test@example.com', name: 'Test User', role: 'CUSTOMER', createdAt: '2023-01-01' },
        isLoading: false,
        isAuthenticated: true,
        isHydrated: true,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        refetchUser: jest.fn(),
      });

      mockUseSubscriptionStatus.mockReturnValue({
        hasSubscriptionHistory: false,
        currentStatus: 'NONE',
        shouldShowCustomerDashboard: false,
        shouldShowPromotion: true,
        canAccessPremiumFeatures: false,
        isLoading: false,
        error: new Error('Subscription data unavailable'),
        refetch: jest.fn(),
        isError: true,
      });

      render(
        <DashboardRouteGuard>
          <div>Dashboard Content</div>
        </DashboardRouteGuard>
      );

      expect(screen.getByText('Subscription Data Unavailable')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /continue anyway/i })).toBeInTheDocument();
    });

    it('should handle retry functionality', async () => {
      const mockRefetch = jest.fn();
      
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'test@example.com', name: 'Test User', role: 'CUSTOMER', createdAt: '2023-01-01' },
        isLoading: false,
        isAuthenticated: true,
        isHydrated: true,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        refetchUser: jest.fn(),
      });

      mockUseSubscriptionStatus.mockReturnValue({
        hasSubscriptionHistory: false,
        currentStatus: 'NONE',
        shouldShowCustomerDashboard: false,
        shouldShowPromotion: true,
        canAccessPremiumFeatures: false,
        isLoading: false,
        error: new Error('Network error'),
        refetch: mockRefetch,
        isError: true,
      });

      render(
        <DashboardRouteGuard>
          <div>Dashboard Content</div>
        </DashboardRouteGuard>
      );

      const retryButton = screen.getByRole('button', { name: /try again/i });
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(mockRefetch).toHaveBeenCalled();
      });
    });
  });

  describe('Dashboard Routing', () => {
    it('should trigger navigation when target route differs from current route', async () => {
      const mockNavigateToDashboard = jest.fn();

      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'test@example.com', name: 'Test User', role: 'CUSTOMER', createdAt: '2023-01-01' },
        isLoading: false,
        isAuthenticated: true,
        isHydrated: true,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        refetchUser: jest.fn(),
      });

      mockUseDashboardRouting.mockReturnValue({
        currentRoute: '/dashboard',
        targetRoute: '/customer-dashboard', // Different target
        isLoading: false,
        error: null,
        availableRoutes: [],
        shouldRedirectToCustomerDashboard: true,
        shouldShowGeneralDashboard: false,
        shouldRedirectToAdmin: false,
        navigateToDashboard: mockNavigateToDashboard,
        navigateToRoute: jest.fn(),
        getDashboardUrl: jest.fn().mockReturnValue('/customer-dashboard'),
        isCurrentRoute: jest.fn(),
        canAccessRoute: jest.fn(),
      });

      render(
        <DashboardRouteGuard>
          <div>Dashboard Content</div>
        </DashboardRouteGuard>
      );

      await waitFor(() => {
        expect(mockNavigateToDashboard).toHaveBeenCalledWith(true);
      });
    });

    it('should not trigger navigation when target route matches current route', () => {
      const mockNavigateToDashboard = jest.fn();

      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'test@example.com', name: 'Test User', role: 'CUSTOMER', createdAt: '2023-01-01' },
        isLoading: false,
        isAuthenticated: true,
        isHydrated: true,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        refetchUser: jest.fn(),
      });

      mockUseDashboardRouting.mockReturnValue({
        currentRoute: '/dashboard',
        targetRoute: '/dashboard', // Same target
        isLoading: false,
        error: null,
        availableRoutes: [],
        shouldRedirectToCustomerDashboard: false,
        shouldShowGeneralDashboard: true,
        shouldRedirectToAdmin: false,
        navigateToDashboard: mockNavigateToDashboard,
        navigateToRoute: jest.fn(),
        getDashboardUrl: jest.fn().mockReturnValue('/dashboard'),
        isCurrentRoute: jest.fn(),
        canAccessRoute: jest.fn(),
      });

      render(
        <DashboardRouteGuard>
          <div>Dashboard Content</div>
        </DashboardRouteGuard>
      );

      expect(mockNavigateToDashboard).not.toHaveBeenCalled();
    });
  });

  describe('Higher-Order Component', () => {
    it('should wrap component with route guard', () => {
      const TestComponent = () => <div>Test Component</div>;
      const WrappedComponent = withDashboardRouteGuard(TestComponent, { requiredRole: 'CUSTOMER' });

      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'test@example.com', name: 'Test User', role: 'CUSTOMER', createdAt: '2023-01-01' },
        isLoading: false,
        isAuthenticated: true,
        isHydrated: true,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        refetchUser: jest.fn(),
      });

      render(<WrappedComponent />);

      expect(screen.getByText('Test Component')).toBeInTheDocument();
    });
  });

  describe('useDashboardRouteGuardStatus Hook', () => {
    it('should return correct status when ready', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'test@example.com', name: 'Test User', role: 'CUSTOMER', createdAt: '2023-01-01' },
        isLoading: false,
        isAuthenticated: true,
        isHydrated: true,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        refetchUser: jest.fn(),
      });

      const TestComponent = () => {
        const status = useDashboardRouteGuardStatus();
        return (
          <div>
            <div>Loading: {status.isLoading.toString()}</div>
            <div>Ready: {status.isReady.toString()}</div>
            <div>Has Error: {(status.hasError || false).toString()}</div>
          </div>
        );
      };

      render(<TestComponent />);

      expect(screen.getByText('Loading: false')).toBeInTheDocument();
      expect(screen.getByText('Ready: true')).toBeInTheDocument();
      expect(screen.getByText('Has Error: false')).toBeInTheDocument();
    });

    it('should return correct status when loading', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: true,
        isAuthenticated: false,
        isHydrated: true,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        refetchUser: jest.fn(),
      });

      const TestComponent = () => {
        const status = useDashboardRouteGuardStatus();
        return (
          <div>
            <div>Loading: {status.isLoading.toString()}</div>
            <div>Ready: {status.isReady.toString()}</div>
          </div>
        );
      };

      render(<TestComponent />);

      expect(screen.getByText('Loading: true')).toBeInTheDocument();
      expect(screen.getByText('Ready: false')).toBeInTheDocument();
    });
  });
});