import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import { MobileNavigation } from '@/components/ui/touch/MobileNavigation';
import { useDashboardRouting } from '@/hooks/use-dashboard-routing';
import { useDashboardTransitions } from '@/components/dashboard/DashboardTransitions';
import { useGestureSupport } from '@/hooks/use-gesture-support';

// Mock the hooks
jest.mock('@/hooks/use-dashboard-routing');
jest.mock('@/components/dashboard/DashboardTransitions');
jest.mock('@/hooks/use-gesture-support');

const mockUseDashboardRouting = useDashboardRouting as jest.MockedFunction<typeof useDashboardRouting>;
const mockUseDashboardTransitions = useDashboardTransitions as jest.MockedFunction<typeof useDashboardTransitions>;
const mockUseGestureSupport = useGestureSupport as jest.MockedFunction<typeof useGestureSupport>;

describe('Touch MobileNavigation Enhanced Routing', () => {
  const mockNavigateWithTransition = jest.fn();
  const mockOnToggle = jest.fn();
  const mockOnClose = jest.fn();
  const mockOnLogout = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
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

    mockUseDashboardTransitions.mockReturnValue({
      navigateWithTransition: mockNavigateWithTransition,
      canNavigate: true,
      isTransitioning: false,
      transitionState: 'idle',
      getDashboardState: jest.fn(() => ({ isLoading: false, hasError: false })),
    });

    mockUseGestureSupport.mockReturnValue({
      gestureHandlers: {},
      isGestureSupported: true,
    });
  });

  describe('Enhanced Dashboard Navigation', () => {
    it('should show correct dashboard label for different user types', () => {
      const user = { name: 'Admin User', email: 'admin@test.com', role: 'ADMIN' };
      
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

      render(
        <MobileNavigation 
          isOpen={true}
          onToggle={mockOnToggle}
          onClose={mockOnClose}
          user={user}
          onLogout={mockOnLogout}
        />
      );

      expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
    });

    it('should show customer dashboard label for customer with subscription', () => {
      const user = { name: 'Customer User', email: 'customer@test.com', role: 'CUSTOMER' };
      
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

      render(
        <MobileNavigation 
          isOpen={true}
          onToggle={mockOnToggle}
          onClose={mockOnClose}
          user={user}
          onLogout={mockOnLogout}
        />
      );

      expect(screen.getByText('Customer Dashboard')).toBeInTheDocument();
    });

    it('should show loading state when dashboard routing is loading', () => {
      const user = { name: 'User', email: 'user@test.com', role: 'CUSTOMER' };
      
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

      mockUseDashboardTransitions.mockReturnValue({
        navigateWithTransition: mockNavigateWithTransition,
        canNavigate: false,
        isTransitioning: true,
        transitionState: 'loading',
        getDashboardState: jest.fn(() => ({ isLoading: true, hasError: false })),
      });

      render(
        <MobileNavigation 
          isOpen={true}
          onToggle={mockOnToggle}
          onClose={mockOnClose}
          user={user}
          onLogout={mockOnLogout}
        />
      );

      expect(screen.getByText('Dashboard...')).toBeInTheDocument();
    });

    it('should handle dashboard navigation with enhanced routing', async () => {
      const user = { name: 'Customer User', email: 'customer@test.com', role: 'CUSTOMER' };
      const mockGetDashboardUrl = jest.fn(() => '/customer-dashboard');
      
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

      render(
        <MobileNavigation 
          isOpen={true}
          onToggle={mockOnToggle}
          onClose={mockOnClose}
          user={user}
          onLogout={mockOnLogout}
        />
      );

      // Click dashboard button
      const dashboardButton = screen.getByRole('button', { name: /customer dashboard/i });
      fireEvent.click(dashboardButton);

      await waitFor(() => {
        expect(mockGetDashboardUrl).toHaveBeenCalled();
        expect(mockNavigateWithTransition).toHaveBeenCalledWith('/customer-dashboard', true);
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('should disable dashboard navigation when loading or cannot navigate', () => {
      const user = { name: 'Customer User', email: 'customer@test.com', role: 'CUSTOMER' };
      
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

      render(
        <MobileNavigation 
          isOpen={true}
          onToggle={mockOnToggle}
          onClose={mockOnClose}
          user={user}
          onLogout={mockOnLogout}
        />
      );

      // Dashboard button should be disabled
      const dashboardButton = screen.getByRole('button', { name: /dashboard\.\.\./i });
      expect(dashboardButton).toBeDisabled();
      expect(dashboardButton).toHaveClass('opacity-50', 'cursor-not-allowed');
    });

    it('should handle navigation errors with fallback', async () => {
      const user = { name: 'Customer User', email: 'customer@test.com', role: 'CUSTOMER' };
      const mockGetDashboardUrl = jest.fn(() => '/customer-dashboard');
      
      // Mock navigation failure
      mockNavigateWithTransition.mockRejectedValue(new Error('Navigation failed'));
      
      // Mock window.location.href
      delete (window as any).location;
      (window as any).location = { href: '' };

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

      render(
        <MobileNavigation 
          isOpen={true}
          onToggle={mockOnToggle}
          onClose={mockOnClose}
          user={user}
          onLogout={mockOnLogout}
        />
      );

      // Click dashboard button
      const dashboardButton = screen.getByRole('button', { name: /customer dashboard/i });
      fireEvent.click(dashboardButton);

      await waitFor(() => {
        expect(mockNavigateWithTransition).toHaveBeenCalledWith('/customer-dashboard', true);
        // Should fallback to direct navigation when transition fails
        expect(window.location.href).toBe('/customer-dashboard');
      });
    });
  });

  describe('Fallback Navigation Logic', () => {
    it('should use correct fallback URLs for different user roles', async () => {
      const adminUser = { name: 'Admin User', email: 'admin@test.com', role: 'ADMIN' };
      
      // Mock navigation failure
      mockNavigateWithTransition.mockRejectedValue(new Error('Navigation failed'));
      
      // Mock window.location.href
      delete (window as any).location;
      (window as any).location = { href: '' };

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

      render(
        <MobileNavigation 
          isOpen={true}
          onToggle={mockOnToggle}
          onClose={mockOnClose}
          user={adminUser}
          onLogout={mockOnLogout}
        />
      );

      // Click dashboard button
      const dashboardButton = screen.getByRole('button', { name: /admin dashboard/i });
      fireEvent.click(dashboardButton);

      await waitFor(() => {
        // Should fallback to /admin for admin users
        expect(window.location.href).toBe('/admin');
      });
    });

    it('should use general dashboard fallback for users without subscription', async () => {
      const user = { name: 'User', email: 'user@test.com', role: 'CUSTOMER' };
      
      // Mock navigation failure
      mockNavigateWithTransition.mockRejectedValue(new Error('Navigation failed'));
      
      // Mock window.location.href
      delete (window as any).location;
      (window as any).location = { href: '' };

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

      render(
        <MobileNavigation 
          isOpen={true}
          onToggle={mockOnToggle}
          onClose={mockOnClose}
          user={user}
          onLogout={mockOnLogout}
        />
      );

      // Click dashboard button
      const dashboardButton = screen.getByRole('button', { name: /^dashboard$/i });
      fireEvent.click(dashboardButton);

      await waitFor(() => {
        // Should fallback to /dashboard for users without subscription
        expect(window.location.href).toBe('/dashboard');
      });
    });
  });
});