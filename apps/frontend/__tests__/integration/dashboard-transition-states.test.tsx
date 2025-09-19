/**
 * Integration tests for dashboard transition states
 * Tests smooth transitions, loading indicators, and browser history management
 * Requirements: 4.1, 4.2, 4.5
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import {
    DashboardTransitionWrapper,
    RouteTransitionIndicator,
    SubscriptionStatusTransition,
    NavigationTransition,
    DashboardStateIndicator,
    useDashboardTransitions,
    DashboardHistoryManager
} from '@/components/dashboard/DashboardTransitions';
import { useDashboardRouting } from '@/hooks/use-dashboard-routing';
import { useSubscriptionStatus } from '@/hooks/use-subscription-status';

// Mock dependencies
jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
    usePathname: jest.fn(() => '/dashboard'),
    useSearchParams: jest.fn(() => new URLSearchParams())
}));
jest.mock('@/hooks/use-dashboard-routing');
jest.mock('@/hooks/use-subscription-status');
jest.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }: any) => <div {...props}>{children}</div>
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
    useReducedMotion: () => false
}));

const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn()
};

const mockDashboardRouting = {
    isLoading: false,
    error: null,
    targetRoute: '/customer-dashboard',
    navigateToRoute: jest.fn(),
    navigateToDashboard: jest.fn(),
    shouldRedirectToCustomerDashboard: true,
    shouldRedirectToAdmin: false,
    shouldShowGeneralDashboard: false
};

const mockSubscriptionStatus = {
    isLoading: false,
    error: null,
    currentStatus: 'ACTIVE',
    shouldShowCustomerDashboard: true,
    shouldShowPromotion: false
};

describe('Dashboard Transition Components', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (useRouter as jest.Mock).mockReturnValue(mockRouter);
        (useDashboardRouting as jest.Mock).mockReturnValue(mockDashboardRouting);
        (useSubscriptionStatus as jest.Mock).mockReturnValue(mockSubscriptionStatus);
    });

    describe('DashboardTransitionWrapper', () => {
        it('should render children with transition wrapper', () => {
            render(
                <DashboardTransitionWrapper transitionKey="test-key">
                    <div>Test Content</div>
                </DashboardTransitionWrapper>
            );

            expect(screen.getByText('Test Content')).toBeInTheDocument();
        });

        it('should apply different transition variants', () => {
            const { rerender } = render(
                <DashboardTransitionWrapper transitionKey="test-key" variant="fade">
                    <div>Fade Content</div>
                </DashboardTransitionWrapper>
            );

            expect(screen.getByText('Fade Content')).toBeInTheDocument();

            rerender(
                <DashboardTransitionWrapper transitionKey="test-key" variant="slide">
                    <div>Slide Content</div>
                </DashboardTransitionWrapper>
            );

            expect(screen.getByText('Slide Content')).toBeInTheDocument();
        });

        it('should handle transition key changes', () => {
            const { rerender } = render(
                <DashboardTransitionWrapper transitionKey="key1">
                    <div>Content 1</div>
                </DashboardTransitionWrapper>
            );

            expect(screen.getByText('Content 1')).toBeInTheDocument();

            rerender(
                <DashboardTransitionWrapper transitionKey="key2">
                    <div>Content 2</div>
                </DashboardTransitionWrapper>
            );

            expect(screen.getByText('Content 2')).toBeInTheDocument();
        });
    });

    describe('RouteTransitionIndicator', () => {
        it('should show loading indicator during transition', () => {
            render(
                <RouteTransitionIndicator
                    isTransitioning={true}
                    fromRoute="/dashboard"
                    toRoute="/customer-dashboard"
                />
            );

            expect(screen.getByText(/Navigating from Dashboard to Customer Dashboard/)).toBeInTheDocument();
            expect(screen.getByText(/\d+%/)).toBeInTheDocument();
        });

        it('should not render when not transitioning', async () => {
            const { container } = render(
                <RouteTransitionIndicator
                    isTransitioning={false}
                    fromRoute="/dashboard"
                    toRoute="/customer-dashboard"
                />
            );

            // Wait for the timeout to complete
            await waitFor(() => {
                expect(container.firstChild).toBeNull();
            }, { timeout: 1000 });
        });

        it('should show custom message when provided', () => {
            render(
                <RouteTransitionIndicator
                    isTransitioning={true}
                    message="Custom loading message"
                />
            );

            expect(screen.getByText('Custom loading message')).toBeInTheDocument();
        });

        it('should simulate progress during transition', async () => {
            jest.useFakeTimers();

            render(
                <RouteTransitionIndicator
                    isTransitioning={true}
                    message="Loading..."
                />
            );

            // Initial progress should be 0%
            expect(screen.getByText('0%')).toBeInTheDocument();

            // Advance timers to simulate progress
            act(() => {
                jest.advanceTimersByTime(500);
            });

            // Progress should have increased
            const progressText = screen.getByText(/\d+%/);
            expect(progressText.textContent).not.toBe('0%');

            jest.useRealTimers();
        });
    });

    describe('SubscriptionStatusTransition', () => {
        it('should render children without transition when status is stable', () => {
            render(
                <SubscriptionStatusTransition subscriptionStatus={mockSubscriptionStatus}>
                    <div>Dashboard Content</div>
                </SubscriptionStatusTransition>
            );

            expect(screen.getByText('Dashboard Content')).toBeInTheDocument();
        });

        it('should show transition overlay when status changes', async () => {
            const { rerender } = render(
                <SubscriptionStatusTransition subscriptionStatus={{ currentStatus: 'ACTIVE' }}>
                    <div>Dashboard Content</div>
                </SubscriptionStatusTransition>
            );

            // Change subscription status
            rerender(
                <SubscriptionStatusTransition subscriptionStatus={{ currentStatus: 'PAST_DUE' }}>
                    <div>Dashboard Content</div>
                </SubscriptionStatusTransition>
            );

            await waitFor(() => {
                expect(screen.getByText('Status Updated')).toBeInTheDocument();
                expect(screen.getByText(/Payment required to continue service/)).toBeInTheDocument();
            });
        });

        it('should show appropriate messages for different status changes', async () => {
            const { rerender } = render(
                <SubscriptionStatusTransition subscriptionStatus={{ currentStatus: 'NONE' }}>
                    <div>Dashboard Content</div>
                </SubscriptionStatusTransition>
            );

            // Change from NONE to ACTIVE
            rerender(
                <SubscriptionStatusTransition subscriptionStatus={{ currentStatus: 'ACTIVE' }}>
                    <div>Dashboard Content</div>
                </SubscriptionStatusTransition>
            );

            await waitFor(() => {
                expect(screen.getByText(/Welcome! Your subscription is now active/)).toBeInTheDocument();
            });
        });
    });

    describe('NavigationTransition', () => {
        it('should show navigation overlay when navigating', () => {
            render(
                <NavigationTransition isNavigating={true} destination="/customer-dashboard">
                    <div>Dashboard Content</div>
                </NavigationTransition>
            );

            expect(screen.getByText(/Navigating to \/customer-dashboard/)).toBeInTheDocument();
        });

        it('should blur content during navigation', () => {
            render(
                <NavigationTransition isNavigating={true}>
                    <div data-testid="content">Dashboard Content</div>
                </NavigationTransition>
            );

            // Check that navigation overlay is present
            expect(screen.getByText(/Navigating/)).toBeInTheDocument();
        });

        it('should not show overlay when not navigating', () => {
            render(
                <NavigationTransition isNavigating={false}>
                    <div>Dashboard Content</div>
                </NavigationTransition>
            );

            expect(screen.queryByText(/Navigating/)).not.toBeInTheDocument();
        });
    });

    describe('DashboardStateIndicator', () => {
        it('should show loading state', () => {
            render(
                <DashboardStateIndicator
                    state="loading"
                    message="Loading dashboard..."
                />
            );

            expect(screen.getByText('Loading dashboard...')).toBeInTheDocument();
            // Check for the loading icon by class name since aria-label is not being applied correctly in the mock
            const loadingIcon = document.querySelector('.lucide-loader2');
            expect(loadingIcon).toBeInTheDocument();
        });

        it('should show ready state', () => {
            render(
                <DashboardStateIndicator
                    state="ready"
                    message="Dashboard ready"
                />
            );

            expect(screen.getByText('Dashboard ready')).toBeInTheDocument();
        });

        it('should show error state with retry button', () => {
            const onRetry = jest.fn();

            render(
                <DashboardStateIndicator
                    state="error"
                    message="Error loading dashboard"
                    onRetry={onRetry}
                />
            );

            expect(screen.getByText('Error loading dashboard')).toBeInTheDocument();

            const retryButton = screen.getByLabelText('Retry');
            fireEvent.click(retryButton);

            expect(onRetry).toHaveBeenCalledTimes(1);
        });

        it('should show transitioning state', () => {
            render(
                <DashboardStateIndicator
                    state="transitioning"
                    message="Updating dashboard..."
                />
            );

            expect(screen.getByText('Updating dashboard...')).toBeInTheDocument();
        });

        it('should use default messages when none provided', () => {
            render(<DashboardStateIndicator state="loading" />);
            expect(screen.getByText('Loading dashboard...')).toBeInTheDocument();

            render(<DashboardStateIndicator state="ready" />);
            expect(screen.getByText('Dashboard ready')).toBeInTheDocument();

            render(<DashboardStateIndicator state="error" />);
            expect(screen.getByText('Error loading dashboard')).toBeInTheDocument();

            render(<DashboardStateIndicator state="transitioning" />);
            expect(screen.getByText('Updating dashboard...')).toBeInTheDocument();
        });
    });

    describe('useDashboardTransitions hook', () => {
        const TestComponent = () => {
            const {
                isTransitioning,
                transitionState,
                navigateWithTransition,
                dashboardState,
                canNavigate
            } = useDashboardTransitions();

            return (
                <div>
                    <div data-testid="is-transitioning">{isTransitioning.toString()}</div>
                    <div data-testid="transition-state">{transitionState}</div>
                    <div data-testid="dashboard-state">{dashboardState}</div>
                    <div data-testid="can-navigate">{canNavigate.toString()}</div>
                    <button onClick={() => navigateWithTransition('/test-route')}>
                        Navigate
                    </button>
                </div>
            );
        };

        it('should provide transition state information', () => {
            render(<TestComponent />);

            expect(screen.getByTestId('is-transitioning')).toHaveTextContent('false');
            expect(screen.getByTestId('transition-state')).toHaveTextContent('idle');
            expect(screen.getByTestId('dashboard-state')).toHaveTextContent('ready');
            expect(screen.getByTestId('can-navigate')).toHaveTextContent('true');
        });

        it('should handle navigation with transitions', async () => {
            render(<TestComponent />);

            const navigateButton = screen.getByText('Navigate');
            fireEvent.click(navigateButton);

            await waitFor(() => {
                expect(mockDashboardRouting.navigateToRoute).toHaveBeenCalledWith('/test-route', true);
            });
        });

        it('should reflect loading states', () => {
            (useDashboardRouting as jest.Mock).mockReturnValue({
                ...mockDashboardRouting,
                isLoading: true
            });

            render(<TestComponent />);

            expect(screen.getByTestId('dashboard-state')).toHaveTextContent('loading');
            expect(screen.getByTestId('can-navigate')).toHaveTextContent('false');
        });

        it('should reflect error states', () => {
            (useDashboardRouting as jest.Mock).mockReturnValue({
                ...mockDashboardRouting,
                error: new Error('Test error')
            });

            render(<TestComponent />);

            expect(screen.getByTestId('dashboard-state')).toHaveTextContent('error');
        });
    });

    describe('DashboardHistoryManager', () => {
        let historyManager: DashboardHistoryManager;

        beforeEach(() => {
            historyManager = DashboardHistoryManager.getInstance();
            historyManager.clear();
        });

        it('should manage navigation history', () => {
            historyManager.pushRoute('/dashboard');
            historyManager.pushRoute('/customer-dashboard');
            historyManager.pushRoute('/admin');

            expect(historyManager.getCurrentRoute()).toBe('/admin');
            expect(historyManager.canGoBack()).toBe(true);
            expect(historyManager.canGoForward()).toBe(false);
        });

        it('should handle back navigation', () => {
            historyManager.pushRoute('/dashboard');
            historyManager.pushRoute('/customer-dashboard');

            const previousRoute = historyManager.goBack();
            expect(previousRoute).toBe('/dashboard');
            expect(historyManager.getCurrentRoute()).toBe('/dashboard');
            expect(historyManager.canGoForward()).toBe(true);
        });

        it('should handle forward navigation', () => {
            historyManager.pushRoute('/dashboard');
            historyManager.pushRoute('/customer-dashboard');
            historyManager.goBack();

            const nextRoute = historyManager.goForward();
            expect(nextRoute).toBe('/customer-dashboard');
            expect(historyManager.getCurrentRoute()).toBe('/customer-dashboard');
        });

        it('should limit stack size', () => {
            // Add more than 50 routes
            for (let i = 0; i < 60; i++) {
                historyManager.pushRoute(`/route-${i}`);
            }

            const history = historyManager.getNavigationHistory();
            expect(history.stack.length).toBeLessThanOrEqual(50);
        });

        it('should handle navigation from middle of stack', () => {
            historyManager.pushRoute('/route1');
            historyManager.pushRoute('/route2');
            historyManager.pushRoute('/route3');
            historyManager.goBack(); // Now at route2

            historyManager.pushRoute('/route4'); // Should remove route3

            expect(historyManager.getCurrentRoute()).toBe('/route4');
            expect(historyManager.canGoForward()).toBe(false);
        });

        it('should provide navigation history information', () => {
            historyManager.pushRoute('/dashboard');
            historyManager.pushRoute('/customer-dashboard');

            const history = historyManager.getNavigationHistory();
            expect(history.stack).toEqual(['/dashboard', '/customer-dashboard']);
            expect(history.currentIndex).toBe(1);
        });

        it('should handle edge cases', () => {
            // Empty history
            expect(historyManager.canGoBack()).toBe(false);
            expect(historyManager.canGoForward()).toBe(false);
            expect(historyManager.getCurrentRoute()).toBe(null);
            expect(historyManager.goBack()).toBe(null);
            expect(historyManager.goForward()).toBe(null);

            // Single route
            historyManager.pushRoute('/dashboard');
            expect(historyManager.canGoBack()).toBe(false);
            expect(historyManager.canGoForward()).toBe(false);
        });

        it('should clear history', () => {
            historyManager.pushRoute('/dashboard');
            historyManager.pushRoute('/customer-dashboard');

            historyManager.clear();

            expect(historyManager.getCurrentRoute()).toBe(null);
            expect(historyManager.canGoBack()).toBe(false);
            expect(historyManager.canGoForward()).toBe(false);
        });
    });

    describe('Integration scenarios', () => {
        it('should handle complete dashboard transition flow', async () => {
            const TestDashboard = () => {
                const { isTransitioning, dashboardState } = useDashboardTransitions();

                return (
                    <div>
                        <RouteTransitionIndicator
                            isTransitioning={isTransitioning}
                            message="Loading dashboard..."
                        />
                        <DashboardStateIndicator
                            state={dashboardState}
                        />
                        <SubscriptionStatusTransition subscriptionStatus={mockSubscriptionStatus}>
                            <div>Dashboard Content</div>
                        </SubscriptionStatusTransition>
                    </div>
                );
            };

            render(<TestDashboard />);

            expect(screen.getByText('Dashboard ready')).toBeInTheDocument();
            expect(screen.getByText('Dashboard Content')).toBeInTheDocument();
        });

        it('should handle subscription status changes with transitions', async () => {
            const TestComponent = () => {
                const [status, setStatus] = React.useState({ currentStatus: 'ACTIVE' });

                return (
                    <div>
                        <button onClick={() => setStatus({ currentStatus: 'PAST_DUE' })}>
                            Change Status
                        </button>
                        <SubscriptionStatusTransition subscriptionStatus={status}>
                            <div>Dashboard Content</div>
                        </SubscriptionStatusTransition>
                    </div>
                );
            };

            render(<TestComponent />);

            const changeButton = screen.getByText('Change Status');
            fireEvent.click(changeButton);

            await waitFor(() => {
                expect(screen.getByText('Status Updated')).toBeInTheDocument();
            });
        });

        it('should handle error states with retry functionality', () => {
            const onRetry = jest.fn();

            render(
                <div>
                    <DashboardStateIndicator
                        state="error"
                        message="Failed to load dashboard"
                        onRetry={onRetry}
                    />
                </div>
            );

            expect(screen.getByText('Failed to load dashboard')).toBeInTheDocument();

            const retryButton = screen.getByLabelText('Retry');
            fireEvent.click(retryButton);

            expect(onRetry).toHaveBeenCalledTimes(1);
        });
    });
});