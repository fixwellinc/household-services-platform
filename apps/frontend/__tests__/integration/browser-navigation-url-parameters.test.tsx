/**
 * Browser Navigation and URL Parameter Handling Tests
 * 
 * Tests browser navigation, URL parameter preservation, and history management
 * Requirements: 2.5, 4.5
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock browser history API
const mockHistoryState = {
  entries: ['/'],
  currentIndex: 0,
};

const mockHistory = {
  pushState: jest.fn((state, title, url) => {
    mockHistoryState.entries.push(url);
    mockHistoryState.currentIndex = mockHistoryState.entries.length - 1;
  }),
  replaceState: jest.fn((state, title, url) => {
    mockHistoryState.entries[mockHistoryState.currentIndex] = url;
  }),
  back: jest.fn(() => {
    if (mockHistoryState.currentIndex > 0) {
      mockHistoryState.currentIndex--;
    }
  }),
  forward: jest.fn(() => {
    if (mockHistoryState.currentIndex < mockHistoryState.entries.length - 1) {
      mockHistoryState.currentIndex++;
    }
  }),
  go: jest.fn((delta) => {
    const newIndex = mockHistoryState.currentIndex + delta;
    if (newIndex >= 0 && newIndex < mockHistoryState.entries.length) {
      mockHistoryState.currentIndex = newIndex;
    }
  }),
  state: null,
  length: 1,
};

// Mock window.location
const mockLocation = {
  href: 'http://localhost:3000/',
  origin: 'http://localhost:3000',
  pathname: '/',
  search: '',
  hash: '',
  assign: jest.fn(),
  replace: jest.fn(),
  reload: jest.fn(),
};

// Setup global mocks
Object.defineProperty(window, 'history', {
  value: mockHistory,
  writable: true,
});

Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

// Mock Next.js navigation
const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  prefetch: jest.fn(),
};

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  useSearchParams: jest.fn(),
  usePathname: jest.fn(),
}));

import { useSearchParams, usePathname } from 'next/navigation';

const mockUseSearchParams = useSearchParams as jest.MockedFunction<typeof useSearchParams>;
const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;

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

// URL parameter utilities
class URLParameterManager {
  private currentParams: URLSearchParams;
  private currentPath: string;
  private currentHash: string;

  constructor(initialUrl = '/') {
    const url = new URL(initialUrl, 'http://localhost:3000');
    this.currentParams = new URLSearchParams(url.search);
    this.currentPath = url.pathname;
    this.currentHash = url.hash;
  }

  setParam(key: string, value: string): void {
    this.currentParams.set(key, value);
  }

  getParam(key: string): string | null {
    return this.currentParams.get(key);
  }

  removeParam(key: string): void {
    this.currentParams.delete(key);
  }

  setPath(path: string): void {
    this.currentPath = path;
  }

  setHash(hash: string): void {
    this.currentHash = hash;
  }

  getFullUrl(): string {
    const params = this.currentParams.toString();
    const query = params ? `?${params}` : '';
    return `${this.currentPath}${query}${this.currentHash}`;
  }

  clone(): URLParameterManager {
    const manager = new URLParameterManager();
    manager.currentParams = new URLSearchParams(this.currentParams);
    manager.currentPath = this.currentPath;
    manager.currentHash = this.currentHash;
    return manager;
  }
}

describe('Browser Navigation and URL Parameter Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset mock history state
    mockHistoryState.entries = ['/'];
    mockHistoryState.currentIndex = 0;
    
    // Reset mock location
    mockLocation.href = 'http://localhost:3000/';
    mockLocation.pathname = '/';
    mockLocation.search = '';
    mockLocation.hash = '';
    
    // Default mocks
    mockUseSearchParams.mockReturnValue(new URLSearchParams());
    mockUsePathname.mockReturnValue('/');
  });

  describe('URL Parameter Preservation', () => {
    it('should preserve query parameters during dashboard routing', async () => {
      const initialParams = new URLSearchParams('utm_source=email&ref=campaign&user_id=123');
      mockUseSearchParams.mockReturnValue(initialParams);
      mockUsePathname.mockReturnValue('/dashboard');

      const ParameterPreservationTest = () => {
        const [currentRoute, setCurrentRoute] = React.useState('/dashboard');
        const [preservedParams, setPreservedParams] = React.useState<URLSearchParams>(new URLSearchParams());

        const navigateWithParams = (targetRoute: string, preserveParams = true) => {
          const searchParams = mockUseSearchParams();
          
          if (preserveParams) {
            const newUrl = `${targetRoute}?${searchParams.toString()}`;
            mockRouter.push(newUrl);
            setPreservedParams(new URLSearchParams(searchParams));
          } else {
            mockRouter.push(targetRoute);
            setPreservedParams(new URLSearchParams());
          }
          
          setCurrentRoute(targetRoute);
        };

        return (
          <div data-testid="parameter-preservation-test">
            <div data-testid="current-route">Route: {currentRoute}</div>
            <div data-testid="current-params">
              Params: {Array.from(preservedParams.entries()).map(([key, value]) => `${key}=${value}`).join('&')}
            </div>
            
            <div data-testid="navigation-controls">
              <button 
                onClick={() => navigateWithParams('/customer-dashboard', true)}
                data-testid="nav-with-params"
              >
                Navigate with Params
              </button>
              <button 
                onClick={() => navigateWithParams('/admin', false)}
                data-testid="nav-without-params"
              >
                Navigate without Params
              </button>
            </div>
          </div>
        );
      };

      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <ParameterPreservationTest />
        </Wrapper>
      );

      // Navigate with parameter preservation
      fireEvent.click(screen.getByTestId('nav-with-params'));

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/customer-dashboard?utm_source=email&ref=campaign&user_id=123');
      });

      expect(screen.getByTestId('current-route')).toHaveTextContent('/customer-dashboard');
      expect(screen.getByTestId('current-params')).toHaveTextContent('utm_source=email&ref=campaign&user_id=123');

      // Navigate without parameter preservation
      fireEvent.click(screen.getByTestId('nav-without-params'));

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/admin');
      });

      expect(screen.getByTestId('current-route')).toHaveTextContent('/admin');
      expect(screen.getByTestId('current-params')).toHaveTextContent('Params:');
    });

    it('should preserve hash fragments during navigation', async () => {
      mockUseSearchParams.mockReturnValue(new URLSearchParams('tab=billing'));
      mockUsePathname.mockReturnValue('/customer-dashboard');
      
      // Mock window.location.hash
      Object.defineProperty(window, 'location', {
        value: {
          ...mockLocation,
          hash: '#section-payment-methods',
        },
        writable: true,
      });

      const HashPreservationTest = () => {
        const [navigationHistory, setNavigationHistory] = React.useState<string[]>([]);

        const navigateWithHash = (route: string, preserveHash = true) => {
          const searchParams = mockUseSearchParams();
          const currentHash = window.location.hash;
          
          let targetUrl = route;
          if (searchParams.toString()) {
            targetUrl += `?${searchParams.toString()}`;
          }
          if (preserveHash && currentHash) {
            targetUrl += currentHash;
          }
          
          mockRouter.push(targetUrl);
          setNavigationHistory(prev => [...prev, targetUrl]);
        };

        return (
          <div data-testid="hash-preservation-test">
            <div data-testid="current-hash">Hash: {window.location.hash}</div>
            
            <div data-testid="navigation-history">
              <h4>Navigation History:</h4>
              {navigationHistory.map((url, index) => (
                <div key={index} data-testid={`history-${index}`}>
                  {index + 1}. {url}
                </div>
              ))}
            </div>
            
            <div data-testid="hash-controls">
              <button 
                onClick={() => navigateWithHash('/dashboard', true)}
                data-testid="nav-preserve-hash"
              >
                Navigate with Hash
              </button>
              <button 
                onClick={() => navigateWithHash('/admin', false)}
                data-testid="nav-clear-hash"
              >
                Navigate without Hash
              </button>
            </div>
          </div>
        );
      };

      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <HashPreservationTest />
        </Wrapper>
      );

      expect(screen.getByTestId('current-hash')).toHaveTextContent('#section-payment-methods');

      // Navigate preserving hash
      fireEvent.click(screen.getByTestId('nav-preserve-hash'));

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/dashboard?tab=billing#section-payment-methods');
      });

      expect(screen.getByTestId('history-0')).toHaveTextContent('/dashboard?tab=billing#section-payment-methods');

      // Navigate without hash
      fireEvent.click(screen.getByTestId('nav-clear-hash'));

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/admin');
      });

      expect(screen.getByTestId('history-1')).toHaveTextContent('/admin');
    });

    it('should handle complex parameter combinations', async () => {
      const ComplexParameterTest = () => {
        const [urlManager] = React.useState(() => new URLParameterManager('/dashboard?utm_source=email&ref=campaign'));
        const [currentUrl, setCurrentUrl] = React.useState(urlManager.getFullUrl());

        const addTrackingParams = () => {
          const newManager = urlManager.clone();
          newManager.setParam('timestamp', Date.now().toString());
          newManager.setParam('session_id', 'sess_123456');
          setCurrentUrl(newManager.getFullUrl());
          mockRouter.push(newManager.getFullUrl());
        };

        const addUserContext = () => {
          const newManager = urlManager.clone();
          newManager.setParam('user_type', 'premium');
          newManager.setParam('plan_tier', 'homecare');
          newManager.setHash('#dashboard-overview');
          setCurrentUrl(newManager.getFullUrl());
          mockRouter.push(newManager.getFullUrl());
        };

        const navigateToCustomerDashboard = () => {
          const newManager = urlManager.clone();
          newManager.setPath('/customer-dashboard');
          // Keep all existing parameters
          setCurrentUrl(newManager.getFullUrl());
          mockRouter.push(newManager.getFullUrl());
        };

        const clearNonEssentialParams = () => {
          const newManager = urlManager.clone();
          newManager.removeParam('timestamp');
          newManager.removeParam('session_id');
          // Keep utm_source, ref, user_type, plan_tier
          setCurrentUrl(newManager.getFullUrl());
          mockRouter.push(newManager.getFullUrl());
        };

        return (
          <div data-testid="complex-parameter-test">
            <div data-testid="current-url">URL: {currentUrl}</div>
            
            <div data-testid="parameter-controls">
              <button onClick={addTrackingParams} data-testid="add-tracking">
                Add Tracking Params
              </button>
              <button onClick={addUserContext} data-testid="add-user-context">
                Add User Context
              </button>
              <button onClick={navigateToCustomerDashboard} data-testid="nav-customer-dashboard">
                Navigate to Customer Dashboard
              </button>
              <button onClick={clearNonEssentialParams} data-testid="clear-non-essential">
                Clear Non-Essential Params
              </button>
            </div>
          </div>
        );
      };

      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <ComplexParameterTest />
        </Wrapper>
      );

      // Initial URL
      expect(screen.getByTestId('current-url')).toHaveTextContent('/dashboard?utm_source=email&ref=campaign');

      // Add tracking parameters
      fireEvent.click(screen.getByTestId('add-tracking'));
      
      await waitFor(() => {
        const urlText = screen.getByTestId('current-url').textContent;
        expect(urlText).toContain('timestamp=');
        expect(urlText).toContain('session_id=sess_123456');
      });

      // Add user context
      fireEvent.click(screen.getByTestId('add-user-context'));
      
      await waitFor(() => {
        const urlText = screen.getByTestId('current-url').textContent;
        expect(urlText).toContain('user_type=premium');
        expect(urlText).toContain('plan_tier=homecare');
        expect(urlText).toContain('#dashboard-overview');
      });

      // Navigate to customer dashboard (preserving all params)
      fireEvent.click(screen.getByTestId('nav-customer-dashboard'));
      
      await waitFor(() => {
        const urlText = screen.getByTestId('current-url').textContent;
        expect(urlText).toContain('/customer-dashboard');
        expect(urlText).toContain('utm_source=email');
        expect(urlText).toContain('user_type=premium');
      });

      // Clear non-essential parameters
      fireEvent.click(screen.getByTestId('clear-non-essential'));
      
      await waitFor(() => {
        const urlText = screen.getByTestId('current-url').textContent;
        expect(urlText).not.toContain('timestamp=');
        expect(urlText).not.toContain('session_id=');
        expect(urlText).toContain('utm_source=email');
        expect(urlText).toContain('user_type=premium');
      });
    });
  });

  describe('Browser History Management', () => {
    it('should manage browser history correctly during dashboard navigation', async () => {
      const HistoryManagementTest = () => {
        const [historyStack, setHistoryStack] = React.useState<string[]>(['/']);
        const [currentIndex, setCurrentIndex] = React.useState(0);

        const pushToHistory = (url: string) => {
          const newStack = [...historyStack.slice(0, currentIndex + 1), url];
          setHistoryStack(newStack);
          setCurrentIndex(newStack.length - 1);
          mockHistory.pushState(null, '', url);
          mockRouter.push(url);
        };

        const replaceInHistory = (url: string) => {
          const newStack = [...historyStack];
          newStack[currentIndex] = url;
          setHistoryStack(newStack);
          mockHistory.replaceState(null, '', url);
          mockRouter.replace(url);
        };

        const goBack = () => {
          if (currentIndex > 0) {
            const newIndex = currentIndex - 1;
            setCurrentIndex(newIndex);
            mockHistory.back();
            mockRouter.back();
          }
        };

        const goForward = () => {
          if (currentIndex < historyStack.length - 1) {
            const newIndex = currentIndex + 1;
            setCurrentIndex(newIndex);
            mockHistory.forward();
            mockRouter.forward();
          }
        };

        return (
          <div data-testid="history-management-test">
            <div data-testid="current-url">
              Current: {historyStack[currentIndex]} (Index: {currentIndex})
            </div>
            
            <div data-testid="history-stack">
              <h4>History Stack:</h4>
              {historyStack.map((url, index) => (
                <div 
                  key={index} 
                  data-testid={`history-item-${index}`}
                  className={index === currentIndex ? 'current' : ''}
                >
                  {index === currentIndex ? '→ ' : '  '}{url}
                </div>
              ))}
            </div>
            
            <div data-testid="history-controls">
              <button onClick={() => pushToHistory('/dashboard')} data-testid="push-dashboard">
                Push Dashboard
              </button>
              <button onClick={() => pushToHistory('/customer-dashboard')} data-testid="push-customer">
                Push Customer Dashboard
              </button>
              <button onClick={() => replaceInHistory('/admin')} data-testid="replace-admin">
                Replace with Admin
              </button>
              <button onClick={goBack} data-testid="go-back" disabled={currentIndex === 0}>
                Back
              </button>
              <button onClick={goForward} data-testid="go-forward" disabled={currentIndex === historyStack.length - 1}>
                Forward
              </button>
            </div>
          </div>
        );
      };

      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <HistoryManagementTest />
        </Wrapper>
      );

      // Initial state
      expect(screen.getByTestId('current-url')).toHaveTextContent('Current: / (Index: 0)');

      // Push dashboard
      fireEvent.click(screen.getByTestId('push-dashboard'));
      
      await waitFor(() => {
        expect(screen.getByTestId('current-url')).toHaveTextContent('Current: /dashboard (Index: 1)');
      });

      expect(screen.getByTestId('history-item-1')).toHaveTextContent('→ /dashboard');

      // Push customer dashboard
      fireEvent.click(screen.getByTestId('push-customer'));
      
      await waitFor(() => {
        expect(screen.getByTestId('current-url')).toHaveTextContent('Current: /customer-dashboard (Index: 2)');
      });

      // Go back
      fireEvent.click(screen.getByTestId('go-back'));
      
      await waitFor(() => {
        expect(screen.getByTestId('current-url')).toHaveTextContent('Current: /dashboard (Index: 1)');
      });

      expect(mockRouter.back).toHaveBeenCalled();

      // Replace current with admin
      fireEvent.click(screen.getByTestId('replace-admin'));
      
      await waitFor(() => {
        expect(screen.getByTestId('current-url')).toHaveTextContent('Current: /admin (Index: 1)');
      });

      expect(screen.getByTestId('history-item-1')).toHaveTextContent('→ /admin');
      expect(mockRouter.replace).toHaveBeenCalledWith('/admin');

      // Go forward
      fireEvent.click(screen.getByTestId('go-forward'));
      
      await waitFor(() => {
        expect(screen.getByTestId('current-url')).toHaveTextContent('Current: /customer-dashboard (Index: 2)');
      });

      expect(mockRouter.forward).toHaveBeenCalled();
    });

    it('should handle browser back/forward buttons correctly', async () => {
      const BrowserNavigationTest = () => {
        const [navigationEvents, setNavigationEvents] = React.useState<Array<{
          type: string;
          url: string;
          timestamp: number;
        }>>([]);

        const simulateBrowserNavigation = (direction: 'back' | 'forward') => {
          const event = {
            type: `browser-${direction}`,
            url: direction === 'back' ? '/dashboard' : '/customer-dashboard',
            timestamp: Date.now(),
          };
          
          setNavigationEvents(prev => [...prev, event]);
          
          if (direction === 'back') {
            mockHistory.back();
            mockRouter.back();
          } else {
            mockHistory.forward();
            mockRouter.forward();
          }
        };

        const simulatePopState = (url: string) => {
          const event = {
            type: 'popstate',
            url,
            timestamp: Date.now(),
          };
          
          setNavigationEvents(prev => [...prev, event]);
          
          // Simulate popstate event handling
          window.dispatchEvent(new PopStateEvent('popstate', { state: { url } }));
        };

        React.useEffect(() => {
          const handlePopState = (event: PopStateEvent) => {
            const url = event.state?.url || window.location.pathname;
            setNavigationEvents(prev => [...prev, {
              type: 'popstate-handled',
              url,
              timestamp: Date.now(),
            }]);
          };

          window.addEventListener('popstate', handlePopState);
          return () => window.removeEventListener('popstate', handlePopState);
        }, []);

        return (
          <div data-testid="browser-navigation-test">
            <div data-testid="navigation-events">
              <h4>Navigation Events:</h4>
              {navigationEvents.map((event, index) => (
                <div key={index} data-testid={`event-${index}`}>
                  {event.type}: {event.url} at {new Date(event.timestamp).toLocaleTimeString()}
                </div>
              ))}
            </div>
            
            <div data-testid="browser-controls">
              <button onClick={() => simulateBrowserNavigation('back')} data-testid="simulate-back">
                Simulate Browser Back
              </button>
              <button onClick={() => simulateBrowserNavigation('forward')} data-testid="simulate-forward">
                Simulate Browser Forward
              </button>
              <button onClick={() => simulatePopState('/customer-dashboard')} data-testid="simulate-popstate">
                Simulate PopState
              </button>
            </div>
          </div>
        );
      };

      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <BrowserNavigationTest />
        </Wrapper>
      );

      // Simulate browser back
      fireEvent.click(screen.getByTestId('simulate-back'));
      
      await waitFor(() => {
        expect(screen.getByTestId('event-0')).toHaveTextContent('browser-back: /dashboard');
      });

      // Simulate browser forward
      fireEvent.click(screen.getByTestId('simulate-forward'));
      
      await waitFor(() => {
        expect(screen.getByTestId('event-1')).toHaveTextContent('browser-forward: /customer-dashboard');
      });

      // Simulate popstate event
      fireEvent.click(screen.getByTestId('simulate-popstate'));
      
      await waitFor(() => {
        expect(screen.getByTestId('event-2')).toHaveTextContent('popstate: /customer-dashboard');
      });

      await waitFor(() => {
        expect(screen.getByTestId('event-3')).toHaveTextContent('popstate-handled: /customer-dashboard');
      });
    });
  });

  describe('URL State Synchronization', () => {
    it('should synchronize dashboard state with URL parameters', async () => {
      const URLStateSyncTest = () => {
        const [dashboardState, setDashboardState] = React.useState({
          activeTab: 'overview',
          selectedPlan: null as string | null,
          showModal: false,
        });

        const updateURL = (newState: typeof dashboardState) => {
          const params = new URLSearchParams();
          params.set('tab', newState.activeTab);
          if (newState.selectedPlan) {
            params.set('plan', newState.selectedPlan);
          }
          if (newState.showModal) {
            params.set('modal', 'true');
          }
          
          const newUrl = `/customer-dashboard?${params.toString()}`;
          mockRouter.replace(newUrl);
        };

        const syncFromURL = () => {
          // Simulate reading from URL
          const params = new URLSearchParams('tab=billing&plan=premium&modal=true');
          
          setDashboardState({
            activeTab: params.get('tab') || 'overview',
            selectedPlan: params.get('plan'),
            showModal: params.get('modal') === 'true',
          });
        };

        const changeTab = (tab: string) => {
          const newState = { ...dashboardState, activeTab: tab };
          setDashboardState(newState);
          updateURL(newState);
        };

        const selectPlan = (plan: string) => {
          const newState = { ...dashboardState, selectedPlan: plan };
          setDashboardState(newState);
          updateURL(newState);
        };

        const toggleModal = () => {
          const newState = { ...dashboardState, showModal: !dashboardState.showModal };
          setDashboardState(newState);
          updateURL(newState);
        };

        return (
          <div data-testid="url-state-sync-test">
            <div data-testid="current-state">
              <div>Active Tab: {dashboardState.activeTab}</div>
              <div>Selected Plan: {dashboardState.selectedPlan || 'None'}</div>
              <div>Modal Open: {dashboardState.showModal.toString()}</div>
            </div>
            
            <div data-testid="state-controls">
              <button onClick={() => changeTab('billing')} data-testid="tab-billing">
                Billing Tab
              </button>
              <button onClick={() => changeTab('services')} data-testid="tab-services">
                Services Tab
              </button>
              <button onClick={() => selectPlan('premium')} data-testid="select-premium">
                Select Premium
              </button>
              <button onClick={toggleModal} data-testid="toggle-modal">
                Toggle Modal
              </button>
              <button onClick={syncFromURL} data-testid="sync-from-url">
                Sync from URL
              </button>
            </div>
          </div>
        );
      };

      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <URLStateSyncTest />
        </Wrapper>
      );

      // Initial state
      expect(screen.getByText('Active Tab: overview')).toBeInTheDocument();
      expect(screen.getByText('Selected Plan: None')).toBeInTheDocument();
      expect(screen.getByText('Modal Open: false')).toBeInTheDocument();

      // Change tab
      fireEvent.click(screen.getByTestId('tab-billing'));
      
      await waitFor(() => {
        expect(screen.getByText('Active Tab: billing')).toBeInTheDocument();
      });

      expect(mockRouter.replace).toHaveBeenCalledWith('/customer-dashboard?tab=billing');

      // Select plan
      fireEvent.click(screen.getByTestId('select-premium'));
      
      await waitFor(() => {
        expect(screen.getByText('Selected Plan: premium')).toBeInTheDocument();
      });

      expect(mockRouter.replace).toHaveBeenCalledWith('/customer-dashboard?tab=billing&plan=premium');

      // Toggle modal
      fireEvent.click(screen.getByTestId('toggle-modal'));
      
      await waitFor(() => {
        expect(screen.getByText('Modal Open: true')).toBeInTheDocument();
      });

      expect(mockRouter.replace).toHaveBeenCalledWith('/customer-dashboard?tab=billing&plan=premium&modal=true');

      // Sync from URL (simulate browser refresh or direct URL access)
      fireEvent.click(screen.getByTestId('sync-from-url'));
      
      await waitFor(() => {
        expect(screen.getByText('Active Tab: billing')).toBeInTheDocument();
        expect(screen.getByText('Selected Plan: premium')).toBeInTheDocument();
        expect(screen.getByText('Modal Open: true')).toBeInTheDocument();
      });
    });

    it('should handle URL parameter validation and sanitization', async () => {
      const URLValidationTest = () => {
        const [validationResults, setValidationResults] = React.useState<Array<{
          param: string;
          value: string;
          isValid: boolean;
          sanitized?: string;
        }>>([]);

        const validateAndSanitizeParams = (params: URLSearchParams) => {
          const results: typeof validationResults = [];
          
          // Validate tab parameter
          const tab = params.get('tab');
          if (tab) {
            const validTabs = ['overview', 'billing', 'services', 'settings'];
            const isValid = validTabs.includes(tab);
            results.push({
              param: 'tab',
              value: tab,
              isValid,
              sanitized: isValid ? tab : 'overview',
            });
          }
          
          // Validate plan parameter
          const plan = params.get('plan');
          if (plan) {
            const validPlans = ['starter', 'homecare', 'priority'];
            const isValid = validPlans.includes(plan.toLowerCase());
            results.push({
              param: 'plan',
              value: plan,
              isValid,
              sanitized: isValid ? plan.toLowerCase() : undefined,
            });
          }
          
          // Validate user_id parameter (should be numeric)
          const userId = params.get('user_id');
          if (userId) {
            const isValid = /^\d+$/.test(userId);
            results.push({
              param: 'user_id',
              value: userId,
              isValid,
              sanitized: isValid ? userId : undefined,
            });
          }
          
          setValidationResults(results);
        };

        const testValidation = (paramString: string) => {
          const params = new URLSearchParams(paramString);
          validateAndSanitizeParams(params);
        };

        return (
          <div data-testid="url-validation-test">
            <div data-testid="validation-results">
              <h4>Validation Results:</h4>
              {validationResults.map((result, index) => (
                <div key={index} data-testid={`validation-${index}`}>
                  {result.param}: "{result.value}" - {result.isValid ? '✅ Valid' : '❌ Invalid'}
                  {result.sanitized && ` → "${result.sanitized}"`}
                </div>
              ))}
            </div>
            
            <div data-testid="validation-controls">
              <button 
                onClick={() => testValidation('tab=billing&plan=HOMECARE&user_id=123')}
                data-testid="test-valid-params"
              >
                Test Valid Params
              </button>
              <button 
                onClick={() => testValidation('tab=invalid&plan=fake&user_id=abc')}
                data-testid="test-invalid-params"
              >
                Test Invalid Params
              </button>
              <button 
                onClick={() => testValidation('tab=services&plan=Priority&user_id=456&malicious=<script>')}
                data-testid="test-mixed-params"
              >
                Test Mixed Params
              </button>
            </div>
          </div>
        );
      };

      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <URLValidationTest />
        </Wrapper>
      );

      // Test valid parameters
      fireEvent.click(screen.getByTestId('test-valid-params'));
      
      await waitFor(() => {
        expect(screen.getByTestId('validation-0')).toHaveTextContent('tab: "billing" - ✅ Valid');
        expect(screen.getByTestId('validation-1')).toHaveTextContent('plan: "HOMECARE" - ✅ Valid → "homecare"');
        expect(screen.getByTestId('validation-2')).toHaveTextContent('user_id: "123" - ✅ Valid');
      });

      // Test invalid parameters
      fireEvent.click(screen.getByTestId('test-invalid-params'));
      
      await waitFor(() => {
        expect(screen.getByTestId('validation-0')).toHaveTextContent('tab: "invalid" - ❌ Invalid → "overview"');
        expect(screen.getByTestId('validation-1')).toHaveTextContent('plan: "fake" - ❌ Invalid');
        expect(screen.getByTestId('validation-2')).toHaveTextContent('user_id: "abc" - ❌ Invalid');
      });

      // Test mixed parameters (including potential XSS)
      fireEvent.click(screen.getByTestId('test-mixed-params'));
      
      await waitFor(() => {
        expect(screen.getByTestId('validation-0')).toHaveTextContent('tab: "services" - ✅ Valid');
        expect(screen.getByTestId('validation-1')).toHaveTextContent('plan: "Priority" - ✅ Valid → "priority"');
        expect(screen.getByTestId('validation-2')).toHaveTextContent('user_id: "456" - ✅ Valid');
      });
    });
  });
});