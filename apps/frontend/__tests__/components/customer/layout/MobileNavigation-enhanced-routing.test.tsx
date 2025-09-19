import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import MobileNavigation from '@/components/customer/layout/MobileNavigation';
import { useDashboardRouting } from '@/hooks/use-dashboard-routing';
import { useDashboardTransitions } from '@/components/dashboard/DashboardTransitions';

// Mock the hooks
jest.mock('@/hooks/use-dashboard-routing');
jest.mock('@/components/dashboard/DashboardTransitions');

const mockUseDashboardRouting = useDashboardRouting as jest.MockedFunction<typeof useDashboardRouting>;
const mockUseDashboardTransitions = useDashboardTransitions as jest.MockedFunction<typeof useDashboardTransitions>;

describe('MobileNavigation Enhanced Routing', () => {
  const mockNavigateWithTransition = jest.fn();
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
  });

  describe('Enhanced Dashboard Navigation', () => {
    it('should use dynamic dashboard URL from routing hook', () => {
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
          isConnected={true}
          notificationCount={0}
          userTier="STARTER"
          onLogout={mockOnLogout}
        />
      );

      // Open mobile menu
      const menuButton = screen.getByLabelText('Toggle menu');
      fireEvent.click(menuButton);

      // Check that dashboard link uses dynamic URL
      expect(mockGetDashboardUrl).toHaveBeenCalled();
    });

    it('should show loading state when dashboard routing is loading', () => {
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
          isConnected={true}
          notificationCount={0}
          userTier="STARTER"
          onLogout={mockOnLogout}
        />
      );

      // Open mobile menu
      const menuButton = screen.getByLabelText('Toggle menu');
      fireEvent.click(menuButton);

      // Should show loading state
      expect(screen.getByText('Dashboard...')).toBeInTheDocument();
    });

    it('should handle dashboard navigation with enhanced routing', async () => {
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
          isConnected={true}
          notificationCount={0}
          userTier="STARTER"
          onLogout={mockOnLogout}
        />
      );

      // Open mobile menu
      const menuButton = screen.getByLabelText('Toggle menu');
      fireEvent.click(menuButton);

      // Click dashboard button
      const dashboardButton = screen.getByRole('button', { name: /dashboard/i });
      fireEvent.click(dashboardButton);

      await waitFor(() => {
        expect(mockGetDashboardUrl).toHaveBeenCalled();
        expect(mockNavigateWithTransition).toHaveBeenCalledWith('/customer-dashboard', true);
      });
    });

    it('should disable dashboard navigation when loading', () => {
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
          isConnected={true}
          notificationCount={0}
          userTier="STARTER"
          onLogout={mockOnLogout}
        />
      );

      // Open mobile menu
      const menuButton = screen.getByLabelText('Toggle menu');
      fireEvent.click(menuButton);

      // Dashboard button should be disabled
      const dashboardButton = screen.getByRole('button', { name: /dashboard\.\.\./i });
      expect(dashboardButton).toBeDisabled();
      expect(dashboardButton).toHaveClass('opacity-50', 'cursor-not-allowed');
    });

    it('should handle navigation errors with fallback', async () => {
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
          isConnected={true}
          notificationCount={0}
          userTier="STARTER"
          onLogout={mockOnLogout}
        />
      );

      // Open mobile menu
      const menuButton = screen.getByLabelText('Toggle menu');
      fireEvent.click(menuButton);

      // Click dashboard button
      const dashboardButton = screen.getByRole('button', { name: /dashboard/i });
      fireEvent.click(dashboardButton);

      await waitFor(() => {
        expect(mockNavigateWithTransition).toHaveBeenCalledWith('/customer-dashboard', true);
        // Should fallback to direct navigation when transition fails
        expect(window.location.href).toBe('/customer-dashboard');
      });
    });
  });

  describe('Dynamic Anchor Links', () => {
    it('should update perks and notifications links based on dashboard URL', () => {
      const mockGetDashboardUrl = jest.fn(() => '/admin');
      
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

      render(
        <MobileNavigation 
          isConnected={true}
          notificationCount={5}
          userTier="PRIORITY"
          onLogout={mockOnLogout}
        />
      );

      // Open mobile menu
      const menuButton = screen.getByLabelText('Toggle menu');
      fireEvent.click(menuButton);

      // Check that perks link uses dynamic dashboard URL
      const perksLink = screen.getByRole('link', { name: /perks & benefits/i });
      expect(perksLink).toHaveAttribute('href', '/admin#perks');

      // Check that notifications link uses dynamic dashboard URL
      const notificationsLink = screen.getByRole('link', { name: /notifications/i });
      expect(notificationsLink).toHaveAttribute('href', '/admin#notifications');
    });

    it('should show notification badge when count > 0', () => {
      render(
        <MobileNavigation 
          isConnected={true}
          notificationCount={3}
          userTier="STARTER"
          onLogout={mockOnLogout}
        />
      );

      // Open mobile menu
      const menuButton = screen.getByLabelText('Toggle menu');
      fireEvent.click(menuButton);

      // Should show notification badge
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });
});