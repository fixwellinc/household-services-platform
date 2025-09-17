import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock fetch globally
global.fetch = jest.fn();

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/customer-dashboard',
}));

// Mock authentication context
const mockAuthContext = {
  user: {
    id: 'user_123',
    email: 'test@example.com',
    subscription: {
      id: 'sub_123',
      tier: 'HOMECARE',
      status: 'ACTIVE'
    }
  },
  isAuthenticated: true,
  loading: false
};

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockAuthContext,
}));

describe('Customer Dashboard API Integration', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  describe('Subscription Data API', () => {
    it('fetches subscription data successfully', async () => {
      const mockSubscriptionData = {
        id: 'sub_123',
        tier: 'HOMECARE',
        status: 'ACTIVE',
        currentPeriodStart: '2024-01-01',
        currentPeriodEnd: '2024-02-01',
        paymentFrequency: 'MONTHLY',
        nextPaymentAmount: 4999,
        plan: {
          name: 'HomeCare Plan',
          description: 'Perfect for regular home maintenance',
          monthlyPrice: 4999,
          yearlyPrice: 49999,
          features: ['Priority booking', '10% discount']
        }
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockSubscriptionData })
      });

      const response = await fetch('/api/customer/subscription');
      const data = await response.json();

      expect(fetch).toHaveBeenCalledWith('/api/customer/subscription');
      expect(data.success).toBe(true);
      expect(data.data.tier).toBe('HOMECARE');
      expect(data.data.plan.name).toBe('HomeCare Plan');
    });

    it('handles subscription data fetch errors', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ success: false, error: 'Internal server error' })
      });

      const response = await fetch('/api/customer/subscription');
      const data = await response.json();

      expect(response.ok).toBe(false);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal server error');
    });

    it('fetches usage statistics successfully', async () => {
      const mockUsageData = {
        currentPeriod: {
          servicesUsed: 3,
          discountsSaved: 150,
          priorityBookings: 2
        },
        limits: {
          maxServices: 10,
          maxPriorityBookings: 5
        }
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockUsageData })
      });

      const response = await fetch('/api/customer/subscription/usage');
      const data = await response.json();

      expect(fetch).toHaveBeenCalledWith('/api/customer/subscription/usage');
      expect(data.success).toBe(true);
      expect(data.data.currentPeriod.servicesUsed).toBe(3);
      expect(data.data.limits.maxServices).toBe(10);
    });
  });

  describe('Perks and Services API', () => {
    it('fetches perks data successfully', async () => {
      const mockPerksData = [
        {
          id: 'perk_1',
          name: 'Priority Booking',
          description: 'Skip the queue',
          isIncluded: true,
          usageLimit: 5,
          currentUsage: 2
        },
        {
          id: 'perk_2',
          name: 'Emergency Support',
          description: '24/7 support',
          isIncluded: true,
          isUnlimited: true
        }
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockPerksData })
      });

      const response = await fetch('/api/customer/perks');
      const data = await response.json();

      expect(fetch).toHaveBeenCalledWith('/api/customer/perks');
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(2);
      expect(data.data[0].name).toBe('Priority Booking');
      expect(data.data[1].isUnlimited).toBe(true);
    });

    it('fetches available services successfully', async () => {
      const mockServicesData = [
        {
          id: 'service_1',
          name: 'House Cleaning',
          category: 'CLEANING',
          basePrice: 12000,
          isIncluded: true,
          discountPercentage: 10
        },
        {
          id: 'service_2',
          name: 'Premium Maintenance',
          category: 'MAINTENANCE',
          basePrice: 25000,
          isIncluded: false,
          requiresUpgrade: true,
          upgradeToTier: 'PRIORITY'
        }
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockServicesData })
      });

      const response = await fetch('/api/customer/services');
      const data = await response.json();

      expect(fetch).toHaveBeenCalledWith('/api/customer/services');
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(2);
      expect(data.data[0].isIncluded).toBe(true);
      expect(data.data[1].requiresUpgrade).toBe(true);
    });

    it('submits service request successfully', async () => {
      const serviceRequestData = {
        serviceId: 'service_1',
        description: 'Need house cleaning',
        urgency: 'NORMAL',
        address: '123 Main St',
        contactMethod: 'EMAIL'
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          success: true, 
          data: { 
            id: 'request_123',
            status: 'PENDING',
            estimatedResponse: '2-4 hours'
          }
        })
      });

      const response = await fetch('/api/customer/service-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serviceRequestData)
      });
      const data = await response.json();

      expect(fetch).toHaveBeenCalledWith('/api/customer/service-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serviceRequestData)
      });
      expect(data.success).toBe(true);
      expect(data.data.id).toBe('request_123');
      expect(data.data.status).toBe('PENDING');
    });
  });

  describe('Subscription Management API', () => {
    it('changes subscription plan successfully', async () => {
      const planChangeData = {
        newPlan: 'PRIORITY',
        billingCycle: 'MONTHLY'
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          success: true, 
          data: { 
            subscriptionId: 'sub_123',
            newTier: 'PRIORITY',
            effectiveDate: '2024-02-01',
            prorationAmount: 2500
          }
        })
      });

      const response = await fetch('/api/customer/subscription/change-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(planChangeData)
      });
      const data = await response.json();

      expect(fetch).toHaveBeenCalledWith('/api/customer/subscription/change-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(planChangeData)
      });
      expect(data.success).toBe(true);
      expect(data.data.newTier).toBe('PRIORITY');
      expect(data.data.prorationAmount).toBe(2500);
    });

    it('cancels subscription successfully', async () => {
      const cancellationData = {
        reason: 'No longer needed',
        feedback: 'Service was good but circumstances changed'
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          success: true, 
          data: { 
            subscriptionId: 'sub_123',
            status: 'CANCELLED',
            accessEndDate: '2024-02-01',
            refundAmount: 0
          }
        })
      });

      const response = await fetch('/api/customer/subscription/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cancellationData)
      });
      const data = await response.json();

      expect(fetch).toHaveBeenCalledWith('/api/customer/subscription/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cancellationData)
      });
      expect(data.success).toBe(true);
      expect(data.data.status).toBe('CANCELLED');
      expect(data.data.accessEndDate).toBe('2024-02-01');
    });

    it('updates payment method successfully', async () => {
      const paymentMethodData = {
        paymentMethodId: 'pm_new123',
        setAsDefault: true
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          success: true, 
          data: { 
            paymentMethodId: 'pm_new123',
            last4: '4242',
            brand: 'visa',
            isDefault: true
          }
        })
      });

      const response = await fetch('/api/customer/payment-methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentMethodData)
      });
      const data = await response.json();

      expect(fetch).toHaveBeenCalledWith('/api/customer/payment-methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentMethodData)
      });
      expect(data.success).toBe(true);
      expect(data.data.isDefault).toBe(true);
      expect(data.data.last4).toBe('4242');
    });
  });

  describe('Usage Analytics API', () => {
    it('fetches usage analytics successfully', async () => {
      const mockAnalyticsData = {
        currentPeriod: {
          period: '2024-01',
          servicesUsed: 5,
          discountsSaved: 250,
          priorityBookings: 3
        },
        historical: [
          { period: '2023-12', servicesUsed: 4, discountsSaved: 200 },
          { period: '2023-11', servicesUsed: 6, discountsSaved: 300 }
        ],
        trends: {
          servicesUsed: { direction: 'UP', percentage: 25 },
          discountsSaved: { direction: 'UP', percentage: 25 }
        }
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockAnalyticsData })
      });

      const response = await fetch('/api/customer/usage');
      const data = await response.json();

      expect(fetch).toHaveBeenCalledWith('/api/customer/usage');
      expect(data.success).toBe(true);
      expect(data.data.currentPeriod.servicesUsed).toBe(5);
      expect(data.data.historical).toHaveLength(2);
      expect(data.data.trends.servicesUsed.direction).toBe('UP');
    });

    it('exports usage data successfully', async () => {
      const exportParams = {
        format: 'CSV',
        dateRange: {
          start: '2024-01-01',
          end: '2024-01-31'
        }
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        blob: async () => new Blob(['usage,data,csv'], { type: 'text/csv' }),
        headers: new Headers({
          'Content-Disposition': 'attachment; filename="usage-export.csv"'
        })
      });

      const response = await fetch('/api/customer/usage/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exportParams)
      });

      expect(fetch).toHaveBeenCalledWith('/api/customer/usage/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exportParams)
      });
      expect(response.ok).toBe(true);
      
      const blob = await response.blob();
      expect(blob.type).toBe('text/csv');
    });
  });

  describe('Error Handling', () => {
    it('handles network errors gracefully', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      try {
        await fetch('/api/customer/subscription');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Network error');
      }
    });

    it('handles 401 unauthorized errors', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ success: false, error: 'Unauthorized' })
      });

      const response = await fetch('/api/customer/subscription');
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('handles 403 forbidden errors', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ success: false, error: 'Insufficient permissions' })
      });

      const response = await fetch('/api/customer/perks');
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Insufficient permissions');
    });

    it('handles 404 not found errors', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ success: false, error: 'Subscription not found' })
      });

      const response = await fetch('/api/customer/subscription');
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Subscription not found');
    });

    it('handles validation errors', async () => {
      const invalidServiceRequest = {
        description: '', // Invalid: empty description
        urgency: 'INVALID', // Invalid: not a valid urgency level
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ 
          success: false, 
          error: 'Validation failed',
          details: {
            description: 'Description is required',
            urgency: 'Invalid urgency level'
          }
        })
      });

      const response = await fetch('/api/customer/service-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidServiceRequest)
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
      expect(data.details.description).toBe('Description is required');
      expect(data.details.urgency).toBe('Invalid urgency level');
    });
  });

  describe('Rate Limiting', () => {
    it('handles rate limit errors', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({ 
          success: false, 
          error: 'Rate limit exceeded',
          retryAfter: 60
        })
      });

      const response = await fetch('/api/customer/subscription');
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.error).toBe('Rate limit exceeded');
      expect(data.retryAfter).toBe(60);
    });
  });
});