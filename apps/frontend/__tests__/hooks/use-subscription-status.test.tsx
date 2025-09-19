import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useSubscriptionStatus, shouldRedirectToCustomerDashboard, shouldShowGeneralDashboard, getDashboardUrl } from '../../hooks/use-subscription-status';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';

// Mock dependencies
jest.mock('../../contexts/AuthContext');
jest.mock('../../lib/api');

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

describe('useSubscriptionStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('loading states', () => {
    it('should return loading true when auth is loading', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: true,
      } as any);

      const { result } = renderHook(() => useSubscriptionStatus(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.hasSubscriptionHistory).toBe(false);
      expect(result.current.currentStatus).toBe('NONE');
    });

    it('should return loading true when plan data is loading', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', role: 'CUSTOMER' },
        isLoading: false,
      } as any);

      // Mock API to return a promise that doesn't resolve immediately
      mockApi.getUserPlan.mockImplementation(() => new Promise(() => {}));

      const { result } = renderHook(() => useSubscriptionStatus(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
    });
  });

  describe('no subscription scenarios', () => {
    it('should handle user with no subscription history', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', role: 'CUSTOMER' },
        isLoading: false,
      } as any);

      mockApi.getUserPlan.mockResolvedValue({
        success: true,
        hasPlan: false,
        message: 'No subscription found',
      });

      const { result } = renderHook(() => useSubscriptionStatus(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.hasSubscriptionHistory).toBe(false);
      expect(result.current.currentStatus).toBe('NONE');
      expect(result.current.shouldShowCustomerDashboard).toBe(false);
      expect(result.current.shouldShowPromotion).toBe(true);
      expect(result.current.canAccessPremiumFeatures).toBe(false);
    });

    it('should handle unsuccessful API response gracefully', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', role: 'CUSTOMER' },
        isLoading: false,
      } as any);

      mockApi.getUserPlan.mockResolvedValue({
        success: false,
        hasPlan: false,
        message: 'Failed to fetch plan',
      });

      const { result } = renderHook(() => useSubscriptionStatus(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.hasSubscriptionHistory).toBe(false);
      expect(result.current.currentStatus).toBe('NONE');
      expect(result.current.shouldShowPromotion).toBe(true);
    });
  });

  describe('active subscription', () => {
    it('should handle active subscription correctly', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', role: 'CUSTOMER' },
        isLoading: false,
      } as any);

      mockApi.getUserPlan.mockResolvedValue({
        success: true,
        hasPlan: true,
        subscription: {
          tier: 'HOMECARE',
          status: 'ACTIVE',
          currentPeriodStart: '2024-01-01',
          currentPeriodEnd: '2024-02-01',
          createdAt: '2024-01-01',
        },
        plan: {
          id: 'homecare',
          name: 'HomeCare Plan',
          description: 'Basic home maintenance',
          monthlyPrice: 29.99,
          yearlyPrice: 299.99,
          originalPrice: 39.99,
          stripePriceIds: {
            monthly: 'price_monthly',
            yearly: 'price_yearly',
          },
          features: ['Monthly visit', 'Basic repairs'],
          savings: '25% off',
          color: 'blue',
          icon: 'home',
        },
        message: 'Plan retrieved successfully',
      });

      const { result } = renderHook(() => useSubscriptionStatus(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.hasSubscriptionHistory).toBe(true);
      expect(result.current.currentStatus).toBe('ACTIVE');
      expect(result.current.shouldShowCustomerDashboard).toBe(true);
      expect(result.current.shouldShowPromotion).toBe(false);
      expect(result.current.canAccessPremiumFeatures).toBe(true);
      expect(result.current.subscription?.tier).toBe('HOMECARE');
      expect(result.current.plan?.name).toBe('HomeCare Plan');
    });
  });

  describe('past due subscription', () => {
    it('should handle past due subscription with grace period access', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', role: 'CUSTOMER' },
        isLoading: false,
      } as any);

      mockApi.getUserPlan.mockResolvedValue({
        success: true,
        hasPlan: true,
        subscription: {
          tier: 'HOMECARE',
          status: 'PAST_DUE',
          currentPeriodStart: '2024-01-01',
          currentPeriodEnd: '2024-02-01',
          createdAt: '2024-01-01',
        },
        plan: {
          id: 'homecare',
          name: 'HomeCare Plan',
          description: 'Basic home maintenance',
          monthlyPrice: 29.99,
          yearlyPrice: 299.99,
          originalPrice: 39.99,
          stripePriceIds: {
            monthly: 'price_monthly',
            yearly: 'price_yearly',
          },
          features: ['Monthly visit', 'Basic repairs'],
          savings: '25% off',
          color: 'blue',
          icon: 'home',
        },
        message: 'Plan retrieved successfully',
      });

      const { result } = renderHook(() => useSubscriptionStatus(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.currentStatus).toBe('PAST_DUE');
      expect(result.current.shouldShowCustomerDashboard).toBe(true);
      expect(result.current.shouldShowPromotion).toBe(false);
      expect(result.current.canAccessPremiumFeatures).toBe(true); // Grace period
    });
  });

  describe('cancelled subscription', () => {
    it('should handle cancelled subscription correctly', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', role: 'CUSTOMER' },
        isLoading: false,
      } as any);

      mockApi.getUserPlan.mockResolvedValue({
        success: true,
        hasPlan: true,
        subscription: {
          tier: 'HOMECARE',
          status: 'CANCELLED',
          currentPeriodStart: '2024-01-01',
          currentPeriodEnd: '2024-02-01',
          createdAt: '2024-01-01',
        },
        plan: {
          id: 'homecare',
          name: 'HomeCare Plan',
          description: 'Basic home maintenance',
          monthlyPrice: 29.99,
          yearlyPrice: 299.99,
          originalPrice: 39.99,
          stripePriceIds: {
            monthly: 'price_monthly',
            yearly: 'price_yearly',
          },
          features: ['Monthly visit', 'Basic repairs'],
          savings: '25% off',
          color: 'blue',
          icon: 'home',
        },
        message: 'Plan retrieved successfully',
      });

      const { result } = renderHook(() => useSubscriptionStatus(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.currentStatus).toBe('CANCELLED');
      expect(result.current.shouldShowCustomerDashboard).toBe(true);
      expect(result.current.shouldShowPromotion).toBe(false);
      expect(result.current.canAccessPremiumFeatures).toBe(false);
    });
  });

  describe('incomplete subscription', () => {
    it('should handle incomplete subscription correctly', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', role: 'CUSTOMER' },
        isLoading: false,
      } as any);

      mockApi.getUserPlan.mockResolvedValue({
        success: true,
        hasPlan: true,
        subscription: {
          tier: 'HOMECARE',
          status: 'INCOMPLETE',
          currentPeriodStart: '2024-01-01',
          currentPeriodEnd: '2024-02-01',
          createdAt: '2024-01-01',
        },
        plan: {
          id: 'homecare',
          name: 'HomeCare Plan',
          description: 'Basic home maintenance',
          monthlyPrice: 29.99,
          yearlyPrice: 299.99,
          originalPrice: 39.99,
          stripePriceIds: {
            monthly: 'price_monthly',
            yearly: 'price_yearly',
          },
          features: ['Monthly visit', 'Basic repairs'],
          savings: '25% off',
          color: 'blue',
          icon: 'home',
        },
        message: 'Plan retrieved successfully',
      });

      const { result } = renderHook(() => useSubscriptionStatus(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.currentStatus).toBe('INCOMPLETE');
      expect(result.current.shouldShowCustomerDashboard).toBe(true);
      expect(result.current.shouldShowPromotion).toBe(false);
      expect(result.current.canAccessPremiumFeatures).toBe(false);
    });
  });

  describe('case insensitive status handling', () => {
    it('should handle lowercase status values', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', role: 'CUSTOMER' },
        isLoading: false,
      } as any);

      mockApi.getUserPlan.mockResolvedValue({
        success: true,
        hasPlan: true,
        subscription: {
          tier: 'HOMECARE',
          status: 'active', // lowercase
          currentPeriodStart: '2024-01-01',
          currentPeriodEnd: '2024-02-01',
          createdAt: '2024-01-01',
        },
        message: 'Plan retrieved successfully',
      });

      const { result } = renderHook(() => useSubscriptionStatus(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.currentStatus).toBe('ACTIVE');
      expect(result.current.canAccessPremiumFeatures).toBe(true);
    });
  });

  describe('authentication error handling', () => {
    it('should not retry on authentication errors', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', role: 'CUSTOMER' },
        isLoading: false,
      } as any);

      const authError = new Error('Authentication required');
      mockApi.getUserPlan.mockRejectedValue(authError);

      const { result } = renderHook(() => useSubscriptionStatus(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isError).toBe(true);
      expect(mockApi.getUserPlan).toHaveBeenCalledTimes(1); // No retries
    });
  });
});

