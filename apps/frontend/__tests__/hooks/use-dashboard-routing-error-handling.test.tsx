import { renderHook, waitFor, act } from '@testing-library/react';
import { useDashboardRouting } from '../../hooks/use-dashboard-routing';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscriptionStatus } from '../../hooks/use-subscription-status';

// Mock dependencies
jest.mock('../../contexts/AuthContext');
jest.mock('../../hooks/use-subscription-status');
jest.mock('../../components/customer/error-handling/useErrorHandler', () => ({
  useErrorHandler: jest.fn(() => ({
    error: null,
    isRetrying: false,
    retryCount: 0,
    canRetry: true,
    retry: jest.fn(),
    executeWithRetry: jest.fn((fn) => fn()),
  }))
}));

// Mock Next.js router
const mockPush = jest.fn();
const mockSearchParams = new URLSearchParams();
const mockPathname = '/dashboard';

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => mockSearchParams,
  usePathname: () => mockPathname,
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseSubscriptionStatus = useSubscriptionStatus as jest.MockedFunction<typeof useSubscriptionStatus>;

describe('useDashboardRouting - Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mocks
    mockUseAuth.mockReturnValue({
      user: { id: '1', role: 'CUSTOMER' },
      isLoading: false,
    } as any);

    mockUseSubscriptionStatus.mockReturnValue({
      isLoading: false,
      error: null,
      hasSubscriptionHistory: true,
      currentStatus: 'ACTIVE',
      shouldShowCustomerDashboard: true,
      shouldShowPromotion: false,
      canAccessPremiumFeatures: true,
      isError: false,
      refetch: jest.fn(),
      retryCount: 0,
      canRetry: true,
      isRetrying: false,
      retrySubscriptionData: jest.fn(),
      errorType: null,
      userFriendlyErrorMessage: null,
    } as any);
  });

  describe('subscription data errors', () => {
    it('should provide fallback routing when subscription data fails', () => {
      mockUseSubscriptionStatus.mockReturnValue({
        isLoading: false,
        error: new Error('Subscription service unavailable'),
        hasSubscriptionHistory: false,
        currentStatus: 'NONE',
        shouldShowCustomerDashboard: false,
        shouldShowPromotion: true,
        canAccessPremiumFeatures: false,
        isError: true,
        refetch: jest.fn(),
        retryCount: 0,
        canRetry: true,
        isRetrying: false,
        retrySubscriptionData: jest.fn(),
        errorType: 'network',
        userFriendlyErrorMessage: 'Connection problem',
      } as any);

      const { result } = renderHook(() => useDashboardRouting());

      // Should fallback to customer dashboard for customer users when subscription data fails
      expect(result.current.targetRoute).toBe('/customer-dashboard');
      expect(result.current.shouldRedirectToCustomerDashboard).toBe(true);
      expect(result.current.fallbackRoute).toBe('/customer-dashboard');
    });

    it('should handle subscription loading state properly', () => {
      mockUseSubscriptionStatus.mockReturnValue({
        isLoading: true,
        error: null,
        hasSubscriptionHistory: false,
        currentStatus: 'NONE',
        shouldShowCustomerDashboard: false,
        shouldShowPromotion: false,
        canAccessPremiumFeatures: false,
        isError: false,
        refetch: jest.fn(),
        retryCount: 0,
        canRetry: true,
        isRetrying: false,
        retrySubscriptionData: jest.fn(),
        errorType: null,
        userFriendlyErrorMessage: null,
      } as any);

      const { result } = renderHook(() => useDashboardRouting());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.targetRoute).toBe('/dashboard'); // Stay on current route while loading
    });
  });

  describe('routing errors', () => {
    it('should handle navigation errors gracefully', async () => {
      const mockErrorHandler = require('../../components/customer/error-handling/useErrorHandler');
      const mockExecuteWithRetry = jest.fn().mockRejectedValue(new Error('Navigation failed'));
      
      mockErrorHandler.useErrorHandler.mockReturnValue({
        error: new Error('Navigation failed'),
        isRetrying: false,
        retryCount: 1,
        canRetry: true,
        retry: jest.fn(),
        executeWithRetry: mockExecuteWithRetry,
      });

      const { result } = renderHook(() => useDashboardRouting());

      expect(result.current.hasRoutingError).toBe(true);
      expect(result.current.error).toEqual(new Error('Navigation failed'));
      expect(result.current.canRetry).toBe(true);
    });

    it('should provide fallback navigation when routing fails', async () => {
      const mockErrorHandler = require('../../components/customer/error-handling/useErrorHandler');
      mockErrorHandler.useErrorHandler.mockReturnValue({
        error: new Error('Navigation failed'),
        isRetrying: false,
        retryCount: 0,
        canRetry: true,
        retry: jest.fn(),
        executeWithRetry: jest.fn().mockRejectedValue(new Error('Navigation failed')),
      });

      const { result } = renderHook(() => useDashboardRouting());

      await act(async () => {
        await result.current.navigateToDashboard();
      });

      // Should fallback to safe route when navigation fails
      expect(mockPush).toHaveBeenCalledWith('/customer-dashboard');
    });

    it('should handle route determination errors', () => {
      // Mock a scenario where route determination throws an error
      mockUseAuth.mockReturnValue({
        user: { id: '1', role: 'INVALID_ROLE' as any },
        isLoading: false,
      } as any);

      const { result } = renderHook(() => useDashboardRouting());

      // Should provide fallback route
      expect(result.current.fallbackRoute).toBe('/dashboard');
      expect(result.current.targetRoute).toBe('/dashboard');
    });
  });

  describe('fallback routing', () => {
    it('should determine correct fallback route for different user types', () => {
      // Test admin user
      mockUseAuth.mockReturnValue({
        user: { id: '1', role: 'ADMIN' },
        isLoading: false,
      } as any);

      const { result: adminResult } = renderHook(() => useDashboardRouting());
      expect(adminResult.current.fallbackRoute).toBe('/admin');

      // Test customer user
      mockUseAuth.mockReturnValue({
        user: { id: '1', role: 'CUSTOMER' },
        isLoading: false,
      } as any);

      const { result: customerResult } = renderHook(() => useDashboardRouting());
      expect(customerResult.current.fallbackRoute).toBe('/customer-dashboard');

      // Test no user
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
      } as any);

      const { result: noUserResult } = renderHook(() => useDashboardRouting());
      expect(noUserResult.current.fallbackRoute).toBe('/login');
    });

    it('should navigate to fallback route when requested', () => {
      const { result } = renderHook(() => useDashboardRouting());

      act(() => {
        result.current.navigateToFallback();
      });

      expect(mockPush).toHaveBeenCalledWith('/customer-dashboard');
    });

    it('should use hard navigation as last resort when router fails', () => {
      mockPush.mockImplementation(() => {
        throw new Error('Router failed');
      });

      // Mock window.location
      delete (window as any).location;
      window.location = { href: '' } as any;

      const { result } = renderHook(() => useDashboardRouting());

      act(() => {
        result.current.navigateToFallback();
      });

      expect(window.location.href).toBe('/customer-dashboard');
    });
  });

  describe('retry mechanisms', () => {
    it('should provide retry functionality for routing errors', async () => {
      const mockRetry = jest.fn();
      const mockRetrySubscriptionData = jest.fn();
      
      const mockErrorHandler = require('../../components/customer/error-handling/useErrorHandler');
      mockErrorHandler.useErrorHandler.mockReturnValue({
        error: new Error('Routing error'),
        isRetrying: false,
        retryCount: 1,
        canRetry: true,
        retry: mockRetry,
        executeWithRetry: jest.fn(),
      });

      mockUseSubscriptionStatus.mockReturnValue({
        ...mockUseSubscriptionStatus(),
        error: new Error('Subscription error'),
        canRetry: true,
        retrySubscriptionData: mockRetrySubscriptionData,
      } as any);

      const { result } = renderHook(() => useDashboardRouting());

      await act(async () => {
        await result.current.retryRouting();
      });

      expect(mockRetry).toHaveBeenCalled();
      expect(mockRetrySubscriptionData).toHaveBeenCalled();
    });

    it('should handle retry failures gracefully', async () => {
      const mockRetry = jest.fn().mockRejectedValue(new Error('Retry failed'));
      
      const mockErrorHandler = require('../../components/customer/error-handling/useErrorHandler');
      mockErrorHandler.useErrorHandler.mockReturnValue({
        error: new Error('Routing error'),
        isRetrying: false,
        retryCount: 1,
        canRetry: true,
        retry: mockRetry,
        executeWithRetry: jest.fn(),
      });

      const { result } = renderHook(() => useDashboardRouting());

      // Should not throw when retry fails
      await act(async () => {
        await expect(result.current.retryRouting()).resolves.toBeUndefined();
      });

      expect(mockRetry).toHaveBeenCalled();
    });
  });

  describe('loading states during error recovery', () => {
    it('should show loading state during retry', () => {
      const mockErrorHandler = require('../../components/customer/error-handling/useErrorHandler');
      mockErrorHandler.useErrorHandler.mockReturnValue({
        error: null,
        isRetrying: true,
        retryCount: 1,
        canRetry: true,
        retry: jest.fn(),
        executeWithRetry: jest.fn(),
      });

      const { result } = renderHook(() => useDashboardRouting());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.isRetrying).toBe(true);
    });

    it('should combine loading states from multiple sources', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: true,
      } as any);

      mockUseSubscriptionStatus.mockReturnValue({
        ...mockUseSubscriptionStatus(),
        isLoading: true,
      } as any);

      const mockErrorHandler = require('../../components/customer/error-handling/useErrorHandler');
      mockErrorHandler.useErrorHandler.mockReturnValue({
        error: null,
        isRetrying: true,
        retryCount: 0,
        canRetry: true,
        retry: jest.fn(),
        executeWithRetry: jest.fn(),
      });

      const { result } = renderHook(() => useDashboardRouting());

      expect(result.current.isLoading).toBe(true);
    });
  });

  describe('error state management', () => {
    it('should clear routing error on successful fallback navigation', () => {
      const { result } = renderHook(() => useDashboardRouting());

      // Simulate routing error
      act(() => {
        // This would normally be set by the error handler
        result.current.navigateToFallback();
      });

      expect(mockPush).toHaveBeenCalledWith('/customer-dashboard');
    });

    it('should maintain error state until resolved', () => {
      const mockErrorHandler = require('../../components/customer/error-handling/useErrorHandler');
      const routingError = new Error('Persistent routing error');
      
      mockErrorHandler.useErrorHandler.mockReturnValue({
        error: routingError,
        isRetrying: false,
        retryCount: 2,
        canRetry: true,
        retry: jest.fn(),
        executeWithRetry: jest.fn(),
      });

      const { result } = renderHook(() => useDashboardRouting());

      expect(result.current.hasRoutingError).toBe(true);
      expect(result.current.error).toBe(routingError);
      expect(result.current.canRetry).toBe(true);
    });
  });

  describe('navigation with error handling', () => {
    it('should handle navigation to specific route with error recovery', async () => {
      const mockExecuteWithRetry = jest.fn().mockResolvedValue(undefined);
      
      const mockErrorHandler = require('../../components/customer/error-handling/useErrorHandler');
      mockErrorHandler.useErrorHandler.mockReturnValue({
        error: null,
        isRetrying: false,
        retryCount: 0,
        canRetry: true,
        retry: jest.fn(),
        executeWithRetry: mockExecuteWithRetry,
      });

      const { result } = renderHook(() => useDashboardRouting());

      await act(async () => {
        await result.current.navigateToRoute('/custom-route');
      });

      expect(mockExecuteWithRetry).toHaveBeenCalled();
    });

    it('should preserve URL parameters during error recovery navigation', async () => {
      // Mock search params
      const mockSearchParams = new URLSearchParams('param1=value1&param2=value2');
      jest.mocked(require('next/navigation').useSearchParams).mockReturnValue(mockSearchParams);

      const { result } = renderHook(() => useDashboardRouting());

      const urlWithParams = result.current.getDashboardUrl(true);
      expect(urlWithParams).toContain('param1=value1');
      expect(urlWithParams).toContain('param2=value2');
    });
  });
});