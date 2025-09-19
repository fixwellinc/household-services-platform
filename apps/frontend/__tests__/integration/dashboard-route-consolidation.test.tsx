/**
 * Integration Tests for Dashboard Route Consolidation
 * 
 * Tests the complete routing flow for dashboard consolidation including:
 * - Route redirect logic in /dashboard page
 * - Enhanced subscription detection in /customer-dashboard page
 * - Access control for customer dashboard
 * - Query parameter and hash preservation
 */

import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { useDashboardRouting } from '@/hooks/use-dashboard-routing';

// Mock Next.js navigation hooks
const mockPush = jest.fn();
const mockRouter = {
  push: mockPush,
  replace: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  prefetch: jest.fn(),
};

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  useSearchParams: () => new URLSearchParams('utm_source=email&ref=campaign'),
  usePathname: () => '/dashboard',
}));

// Mock auth context
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock subscription status hook
jest.mock('@/hooks/use-subscription-status', () => ({
  useSubscriptionStatus: jest.fn(),
}));

describe('Dashboard Route Consolidation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Clean up DOM between tests
    document.body.innerHTML = '';
    
    // Mock window.location.hash for hash preservation tests
    Object.defineProperty(window, 'location', {
      value: {
        hash: '#section1',
      },
      writable: true,
    });
  });

  describe('Dashboard routing hook functionality', () => {
    it('should provide correct routing decisions for admin users', () => {
      const { useAuth } = require('@/contexts/AuthContext');
      const { useSubscriptionStatus } = require('@/hooks/use-subscription-status');
      
      useAuth.mockReturnValue({
        user: { id: '1', role: 'ADMIN', name: 'Admin User', email: 'admin@test.com' },
        isLoading: false,
      });

      useSubscriptionStatus.mockReturnValue({
        hasSubscriptionHistory: true,
        currentStatus: 'ACTIVE',
        shouldShowCustomerDashboard: true,
        isLoading: false,
        isError: false,
      });

      const TestComponent = () => {
        const routing = useDashboardRouting();
        return (
          <div>
            <div data-testid="should-redirect-admin">{routing.shouldRedirectToAdmin.toString()}</div>
            <div data-testid="target-route">{routing.targetRoute}</div>
          </div>
        );
      };

      render(<TestComponent />);

      expect(screen.getByTestId('should-redirect-admin')).toHaveTextContent('true');
      expect(screen.getByTestId('target-route')).toHaveTextContent('/admin');
    });

    it('should provide correct routing decisions for customer users with subscription', () => {
      const { useAuth } = require('@/contexts/AuthContext');
      const { useSubscriptionStatus } = require('@/hooks/use-subscription-status');
      
      useAuth.mockReturnValue({
        user: { id: '1', role: 'CUSTOMER', name: 'Customer User', email: 'customer@test.com' },
        isLoading: false,
      });

      useSubscriptionStatus.mockReturnValue({
        hasSubscriptionHistory: true,
        currentStatus: 'ACTIVE',
        shouldShowCustomerDashboard: true,
        isLoading: false,
        isError: false,
      });

      const TestComponent = () => {
        const routing = useDashboardRouting();
        return (
          <div>
            <div data-testid="should-redirect-customer">{routing.shouldRedirectToCustomerDashboard.toString()}</div>
            <div data-testid="target-route">{routing.targetRoute}</div>
          </div>
        );
      };

      render(<TestComponent />);

      expect(screen.getByTestId('should-redirect-customer')).toHaveTextContent('true');
      expect(screen.getByTestId('target-route')).toHaveTextContent('/customer-dashboard');
    });

    it('should provide correct routing decisions for customer users without subscription', () => {
      const { useAuth } = require('@/contexts/AuthContext');
      const { useSubscriptionStatus } = require('@/hooks/use-subscription-status');
      
      useAuth.mockReturnValue({
        user: { id: '1', role: 'CUSTOMER', name: 'Customer User', email: 'customer@test.com' },
        isLoading: false,
      });

      useSubscriptionStatus.mockReturnValue({
        hasSubscriptionHistory: false,
        currentStatus: 'NONE',
        shouldShowCustomerDashboard: false,
        isLoading: false,
        isError: false,
      });

      const TestComponent = () => {
        const routing = useDashboardRouting();
        return (
          <div>
            <div data-testid="should-show-general">{routing.shouldShowGeneralDashboard.toString()}</div>
            <div data-testid="target-route">{routing.targetRoute}</div>
          </div>
        );
      };

      render(<TestComponent />);

      expect(screen.getByTestId('should-show-general')).toHaveTextContent('true');
      expect(screen.getByTestId('target-route')).toHaveTextContent('/dashboard');
    });

    it('should handle loading states correctly', () => {
      const { useAuth } = require('@/contexts/AuthContext');
      const { useSubscriptionStatus } = require('@/hooks/use-subscription-status');
      
      useAuth.mockReturnValue({
        user: { id: '1', role: 'CUSTOMER', name: 'Customer User', email: 'customer@test.com' },
        isLoading: false,
      });

      useSubscriptionStatus.mockReturnValue({
        hasSubscriptionHistory: false,
        currentStatus: 'NONE',
        shouldShowCustomerDashboard: false,
        isLoading: true, // Still loading
        isError: false,
      });

      const TestComponent = () => {
        const routing = useDashboardRouting();
        return (
          <div>
            <div data-testid="is-loading">{routing.isLoading.toString()}</div>
            <div data-testid="should-redirect-customer">{routing.shouldRedirectToCustomerDashboard.toString()}</div>
            <div data-testid="should-show-general">{routing.shouldShowGeneralDashboard.toString()}</div>
          </div>
        );
      };

      render(<TestComponent />);

      expect(screen.getByTestId('is-loading')).toHaveTextContent('true'); // Hook is loading when subscription is loading
      expect(screen.getByTestId('should-redirect-customer')).toHaveTextContent('false');
      expect(screen.getByTestId('should-show-general')).toHaveTextContent('false');
    });

    it('should handle subscription data errors correctly', () => {
      const { useAuth } = require('@/contexts/AuthContext');
      const { useSubscriptionStatus } = require('@/hooks/use-subscription-status');
      
      useAuth.mockReturnValue({
        user: { id: '1', role: 'CUSTOMER', name: 'Customer User', email: 'customer@test.com' },
        isLoading: false,
      });

      useSubscriptionStatus.mockReturnValue({
        hasSubscriptionHistory: false,
        currentStatus: 'NONE',
        shouldShowCustomerDashboard: false,
        isLoading: false,
        isError: true,
        error: new Error('Failed to load subscription'),
      });

      const TestComponent = () => {
        const routing = useDashboardRouting();
        return (
          <div>
            <div data-testid="should-redirect-customer">{routing.shouldRedirectToCustomerDashboard.toString()}</div>
            <div data-testid="target-route">{routing.targetRoute}</div>
          </div>
        );
      };

      render(<TestComponent />);

      // When subscription data fails to load, customer users should default to customer dashboard
      expect(screen.getByTestId('should-redirect-customer')).toHaveTextContent('true');
      expect(screen.getByTestId('target-route')).toHaveTextContent('/customer-dashboard');
    });
  });

  describe('Navigation with parameter preservation', () => {
    it('should preserve query parameters and hash fragments', () => {
      const { useAuth } = require('@/contexts/AuthContext');
      const { useSubscriptionStatus } = require('@/hooks/use-subscription-status');
      
      useAuth.mockReturnValue({
        user: { id: '1', role: 'CUSTOMER', name: 'Customer User', email: 'customer@test.com' },
        isLoading: false,
      });

      useSubscriptionStatus.mockReturnValue({
        hasSubscriptionHistory: true,
        currentStatus: 'ACTIVE',
        shouldShowCustomerDashboard: true,
        isLoading: false,
        isError: false,
      });

      const TestComponent = () => {
        const routing = useDashboardRouting();
        
        // Test navigation with parameter preservation
        const handleNavigate = () => {
          routing.navigateToRoute('/customer-dashboard', true);
        };

        return (
          <div>
            <button onClick={handleNavigate} data-testid="navigate-btn">Navigate</button>
          </div>
        );
      };

      render(<TestComponent />);

      fireEvent.click(screen.getByTestId('navigate-btn'));

      // Should call router.push with preserved parameters and hash
      expect(mockPush).toHaveBeenCalledWith('/customer-dashboard?utm_source=email&ref=campaign#section1');
    });

    it('should navigate without parameters when preserveParams is false', () => {
      const { useAuth } = require('@/contexts/AuthContext');
      const { useSubscriptionStatus } = require('@/hooks/use-subscription-status');
      
      useAuth.mockReturnValue({
        user: { id: '1', role: 'ADMIN', name: 'Admin User', email: 'admin@test.com' },
        isLoading: false,
      });

      useSubscriptionStatus.mockReturnValue({
        hasSubscriptionHistory: true,
        currentStatus: 'ACTIVE',
        shouldShowCustomerDashboard: true,
        isLoading: false,
        isError: false,
      });

      const TestComponent = () => {
        const routing = useDashboardRouting();
        
        // Test navigation without parameter preservation
        const handleNavigate = () => {
          routing.navigateToRoute('/admin', false);
        };

        return (
          <div>
            <button onClick={handleNavigate} data-testid="navigate-btn">Navigate</button>
          </div>
        );
      };

      render(<TestComponent />);

      fireEvent.click(screen.getByTestId('navigate-btn'));

      // Should call router.push without parameters
      expect(mockPush).toHaveBeenCalledWith('/admin');
    });
  });

  describe('Enhanced subscription detection scenarios', () => {
    const subscriptionStatuses = [
      { status: 'ACTIVE', shouldShow: true, description: 'active subscription' },
      { status: 'PAST_DUE', shouldShow: true, description: 'past due subscription' },
      { status: 'CANCELLED', shouldShow: true, description: 'cancelled subscription' },
      { status: 'INCOMPLETE', shouldShow: true, description: 'incomplete subscription' },
      { status: 'NONE', shouldShow: false, description: 'no subscription history' },
    ];

    subscriptionStatuses.forEach(({ status, shouldShow, description }) => {
      it(`should handle ${description} correctly`, () => {
        const { useAuth } = require('@/contexts/AuthContext');
        const { useSubscriptionStatus } = require('@/hooks/use-subscription-status');
        // Clean up any previous renders
        cleanup();
        
        useAuth.mockReturnValue({
          user: { id: '1', role: 'CUSTOMER', name: 'Customer User', email: 'customer@test.com' },
          isLoading: false,
        });

        useSubscriptionStatus.mockReturnValue({
          hasSubscriptionHistory: status !== 'NONE',
          currentStatus: status,
          shouldShowCustomerDashboard: shouldShow,
          isLoading: false,
          isError: false,
        });

        const TestComponent = () => {
          const routing = useDashboardRouting();
          return (
            <div data-testid={`test-${status.toLowerCase()}`}>
              <div data-testid={`should-redirect-customer-${status.toLowerCase()}`}>{routing.shouldRedirectToCustomerDashboard.toString()}</div>
              <div data-testid={`should-show-general-${status.toLowerCase()}`}>{routing.shouldShowGeneralDashboard.toString()}</div>
              <div data-testid={`target-route-${status.toLowerCase()}`}>{routing.targetRoute}</div>
            </div>
          );
        };

        render(<TestComponent />);

        if (shouldShow) {
          expect(screen.getByTestId(`should-redirect-customer-${status.toLowerCase()}`)).toHaveTextContent('true');
          expect(screen.getByTestId(`should-show-general-${status.toLowerCase()}`)).toHaveTextContent('false');
          expect(screen.getByTestId(`target-route-${status.toLowerCase()}`)).toHaveTextContent('/customer-dashboard');
        } else {
          expect(screen.getByTestId(`should-redirect-customer-${status.toLowerCase()}`)).toHaveTextContent('false');
          expect(screen.getByTestId(`should-show-general-${status.toLowerCase()}`)).toHaveTextContent('true');
          expect(screen.getByTestId(`target-route-${status.toLowerCase()}`)).toHaveTextContent('/dashboard');
        }
        
        cleanup();
      });
    });
  });

  describe('Route consolidation logic', () => {
    it('should provide correct available routes for different user types', () => {
      const { useAuth } = require('@/contexts/AuthContext');
      const { useSubscriptionStatus } = require('@/hooks/use-subscription-status');
      
      useAuth.mockReturnValue({
        user: { id: '1', role: 'CUSTOMER', name: 'Customer User', email: 'customer@test.com' },
        isLoading: false,
      });

      useSubscriptionStatus.mockReturnValue({
        hasSubscriptionHistory: true,
        currentStatus: 'ACTIVE',
        shouldShowCustomerDashboard: true,
        isLoading: false,
        isError: false,
      });

      const TestComponent = () => {
        const routing = useDashboardRouting();
        return (
          <div>
            <div data-testid="available-routes-count">{routing.availableRoutes.length}</div>
            <div data-testid="current-route">{routing.currentRoute}</div>
          </div>
        );
      };

      render(<TestComponent />);

      expect(screen.getByTestId('current-route')).toHaveTextContent('/dashboard');
      // Available routes should be populated based on user type
      expect(parseInt(screen.getByTestId('available-routes-count').textContent || '0')).toBeGreaterThan(0);
    });

    it('should handle route determination correctly', () => {
      const { useAuth } = require('@/contexts/AuthContext');
      const { useSubscriptionStatus } = require('@/hooks/use-subscription-status');
      
      useAuth.mockReturnValue({
        user: { id: '1', role: 'CUSTOMER', name: 'Customer User', email: 'customer@test.com' },
        isLoading: false,
      });

      useSubscriptionStatus.mockReturnValue({
        hasSubscriptionHistory: true,
        currentStatus: 'ACTIVE',
        shouldShowCustomerDashboard: true,
        isLoading: false,
        isError: false,
      });

      const TestComponent = () => {
        const routing = useDashboardRouting();
        
        const handleGetDashboardUrl = () => {
          const url = routing.getDashboardUrl(true);
          return url;
        };

        return (
          <div>
            <div data-testid="dashboard-url">{handleGetDashboardUrl()}</div>
            <div data-testid="is-current-route">{routing.isCurrentRoute('/dashboard').toString()}</div>
          </div>
        );
      };

      render(<TestComponent />);

      // Should generate correct dashboard URL with parameters
      expect(screen.getByTestId('dashboard-url')).toHaveTextContent('/customer-dashboard?utm_source=email&ref=campaign#section1');
      expect(screen.getByTestId('is-current-route')).toHaveTextContent('true');
    });
  });
});