describe('utility functions', () => {
  describe('shouldRedirectToCustomerDashboard', () => {
    it('should return true for customer with subscription history', () => {
      const status = {
        hasSubscriptionHistory: true,
        shouldShowCustomerDashboard: true,
      } as any;

      expect(shouldRedirectToCustomerDashboard('CUSTOMER', status)).toBe(true);
    });

    it('should return false for admin users', () => {
      const status = {
        hasSubscriptionHistory: true,
        shouldShowCustomerDashboard: true,
      } as any;

      expect(shouldRedirectToCustomerDashboard('ADMIN', status)).toBe(false);
    });

    it('should return false for customer without subscription history', () => {
      const status = {
        hasSubscriptionHistory: false,
        shouldShowCustomerDashboard: false,
      } as any;

      expect(shouldRedirectToCustomerDashboard('CUSTOMER', status)).toBe(false);
    });
  });

  describe('shouldShowGeneralDashboard', () => {
    it('should return true for customer who should see promotion', () => {
      const status = {
        shouldShowPromotion: true,
      } as any;

      expect(shouldShowGeneralDashboard('CUSTOMER', status)).toBe(true);
    });

    it('should return false for admin users', () => {
      const status = {
        shouldShowPromotion: true,
      } as any;

      expect(shouldShowGeneralDashboard('ADMIN', status)).toBe(false);
    });
  });

  describe('getDashboardUrl', () => {
    it('should return admin dashboard for admin users', () => {
      const status = {} as any;
      expect(getDashboardUrl('ADMIN', status)).toBe('/admin');
    });

    it('should return customer dashboard for subscribed customers', () => {
      const status = {
        shouldShowCustomerDashboard: true,
      } as any;

      expect(getDashboardUrl('CUSTOMER', status)).toBe('/customer-dashboard');
    });

    it('should return general dashboard for customers without subscription', () => {
      const status = {
        shouldShowCustomerDashboard: false,
      } as any;

      expect(getDashboardUrl('CUSTOMER', status)).toBe('/dashboard');
    });

    it('should return general dashboard for undefined user role', () => {
      const status = {} as any;
      expect(getDashboardUrl(undefined, status)).toBe('/dashboard');
    });
  });
});