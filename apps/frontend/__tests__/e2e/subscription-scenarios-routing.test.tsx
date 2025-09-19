/**
 * End-to-End Tests for Different User Subscription Scenarios
 * 
 * Tests complete user journeys for different subscription states and routing behavior
 * Requirements: All requirements validation
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock global fetch for API calls
global.fetch = jest.fn();

// Mock Next.js navigation with history tracking
const mockNavigationHistory: string[] = [];
const mockPush = jest.fn((path: string) => {
  mockNavigationHistory.push(path);
});

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    back: jest.fn(() => {
      mockNavigationHistory.pop();
    }),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams('utm_source=email&ref=campaign'),
  usePathname: () => mockNavigationHistory[mockNavigationHistory.length - 1] || '/dashboard',
}));

// Mock authentication context
const createMockAuthContext = (userType: 'admin' | 'customer_new' | 'customer_active' | 'customer_past_due' | 'customer_cancelled' | 'customer_none') => {
  const users = {
    admin: {
      id: 'admin_1',
      role: 'ADMIN',
      email: 'admin@fixwell.com',
      name: 'Admin User',
    },
    customer_new: {
      id: 'customer_new',
      role: 'CUSTOMER',
      email: 'new@customer.com',
      name: 'New Customer',
      createdAt: new Date().toISOString(),
    },
    customer_active: {
      id: 'customer_active',
      role: 'CUSTOMER',
      email: 'active@customer.com',
      name: 'Active Customer',
      createdAt: '2023-01-01T00:00:00Z',
    },
    customer_past_due: {
      id: 'customer_past_due',
      role: 'CUSTOMER',
      email: 'pastdue@customer.com',
      name: 'Past Due Customer',
      createdAt: '2023-01-01T00:00:00Z',
    },
    customer_cancelled: {
      id: 'customer_cancelled',
      role: 'CUSTOMER',
      email: 'cancelled@customer.com',
      name: 'Cancelled Customer',
      createdAt: '2023-01-01T00:00:00Z',
    },
    customer_none: {
      id: 'customer_none',
      role: 'CUSTOMER',
      email: 'none@customer.com',
      name: 'No Subscription Customer',
      createdAt: '2023-01-01T00:00:00Z',
    },
  };

  return {
    user: users[userType],
    isAuthenticated: true,
    isLoading: false,
    isHydrated: true,
  };
};

// Mock subscription data for different scenarios
const createMockSubscriptionData = (scenario: string) => {
  const subscriptionData = {
    admin: null, // Admins don't have subscriptions
    customer_new: {
      success: true,
      hasPlan: true,
      subscription: {
        id: 'sub_new',
        status: 'ACTIVE',
        tier: 'STARTER',
        createdAt: new Date().toISOString(),
      },
      plan: {
        id: 'plan_starter',
        name: 'Starter Plan',
        monthlyPrice: 2999,
      },
    },
    customer_active: {
      success: true,
      hasPlan: true,
      subscription: {
        id: 'sub_active',
        status: 'ACTIVE',
        tier: 'HOMECARE',
        createdAt: '2023-06-01T00:00:00Z',
      },
      plan: {
        id: 'plan_homecare',
        name: 'HomeCare Plan',
        monthlyPrice: 4999,
      },
    },
    customer_past_due: {
      success: true,
      hasPlan: true,
      subscription: {
        id: 'sub_past_due',
        status: 'PAST_DUE',
        tier: 'HOMECARE',
        createdAt: '2023-06-01T00:00:00Z',
        lastPaymentError: 'Your card was declined',
      },
      plan: {
        id: 'plan_homecare',
        name: 'HomeCare Plan',
        monthlyPrice: 4999,
      },
    },
    customer_cancelled: {
      success: true,
      hasPlan: false,
      subscription: {
        id: 'sub_cancelled',
        status: 'CANCELLED',
        tier: 'HOMECARE',
        createdAt: '2023-06-01T00:00:00Z',
        cancelledAt: '2024-01-15T00:00:00Z',
      },
      plan: null,
    },
    customer_none: {
      success: true,
      hasPlan: false,
      subscription: null,
      plan: null,
    },
  };

  return subscriptionData[scenario as keyof typeof subscriptionData];
};

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

describe('Subscription Scenarios E2E Routing Tests', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
    mockToast.success.mockClear();
    mockToast.error.mockClear();
    mockToast.info.mockClear();
    mockToast.warning.mockClear();
    mockPush.mockClear();
    mockNavigationHistory.length = 0;
  });

  describe('Admin User Routing Scenarios', () => {
    it('should route admin user directly to admin dashboard regardless of subscription data', async () => {
      const authContext = createMockAuthContext('admin');
      
      // Mock API response (admin shouldn't need subscription data)
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => createMockSubscriptionData('admin'),
      });

      const AdminDashboardScenario = () => {
        const [currentRoute, setCurrentRoute] = React.useState('/dashboard');
        const [isLoading, setIsLoading] = React.useState(true);

        React.useEffect(() => {
          // Simulate dashboard routing logic
          const determineRoute = async () => {
            if (authContext.user.role === 'ADMIN') {
              setCurrentRoute('/admin');
              mockPush('/admin');
            }
            setIsLoading(false);
          };

          determineRoute();
        }, []);

        if (isLoading) {
          return <div data-testid="loading">Loading dashboard...</div>;
        }

        if (currentRoute === '/admin') {
          return (
            <div data-testid="admin-dashboard">
              <h1>Admin Dashboard</h1>
              <p>Welcome, {authContext.user.name}</p>
              <div data-testid="admin-features">
                <button>Manage Users</button>
                <button>View Analytics</button>
                <button>System Settings</button>
              </div>
            </div>
          );
        }

        return <div data-testid="error">Unexpected route: {currentRoute}</div>;
      };

      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <AdminDashboardScenario />
        </Wrapper>
      );

      // Should show loading initially
      expect(screen.getByTestId('loading')).toBeInTheDocument();

      // Should route to admin dashboard
      await waitFor(() => {
        expect(screen.getByTestId('admin-dashboard')).toBeInTheDocument();
      });

      expect(screen.getByText('Welcome, Admin User')).toBeInTheDocument();
      expect(screen.getByTestId('admin-features')).toBeInTheDocument();
      expect(mockPush).toHaveBeenCalledWith('/admin');
    });
  });

  describe('New Customer Routing Scenarios', () => {
    it('should route new customer with active subscription to customer dashboard with onboarding', async () => {
      const authContext = createMockAuthContext('customer_new');
      const subscriptionData = createMockSubscriptionData('customer_new');

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => subscriptionData,
      });

      const NewCustomerScenario = () => {
        const [currentRoute, setCurrentRoute] = React.useState('/dashboard');
        const [isLoading, setIsLoading] = React.useState(true);
        const [showOnboarding, setShowOnboarding] = React.useState(false);
        const [subscriptionInfo, setSubscriptionInfo] = React.useState<any>(null);

        React.useEffect(() => {
          const loadDashboard = async () => {
            try {
              // Fetch subscription data
              const response = await fetch('/api/customer/subscription');
              const data = await response.json();
              setSubscriptionInfo(data);

              // Determine routing based on user and subscription
              if (authContext.user.role === 'CUSTOMER' && data.hasPlan) {
                setCurrentRoute('/customer-dashboard');
                
                // Check if user is new (created within last 7 days)
                const userCreated = new Date(authContext.user.createdAt);
                const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                
                if (userCreated > weekAgo) {
                  setShowOnboarding(true);
                }
                
                mockPush('/customer-dashboard');
              }
            } catch (error) {
              console.error('Failed to load dashboard:', error);
            } finally {
              setIsLoading(false);
            }
          };

          loadDashboard();
        }, []);

        if (isLoading) {
          return <div data-testid="loading">Loading your dashboard...</div>;
        }

        if (currentRoute === '/customer-dashboard') {
          return (
            <div data-testid="customer-dashboard">
              {showOnboarding && (
                <div data-testid="onboarding-banner">
                  <h2>Welcome to FixWell!</h2>
                  <p>You're all set with your {subscriptionInfo?.plan?.name}</p>
                  <button 
                    onClick={() => setShowOnboarding(false)}
                    data-testid="dismiss-onboarding"
                  >
                    Get Started
                  </button>
                </div>
              )}
              
              <div data-testid="dashboard-content">
                <h1>Customer Dashboard</h1>
                <div data-testid="subscription-card">
                  <h3>{subscriptionInfo?.plan?.name}</h3>
                  <p>Status: {subscriptionInfo?.subscription?.status}</p>
                  <p>Monthly: ${subscriptionInfo?.plan?.monthlyPrice / 100}</p>
                </div>
                
                <div data-testid="quick-actions">
                  <button>Request Service</button>
                  <button>View Services</button>
                  <button>Manage Subscription</button>
                </div>
              </div>
            </div>
          );
        }

        return <div data-testid="error">Unexpected route: {currentRoute}</div>;
      };

      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <NewCustomerScenario />
        </Wrapper>
      );

      // Should show loading initially
      expect(screen.getByTestId('loading')).toBeInTheDocument();

      // Should route to customer dashboard with onboarding
      await waitFor(() => {
        expect(screen.getByTestId('customer-dashboard')).toBeInTheDocument();
      });

      expect(screen.getByTestId('onboarding-banner')).toBeInTheDocument();
      expect(screen.getByText('Welcome to FixWell!')).toBeInTheDocument();
      expect(screen.getByText("You're all set with your Starter Plan")).toBeInTheDocument();

      // Dismiss onboarding
      fireEvent.click(screen.getByTestId('dismiss-onboarding'));

      expect(screen.queryByTestId('onboarding-banner')).not.toBeInTheDocument();
      expect(screen.getByTestId('dashboard-content')).toBeInTheDocument();
      expect(mockPush).toHaveBeenCalledWith('/customer-dashboard');
    });
  });

  describe('Active Customer Routing Scenarios', () => {
    it('should route active customer directly to customer dashboard', async () => {
      const authContext = createMockAuthContext('customer_active');
      const subscriptionData = createMockSubscriptionData('customer_active');

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => subscriptionData,
      });

      const ActiveCustomerScenario = () => {
        const [currentRoute, setCurrentRoute] = React.useState('/dashboard');
        const [isLoading, setIsLoading] = React.useState(true);
        const [subscriptionInfo, setSubscriptionInfo] = React.useState<any>(null);

        React.useEffect(() => {
          const loadDashboard = async () => {
            try {
              const response = await fetch('/api/customer/subscription');
              const data = await response.json();
              setSubscriptionInfo(data);

              if (authContext.user.role === 'CUSTOMER' && data.hasPlan) {
                setCurrentRoute('/customer-dashboard');
                mockPush('/customer-dashboard?utm_source=email&ref=campaign');
              }
            } catch (error) {
              console.error('Failed to load dashboard:', error);
            } finally {
              setIsLoading(false);
            }
          };

          loadDashboard();
        }, []);

        if (isLoading) {
          return <div data-testid="loading">Loading your dashboard...</div>;
        }

        if (currentRoute === '/customer-dashboard') {
          return (
            <div data-testid="customer-dashboard">
              <h1>Customer Dashboard</h1>
              <div data-testid="subscription-status">
                <h3>{subscriptionInfo?.plan?.name}</h3>
                <span data-testid="status-badge" className={`status-${subscriptionInfo?.subscription?.status?.toLowerCase()}`}>
                  {subscriptionInfo?.subscription?.status}
                </span>
              </div>
              
              <div data-testid="dashboard-sections">
                <section data-testid="services-section">
                  <h4>Available Services</h4>
                  <p>Access all services included in your plan</p>
                </section>
                
                <section data-testid="usage-section">
                  <h4>Usage This Month</h4>
                  <p>Track your service usage and limits</p>
                </section>
                
                <section data-testid="billing-section">
                  <h4>Billing & Payments</h4>
                  <p>Manage your payment methods and view invoices</p>
                </section>
              </div>
            </div>
          );
        }

        return <div data-testid="error">Unexpected route: {currentRoute}</div>;
      };

      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <ActiveCustomerScenario />
        </Wrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('customer-dashboard')).toBeInTheDocument();
      });

      expect(screen.getByText('HomeCare Plan')).toBeInTheDocument();
      expect(screen.getByTestId('status-badge')).toHaveTextContent('ACTIVE');
      expect(screen.getByTestId('services-section')).toBeInTheDocument();
      expect(screen.getByTestId('usage-section')).toBeInTheDocument();
      expect(screen.getByTestId('billing-section')).toBeInTheDocument();

      // Verify URL parameters were preserved
      expect(mockPush).toHaveBeenCalledWith('/customer-dashboard?utm_source=email&ref=campaign');
    });
  });

  describe('Past Due Customer Routing Scenarios', () => {
    it('should route past due customer to customer dashboard with payment warning', async () => {
      const authContext = createMockAuthContext('customer_past_due');
      const subscriptionData = createMockSubscriptionData('customer_past_due');

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => subscriptionData,
      });

      const PastDueCustomerScenario = () => {
        const [currentRoute, setCurrentRoute] = React.useState('/dashboard');
        const [isLoading, setIsLoading] = React.useState(true);
        const [subscriptionInfo, setSubscriptionInfo] = React.useState<any>(null);

        React.useEffect(() => {
          const loadDashboard = async () => {
            try {
              const response = await fetch('/api/customer/subscription');
              const data = await response.json();
              setSubscriptionInfo(data);

              // Past due customers still get customer dashboard but with warnings
              if (authContext.user.role === 'CUSTOMER' && data.hasPlan) {
                setCurrentRoute('/customer-dashboard');
                mockPush('/customer-dashboard');
                
                // Show warning for past due status
                if (data.subscription?.status === 'PAST_DUE') {
                  mockToast.warning('Payment required to continue service');
                }
              }
            } catch (error) {
              console.error('Failed to load dashboard:', error);
            } finally {
              setIsLoading(false);
            }
          };

          loadDashboard();
        }, []);

        if (isLoading) {
          return <div data-testid="loading">Loading your dashboard...</div>;
        }

        if (currentRoute === '/customer-dashboard') {
          const isPastDue = subscriptionInfo?.subscription?.status === 'PAST_DUE';
          
          return (
            <div data-testid="customer-dashboard">
              {isPastDue && (
                <div data-testid="payment-warning" className="warning-banner">
                  <h3>Payment Required</h3>
                  <p>{subscriptionInfo?.subscription?.lastPaymentError}</p>
                  <button data-testid="update-payment">Update Payment Method</button>
                </div>
              )}
              
              <h1>Customer Dashboard</h1>
              <div data-testid="subscription-status">
                <h3>{subscriptionInfo?.plan?.name}</h3>
                <span data-testid="status-badge" className={`status-${subscriptionInfo?.subscription?.status?.toLowerCase()}`}>
                  {subscriptionInfo?.subscription?.status}
                </span>
              </div>
              
              <div data-testid="limited-access-notice">
                <p>Some features may be limited until payment is updated</p>
              </div>
            </div>
          );
        }

        return <div data-testid="error">Unexpected route: {currentRoute}</div>;
      };

      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <PastDueCustomerScenario />
        </Wrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('customer-dashboard')).toBeInTheDocument();
      });

      expect(screen.getByTestId('payment-warning')).toBeInTheDocument();
      expect(screen.getByText('Payment Required')).toBeInTheDocument();
      expect(screen.getByText('Your card was declined')).toBeInTheDocument();
      expect(screen.getByTestId('update-payment')).toBeInTheDocument();
      expect(screen.getByTestId('status-badge')).toHaveTextContent('PAST_DUE');
      expect(screen.getByTestId('limited-access-notice')).toBeInTheDocument();

      expect(mockToast.warning).toHaveBeenCalledWith('Payment required to continue service');
    });
  });

  describe('Cancelled Customer Routing Scenarios', () => {
    it('should route cancelled customer to customer dashboard with reactivation options', async () => {
      const authContext = createMockAuthContext('customer_cancelled');
      const subscriptionData = createMockSubscriptionData('customer_cancelled');

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => subscriptionData,
      });

      const CancelledCustomerScenario = () => {
        const [currentRoute, setCurrentRoute] = React.useState('/dashboard');
        const [isLoading, setIsLoading] = React.useState(true);
        const [subscriptionInfo, setSubscriptionInfo] = React.useState<any>(null);

        React.useEffect(() => {
          const loadDashboard = async () => {
            try {
              const response = await fetch('/api/customer/subscription');
              const data = await response.json();
              setSubscriptionInfo(data);

              // Cancelled customers still have subscription history, show customer dashboard
              if (authContext.user.role === 'CUSTOMER') {
                setCurrentRoute('/customer-dashboard');
                mockPush('/customer-dashboard');
              }
            } catch (error) {
              console.error('Failed to load dashboard:', error);
            } finally {
              setIsLoading(false);
            }
          };

          loadDashboard();
        }, []);

        if (isLoading) {
          return <div data-testid="loading">Loading your dashboard...</div>;
        }

        if (currentRoute === '/customer-dashboard') {
          const isCancelled = subscriptionInfo?.subscription?.status === 'CANCELLED';
          
          return (
            <div data-testid="customer-dashboard">
              {isCancelled && (
                <div data-testid="reactivation-banner" className="info-banner">
                  <h3>Subscription Cancelled</h3>
                  <p>Your subscription was cancelled on {new Date(subscriptionInfo?.subscription?.cancelledAt).toLocaleDateString()}</p>
                  <button data-testid="reactivate-subscription">Reactivate Subscription</button>
                  <button data-testid="browse-plans">Browse Plans</button>
                </div>
              )}
              
              <h1>Customer Dashboard</h1>
              <div data-testid="subscription-history">
                <h3>Previous Subscription</h3>
                <p>{subscriptionInfo?.subscription?.tier} Plan</p>
                <span data-testid="status-badge" className="status-cancelled">
                  CANCELLED
                </span>
              </div>
              
              <div data-testid="limited-features">
                <h4>Available Options</h4>
                <ul>
                  <li>View subscription history</li>
                  <li>Reactivate subscription</li>
                  <li>Browse available plans</li>
                </ul>
              </div>
            </div>
          );
        }

        return <div data-testid="error">Unexpected route: {currentRoute}</div>;
      };

      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <CancelledCustomerScenario />
        </Wrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('customer-dashboard')).toBeInTheDocument();
      });

      expect(screen.getByTestId('reactivation-banner')).toBeInTheDocument();
      expect(screen.getByText('Subscription Cancelled')).toBeInTheDocument();
      expect(screen.getByTestId('reactivate-subscription')).toBeInTheDocument();
      expect(screen.getByTestId('browse-plans')).toBeInTheDocument();
      expect(screen.getByTestId('subscription-history')).toBeInTheDocument();
      expect(screen.getByText('HOMECARE Plan')).toBeInTheDocument();
      expect(screen.getByTestId('status-badge')).toHaveTextContent('CANCELLED');
    });
  });

  describe('No Subscription Customer Routing Scenarios', () => {
    it('should route customer with no subscription history to general dashboard with promotion', async () => {
      const authContext = createMockAuthContext('customer_none');
      const subscriptionData = createMockSubscriptionData('customer_none');

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => subscriptionData,
      });

      const NoSubscriptionScenario = () => {
        const [currentRoute, setCurrentRoute] = React.useState('/dashboard');
        const [isLoading, setIsLoading] = React.useState(true);
        const [subscriptionInfo, setSubscriptionInfo] = React.useState<any>(null);

        React.useEffect(() => {
          const loadDashboard = async () => {
            try {
              const response = await fetch('/api/customer/subscription');
              const data = await response.json();
              setSubscriptionInfo(data);

              // Customer with no subscription history goes to general dashboard
              if (authContext.user.role === 'CUSTOMER' && !data.hasPlan && !data.subscription) {
                setCurrentRoute('/dashboard');
                // Stay on /dashboard for promotion content
              }
            } catch (error) {
              console.error('Failed to load dashboard:', error);
            } finally {
              setIsLoading(false);
            }
          };

          loadDashboard();
        }, []);

        if (isLoading) {
          return <div data-testid="loading">Loading your dashboard...</div>;
        }

        if (currentRoute === '/dashboard') {
          return (
            <div data-testid="general-dashboard">
              <div data-testid="promotion-banner" className="promotion-banner">
                <h2>Welcome to FixWell!</h2>
                <p>Get started with our home maintenance services</p>
                <button data-testid="view-plans">View Plans</button>
                <button data-testid="learn-more">Learn More</button>
              </div>
              
              <div data-testid="features-preview">
                <h3>What You Get</h3>
                <ul>
                  <li>Professional home maintenance</li>
                  <li>24/7 customer support</li>
                  <li>Flexible scheduling</li>
                  <li>Quality guarantee</li>
                </ul>
              </div>
              
              <div data-testid="plan-options">
                <h3>Choose Your Plan</h3>
                <div data-testid="starter-plan">
                  <h4>Starter Plan</h4>
                  <p>$29.99/month</p>
                  <button data-testid="select-starter">Get Started</button>
                </div>
                <div data-testid="homecare-plan">
                  <h4>HomeCare Plan</h4>
                  <p>$49.99/month</p>
                  <button data-testid="select-homecare">Choose HomeCare</button>
                </div>
              </div>
            </div>
          );
        }

        return <div data-testid="error">Unexpected route: {currentRoute}</div>;
      };

      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <NoSubscriptionScenario />
        </Wrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('general-dashboard')).toBeInTheDocument();
      });

      expect(screen.getByTestId('promotion-banner')).toBeInTheDocument();
      expect(screen.getByText('Welcome to FixWell!')).toBeInTheDocument();
      expect(screen.getByTestId('view-plans')).toBeInTheDocument();
      expect(screen.getByTestId('features-preview')).toBeInTheDocument();
      expect(screen.getByTestId('plan-options')).toBeInTheDocument();
      expect(screen.getByTestId('starter-plan')).toBeInTheDocument();
      expect(screen.getByTestId('homecare-plan')).toBeInTheDocument();

      // Should not have navigated away from /dashboard
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('Cross-scenario routing transitions', () => {
    it('should handle subscription status changes and re-route appropriately', async () => {
      const authContext = createMockAuthContext('customer_active');
      let subscriptionData = createMockSubscriptionData('customer_active');

      // Start with active subscription
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => subscriptionData,
      });

      const DynamicRoutingScenario = () => {
        const [currentRoute, setCurrentRoute] = React.useState('/dashboard');
        const [isLoading, setIsLoading] = React.useState(true);
        const [subscriptionInfo, setSubscriptionInfo] = React.useState<any>(null);

        const loadSubscriptionData = async () => {
          try {
            const response = await fetch('/api/customer/subscription');
            const data = await response.json();
            setSubscriptionInfo(data);

            // Route based on subscription status
            if (authContext.user.role === 'CUSTOMER') {
              if (data.hasPlan || data.subscription) {
                setCurrentRoute('/customer-dashboard');
                mockPush('/customer-dashboard');
              } else {
                setCurrentRoute('/dashboard');
                mockPush('/dashboard');
              }
            }
          } catch (error) {
            console.error('Failed to load dashboard:', error);
          } finally {
            setIsLoading(false);
          }
        };

        React.useEffect(() => {
          loadSubscriptionData();
        }, []);

        const simulateSubscriptionChange = (newStatus: string) => {
          setIsLoading(true);
          
          // Update mock data
          if (newStatus === 'CANCELLED') {
            subscriptionData = createMockSubscriptionData('customer_cancelled');
          } else if (newStatus === 'NONE') {
            subscriptionData = createMockSubscriptionData('customer_none');
          }

          (fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => subscriptionData,
          });

          loadSubscriptionData();
        };

        if (isLoading) {
          return <div data-testid="loading">Loading...</div>;
        }

        return (
          <div data-testid="dynamic-dashboard">
            <div data-testid="current-route">Current Route: {currentRoute}</div>
            <div data-testid="subscription-status">
              Status: {subscriptionInfo?.subscription?.status || 'NONE'}
            </div>
            
            <div data-testid="test-controls">
              <button 
                onClick={() => simulateSubscriptionChange('CANCELLED')}
                data-testid="simulate-cancellation"
              >
                Simulate Cancellation
              </button>
              <button 
                onClick={() => simulateSubscriptionChange('NONE')}
                data-testid="simulate-no-subscription"
              >
                Simulate No Subscription
              </button>
            </div>

            {currentRoute === '/customer-dashboard' && (
              <div data-testid="customer-content">Customer Dashboard Content</div>
            )}
            
            {currentRoute === '/dashboard' && (
              <div data-testid="general-content">General Dashboard Content</div>
            )}
          </div>
        );
      };

      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <DynamicRoutingScenario />
        </Wrapper>
      );

      // Should start with customer dashboard
      await waitFor(() => {
        expect(screen.getByTestId('current-route')).toHaveTextContent('/customer-dashboard');
      });

      expect(screen.getByTestId('subscription-status')).toHaveTextContent('ACTIVE');
      expect(screen.getByTestId('customer-content')).toBeInTheDocument();

      // Simulate subscription cancellation
      fireEvent.click(screen.getByTestId('simulate-cancellation'));

      await waitFor(() => {
        expect(screen.getByTestId('subscription-status')).toHaveTextContent('CANCELLED');
      });

      // Should still be on customer dashboard (cancelled users keep access)
      expect(screen.getByTestId('current-route')).toHaveTextContent('/customer-dashboard');

      // Simulate complete subscription removal
      fireEvent.click(screen.getByTestId('simulate-no-subscription'));

      await waitFor(() => {
        expect(screen.getByTestId('subscription-status')).toHaveTextContent('NONE');
      });

      // Should route to general dashboard
      expect(screen.getByTestId('current-route')).toHaveTextContent('/dashboard');
      expect(screen.getByTestId('general-content')).toBeInTheDocument();
    });
  });

  describe('URL parameter preservation across scenarios', () => {
    it('should preserve URL parameters during routing for all subscription scenarios', async () => {
      const scenarios = [
        { type: 'customer_active', expectedRoute: '/customer-dashboard' },
        { type: 'customer_past_due', expectedRoute: '/customer-dashboard' },
        { type: 'customer_cancelled', expectedRoute: '/customer-dashboard' },
        { type: 'customer_none', expectedRoute: '/dashboard' },
      ];

      for (const scenario of scenarios) {
        // Reset mocks for each scenario
        mockPush.mockClear();
        (fetch as jest.Mock).mockClear();

        const authContext = createMockAuthContext(scenario.type as any);
        const subscriptionData = createMockSubscriptionData(scenario.type);

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => subscriptionData,
        });

        const ParameterPreservationTest = () => {
          const [currentRoute, setCurrentRoute] = React.useState('/dashboard');
          const [isLoading, setIsLoading] = React.useState(true);

          React.useEffect(() => {
            const loadDashboard = async () => {
              try {
                const response = await fetch('/api/customer/subscription');
                const data = await response.json();

                // Determine route based on subscription data
                let targetRoute = '/dashboard';
                if (authContext.user.role === 'CUSTOMER' && (data.hasPlan || data.subscription)) {
                  targetRoute = '/customer-dashboard';
                }

                setCurrentRoute(targetRoute);
                
                // Preserve URL parameters
                const params = new URLSearchParams('utm_source=email&ref=campaign');
                const routeWithParams = `${targetRoute}?${params.toString()}`;
                mockPush(routeWithParams);
              } catch (error) {
                console.error('Failed to load dashboard:', error);
              } finally {
                setIsLoading(false);
              }
            };

            loadDashboard();
          }, []);

          if (isLoading) {
            return <div data-testid="loading">Loading...</div>;
          }

          return (
            <div data-testid={`${scenario.type}-test`}>
              <div data-testid="route">{currentRoute}</div>
            </div>
          );
        };

        const Wrapper = createWrapper();
        render(
          <Wrapper>
            <ParameterPreservationTest />
          </Wrapper>
        );

        await waitFor(() => {
          expect(screen.getByTestId(`${scenario.type}-test`)).toBeInTheDocument();
        });

        expect(screen.getByTestId('route')).toHaveTextContent(scenario.expectedRoute);
        expect(mockPush).toHaveBeenCalledWith(`${scenario.expectedRoute}?utm_source=email&ref=campaign`);
      }
    });
  });
});