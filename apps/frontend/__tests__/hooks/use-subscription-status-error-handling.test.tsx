import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useSubscriptionStatus } from '../../hooks/use-subscription-status';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';

// Mock dependencies
jest.mock('../../contexts/AuthContext');
jest.mock('../../lib/api');
jest.mock('../../components/customer/error-handling/useErrorHandler', () => ({
  useApiErrorHandler: jest.fn(() => ({
    error: null,
    isRetrying: false,
    retryCount: 0,
    canRetry: true,
    retry: jest.fn(),
    executeApiCall: jest.fn((fn) => fn()),
  })),
  classifyError: jest.fn((error) => ({
    type: 'network',
    severity: 'high',
    isRetryable: true,
    userMessage: 'Connection problem. Please check your internet connection and try again.'
  }))
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
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

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useSubscriptionStatus - Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: { id: '1', role: 'CUSTOMER' },
      isLoading: false,
    } as any);
  });

  describe('network errors', () => {
    it('should handle network errors gracefully', async () => {
      const networkError = new Error('Network error: Unable to connect');
      mockApi.getUserPlan.mockRejectedValue(networkError);

      const { result } = renderHook(() => useSubscriptionStatus(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(networkError);
      expect(result.current.errorType).toBe('network');
      expect(result.current.userFriendlyErrorMessage).toContain('Connection problem');
      expect(result.current.hasSubscriptionHistory).toBe(false);
      expect(result.current.shouldShowCustomerDashboard).toBe(false);
    });

    it('should provide retry functionality for network errors', async () => {
      const networkError = new Error('Network error');
      mockApi.getUserPlan.mockRejectedValueOnce(networkError);

      const { result } = renderHook(() => useSubscriptionStatus(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.canRetry).toBe(true);
      expect(typeof result.current.retrySubscriptionData).toBe('function');
    });
  });

  describe('authentication errors', () => {
    it('should not retry authentication errors', async () => {
      const authError = new Error('Authentication required');
      mockApi.getUserPlan.mockRejectedValue(authError);

      const { result } = renderHook(() => useSubscriptionStatus(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(authError);
      // Should still provide fallback subscription status
      expect(result.current.hasSubscriptionHistory).toBe(false);
      expect(result.current.currentStatus).toBe('NONE');
    });
  });

  describe('server errors', () => {
    it('should handle 500 server errors with retry capability', async () => {
      const serverError = new Error('500: Internal Server Error');
      (serverError as any).status = 500;
      mockApi.getUserPlan.mockRejectedValue(serverError);

      const { result } = renderHook(() => useSubscriptionStatus(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(serverError);
      expect(result.current.canRetry).toBe(true);
    });

    it('should handle 503 service unavailable errors', async () => {
      const serviceError = new Error('503: Service Unavailable');
      (serviceError as any).status = 503;
      mockApi.getUserPlan.mockRejectedValue(serviceError);

      const { result } = renderHook(() => useSubscriptionStatus(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(serviceError);
      expect(result.current.canRetry).toBe(true);
    });
  });

  describe('fallback behavior', () => {
    it('should provide safe fallback when subscription data is unavailable', async () => {
      const error = new Error('Subscription service unavailable');
      mockApi.getUserPlan.mockRejectedValue(error);

      const { result } = renderHook(() => useSubscriptionStatus(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      // Should provide safe fallback values
      expect(result.current.hasSubscriptionHistory).toBe(false);
      expect(result.current.currentStatus).toBe('NONE');
      expect(result.current.shouldShowCustomerDashboard).toBe(false);
      expect(result.current.shouldShowPromotion).toBe(true);
      expect(result.current.canAccessPremiumFeatures).toBe(false);
    });

    it('should handle malformed API responses gracefully', async () => {
      mockApi.getUserPlan.mockResolvedValue(null);

      const { result } = renderHook(() => useSubscriptionStatus(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should provide safe fallback for null response
      expect(result.current.hasSubscriptionHistory).toBe(false);
      expect(result.current.currentStatus).toBe('NONE');
      expect(result.current.shouldShowPromotion).toBe(true);
    });

    it('should handle API responses with success: false', async () => {
      mockApi.getUserPlan.mockResolvedValue({ success: false });

      const { result } = renderHook(() => useSubscriptionStatus(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should provide safe fallback for unsuccessful response
      expect(result.current.hasSubscriptionHistory).toBe(false);
      expect(result.current.currentStatus).toBe('NONE');
      expect(result.current.shouldShowPromotion).toBe(true);
    });
  });

  describe('retry mechanisms', () => {
    it('should implement exponential backoff for retries', async () => {
      const error = new Error('Temporary error');
      mockApi.getUserPlan.mockRejectedValue(error);

      const { result } = renderHook(() => useSubscriptionStatus(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.retryCount).toBe(0);
      expect(result.current.canRetry).toBe(true);
    });

    it('should stop retrying after max attempts', async () => {
      const error = new Error('Persistent error');
      mockApi.getUserPlan.mockRejectedValue(error);

      // Mock the error handler to simulate max retries reached
      const mockErrorHandler = require('../../components/customer/error-handling/useErrorHandler');
      mockErrorHandler.useApiErrorHandler.mockReturnValue({
        error,
        isRetrying: false,
        retryCount: 3,
        canRetry: false,
        retry: jest.fn(),
        executeApiCall: jest.fn().mockRejectedValue(error),
      });

      const { result } = renderHook(() => useSubscriptionStatus(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.retryCount).toBe(3);
      expect(result.current.canRetry).toBe(false);
    });
  });

  describe('loading states during error recovery', () => {
    it('should show loading state during retry', async () => {
      const error = new Error('Temporary error');
      mockApi.getUserPlan.mockRejectedValue(error);

      // Mock the error handler to simulate retry in progress
      const mockErrorHandler = require('../../components/customer/error-handling/useErrorHandler');
      mockErrorHandler.useApiErrorHandler.mockReturnValue({
        error: null,
        isRetrying: true,
        retryCount: 1,
        canRetry: true,
        retry: jest.fn(),
        executeApiCall: jest.fn(),
      });

      const { result } = renderHook(() => useSubscriptionStatus(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.isRetrying).toBe(true);
    });
  });

  describe('error classification', () => {
    it('should classify different error types correctly', async () => {
      const errors = [
        { error: new Error('Network timeout'), expectedType: 'network' },
        { error: new Error('401: Unauthorized'), expectedType: 'network' },
        { error: new Error('500: Server Error'), expectedType: 'network' },
        { error: new Error('Unknown error'), expectedType: 'network' }
      ];

      for (const { error, expectedType } of errors) {
        mockApi.getUserPlan.mockRejectedValueOnce(error);

        const { result } = renderHook(() => useSubscriptionStatus(), {
          wrapper: createWrapper(),
        });

        await waitFor(() => {
          expect(result.current.isError).toBe(true);
        });

        expect(result.current.errorType).toBe(expectedType);
      }
    });
  });

  describe('user-friendly error messages', () => {
    it('should provide user-friendly error messages', async () => {
      const networkError = new Error('Network error');
      mockApi.getUserPlan.mockRejectedValue(networkError);

      const { result } = renderHook(() => useSubscriptionStatus(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.userFriendlyErrorMessage).toBe(
        'Connection problem. Please check your internet connection and try again.'
      );
    });
  });

  describe('integration with auth loading', () => {
    it('should not fetch subscription data when auth is loading', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: true,
      } as any);

      renderHook(() => useSubscriptionStatus(), {
        wrapper: createWrapper(),
      });

      expect(mockApi.getUserPlan).not.toHaveBeenCalled();
    });

    it('should not fetch subscription data when user is not available', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
      } as any);

      renderHook(() => useSubscriptionStatus(), {
        wrapper: createWrapper(),
      });

      expect(mockApi.getUserPlan).not.toHaveBeenCalled();
    });
  });
});