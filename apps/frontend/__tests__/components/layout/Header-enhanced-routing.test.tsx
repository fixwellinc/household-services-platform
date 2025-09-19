import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import Header from '@/components/layout/Header';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from '@/contexts/LocationContext';
import { useDashboardRouting } from '@/hooks/use-dashboard-routing';
import { useDashboardTransitions } from '@/components/dashboard/DashboardTransitions';

// Mock the hooks
jest.mock('@/contexts/AuthContext');
jest.mock('@/contexts/LocationContext');
jest.mock('@/hooks/use-dashboard-routing');
jest.mock('@/components/dashboard/DashboardTransitions');
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseLocation = useLocation as jest.MockedFunction<typeof useLocation>;
const mockUseDashboardRouting = useDashboardRouting as jest.MockedFunction<typeof useDashboardRouting>;
const mockUseDashboardTransitions = useDashboardTransitions as jest.MockedFunction<typeof useDashboardTransitions>;

describe('Header Enhanced Routing', () => {
  const mockNavigateWithTransition = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
      logout: jest.fn(),
      isHydrated: true,
      login: jest.fn(),
      register: jest.fn(),
      isAuthenticated: false,
    });

    mockUseLocation.mockReturnValue({
      userLocation: null,
      isInBC: false,
      isLoading: false,
      error: null,
      refreshLocation: jest.fn(),
    });

    mockUseDashboardRouting.mockReturnValue({
      getDashboardUrl: jest.fn(() => '/dashboard'),
      isLoading: false,
      shouldRedirectToCustomerDashboard: false,
      shouldShowGeneralDashboard: true,
      availableRoutes: ['/dashboard'],
      navigateToRoute: jest.fn(),
      navigateToDashboard: jest.fn(),
      isCurrentRoute: jest.fn(() => false),
    });

    mockUseDashboardTransitions.mockReturnValue({
      navigateWithTransition: mockNavigateWithTransition,
      canNavigate: true,
      isTransitioning: false,
      transitionState: 'idle',
      getDashboardState: jest.fn(() => ({ isLoading: false, hasError: false })),
    });
  });

  describe('Dashboard Navigation for Different User Types', () => {
    it('should show correct dashboard label for admin users', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', name: 'Admin User', email: 'admin@test.com', role: 'ADMIN' },
        isLoading: false,
        logout: jest.fn(),
        isHydrated: true,
        login: jest.fn(),
        register: jest.fn(),
        isAuthenticated: true,
      });

      mockUseDashboardRouting.mockReturnValue({
        getDashboardUrl: jest.fn(() => '/admin'),
        isLoading: false,
        shouldRedirectToCustomerDashboard: false,
        shouldShowGeneralDashboard: false,
        availableRoutes: ['/admin'],
        navigateToRoute: jest.fn(),
        navigateToDashboard: jest.fn(),
        isCurrentRoute: jest.fn(() => false),
      });

      render(<Header />);
      
      expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
    });

    it('should show correct dashboard label for customer users with subscription', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', name: 'Customer User', email: 'customer@test.com', role: 'CUSTOMER' },
        isLoading: false,
        logout: jest.fn(),
        isHydrated: true,
        login: jest.fn(),
        register: jest.fn(),
        isAuthenticated: true,
      });

      mockUseDashboardRouting.mockReturnValue({
        getDashboardUrl: jest.fn(() => '/customer-dashboard'),
        isLoading: false,
        shouldRedirectToCustomerDashboard: true,
        shouldShowGeneralDashboard: false,
        availableRoutes: ['/customer-dashboard'],
        navigateToRoute: jest.fn(),
        navigateToDashboard: jest.fn(),
        isCurrentRoute: jest.fn(() => false),
      });

      render(<Header />);
      
      expect(screen.getByText('Customer Dashboard')).toBeInTheDocument();
    });

    it('should show loading state when dashboard routing is loading', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', name: 'User', email: 'user@test.com', role: 'CUSTOMER' },
        isLoading: false,
        logout: jest.fn(),
        isHydrated: true,
        login: jest.fn(),
        register: jest.fn(),
        isAuthenticated: true,
      });

      mockUseDashboardRouting.mockReturnValue({
        getDashboardUrl: jest.fn(() => '/dashboard'),
        isLoading: true,
        shouldRedirectToCustomerDashboard: false,
        shouldShowGeneralDashboard: true,
        availableRoutes: [],
        navigateToRoute: jest.fn(),
        navigateToDashboard: jest.fn(),
        isCurrentRoute: jest.fn(() => false),
      });

      render(<Header />);
      
      expect(screen.getByText('Dashboard...')).toBeInTheDocument();
    });
  });

  describe('Enhanced Dashboard Navigation', () => {
    it('should use enhanced routing for dashboard navigation', async () => {
      const mockGetDashboardUrl = jest.fn(() => '/customer-dashboard');
      
      mockUseAuth.mockReturnValue({
        user: { id: '1', name: 'Customer User', email: 'customer@test.com', role: 'CUSTOMER' },
        isLoading: false,
        logout: jest.fn(),
        isHydrated: true,
        login: jest.fn(),
        register: jest.fn(),
        isAuthenticated: true,
      });

      mockUseDashboardRouting.mockReturnValue({
        getDashboardUrl: mockGetDashboardUrl,
        isLoading: false,
        shouldRedirectToCustomerDashboard: true,
        shouldShowGeneralDashboard: false,
        availableRoutes: ['/customer-dashboard'],
        navigateToRoute: jest.fn(),
        navigateToDashboard: jest.fn(),
        isCurrentRoute: jest.fn(() => false),
      });

      render(<Header />);
      
      // Click on dashboard button in user menu
      const userMenuButton = screen.getByRole('button', { name: /customer user/i });
      fireEvent.click(userMenuButton);
      
      const dashboardButton = screen.getByRole('button', { name: /customer dashboard/i });
      fireEvent.click(dashboardButton);

      await waitFor(() => {
        expect(mockGetDashboardUrl).toHaveBeenCalled();
        expect(mockNavigateWithTransition).toHaveBeenCalledWith('/customer-dashboard', true);
      });
    });

    it('should handle navigation errors with fallback', async () => {
      const mockGetDashboardUrl = jest.fn(() => '/customer-dashboard');
      const mockRouter = { push: jest.fn() };
      
      // Mock navigation failure
      mockNavigateWithTransition.mockRejectedValue(new Error('Navigation failed'));
      
      mockUseAuth.mockReturnValue({
        user: { id: '1', name: 'Customer User', email: 'customer@test.com', role: 'CUSTOMER' },
        isLoading: false,
        logout: jest.fn(),
        isHydrated: true,
        login: jest.fn(),
        register: jest.fn(),
        isAuthenticated: true,
      });

      mockUseDashboardRouting.mockReturnValue({
        getDashboardUrl: mockGetDashboardUrl,
        isLoading: false,
        shouldRedirectToCustomerDashboard: true,
        shouldShowGeneralDashboard: false,
        availableRoutes: ['/customer-dashboard'],
        navigateToRoute: jest.fn(),
        navigateToDashboard: jest.fn(),
        isCurrentRoute: jest.fn(() => false),
      });

      // Mock useRouter
      jest.doMock('next/navigation', () => ({
        useRouter: () => mockRouter,
      }));

      render(<Header />);
      
      // Click on dashboard button
      const userMenuButton = screen.getByRole('button', { name: /customer user/i });
      fireEvent.click(userMenuButton);
      
      const dashboardButton = screen.getByRole('button', { name: /customer dashboard/i });
      fireEvent.click(dashboardButton);

      await waitFor(() => {
        expect(mockNavigateWithTransition).toHaveBeenCalledWith('/customer-dashboard', true);
        // Should fallback to router.push when transition fails
        expect(mockRouter.push).toHaveBeenCalledWith('/customer-dashboard');
      });
    });

    it('should disable dashboard navigation when loading or cannot navigate', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', name: 'Customer User', email: 'customer@test.com', role: 'CUSTOMER' },
        isLoading: false,
        logout: jest.fn(),
        isHydrated: true,
        login: jest.fn(),
        register: jest.fn(),
        isAuthenticated: true,
      });

      mockUseDashboardRouting.mockReturnValue({
        getDashboardUrl: jest.fn(() => '/customer-dashboard'),
        isLoading: true,
        shouldRedirectToCustomerDashboard: true,
        shouldShowGeneralDashboard: false,
        availableRoutes: [],
        navigateToRoute: jest.fn(),
        navigateToDashboard: jest.fn(),
        isCurrentRoute: jest.fn(() => false),
      });

      mockUseDashboardTransitions.mockReturnValue({
        navigateWithTransition: mockNavigateWithTransition,
        canNavigate: false,
        isTransitioning: true,
        transitionState: 'navigating',
        getDashboardState: jest.fn(() => ({ isLoading: true, hasError: false })),
      });

      render(<Header />);
      
      // Open user menu
      const userMenuButton = screen.getByRole('button', { name: /customer user/i });
      fireEvent.click(userMenuButton);
      
      // Dashboard button should be disabled
      const dashboardButton = screen.getByRole('button', { name: /dashboard\.\.\./i });
      expect(dashboardButton).toBeDisabled();
      expect(dashboardButton).toHaveClass('opacity-50', 'cursor-not-allowed');
    });
  });

  describe('Mobile Navigation Enhanced Routing', () => {
    it('should use enhanced routing in mobile menu', async () => {
      const mockGetDashboardUrl = jest.fn(() => '/admin');
      
      mockUseAuth.mockReturnValue({
        user: { id: '1', name: 'Admin User', email: 'admin@test.com', role: 'ADMIN' },
        isLoading: false,
        logout: jest.fn(),
        isHydrated: true,
        login: jest.fn(),
        register: jest.fn(),
        isAuthenticated: true,
      });

      mockUseDashboardRouting.mockReturnValue({
        getDashboardUrl: mockGetDashboardUrl,
        isLoading: false,
        shouldRedirectToCustomerDashboard: false,
        shouldShowGeneralDashboard: false,
        availableRoutes: ['/admin'],
        navigateToRoute: jest.fn(),
        navigateToDashboard: jest.fn(),
        isCurrentRoute: jest.fn(() => false),
      });

      render(<Header />);
      
      // Open mobile menu
      const mobileMenuButton = screen.getByLabelText('Toggle mobile menu');
      fireEvent.click(mobileMenuButton);
      
      // Click dashboard in mobile menu
      const mobileDashboardButton = screen.getAllByText('Admin Dashboard')[1]; // Second one is in mobile menu
      fireEvent.click(mobileDashboardButton);

      await waitFor(() => {
        expect(mockGetDashboardUrl).toHaveBeenCalled();
        expect(mockNavigateWithTransition).toHaveBeenCalledWith('/admin', true);
      });
    });
  });
});