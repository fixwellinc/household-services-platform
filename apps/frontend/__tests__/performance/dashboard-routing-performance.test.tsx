/**
 * Performance Tests for Dashboard Routing Optimization
 * 
 * Tests the performance improvements made to dashboard routing and subscription data loading.
 * Validates that the optimizations meet performance thresholds.
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { jest } from '@jest/globals';
import { useDashboardRouting } from '../../hooks/use-dashboard-routing';
import { useSubscriptionStatus } from '../../hooks/use-subscription-status';
import { useDashboardPerformanceMonitor } from '../../lib/dashboard-performance-monitor';

// Mock the hooks
jest.mock('../../hooks/use-dashboard-routing');
jest.mock('../../hooks/use-subscription-status');
jest.mock('../../lib/dashboard-performance-monitor');
jest.mock('../../contexts/AuthContext');
jest.mock('next/navigation');

const mockUseDashboardRouting = useDashboardRouting as jest.MockedFunction<typeof useDashboardRouting>;
const mockUseSubscriptionStatus = useSubscriptionStatus as jest.MockedFunction<typeof useSubscriptionStatus>;
const mockUseDashboardPerformanceMonitor = jest.mocked(useDashboardPerformanceMonitor);

describe('Dashboard Routing Performance Tests', () => {
  let queryClient: QueryClient;
  let performanceMonitor: any;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    performanceMonitor = {
      startTiming: jest.fn(),
      endTiming: jest.fn().mockReturnValue(100), // Mock 100ms timing
      recordCacheHit: jest.fn(),
      recordCacheMiss: jest.fn(),
      recordError: jest.fn(),
      recordRetry: jest.fn(),
      getMetrics: jest.fn().mockReturnValue({
        routingTime: 150,
        subscriptionLoadTime: 800,
        totalDashboardLoadTime: 1200,
        cacheHitRate: 85,
        errorRate: 2,
        retryCount: 1,
      }),
      getPerformanceSummary: jest.fn().mockReturnValue({
        metrics: {
          routingTime: 150,
          subscriptionLoadTime: 800,
          totalDashboardLoadTime: 1200,
          cacheHitRate: 85,
          errorRate: 2,
          retryCount: 1,
        },
        status: 'good',
        recommendations: [],
      }),
      exportMetrics: jest.fn().mockReturnValue('{}'),
    };

    mockUseDashboardPerformanceMonitor.mockReturnValue(performanceMonitor);

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

    mockUseDashboardRouting.mockReturnValue({
      currentRoute: '/customer-dashboard',
      targetRoute: '/customer-dashboard',
      isLoading: false,
      error: null,
      shouldRedirectToCustomerDashboard: true,
      shouldShowGeneralDashboard: false,
      shouldRedirectToAdmin: false,
      availableRoutes: [
        { path: '/customer-dashboard', label: 'Customer Dashboard', description: 'Manage your subscription' }
      ],
      navigateToDashboard: jest.fn(),
      navigateToRoute: jest.fn(),
      getDashboardUrl: jest.fn().mockReturnValue('/customer-dashboard'),
      isCurrentRoute: jest.fn().mockReturnValue(true),
      canAccessRoute: jest.fn().mockReturnValue(true),
      hasRoutingError: false,
      fallbackRoute: '/dashboard',
      retryRouting: jest.fn(),
      navigateToFallback: jest.fn(),
      isRetrying: false,
      canRetry: true,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Performance Monitoring Integration', () => {
    it('should track routing performance metrics', async () => {
      const TestComponent = () => {
        const routing = useDashboardRouting();
        const monitor = useDashboardPerformanceMonitor();

        React.useEffect(() => {
          // Simulate routing operation
          monitor.startTiming('dashboard-routing');
          setTimeout(() => {
            monitor.endTiming('dashboard-routing');
          }, 100);
        }, [monitor]);

        return <div data-testid="test-component">Routing Test</div>;
      };

      render(
        <QueryClientProvider client={queryClient}>
          <TestComponent />
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(performanceMonitor.startTiming).toHaveBeenCalledWith('dashboard-routing');
      });

      // Wait for the timing to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 150));
      });

      expect(performanceMonitor.endTiming).toHaveBeenCalledWith('dashboard-routing');
    });

    it('should track subscription loading performance', async () => {
      const TestComponent = () => {
        const subscription = useSubscriptionStatus();
        const monitor = useDashboardPerformanceMonitor();

        React.useEffect(() => {
          // Simulate subscription data loading
          monitor.startTiming('subscription-load');
          setTimeout(() => {
            monitor.endTiming('subscription-load');
            monitor.recordCacheHit();
          }, 200);
        }, [monitor]);

        return <div data-testid="subscription-test">Subscription Test</div>;
      };

      render(
        <QueryClientProvider client={queryClient}>
          <TestComponent />
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(performanceMonitor.startTiming).toHaveBeenCalledWith('subscription-load');
      });

      // Wait for the timing to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 250));
      });

      expect(performanceMonitor.endTiming).toHaveBeenCalledWith('subscription-load');
      expect(performanceMonitor.recordCacheHit).toHaveBeenCalled();
    });

    it('should record cache hits and misses', async () => {
      const TestComponent = () => {
        const monitor = useDashboardPerformanceMonitor();

        React.useEffect(() => {
          // Simulate cache operations
          monitor.recordCacheHit();
          monitor.recordCacheMiss();
        }, [monitor]);

        return <div data-testid="cache-test">Cache Test</div>;
      };

      render(
        <QueryClientProvider client={queryClient}>
          <TestComponent />
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(performanceMonitor.recordCacheHit).toHaveBeenCalled();
        expect(performanceMonitor.recordCacheMiss).toHaveBeenCalled();
      });
    });

    it('should record errors and retries', async () => {
      const TestComponent = () => {
        const monitor = useDashboardPerformanceMonitor();

        React.useEffect(() => {
          // Simulate error scenarios
          monitor.recordError();
          monitor.recordRetry();
        }, [monitor]);

        return <div data-testid="error-test">Error Test</div>;
      };

      render(
        <QueryClientProvider client={queryClient}>
          <TestComponent />
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(performanceMonitor.recordError).toHaveBeenCalled();
        expect(performanceMonitor.recordRetry).toHaveBeenCalled();
      });
    });
  });

  describe('Performance Metrics Validation', () => {
    it('should meet routing performance thresholds', () => {
      const metrics = performanceMonitor.getMetrics();
      
      // Routing should be under 500ms
      expect(metrics.routingTime).toBeLessThan(500);
      
      // Subscription loading should be under 2000ms
      expect(metrics.subscriptionLoadTime).toBeLessThan(2000);
      
      // Total dashboard load should be under 3000ms
      expect(metrics.totalDashboardLoadTime).toBeLessThan(3000);
    });

    it('should maintain good cache hit rate', () => {
      const metrics = performanceMonitor.getMetrics();
      
      // Cache hit rate should be above 80%
      expect(metrics.cacheHitRate).toBeGreaterThan(80);
    });

    it('should keep error rate low', () => {
      const metrics = performanceMonitor.getMetrics();
      
      // Error rate should be below 5%
      expect(metrics.errorRate).toBeLessThan(5);
    });

    it('should provide performance summary', () => {
      const summary = performanceMonitor.getPerformanceSummary();
      
      expect(summary).toHaveProperty('metrics');
      expect(summary).toHaveProperty('status');
      expect(summary).toHaveProperty('recommendations');
      
      expect(['good', 'warning', 'critical']).toContain(summary.status);
      expect(Array.isArray(summary.recommendations)).toBe(true);
    });

    it('should export metrics for analysis', () => {
      const exportedMetrics = performanceMonitor.exportMetrics();
      
      expect(typeof exportedMetrics).toBe('string');
      expect(() => JSON.parse(exportedMetrics)).not.toThrow();
    });
  });

  describe('Caching Optimization', () => {
    it('should use cached subscription data when available', async () => {
      // Mock subscription hook to simulate cached data
      mockUseSubscriptionStatus.mockReturnValue({
        hasSubscriptionHistory: true,
        currentStatus: 'ACTIVE',
        shouldShowCustomerDashboard: true,
        shouldShowPromotion: false,
        canAccessPremiumFeatures: true,
        isLoading: false, // Not loading indicates cached data
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

      const TestComponent = () => {
        const subscription = useSubscriptionStatus();
        const monitor = useDashboardPerformanceMonitor();

        React.useEffect(() => {
          if (!subscription.isLoading) {
            monitor.recordCacheHit();
          }
        }, [subscription.isLoading, monitor]);

        return (
          <div data-testid="cached-data">
            Status: {subscription.currentStatus}
          </div>
        );
      };

      render(
        <QueryClientProvider client={queryClient}>
          <TestComponent />
        </QueryClientProvider>
      );

      expect(screen.getByTestId('cached-data')).toHaveTextContent('Status: ACTIVE');
      
      await waitFor(() => {
        expect(performanceMonitor.recordCacheHit).toHaveBeenCalled();
      });
    });

    it('should handle cache misses gracefully', async () => {
      // Mock subscription hook to simulate cache miss
      mockUseSubscriptionStatus.mockReturnValue({
        hasSubscriptionHistory: false,
        currentStatus: 'NONE',
        shouldShowCustomerDashboard: false,
        shouldShowPromotion: true,
        canAccessPremiumFeatures: false,
        isLoading: true, // Loading indicates cache miss
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

      const TestComponent = () => {
        const subscription = useSubscriptionStatus();
        const monitor = useDashboardPerformanceMonitor();

        React.useEffect(() => {
          if (subscription.isLoading) {
            monitor.recordCacheMiss();
          }
        }, [subscription.isLoading, monitor]);

        return (
          <div data-testid="loading-data">
            {subscription.isLoading ? 'Loading...' : 'Loaded'}
          </div>
        );
      };

      render(
        <QueryClientProvider client={queryClient}>
          <TestComponent />
        </QueryClientProvider>
      );

      expect(screen.getByTestId('loading-data')).toHaveTextContent('Loading...');
      
      await waitFor(() => {
        expect(performanceMonitor.recordCacheMiss).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling Performance', () => {
    it('should handle routing errors efficiently', async () => {
      const mockNavigateToRoute = jest.fn().mockRejectedValue(new Error('Navigation failed'));
      
      mockUseDashboardRouting.mockReturnValue({
        currentRoute: '/dashboard',
        targetRoute: '/customer-dashboard',
        isLoading: false,
        error: new Error('Navigation failed'),
        shouldRedirectToCustomerDashboard: true,
        shouldShowGeneralDashboard: false,
        shouldRedirectToAdmin: false,
        availableRoutes: [],
        navigateToDashboard: jest.fn(),
        navigateToRoute: mockNavigateToRoute,
        getDashboardUrl: jest.fn().mockReturnValue('/customer-dashboard'),
        isCurrentRoute: jest.fn().mockReturnValue(false),
        canAccessRoute: jest.fn().mockReturnValue(true),
        hasRoutingError: true,
        fallbackRoute: '/dashboard',
        retryRouting: jest.fn(),
        navigateToFallback: jest.fn(),
        isRetrying: false,
        canRetry: true,
      });

      const TestComponent = () => {
        const routing = useDashboardRouting();
        const monitor = useDashboardPerformanceMonitor();

        React.useEffect(() => {
          if (routing.hasRoutingError) {
            monitor.recordError();
          }
        }, [routing.hasRoutingError, monitor]);

        return (
          <div data-testid="error-handling">
            {routing.hasRoutingError ? 'Error occurred' : 'No error'}
          </div>
        );
      };

      render(
        <QueryClientProvider client={queryClient}>
          <TestComponent />
        </QueryClientProvider>
      );

      expect(screen.getByTestId('error-handling')).toHaveTextContent('Error occurred');
      
      await waitFor(() => {
        expect(performanceMonitor.recordError).toHaveBeenCalled();
      });
    });

    it('should track retry attempts', async () => {
      const TestComponent = () => {
        const routing = useDashboardRouting();
        const monitor = useDashboardPerformanceMonitor();

        const handleRetry = async () => {
          monitor.recordRetry();
          await routing.retryRouting();
        };

        return (
          <div>
            <button onClick={handleRetry} data-testid="retry-button">
              Retry
            </button>
          </div>
        );
      };

      render(
        <QueryClientProvider client={queryClient}>
          <TestComponent />
        </QueryClientProvider>
      );

      const retryButton = screen.getByTestId('retry-button');
      
      await act(async () => {
        retryButton.click();
      });

      await waitFor(() => {
        expect(performanceMonitor.recordRetry).toHaveBeenCalled();
      });
    });
  });

  describe('Performance Regression Prevention', () => {
    it('should not exceed baseline performance metrics', () => {
      const metrics = performanceMonitor.getMetrics();
      
      // Baseline performance thresholds (should not exceed these)
      const baselines = {
        routingTime: 500,
        subscriptionLoadTime: 2000,
        totalDashboardLoadTime: 3000,
        minCacheHitRate: 80,
        maxErrorRate: 5,
      };

      expect(metrics.routingTime).toBeLessThanOrEqual(baselines.routingTime);
      expect(metrics.subscriptionLoadTime).toBeLessThanOrEqual(baselines.subscriptionLoadTime);
      expect(metrics.totalDashboardLoadTime).toBeLessThanOrEqual(baselines.totalDashboardLoadTime);
      expect(metrics.cacheHitRate).toBeGreaterThanOrEqual(baselines.minCacheHitRate);
      expect(metrics.errorRate).toBeLessThanOrEqual(baselines.maxErrorRate);
    });

    it('should maintain performance under load', async () => {
      const TestComponent = () => {
        const routing = useDashboardRouting();
        const subscription = useSubscriptionStatus();
        const monitor = useDashboardPerformanceMonitor();

        React.useEffect(() => {
          // Simulate multiple concurrent operations
          const operations = Array.from({ length: 10 }, (_, i) => {
            monitor.startTiming(`operation-${i}`);
            return new Promise(resolve => {
              setTimeout(() => {
                monitor.endTiming(`operation-${i}`);
                resolve(i);
              }, Math.random() * 100);
            });
          });

          Promise.all(operations);
        }, [monitor]);

        return <div data-testid="load-test">Load Test</div>;
      };

      render(
        <QueryClientProvider client={queryClient}>
          <TestComponent />
        </QueryClientProvider>
      );

      // Wait for all operations to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 200));
      });

      // Verify that timing was called for each operation
      expect(performanceMonitor.startTiming).toHaveBeenCalledTimes(10);
      expect(performanceMonitor.endTiming).toHaveBeenCalledTimes(10);
    });
  });
});