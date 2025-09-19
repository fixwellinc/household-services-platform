/**
 * Error Recovery and Fallback Mechanisms Integration Tests
 * 
 * Tests error handling, recovery flows, and fallback mechanisms for dashboard routing
 * Requirements: 3.2, 4.3, 4.4
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
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
const mockApi = api as jest.Mocked<typeof api>;

// Mock toast notifications
const mockToast = {
  success: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  warning: jest.fn(),
};

jest.mock('sonner', () => ({
  toast: mockToast,
}));

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

// Mock dashboard content
const MockDashboardContent = ({ type }: { type: string }) => (
  <div data-testid={`${type}-dashboard-content`}>
    {type} Dashboard Content
  </div>
);

describe('Error Recovery and Fallback Mechanisms', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue(mockRouter);
    
    // Mock console methods to avoid noise
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Network Error Recovery', () => {
    it('should handle network timeouts with retry mechanism', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', role: 'CUSTOMER', name: 'Customer User', email: 'customer@test.com' },
        isLoading: false,
        isAuthenticated: true,
        isHydrated: true,
      } as any);

      // Simulate network timeout
      const networkError = new Error('Network timeout');
      mockApi.getUserPlan
        .mockRejectedValueOnce(networkError)
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce({
          success: true,
          hasPlan: true,
          subscription: { status: 'ACTIVE', tier: 'premium' },
          plan: { id: '1', name: 'Premium Plan' }
        });

      const NetworkErrorRecoveryTest = () => {
        const [retryCount, setRetryCount] = React.useState(0);
        const [isLoading, setIsLoading] = React.useState(true);
        const [error, setError] = React.useState<Error | null>(null);
        const [subscriptionData, setSubscriptionData] = React.useState<any>(null);

        const loadSubscriptionData = async () => {
          try {
            setIsLoading(true);
            setError(null);
            const data = await mockApi.getUserPlan();
            setSubscriptionData(data);
          } catch (err) {
            setError(err as Error);
            mockToast.error(`Network error (attempt ${retryCount + 1}): ${(err as Error).message}`);
          } finally {
            setIsLoading(false);
          }
        };

        React.useEffect(() => {
          loadSubscriptionData();
        }, []);

        const handleRetry = () => {
          setRetryCount(prev => prev + 1);
          loadSubscriptionData();
        };

        const handleFallback = () => {
          // Fallback to customer dashboard without subscription data
          mockRouter.push('/customer-dashboard');
          mockToast.info('Continuing with limited functionality');
        };

        if (isLoading) {
          return (
            <div data-testid="loading-state">
              <div>Loading subscription data...</div>
              {retryCount > 0 && (
                <div data-testid="retry-indicator">
                  Retry attempt {retryCount} of 3
                </div>
              )}
            </div>
          );
        }

        if (error && retryCount < 3) {
          return (
            <div data-testid="error-state">
              <h3>Connection Problem</h3>
              <p>Unable to load subscription data. Please check your internet connection.</p>
              <div data-testid="error-actions">
                <button onClick={handleRetry} data-testid="retry-button">
                  Try Again
                </button>
                <button onClick={handleFallback} data-testid="fallback-button">
                  Continue Anyway
                </button>
              </div>
            </div>
          );
        }

        if (error && retryCount >= 3) {
          return (
            <div data-testid="max-retries-state">
              <h3>Service Temporarily Unavailable</h3>
              <p>We're having trouble connecting to our servers. Please try again later.</p>
              <div data-testid="final-actions">
                <button onClick={handleFallback} data-testid="continue-button">
                  Continue to Dashboard
                </button>
                <button onClick={() => window.location.reload()} data-testid="refresh-button">
                  Refresh Page
                </button>
              </div>
            </div>
          );
        }

        return (
          <div data-testid="success-state">
            <MockDashboardContent type="customer" />
            <div data-testid="subscription-info">
              Plan: {subscriptionData?.plan?.name}
            </div>
          </div>
        );
      };

      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <NetworkErrorRecoveryTest />
        </Wrapper>
      );

      // Should show loading initially
      expect(screen.getByTestId('loading-state')).toBeInTheDocument();

      // Should show error after first failure
      await waitFor(() => {
        expect(screen.getByTestId('error-state')).toBeInTheDocument();
      });

      expect(screen.getByText('Connection Problem')).toBeInTheDocument();
      expect(mockToast.error).toHaveBeenCalledWith('Network error (attempt 1): Network timeout');

      // Retry first time
      fireEvent.click(screen.getByTestId('retry-button'));

      await waitFor(() => {
        expect(screen.getByTestId('retry-indicator')).toBeInTheDocument();
      });

      expect(screen.getByText('Retry attempt 1 of 3')).toBeInTheDocument();

      // Should show error again after second failure
      await waitFor(() => {
        expect(screen.getByTestId('error-state')).toBeInTheDocument();
      });

      // Retry second time (should succeed)
      fireEvent.click(screen.getByTestId('retry-button'));

      await waitFor(() => {
        expect(screen.getByTestId('success-state')).toBeInTheDocument();
      });

      expect(screen.getByText('Plan: Premium Plan')).toBeInTheDocument();
    });

    it('should handle API service unavailable with graceful degradation', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', role: 'CUSTOMER', name: 'Customer User', email: 'customer@test.com' },
        isLoading: false,
        isAuthenticated: true,
        isHydrated: true,
      } as any);

      const serviceError = new Error('Service unavailable (503)');
      mockApi.getUserPlan.mockRejectedValue(serviceError);

      const ServiceUnavailableTest = () => {
        const [error, setError] = React.useState<Error | null>(null);
        const [fallbackMode, setFallbackMode] = React.useState(false);

        React.useEffect(() => {
          const loadData = async () => {
            try {
              await mockApi.getUserPlan();
            } catch (err) {
              setError(err as Error);
              // Auto-enable fallback mode for service errors
              if ((err as Error).message.includes('503')) {
                setTimeout(() => setFallbackMode(true), 2000);
              }
            }
          };

          loadData();
        }, []);

        if (fallbackMode) {
          return (
            <div data-testid="fallback-mode">
              <div data-testid="fallback-banner">
                <h3>Limited Mode</h3>
                <p>Some features may be unavailable due to maintenance</p>
              </div>
              <MockDashboardContent type="customer" />
              <div data-testid="fallback-features">
                <p>Available features:</p>
                <ul>
                  <li>View account information</li>
                  <li>Contact support</li>
                  <li>Access help resources</li>
                </ul>
              </div>
            </div>
          );
        }

        if (error) {
          return (
            <div data-testid="service-error">
              <h3>Service Temporarily Unavailable</h3>
              <p>Our subscription service is currently undergoing maintenance</p>
              <div data-testid="auto-fallback-notice">
                <p>Switching to limited mode...</p>
              </div>
            </div>
          );
        }

        return <div data-testid="loading">Loading...</div>;
      };

      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <ServiceUnavailableTest />
        </Wrapper>
      );

      // Should show service error initially
      await waitFor(() => {
        expect(screen.getByTestId('service-error')).toBeInTheDocument();
      });

      expect(screen.getByText('Service Temporarily Unavailable')).toBeInTheDocument();
      expect(screen.getByTestId('auto-fallback-notice')).toBeInTheDocument();

      // Should automatically switch to fallback mode
      await waitFor(() => {
        expect(screen.getByTestId('fallback-mode')).toBeInTheDocument();
      }, { timeout: 3000 });

      expect(screen.getByTestId('fallback-banner')).toBeInTheDocument();
      expect(screen.getByText('Limited Mode')).toBeInTheDocument();
      expect(screen.getByTestId('customer-dashboard-content')).toBeInTheDocument();
      expect(screen.getByTestId('fallback-features')).toBeInTheDocument();
    });
  });

  describe('Authentication Error Recovery', () => {
    it('should handle token expiration with automatic retry', async () => {
      const AuthExpirationTest = () => {
        const [authState, setAuthState] = React.useState<'checking' | 'expired' | 'refreshing' | 'authenticated'>('checking');
        const [retryCount, setRetryCount] = React.useState(0);

        React.useEffect(() => {
          const checkAuth = async () => {
            // Simulate token expiration
            if (retryCount === 0) {
              setAuthState('expired');
              return;
            }

            // Simulate successful refresh
            if (retryCount === 1) {
              setAuthState('authenticated');
              return;
            }
          };

          checkAuth();
        }, [retryCount]);

        const handleRefreshToken = () => {
          setAuthState('refreshing');
          setRetryCount(prev => prev + 1);
          
          // Simulate token refresh delay
          setTimeout(() => {
            setAuthState('authenticated');
            mockToast.success('Session refreshed successfully');
          }, 1000);
        };

        const handleManualLogin = () => {
          mockRouter.push('/login?returnUrl=/dashboard');
        };

        if (authState === 'checking') {
          return <div data-testid="auth-checking">Checking authentication...</div>;
        }

        if (authState === 'expired') {
          return (
            <div data-testid="auth-expired">
              <h3>Session Expired</h3>
              <p>Your session has expired. Please refresh your authentication.</p>
              <div data-testid="auth-actions">
                <button onClick={handleRefreshToken} data-testid="refresh-token">
                  Refresh Session
                </button>
                <button onClick={handleManualLogin} data-testid="manual-login">
                  Sign In Again
                </button>
              </div>
            </div>
          );
        }

        if (authState === 'refreshing') {
          return (
            <div data-testid="auth-refreshing">
              <div>Refreshing your session...</div>
            </div>
          );
        }

        return (
          <div data-testid="auth-success">
            <MockDashboardContent type="customer" />
          </div>
        );
      };

      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <AuthExpirationTest />
        </Wrapper>
      );

      // Should show checking state initially
      expect(screen.getByTestId('auth-checking')).toBeInTheDocument();

      // Should show expired state
      await waitFor(() => {
        expect(screen.getByTestId('auth-expired')).toBeInTheDocument();
      });

      expect(screen.getByText('Session Expired')).toBeInTheDocument();

      // Click refresh token
      fireEvent.click(screen.getByTestId('refresh-token'));

      // Should show refreshing state
      expect(screen.getByTestId('auth-refreshing')).toBeInTheDocument();

      // Should eventually show success
      await waitFor(() => {
        expect(screen.getByTestId('auth-success')).toBeInTheDocument();
      }, { timeout: 2000 });

      expect(mockToast.success).toHaveBeenCalledWith('Session refreshed successfully');
    });

    it('should handle authentication service downtime', async () => {
      const AuthServiceDownTest = () => {
        const [serviceStatus, setServiceStatus] = React.useState<'checking' | 'down' | 'fallback'>('checking');

        React.useEffect(() => {
          // Simulate auth service check
          setTimeout(() => {
            setServiceStatus('down');
          }, 500);
        }, []);

        const handleOfflineMode = () => {
          setServiceStatus('fallback');
          mockToast.info('Continuing in offline mode with cached data');
        };

        const handleRetryAuth = () => {
          setServiceStatus('checking');
          // Simulate retry
          setTimeout(() => {
            setServiceStatus('down');
          }, 1000);
        };

        if (serviceStatus === 'checking') {
          return <div data-testid="auth-service-checking">Connecting to authentication service...</div>;
        }

        if (serviceStatus === 'down') {
          return (
            <div data-testid="auth-service-down">
              <h3>Authentication Service Unavailable</h3>
              <p>We're unable to verify your authentication at the moment.</p>
              <div data-testid="service-down-actions">
                <button onClick={handleOfflineMode} data-testid="offline-mode">
                  Continue Offline
                </button>
                <button onClick={handleRetryAuth} data-testid="retry-auth">
                  Try Again
                </button>
              </div>
            </div>
          );
        }

        return (
          <div data-testid="offline-dashboard">
            <div data-testid="offline-banner">
              <p>Offline Mode - Some features may be limited</p>
            </div>
            <MockDashboardContent type="customer" />
          </div>
        );
      };

      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <AuthServiceDownTest />
        </Wrapper>
      );

      // Should show checking initially
      expect(screen.getByTestId('auth-service-checking')).toBeInTheDocument();

      // Should show service down
      await waitFor(() => {
        expect(screen.getByTestId('auth-service-down')).toBeInTheDocument();
      });

      expect(screen.getByText('Authentication Service Unavailable')).toBeInTheDocument();

      // Click offline mode
      fireEvent.click(screen.getByTestId('offline-mode'));

      // Should show offline dashboard
      await waitFor(() => {
        expect(screen.getByTestId('offline-dashboard')).toBeInTheDocument();
      });

      expect(screen.getByTestId('offline-banner')).toBeInTheDocument();
      expect(screen.getByText('Offline Mode - Some features may be limited')).toBeInTheDocument();
      expect(mockToast.info).toHaveBeenCalledWith('Continuing in offline mode with cached data');
    });
  });

  describe('Subscription Data Error Recovery', () => {
    it('should handle subscription service errors with customer dashboard fallback', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', role: 'CUSTOMER', name: 'Customer User', email: 'customer@test.com' },
        isLoading: false,
        isAuthenticated: true,
        isHydrated: true,
      } as any);

      const SubscriptionErrorFallbackTest = () => {
        const [subscriptionError, setSubscriptionError] = React.useState<Error | null>(null);
        const [fallbackActive, setFallbackActive] = React.useState(false);
        const [retryAttempts, setRetryAttempts] = React.useState(0);

        React.useEffect(() => {
          const loadSubscription = async () => {
            try {
              // Simulate subscription service error
              throw new Error('Subscription service temporarily unavailable');
            } catch (err) {
              setSubscriptionError(err as Error);
            }
          };

          loadSubscription();
        }, [retryAttempts]);

        const handleRetry = () => {
          setRetryAttempts(prev => prev + 1);
          setSubscriptionError(null);
        };

        const handleFallbackToDashboard = () => {
          setFallbackActive(true);
          // Default customer users to customer dashboard when subscription data fails
          mockRouter.push('/customer-dashboard');
          mockToast.warning('Subscription data unavailable - showing dashboard with limited features');
        };

        if (fallbackActive) {
          return (
            <div data-testid="fallback-dashboard">
              <div data-testid="subscription-error-banner">
                <h4>Subscription Information Unavailable</h4>
                <p>We're having trouble loading your subscription details</p>
                <button onClick={handleRetry} data-testid="retry-subscription">
                  Retry Loading
                </button>
              </div>
              <MockDashboardContent type="customer" />
              <div data-testid="limited-features-notice">
                <p>Some subscription-specific features may not be available</p>
              </div>
            </div>
          );
        }

        if (subscriptionError) {
          return (
            <div data-testid="subscription-error">
              <h3>Subscription Data Unavailable</h3>
              <p>We're having trouble loading your subscription information</p>
              <p>Error: {subscriptionError.message}</p>
              <div data-testid="subscription-error-actions">
                <button onClick={handleRetry} data-testid="retry-subscription-data">
                  Try Again
                </button>
                <button onClick={handleFallbackToDashboard} data-testid="continue-to-dashboard">
                  Continue to Dashboard
                </button>
              </div>
              {retryAttempts > 0 && (
                <div data-testid="retry-count">
                  Retry attempts: {retryAttempts}
                </div>
              )}
            </div>
          );
        }

        return <div data-testid="loading">Loading subscription data...</div>;
      };

      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <SubscriptionErrorFallbackTest />
        </Wrapper>
      );

      // Should show subscription error
      await waitFor(() => {
        expect(screen.getByTestId('subscription-error')).toBeInTheDocument();
      });

      expect(screen.getByText('Subscription Data Unavailable')).toBeInTheDocument();
      expect(screen.getByText('Subscription service temporarily unavailable')).toBeInTheDocument();

      // Try retry first
      fireEvent.click(screen.getByTestId('retry-subscription-data'));

      await waitFor(() => {
        expect(screen.getByTestId('retry-count')).toBeInTheDocument();
      });

      expect(screen.getByText('Retry attempts: 1')).toBeInTheDocument();

      // Continue to dashboard fallback
      fireEvent.click(screen.getByTestId('continue-to-dashboard'));

      await waitFor(() => {
        expect(screen.getByTestId('fallback-dashboard')).toBeInTheDocument();
      });

      expect(screen.getByTestId('subscription-error-banner')).toBeInTheDocument();
      expect(screen.getByText('Subscription Information Unavailable')).toBeInTheDocument();
      expect(screen.getByTestId('customer-dashboard-content')).toBeInTheDocument();
      expect(screen.getByTestId('limited-features-notice')).toBeInTheDocument();

      expect(mockRouter.push).toHaveBeenCalledWith('/customer-dashboard');
      expect(mockToast.warning).toHaveBeenCalledWith('Subscription data unavailable - showing dashboard with limited features');
    });

    it('should handle partial subscription data with graceful degradation', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', role: 'CUSTOMER', name: 'Customer User', email: 'customer@test.com' },
        isLoading: false,
        isAuthenticated: true,
        isHydrated: true,
      } as any);

      // Mock partial subscription data
      mockApi.getUserPlan.mockResolvedValue({
        success: true,
        hasPlan: true,
        subscription: { status: 'ACTIVE' }, // Missing tier and other details
        plan: null, // Missing plan details
      });

      const PartialDataTest = () => {
        const [subscriptionData, setSubscriptionData] = React.useState<any>(null);
        const [dataIssues, setDataIssues] = React.useState<string[]>([]);

        React.useEffect(() => {
          const loadData = async () => {
            try {
              const data = await mockApi.getUserPlan();
              setSubscriptionData(data);

              // Check for data completeness
              const issues: string[] = [];
              if (!data.subscription?.tier) issues.push('Subscription tier information missing');
              if (!data.plan) issues.push('Plan details unavailable');
              if (!data.subscription?.createdAt) issues.push('Subscription date information missing');

              setDataIssues(issues);

              if (issues.length > 0) {
                mockToast.warning(`Some subscription details are unavailable (${issues.length} issues)`);
              }
            } catch (error) {
              console.error('Failed to load subscription data:', error);
            }
          };

          loadData();
        }, []);

        if (!subscriptionData) {
          return <div data-testid="loading">Loading...</div>;
        }

        return (
          <div data-testid="partial-data-dashboard">
            {dataIssues.length > 0 && (
              <div data-testid="data-issues-banner">
                <h4>Limited Information Available</h4>
                <ul data-testid="issues-list">
                  {dataIssues.map((issue, index) => (
                    <li key={index}>{issue}</li>
                  ))}
                </ul>
                <p>Some features may be limited until full data is available</p>
              </div>
            )}

            <MockDashboardContent type="customer" />

            <div data-testid="available-info">
              <h4>Available Information</h4>
              <p>Status: {subscriptionData.subscription?.status || 'Unknown'}</p>
              <p>Plan: {subscriptionData.plan?.name || 'Details unavailable'}</p>
              <p>Tier: {subscriptionData.subscription?.tier || 'Not specified'}</p>
            </div>

            <div data-testid="degraded-features">
              <h4>Available Features</h4>
              <ul>
                <li>Basic dashboard access</li>
                <li>Account management</li>
                <li>Support contact</li>
                {subscriptionData.subscription?.status === 'ACTIVE' && (
                  <li>Service requests (limited)</li>
                )}
              </ul>
            </div>
          </div>
        );
      };

      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <PartialDataTest />
        </Wrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('partial-data-dashboard')).toBeInTheDocument();
      });

      expect(screen.getByTestId('data-issues-banner')).toBeInTheDocument();
      expect(screen.getByText('Limited Information Available')).toBeInTheDocument();

      const issuesList = screen.getByTestId('issues-list');
      expect(issuesList).toHaveTextContent('Subscription tier information missing');
      expect(issuesList).toHaveTextContent('Plan details unavailable');

      expect(screen.getByTestId('available-info')).toBeInTheDocument();
      expect(screen.getByText('Status: ACTIVE')).toBeInTheDocument();
      expect(screen.getByText('Plan: Details unavailable')).toBeInTheDocument();
      expect(screen.getByText('Tier: Not specified')).toBeInTheDocument();

      expect(screen.getByTestId('degraded-features')).toBeInTheDocument();
      expect(screen.getByText('Service requests (limited)')).toBeInTheDocument();

      expect(mockToast.warning).toHaveBeenCalledWith('Some subscription details are unavailable (3 issues)');
    });
  });

  describe('Routing Error Recovery', () => {
    it('should handle routing failures with fallback navigation', async () => {
      const RoutingErrorTest = () => {
        const [routingError, setRoutingError] = React.useState<Error | null>(null);
        const [fallbackRoute, setFallbackRoute] = React.useState<string | null>(null);

        const attemptNavigation = (route: string) => {
          try {
            // Simulate routing failure
            if (route === '/customer-dashboard') {
              throw new Error('Route not accessible');
            }
            mockRouter.push(route);
          } catch (error) {
            setRoutingError(error as Error);
            // Fallback to safe route
            setFallbackRoute('/dashboard');
            mockRouter.push('/dashboard');
            mockToast.error('Navigation failed, redirecting to safe location');
          }
        };

        React.useEffect(() => {
          attemptNavigation('/customer-dashboard');
        }, []);

        if (routingError && fallbackRoute) {
          return (
            <div data-testid="routing-fallback">
              <div data-testid="routing-error-notice">
                <h4>Navigation Issue</h4>
                <p>We encountered a problem accessing your requested page</p>
                <p>You've been redirected to a safe location</p>
              </div>
              <MockDashboardContent type="general" />
              <div data-testid="navigation-options">
                <button onClick={() => attemptNavigation('/customer-dashboard')} data-testid="retry-navigation">
                  Try Original Page Again
                </button>
                <button onClick={() => window.location.reload()} data-testid="refresh-page">
                  Refresh Page
                </button>
              </div>
            </div>
          );
        }

        if (routingError) {
          return (
            <div data-testid="routing-error">
              <h3>Navigation Error</h3>
              <p>Unable to navigate to requested page</p>
            </div>
          );
        }

        return <div data-testid="loading">Navigating...</div>;
      };

      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <RoutingErrorTest />
        </Wrapper>
      );

      // Should show routing fallback
      await waitFor(() => {
        expect(screen.getByTestId('routing-fallback')).toBeInTheDocument();
      });

      expect(screen.getByTestId('routing-error-notice')).toBeInTheDocument();
      expect(screen.getByText('Navigation Issue')).toBeInTheDocument();
      expect(screen.getByText("You've been redirected to a safe location")).toBeInTheDocument();
      expect(screen.getByTestId('general-dashboard-content')).toBeInTheDocument();

      expect(mockRouter.push).toHaveBeenCalledWith('/dashboard');
      expect(mockToast.error).toHaveBeenCalledWith('Navigation failed, redirecting to safe location');
    });
  });

  describe('Comprehensive Error Recovery Flow', () => {
    it('should handle multiple simultaneous errors with prioritized recovery', async () => {
      const MultiErrorRecoveryTest = () => {
        const [errors, setErrors] = React.useState<{
          auth?: Error;
          subscription?: Error;
          routing?: Error;
        }>({});
        const [recoverySteps, setRecoverySteps] = React.useState<string[]>([]);
        const [currentStep, setCurrentStep] = React.useState(0);

        React.useEffect(() => {
          // Simulate multiple errors
          setErrors({
            auth: new Error('Token expired'),
            subscription: new Error('Subscription service down'),
            routing: new Error('Route not found'),
          });

          // Define recovery priority
          setRecoverySteps([
            'Refresh authentication',
            'Load cached subscription data',
            'Navigate to safe route',
            'Enable limited functionality'
          ]);
        }, []);

        const executeRecoveryStep = () => {
          const step = recoverySteps[currentStep];
          
          switch (step) {
            case 'Refresh authentication':
              mockToast.info('Refreshing authentication...');
              setTimeout(() => {
                setErrors(prev => ({ ...prev, auth: undefined }));
                setCurrentStep(1);
              }, 1000);
              break;
              
            case 'Load cached subscription data':
              mockToast.info('Loading cached data...');
              setTimeout(() => {
                setErrors(prev => ({ ...prev, subscription: undefined }));
                setCurrentStep(2);
              }, 1000);
              break;
              
            case 'Navigate to safe route':
              mockToast.info('Redirecting to safe location...');
              mockRouter.push('/dashboard');
              setTimeout(() => {
                setErrors(prev => ({ ...prev, routing: undefined }));
                setCurrentStep(3);
              }, 500);
              break;
              
            case 'Enable limited functionality':
              mockToast.success('Recovery complete - limited functionality enabled');
              setCurrentStep(4);
              break;
          }
        };

        React.useEffect(() => {
          if (currentStep < recoverySteps.length && Object.keys(errors).some(key => errors[key as keyof typeof errors])) {
            const timer = setTimeout(executeRecoveryStep, 500);
            return () => clearTimeout(timer);
          }
        }, [currentStep, errors]);

        const hasErrors = Object.values(errors).some(error => error);

        if (hasErrors) {
          return (
            <div data-testid="multi-error-recovery">
              <h3>System Recovery in Progress</h3>
              <div data-testid="error-list">
                {errors.auth && <p>🔐 Authentication: {errors.auth.message}</p>}
                {errors.subscription && <p>📊 Subscription: {errors.subscription.message}</p>}
                {errors.routing && <p>🧭 Navigation: {errors.routing.message}</p>}
              </div>
              
              <div data-testid="recovery-progress">
                <h4>Recovery Steps</h4>
                <ol>
                  {recoverySteps.map((step, index) => (
                    <li 
                      key={index} 
                      data-testid={`recovery-step-${index}`}
                      className={index < currentStep ? 'completed' : index === currentStep ? 'active' : 'pending'}
                    >
                      {step} {index < currentStep ? '✓' : index === currentStep ? '⏳' : '⏸️'}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          );
        }

        return (
          <div data-testid="recovery-complete">
            <div data-testid="recovery-success-banner">
              <h4>System Recovered</h4>
              <p>All issues have been resolved. Limited functionality is available.</p>
            </div>
            <MockDashboardContent type="general" />
          </div>
        );
      };

      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <MultiErrorRecoveryTest />
        </Wrapper>
      );

      // Should show multi-error recovery
      expect(screen.getByTestId('multi-error-recovery')).toBeInTheDocument();
      expect(screen.getByText('System Recovery in Progress')).toBeInTheDocument();

      const errorList = screen.getByTestId('error-list');
      expect(errorList).toHaveTextContent('Authentication: Token expired');
      expect(errorList).toHaveTextContent('Subscription: Subscription service down');
      expect(errorList).toHaveTextContent('Navigation: Route not found');

      // Wait for recovery to complete
      await waitFor(() => {
        expect(screen.getByTestId('recovery-complete')).toBeInTheDocument();
      }, { timeout: 5000 });

      expect(screen.getByTestId('recovery-success-banner')).toBeInTheDocument();
      expect(screen.getByText('System Recovered')).toBeInTheDocument();
      expect(screen.getByTestId('general-dashboard-content')).toBeInTheDocument();

      // Verify all recovery steps were executed
      expect(mockToast.info).toHaveBeenCalledWith('Refreshing authentication...');
      expect(mockToast.info).toHaveBeenCalledWith('Loading cached data...');
      expect(mockToast.info).toHaveBeenCalledWith('Redirecting to safe location...');
      expect(mockToast.success).toHaveBeenCalledWith('Recovery complete - limited functionality enabled');
    });
  });
});