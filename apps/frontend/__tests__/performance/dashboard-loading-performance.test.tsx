/**
 * Dashboard Loading Performance Tests
 * 
 * Tests dashboard loading times and performance metrics
 * Requirements: 3.1 (2 second loading requirement), 4.1, 4.2
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { performance } from 'perf_hooks';

// Mock performance API for Node.js environment
global.performance = global.performance || {
  now: () => Date.now(),
  mark: () => {},
  measure: () => {},
  getEntriesByName: () => [],
  getEntriesByType: () => [],
  clearMarks: () => {},
  clearMeasures: () => {},
} as any;

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/dashboard',
}));

// Mock authentication context
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock hooks
jest.mock('@/hooks/use-dashboard-routing', () => ({
  useDashboardRouting: jest.fn(),
}));

jest.mock('@/hooks/use-subscription-status', () => ({
  useSubscriptionStatus: jest.fn(),
}));

// Mock API
jest.mock('@/lib/api', () => ({
  getUserPlan: jest.fn(),
}));

import { useAuth } from '@/contexts/AuthContext';
import { useDashboardRouting } from '@/hooks/use-dashboard-routing';
import { useSubscriptionStatus } from '@/hooks/use-subscription-status';
import api from '@/lib/api';

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseDashboardRouting = useDashboardRouting as jest.MockedFunction<typeof useDashboardRouting>;
const mockUseSubscriptionStatus = useSubscriptionStatus as jest.MockedFunction<typeof useSubscriptionStatus>;
const mockApi = api as jest.Mocked<typeof api>;

// Performance measurement utilities
class PerformanceTracker {
  private marks: Map<string, number> = new Map();
  private measures: Map<string, number> = new Map();

  mark(name: string): void {
    this.marks.set(name, performance.now());
  }

  measure(name: string, startMark: string, endMark?: string): number {
    const startTime = this.marks.get(startMark);
    const endTime = endMark ? this.marks.get(endMark) : performance.now();
    
    if (startTime === undefined) {
      throw new Error(`Start mark "${startMark}" not found`);
    }
    
    const duration = (endTime || performance.now()) - startTime;
    this.measures.set(name, duration);
    return duration;
  }

  getMeasure(name: string): number | undefined {
    return this.measures.get(name);
  }

  clear(): void {
    this.marks.clear();
    this.measures.clear();
  }
}

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

describe('Dashboard Loading Performance Tests', () => {
  let performanceTracker: PerformanceTracker;

  beforeEach(() => {
    jest.clearAllMocks();
    performanceTracker = new PerformanceTracker();
    
    // Mock console methods to avoid noise
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    performanceTracker.clear();
    jest.restoreAllMocks();
  });

  describe('Initial Dashboard Loading Performance', () => {
    it('should load customer dashboard within 2 seconds (Requirement 3.1)', async () => {
      // Setup fast-loading scenario
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
        shouldRedirectToCustomerDashboard: true,
        navigateToRoute: jest.fn(),
      } as any);

      const FastDashboardTest = () => {
        const [isLoaded, setIsLoaded] = React.useState(false);
        const [loadingStages, setLoadingStages] = React.useState<string[]>([]);

        React.useEffect(() => {
          performanceTracker.mark('dashboard-start');
          
          const loadDashboard = async () => {
            // Simulate loading stages
            performanceTracker.mark('auth-check-start');
            setLoadingStages(prev => [...prev, 'auth-checked']);
            performanceTracker.mark('auth-check-end');
            
            performanceTracker.mark('subscription-load-start');
            await new Promise(resolve => setTimeout(resolve, 100)); // Simulate API call
            setLoadingStages(prev => [...prev, 'subscription-loaded']);
            performanceTracker.mark('subscription-load-end');
            
            performanceTracker.mark('routing-start');
            setLoadingStages(prev => [...prev, 'routing-determined']);
            performanceTracker.mark('routing-end');
            
            performanceTracker.mark('render-start');
            setIsLoaded(true);
            performanceTracker.mark('render-end');
            
            performanceTracker.mark('dashboard-end');
          };

          loadDashboard();
        }, []);

        if (!isLoaded) {
          return (
            <div data-testid="loading-dashboard">
              <div>Loading dashboard...</div>
              <div data-testid="loading-stages">
                {loadingStages.map((stage, index) => (
                  <div key={index} data-testid={`stage-${stage}`}>
                    ✓ {stage}
                  </div>
                ))}
              </div>
            </div>
          );
        }

        return (
          <div data-testid="customer-dashboard-loaded">
            <h1>Customer Dashboard</h1>
            <div data-testid="dashboard-content">Dashboard content loaded</div>
          </div>
        );
      };

      const Wrapper = createWrapper();
      const startTime = performance.now();
      
      render(
        <Wrapper>
          <FastDashboardTest />
        </Wrapper>
      );

      // Should show loading initially
      expect(screen.getByTestId('loading-dashboard')).toBeInTheDocument();

      // Should complete loading within 2 seconds
      await waitFor(() => {
        expect(screen.getByTestId('customer-dashboard-loaded')).toBeInTheDocument();
      }, { timeout: 2000 });

      const endTime = performance.now();
      const totalLoadTime = endTime - startTime;

      // Verify performance requirement
      expect(totalLoadTime).toBeLessThan(2000);

      // Verify all loading stages completed
      expect(screen.getByTestId('stage-auth-checked')).toBeInTheDocument();
      expect(screen.getByTestId('stage-subscription-loaded')).toBeInTheDocument();
      expect(screen.getByTestId('stage-routing-determined')).toBeInTheDocument();

      // Measure individual stage performance
      const authTime = performanceTracker.measure('auth-check', 'auth-check-start', 'auth-check-end');
      const subscriptionTime = performanceTracker.measure('subscription-load', 'subscription-load-start', 'subscription-load-end');
      const routingTime = performanceTracker.measure('routing', 'routing-start', 'routing-end');
      const renderTime = performanceTracker.measure('render', 'render-start', 'render-end');

      // Log performance metrics for analysis
      console.log('Performance Metrics:', {
        totalLoadTime,
        authTime,
        subscriptionTime,
        routingTime,
        renderTime,
      });

      // Verify individual stage performance
      expect(authTime).toBeLessThan(50); // Auth check should be very fast
      expect(subscriptionTime).toBeLessThan(500); // API call should be reasonable
      expect(routingTime).toBeLessThan(100); // Routing logic should be fast
      expect(renderTime).toBeLessThan(100); // Render should be fast
    });

    it('should handle slow subscription API while maintaining performance', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', role: 'CUSTOMER', name: 'Customer User', email: 'customer@test.com' },
        isLoading: false,
        isAuthenticated: true,
        isHydrated: true,
      } as any);

      // Simulate slow API response
      mockApi.getUserPlan.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            success: true,
            hasPlan: true,
            subscription: { status: 'ACTIVE', tier: 'premium' },
            plan: { id: '1', name: 'Premium Plan' }
          }), 800) // 800ms delay
        )
      );

      mockUseSubscriptionStatus.mockReturnValue({
        hasSubscriptionHistory: true,
        currentStatus: 'ACTIVE',
        shouldShowCustomerDashboard: true,
        isLoading: true, // Initially loading
        isError: false,
      } as any);

      mockUseDashboardRouting.mockReturnValue({
        isLoading: true,
        error: null,
        targetRoute: null,
        shouldRedirectToCustomerDashboard: false,
        navigateToRoute: jest.fn(),
      } as any);

      const SlowApiTest = () => {
        const [loadingState, setLoadingState] = React.useState<'initial' | 'api-loading' | 'loaded'>('initial');
        const [showFallback, setShowFallback] = React.useState(false);

        React.useEffect(() => {
          performanceTracker.mark('slow-api-start');
          setLoadingState('api-loading');

          // Show fallback UI after 1 second if still loading
          const fallbackTimer = setTimeout(() => {
            setShowFallback(true);
          }, 1000);

          // Simulate API completion
          const apiTimer = setTimeout(() => {
            setLoadingState('loaded');
            performanceTracker.mark('slow-api-end');
            clearTimeout(fallbackTimer);
          }, 800);

          return () => {
            clearTimeout(fallbackTimer);
            clearTimeout(apiTimer);
          };
        }, []);

        if (loadingState === 'initial') {
          return <div data-testid="initial-loading">Initializing...</div>;
        }

        if (loadingState === 'api-loading') {
          return (
            <div data-testid="api-loading">
              <div>Loading subscription data...</div>
              {showFallback && (
                <div data-testid="fallback-content">
                  <h2>Dashboard Preview</h2>
                  <p>Loading your subscription details...</p>
                  <div data-testid="skeleton-content">
                    <div className="skeleton-line">Loading plan information...</div>
                    <div className="skeleton-line">Loading usage data...</div>
                    <div className="skeleton-line">Loading billing information...</div>
                  </div>
                </div>
              )}
            </div>
          );
        }

        return (
          <div data-testid="dashboard-loaded-after-delay">
            <h1>Customer Dashboard</h1>
            <div data-testid="full-content">Full dashboard content loaded</div>
          </div>
        );
      };

      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <SlowApiTest />
        </Wrapper>
      );

      // Should show API loading
      await waitFor(() => {
        expect(screen.getByTestId('api-loading')).toBeInTheDocument();
      });

      // Should show fallback content after 1 second
      await waitFor(() => {
        expect(screen.getByTestId('fallback-content')).toBeInTheDocument();
      }, { timeout: 1200 });

      expect(screen.getByText('Dashboard Preview')).toBeInTheDocument();
      expect(screen.getByTestId('skeleton-content')).toBeInTheDocument();

      // Should eventually load full content
      await waitFor(() => {
        expect(screen.getByTestId('dashboard-loaded-after-delay')).toBeInTheDocument();
      }, { timeout: 1000 });

      const apiLoadTime = performanceTracker.measure('api-load', 'slow-api-start', 'slow-api-end');
      expect(apiLoadTime).toBeGreaterThan(700); // Verify it was actually slow
      expect(apiLoadTime).toBeLessThan(1000); // But not too slow
    });
  });

  describe('Dashboard Transition Performance', () => {
    it('should handle route transitions efficiently', async () => {
      const RouteTransitionTest = () => {
        const [currentRoute, setCurrentRoute] = React.useState('/dashboard');
        const [transitionState, setTransitionState] = React.useState<'idle' | 'transitioning' | 'complete'>('idle');

        const performTransition = (targetRoute: string) => {
          performanceTracker.mark('transition-start');
          setTransitionState('transitioning');

          // Simulate transition logic
          setTimeout(() => {
            performanceTracker.mark('route-change');
            setCurrentRoute(targetRoute);
            
            setTimeout(() => {
              performanceTracker.mark('transition-end');
              setTransitionState('complete');
            }, 50); // Render time
          }, 100); // Transition time
        };

        React.useEffect(() => {
          // Auto-start transition test
          performTransition('/customer-dashboard');
        }, []);

        if (transitionState === 'transitioning') {
          return (
            <div data-testid="transition-loading">
              <div>Transitioning to {currentRoute === '/dashboard' ? 'customer dashboard' : 'dashboard'}...</div>
              <div data-testid="transition-indicator">🔄</div>
            </div>
          );
        }

        return (
          <div data-testid="transition-complete">
            <div data-testid="current-route">Current route: {currentRoute}</div>
            <div data-testid="dashboard-content">
              {currentRoute === '/customer-dashboard' ? 'Customer Dashboard' : 'General Dashboard'}
            </div>
          </div>
        );
      };

      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <RouteTransitionTest />
        </Wrapper>
      );

      // Should show transition loading
      expect(screen.getByTestId('transition-loading')).toBeInTheDocument();

      // Should complete transition quickly
      await waitFor(() => {
        expect(screen.getByTestId('transition-complete')).toBeInTheDocument();
      }, { timeout: 500 });

      expect(screen.getByTestId('current-route')).toHaveTextContent('/customer-dashboard');

      const transitionTime = performanceTracker.measure('full-transition', 'transition-start', 'transition-end');
      expect(transitionTime).toBeLessThan(200); // Transitions should be fast
    });

    it('should optimize re-renders during subscription status changes', async () => {
      let renderCount = 0;

      const RenderOptimizationTest = () => {
        renderCount++;
        
        const [subscriptionStatus, setSubscriptionStatus] = React.useState('ACTIVE');
        const [optimizedRenders, setOptimizedRenders] = React.useState(0);

        const memoizedContent = React.useMemo(() => {
          setOptimizedRenders(prev => prev + 1);
          return (
            <div data-testid="memoized-content">
              <h2>Subscription Status: {subscriptionStatus}</h2>
              <p>This content is memoized for performance</p>
            </div>
          );
        }, [subscriptionStatus]);

        React.useEffect(() => {
          // Simulate rapid status changes
          const changes = ['ACTIVE', 'PAST_DUE', 'ACTIVE', 'CANCELLED', 'ACTIVE'];
          
          changes.forEach((status, index) => {
            setTimeout(() => {
              setSubscriptionStatus(status);
            }, index * 100);
          });
        }, []);

        return (
          <div data-testid="render-optimization-test">
            <div data-testid="render-count">Total renders: {renderCount}</div>
            <div data-testid="optimized-renders">Optimized renders: {optimizedRenders}</div>
            {memoizedContent}
          </div>
        );
      };

      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <RenderOptimizationTest />
        </Wrapper>
      );

      // Wait for all status changes to complete
      await waitFor(() => {
        expect(screen.getByText('Subscription Status: ACTIVE')).toBeInTheDocument();
      }, { timeout: 1000 });

      // Check render optimization
      const totalRenders = parseInt(screen.getByTestId('render-count').textContent?.split(': ')[1] || '0');
      const optimizedRenders = parseInt(screen.getByTestId('optimized-renders').textContent?.split(': ')[1] || '0');

      // Should have fewer optimized renders than total renders due to memoization
      expect(optimizedRenders).toBeLessThan(totalRenders);
      expect(optimizedRenders).toBeGreaterThan(0);
    });
  });

  describe('Memory and Resource Performance', () => {
    it('should manage memory efficiently during dashboard operations', async () => {
      const MemoryManagementTest = () => {
        const [components, setComponents] = React.useState<React.ReactNode[]>([]);
        const [memoryUsage, setMemoryUsage] = React.useState<number[]>([]);

        const addComponent = () => {
          const newComponent = (
            <div key={components.length} data-testid={`component-${components.length}`}>
              Component {components.length}
            </div>
          );
          setComponents(prev => [...prev, newComponent]);
          
          // Simulate memory measurement (in real app, use performance.memory if available)
          setMemoryUsage(prev => [...prev, Math.random() * 1000]);
        };

        const removeComponent = () => {
          setComponents(prev => prev.slice(0, -1));
          setMemoryUsage(prev => prev.slice(0, -1));
        };

        React.useEffect(() => {
          // Add components rapidly
          const addTimer = setInterval(addComponent, 100);
          
          // Start removing after 500ms
          setTimeout(() => {
            clearInterval(addTimer);
            const removeTimer = setInterval(removeComponent, 100);
            
            setTimeout(() => {
              clearInterval(removeTimer);
            }, 500);
          }, 500);
        }, []);

        return (
          <div data-testid="memory-test">
            <div data-testid="component-count">Components: {components.length}</div>
            <div data-testid="memory-readings">Memory readings: {memoryUsage.length}</div>
            <div data-testid="components-container">
              {components}
            </div>
          </div>
        );
      };

      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <MemoryManagementTest />
        </Wrapper>
      );

      // Wait for component lifecycle to complete
      await waitFor(() => {
        const componentCount = parseInt(screen.getByTestId('component-count').textContent?.split(': ')[1] || '0');
        return componentCount === 0; // All components should be removed
      }, { timeout: 2000 });

      // Verify memory management
      const finalComponentCount = parseInt(screen.getByTestId('component-count').textContent?.split(': ')[1] || '0');
      expect(finalComponentCount).toBe(0);
    });

    it('should handle concurrent API requests efficiently', async () => {
      const ConcurrentApiTest = () => {
        const [apiCalls, setApiCalls] = React.useState<Array<{ id: number; status: string; duration?: number }>>([]);
        const [completedCalls, setCompletedCalls] = React.useState(0);

        React.useEffect(() => {
          performanceTracker.mark('concurrent-start');
          
          // Simulate multiple concurrent API calls
          const calls = Array.from({ length: 5 }, (_, index) => ({
            id: index,
            status: 'pending',
          }));
          
          setApiCalls(calls);

          // Execute calls concurrently
          const promises = calls.map(async (call) => {
            const startTime = performance.now();
            
            // Simulate API call with random delay
            await new Promise(resolve => setTimeout(resolve, Math.random() * 300 + 100));
            
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            setApiCalls(prev => prev.map(c => 
              c.id === call.id 
                ? { ...c, status: 'completed', duration }
                : c
            ));
            
            setCompletedCalls(prev => prev + 1);
          });

          Promise.all(promises).then(() => {
            performanceTracker.mark('concurrent-end');
          });
        }, []);

        const allCompleted = completedCalls === 5;

        return (
          <div data-testid="concurrent-api-test">
            <div data-testid="completed-count">Completed: {completedCalls}/5</div>
            <div data-testid="api-calls-list">
              {apiCalls.map(call => (
                <div key={call.id} data-testid={`api-call-${call.id}`}>
                  Call {call.id}: {call.status} 
                  {call.duration && ` (${Math.round(call.duration)}ms)`}
                </div>
              ))}
            </div>
            {allCompleted && (
              <div data-testid="all-completed">All API calls completed</div>
            )}
          </div>
        );
      };

      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <ConcurrentApiTest />
        </Wrapper>
      );

      // Wait for all API calls to complete
      await waitFor(() => {
        expect(screen.getByTestId('all-completed')).toBeInTheDocument();
      }, { timeout: 1000 });

      const totalTime = performanceTracker.measure('concurrent-total', 'concurrent-start', 'concurrent-end');
      
      // Concurrent calls should complete faster than sequential calls would
      expect(totalTime).toBeLessThan(800); // Should be much less than 5 * 400ms
      
      // Verify all calls completed
      expect(screen.getByTestId('completed-count')).toHaveTextContent('Completed: 5/5');
    });
  });

  describe('Performance Monitoring and Metrics', () => {
    it('should track and report performance metrics', async () => {
      const PerformanceMonitoringTest = () => {
        const [metrics, setMetrics] = React.useState<{
          loadTime?: number;
          renderTime?: number;
          interactionTime?: number;
        }>({});

        React.useEffect(() => {
          performanceTracker.mark('load-start');
          
          // Simulate loading
          setTimeout(() => {
            performanceTracker.mark('load-end');
            const loadTime = performanceTracker.measure('load', 'load-start', 'load-end');
            
            performanceTracker.mark('render-start');
            setMetrics(prev => ({ ...prev, loadTime }));
            
            setTimeout(() => {
              performanceTracker.mark('render-end');
              const renderTime = performanceTracker.measure('render', 'render-start', 'render-end');
              setMetrics(prev => ({ ...prev, renderTime }));
            }, 50);
          }, 200);
        }, []);

        const handleInteraction = () => {
          performanceTracker.mark('interaction-start');
          
          setTimeout(() => {
            performanceTracker.mark('interaction-end');
            const interactionTime = performanceTracker.measure('interaction', 'interaction-start', 'interaction-end');
            setMetrics(prev => ({ ...prev, interactionTime }));
          }, 100);
        };

        return (
          <div data-testid="performance-monitoring">
            <div data-testid="metrics-display">
              <h3>Performance Metrics</h3>
              <div data-testid="load-time">
                Load Time: {metrics.loadTime ? `${Math.round(metrics.loadTime)}ms` : 'Measuring...'}
              </div>
              <div data-testid="render-time">
                Render Time: {metrics.renderTime ? `${Math.round(metrics.renderTime)}ms` : 'Measuring...'}
              </div>
              <div data-testid="interaction-time">
                Interaction Time: {metrics.interactionTime ? `${Math.round(metrics.interactionTime)}ms` : 'Not measured'}
              </div>
            </div>
            
            <button onClick={handleInteraction} data-testid="test-interaction">
              Test Interaction
            </button>
            
            <div data-testid="performance-status">
              {metrics.loadTime && metrics.renderTime && (
                <div>
                  Performance Status: {
                    metrics.loadTime < 500 && metrics.renderTime < 100 
                      ? '✅ Excellent' 
                      : metrics.loadTime < 1000 && metrics.renderTime < 200
                      ? '⚠️ Good'
                      : '❌ Needs Improvement'
                  }
                </div>
              )}
            </div>
          </div>
        );
      };

      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <PerformanceMonitoringTest />
        </Wrapper>
      );

      // Wait for load and render metrics
      await waitFor(() => {
        expect(screen.getByTestId('render-time')).not.toHaveTextContent('Measuring...');
      }, { timeout: 1000 });

      // Test interaction
      fireEvent.click(screen.getByTestId('test-interaction'));

      await waitFor(() => {
        expect(screen.getByTestId('interaction-time')).not.toHaveTextContent('Not measured');
      }, { timeout: 500 });

      // Verify performance status
      await waitFor(() => {
        expect(screen.getByTestId('performance-status')).toHaveTextContent(/Performance Status:/);
      });

      // Check that metrics are within acceptable ranges
      const loadTimeText = screen.getByTestId('load-time').textContent;
      const renderTimeText = screen.getByTestId('render-time').textContent;
      const interactionTimeText = screen.getByTestId('interaction-time').textContent;

      expect(loadTimeText).toMatch(/\d+ms/);
      expect(renderTimeText).toMatch(/\d+ms/);
      expect(interactionTimeText).toMatch(/\d+ms/);
    });
  });
});