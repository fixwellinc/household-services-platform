import { renderHook, act } from '@testing-library/react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useDashboardRouting } from '../../hooks/use-dashboard-routing';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscriptionStatus } from '../../hooks/use-subscription-status';

// Mock Next.js navigation hooks
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
  usePathname: jest.fn(),
}));

// Mock auth context
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock subscription status hook
jest.mock('../../hooks/use-subscription-status', () => ({
  useSubscriptionStatus: jest.fn(),
}));

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  prefetch: jest.fn(),
};

const mockSearchParams = {
  toString: jest.fn(() => ''),
  get: jest.fn(),
  has: jest.fn(),
};

describe('useDashboardRouting', () => {
  const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
  const mockUseSearchParams = useSearchParams as jest.MockedFunction<typeof useSearchParams>;
  const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;
  const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
  const mockUseSubscriptionStatus = useSubscriptionStatus as jest.MockedFunction<typeof useSubscriptionStatus>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseRouter.mockReturnValue(mockRouter);
    mockUseSearchParams.mockReturnValue(mockSearchParams as any);
    mockUsePathname.mockReturnValue('/dashboard');
    
    // Default auth state
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

    // Default subscription state
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
      retryCount: 0,
      canRetry: true,
      isRetrying: false,
      retrySubscriptionData: jest.fn(),
      errorType: null,
      userFriendlyErrorMessage: null,
    });
  });

  describe('Route determination for unauthenticated users', () => {
    it('should redirect to login when user is not authenticated', () => {
      const { result } = renderHook(() => useDashboardRouting());

      expect(result.current.targetRoute).toBe('/login');
      expect(result.current.shouldRedirectToAdmin).toBe(false);
      expect(result.current.shouldRedirectToCustomerDashboard).toBe(false);
      expect(result.current.shouldShowGeneralDashboard).toBe(false);
    });

    it('should show loading state when auth is loading', () => {
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

      const { result } = renderHook(() => useDashboardRouting());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.targetRoute).toBe('/login');
    });
  });

  describe('Route determination for admin users', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: {
          id: '1',
          email: 'admin@test.com',
          name: 'Admin User',
          role: 'ADMIN',
          createdAt: '2023-01-01',
        },
        isLoading: false,
        isAuthenticated: true,
        isHydrated: true,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        refetchUser: jest.fn(),
      });
    });

    it('should redirect admin users to admin dashboard', () => {
      const { result } = renderHook(() => useDashboardRouting());

      expect(result.current.targetRoute).toBe('/admin');
      expect(result.current.shouldRedirectToAdmin).toBe(true);
      expect(result.current.shouldRedirectToCustomerDashboard).toBe(false);
      expect(result.current.shouldShowGeneralDashboard).toBe(false);
    });

    it('should provide admin dashboard in available routes', () => {
      const { result } = renderHook(() => useDashboardRouting());

      expect(result.current.availableRoutes).toEqual([
        {
          path: '/admin',
          label: 'Admin Dashboard',
          description: 'Administrative controls and system management',
        },
      ]);
    });

    it('should allow admin to access admin routes', () => {
      const { result } = renderHook(() => useDashboardRouting());

      expect(result.current.canAccessRoute('/admin')).toBe(true);
      expect(result.current.canAccessRoute('/admin/users')).toBe(true);
    });
  });

  describe('Route determination for customer users', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: {
          id: '2',
          email: 'customer@test.com',
          name: 'Customer User',
          role: 'CUSTOMER',
          createdAt: '2023-01-01',
        },
        isLoading: false,
        isAuthenticated: true,
        isHydrated: true,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        refetchUser: jest.fn(),
      });
    });

    it('should redirect to customer dashboard when user has subscription history', () => {
      mockUseSubscriptionStatus.mockReturnValue({
        hasSubscriptionHistory: true,
        currentStatus: 'ACTIVE',
        shouldShowCustomerDashboard: true,
        shouldShowPromotion: false,
        canAccessPremiumFeatures: true,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
        isError: false,
        retryCount: 0,
        canRetry: true,
        isRetrying: false,
        retrySubscriptionData: jest.fn(),
        errorType: null,
        userFriendlyErrorMessage: null,
      });

      const { result } = renderHook(() => useDashboardRouting());

      expect(result.current.targetRoute).toBe('/customer-dashboard');
      expect(result.current.shouldRedirectToCustomerDashboard).toBe(true);
      expect(result.current.shouldShowGeneralDashboard).toBe(false);
    });

    it('should redirect to general dashboard when user has no subscription', () => {
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
        retryCount: 0,
        canRetry: true,
        isRetrying: false,
        retrySubscriptionData: jest.fn(),
        errorType: null,
        userFriendlyErrorMessage: null,
      });

      const { result } = renderHook(() => useDashboardRouting());

      expect(result.current.targetRoute).toBe('/dashboard');
      expect(result.current.shouldShowGeneralDashboard).toBe(true);
      expect(result.current.shouldRedirectToCustomerDashboard).toBe(false);
    });

    it('should handle cancelled subscription by showing customer dashboard', () => {
      mockUseSubscriptionStatus.mockReturnValue({
        hasSubscriptionHistory: true,
        currentStatus: 'CANCELLED',
        shouldShowCustomerDashboard: true,
        shouldShowPromotion: false,
        canAccessPremiumFeatures: false,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
        isError: false,
        retryCount: 0,
        canRetry: true,
        isRetrying: false,
        retrySubscriptionData: jest.fn(),
        errorType: null,
        userFriendlyErrorMessage: null,
      });

      const { result } = renderHook(() => useDashboardRouting());

      expect(result.current.targetRoute).toBe('/customer-dashboard');
      expect(result.current.shouldRedirectToCustomerDashboard).toBe(true);
    });

    it('should handle past due subscription by showing customer dashboard', () => {
      mockUseSubscriptionStatus.mockReturnValue({
        hasSubscriptionHistory: true,
        currentStatus: 'PAST_DUE',
        shouldShowCustomerDashboard: true,
        shouldShowPromotion: false,
        canAccessPremiumFeatures: true,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
        isError: false,
        retryCount: 0,
        canRetry: true,
        isRetrying: false,
        retrySubscriptionData: jest.fn(),
        errorType: null,
        userFriendlyErrorMessage: null,
      });

      const { result } = renderHook(() => useDashboardRouting());

      expect(result.current.targetRoute).toBe('/customer-dashboard');
      expect(result.current.shouldRedirectToCustomerDashboard).toBe(true);
    });

    it('should stay on current route when subscription data is loading', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: '2',
          email: 'customer@test.com',
          name: 'Customer User',
          role: 'CUSTOMER',
          createdAt: '2023-01-01',
        },
        isLoading: false,
        isAuthenticated: true,
        isHydrated: true,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        refetchUser: jest.fn(),
      });

      mockUsePathname.mockReturnValue('/current-page');
      mockUseSubscriptionStatus.mockReturnValue({
        hasSubscriptionHistory: false,
        currentStatus: 'NONE',
        shouldShowCustomerDashboard: false,
        shouldShowPromotion: false,
        canAccessPremiumFeatures: false,
        isLoading: true,
        error: null,
        refetch: jest.fn(),
        isError: false,
        retryCount: 0,
        canRetry: true,
        isRetrying: false,
        retrySubscriptionData: jest.fn(),
        errorType: null,
        userFriendlyErrorMessage: null,
      });

      const { result } = renderHook(() => useDashboardRouting());

      expect(result.current.targetRoute).toBe('/current-page');
      expect(result.current.isLoading).toBe(true);
    });

    it('should default to customer dashboard when subscription data fails to load', () => {
      mockUseSubscriptionStatus.mockReturnValue({
        hasSubscriptionHistory: false,
        currentStatus: 'NONE',
        shouldShowCustomerDashboard: false,
        shouldShowPromotion: false,
        canAccessPremiumFeatures: false,
        isLoading: false,
        error: new Error('Failed to load subscription'),
        refetch: jest.fn(),
        isError: true,
        retryCount: 1,
        canRetry: true,
        isRetrying: false,
        retrySubscriptionData: jest.fn(),
        errorType: 'network',
        userFriendlyErrorMessage: 'Connection problem',
      });

      const { result } = renderHook(() => useDashboardRouting());

      expect(result.current.targetRoute).toBe('/customer-dashboard');
      expect(result.current.shouldRedirectToCustomerDashboard).toBe(true);
      expect(result.current.error).toBeInstanceOf(Error);
    });
  });

  describe('URL parameter preservation', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: {
          id: '2',
          email: 'customer@test.com',
          name: 'Customer User',
          role: 'CUSTOMER',
          createdAt: '2023-01-01',
        },
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
        error: null,
        refetch: jest.fn(),
        isError: false,
        retryCount: 0,
        canRetry: true,
        isRetrying: false,
        retrySubscriptionData: jest.fn(),
        errorType: null,
        userFriendlyErrorMessage: null,
      });
    });

    it('should preserve URL parameters when getting dashboard URL', () => {
      mockSearchParams.toString.mockReturnValue('tab=billing&section=overview');

      const { result } = renderHook(() => useDashboardRouting());

      expect(result.current.getDashboardUrl(true)).toBe('/dashboard?tab=billing&section=overview');
    });

    it('should not preserve URL parameters when explicitly disabled', () => {
      mockSearchParams.toString.mockReturnValue('tab=billing&section=overview');

      const { result } = renderHook(() => useDashboardRouting());

      expect(result.current.getDashboardUrl(false)).toBe('/dashboard');
    });

    it('should handle empty search params', () => {
      mockSearchParams.toString.mockReturnValue('');

      const { result } = renderHook(() => useDashboardRouting());

      expect(result.current.getDashboardUrl(true)).toBe('/dashboard');
    });

    it('should navigate with preserved parameters', () => {
      mockSearchParams.toString.mockReturnValue('tab=services');

      const { result } = renderHook(() => useDashboardRouting());

      act(() => {
        result.current.navigateToDashboard(true);
      });

      expect(mockRouter.push).toHaveBeenCalledWith('/dashboard?tab=services');
    });

    it('should navigate without parameters when disabled', () => {
      mockSearchParams.toString.mockReturnValue('tab=services');

      const { result } = renderHook(() => useDashboardRouting());

      act(() => {
        result.current.navigateToDashboard(false);
      });

      expect(mockRouter.push).toHaveBeenCalledWith('/dashboard');
    });

    it('should navigate to specific route with parameters', () => {
      mockSearchParams.toString.mockReturnValue('ref=header');

      const { result } = renderHook(() => useDashboardRouting());

      act(() => {
        result.current.navigateToRoute('/customer-dashboard', true);
      });

      expect(mockRouter.push).toHaveBeenCalledWith('/customer-dashboard?ref=header');
    });
  });

  describe('Route access control', () => {
    it('should allow customer to access customer dashboard when they have subscription', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: '2',
          email: 'customer@test.com',
          name: 'Customer User',
          role: 'CUSTOMER',
          createdAt: '2023-01-01',
        },
        isLoading: false,
        isAuthenticated: true,
        isHydrated: true,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        refetchUser: jest.fn(),
      });

      mockUseSubscriptionStatus.mockReturnValue({
        hasSubscriptionHistory: true,
        currentStatus: 'ACTIVE',
        shouldShowCustomerDashboard: true,
        shouldShowPromotion: false,
        canAccessPremiumFeatures: true,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
        isError: false,
        retryCount: 0,
        canRetry: true,
        isRetrying: false,
        retrySubscriptionData: jest.fn(),
        errorType: null,
        userFriendlyErrorMessage: null,
      });

      const { result } = renderHook(() => useDashboardRouting());

      expect(result.current.canAccessRoute('/customer-dashboard')).toBe(true);
      expect(result.current.canAccessRoute('/dashboard')).toBe(true);
      expect(result.current.canAccessRoute('/admin')).toBe(false);
    });

    it('should not allow customer without subscription to access customer dashboard', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: '2',
          email: 'customer@test.com',
          name: 'Customer User',
          role: 'CUSTOMER',
          createdAt: '2023-01-01',
        },
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
        error: null,
        refetch: jest.fn(),
        isError: false,
        retryCount: 0,
        canRetry: true,
        isRetrying: false,
        retrySubscriptionData: jest.fn(),
        errorType: null,
        userFriendlyErrorMessage: null,
      });

      const { result } = renderHook(() => useDashboardRouting());

      expect(result.current.canAccessRoute('/customer-dashboard')).toBe(false);
      expect(result.current.canAccessRoute('/dashboard')).toBe(true);
    });
  });

  describe('Available routes', () => {
    it('should provide correct available routes for customer with subscription', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: '2',
          email: 'customer@test.com',
          name: 'Customer User',
          role: 'CUSTOMER',
          createdAt: '2023-01-01',
        },
        isLoading: false,
        isAuthenticated: true,
        isHydrated: true,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        refetchUser: jest.fn(),
      });

      mockUseSubscriptionStatus.mockReturnValue({
        hasSubscriptionHistory: true,
        currentStatus: 'ACTIVE',
        shouldShowCustomerDashboard: true,
        shouldShowPromotion: false,
        canAccessPremiumFeatures: true,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
        isError: false,
        retryCount: 0,
        canRetry: true,
        isRetrying: false,
        retrySubscriptionData: jest.fn(),
        errorType: null,
        userFriendlyErrorMessage: null,
      });

      const { result } = renderHook(() => useDashboardRouting());

      expect(result.current.availableRoutes).toEqual([
        {
          path: '/customer-dashboard',
          label: 'Customer Dashboard',
          description: 'Manage your subscription and services',
        },
        {
          path: '/dashboard',
          label: 'Dashboard',
          description: 'General dashboard with subscription options',
        },
      ]);
    });

    it('should provide correct available routes for customer without subscription', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: '2',
          email: 'customer@test.com',
          name: 'Customer User',
          role: 'CUSTOMER',
          createdAt: '2023-01-01',
        },
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
        error: null,
        refetch: jest.fn(),
        isError: false,
        retryCount: 0,
        canRetry: true,
        isRetrying: false,
        retrySubscriptionData: jest.fn(),
        errorType: null,
        userFriendlyErrorMessage: null,
      });

      const { result } = renderHook(() => useDashboardRouting());

      expect(result.current.availableRoutes).toEqual([
        {
          path: '/dashboard',
          label: 'Dashboard',
          description: 'General dashboard with subscription options',
        },
      ]);
    });

    it('should return empty routes for unauthenticated users', () => {
      const { result } = renderHook(() => useDashboardRouting());

      expect(result.current.availableRoutes).toEqual([]);
    });
  });

  describe('Current route detection', () => {
    it('should correctly identify current route', () => {
      mockUsePathname.mockReturnValue('/customer-dashboard');

      const { result } = renderHook(() => useDashboardRouting());

      expect(result.current.isCurrentRoute('/customer-dashboard')).toBe(true);
      expect(result.current.isCurrentRoute('/dashboard')).toBe(false);
      expect(result.current.currentRoute).toBe('/customer-dashboard');
    });
  });

  describe('Error handling', () => {
    it('should propagate subscription errors', () => {
      const subscriptionError = new Error('Subscription service unavailable');
      
      mockUseSubscriptionStatus.mockReturnValue({
        hasSubscriptionHistory: false,
        currentStatus: 'NONE',
        shouldShowCustomerDashboard: false,
        shouldShowPromotion: false,
        canAccessPremiumFeatures: false,
        isLoading: false,
        error: subscriptionError,
        refetch: jest.fn(),
        isError: true,
        retryCount: 1,
        canRetry: true,
        isRetrying: false,
        retrySubscriptionData: jest.fn(),
        errorType: 'network',
        userFriendlyErrorMessage: 'Connection problem',
      });

      const { result } = renderHook(() => useDashboardRouting());

      expect(result.current.error).toBe(subscriptionError);
    });

    it('should handle null subscription status gracefully', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: '2',
          email: 'customer@test.com',
          name: 'Customer User',
          role: 'CUSTOMER',
          createdAt: '2023-01-01',
        },
        isLoading: false,
        isAuthenticated: true,
        isHydrated: true,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        refetchUser: jest.fn(),
      });

      mockUseSubscriptionStatus.mockReturnValue(null as any);

      const { result } = renderHook(() => useDashboardRouting());

      // Should default to customer dashboard when subscription data is unavailable
      expect(result.current.targetRoute).toBe('/customer-dashboard');
    });
  });
});