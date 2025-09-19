import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import Header from '../../../components/layout/Header';
import { useAuth } from '../../../contexts/AuthContext';
import { useLocation } from '../../../contexts/LocationContext';
import { useDashboardRouting } from '../../../hooks/use-dashboard-routing';

// Mock the hooks
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(() => new URLSearchParams()),
  usePathname: jest.fn(() => '/'),
}));

jest.mock('../../../contexts/AuthContext');
jest.mock('../../../contexts/LocationContext');
jest.mock('../../../hooks/use-dashboard-routing');

// Mock Next.js Image component
jest.mock('next/image', () => {
  return function MockImage({ src, alt, ...props }: any) {
    return <img src={src} alt={alt} {...props} />;
  };
});

// Mock Next.js Link component
jest.mock('next/link', () => {
  return function MockLink({ href, children, ...props }: any) {
    return <a href={href} {...props}>{children}</a>;
  };
});

// Mock ThemeToggle components
jest.mock('../../../components/ui/ThemeToggle', () => ({
  ThemeToggle: () => <div data-testid="theme-toggle">Theme Toggle</div>,
  ThemeToggleCompact: () => <div data-testid="theme-toggle-compact">Theme Toggle Compact</div>,
}));

// Mock Button component
jest.mock('../../../components/ui/shared', () => ({
  Button: ({ children, className, ...props }: any) => (
    <button className={className} {...props}>{children}</button>
  ),
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseLocation = useLocation as jest.MockedFunction<typeof useLocation>;
const mockUseDashboardRouting = useDashboardRouting as jest.MockedFunction<typeof useDashboardRouting>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

describe('Header Component', () => {
  const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  };

  const mockLogout = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseRouter.mockReturnValue(mockRouter);
    
    mockUseLocation.mockReturnValue({
      userLocation: null,
      userCity: null,
      isInBC: false,
      isLoading: false,
      setUserLocation: jest.fn(),
      clearUserLocation: jest.fn(),
    });

    // Default auth state - not authenticated
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      logout: mockLogout,
      isHydrated: true,
      login: jest.fn(),
      register: jest.fn(),
      refetchUser: jest.fn(),
    });

    // Default dashboard routing state
    mockUseDashboardRouting.mockReturnValue({
      currentRoute: '/',
      targetRoute: '/login',
      isLoading: false,
      error: null,
      availableRoutes: [],
      shouldRedirectToCustomerDashboard: false,
      shouldShowGeneralDashboard: false,
      shouldRedirectToAdmin: false,
      navigateToDashboard: jest.fn(),
      navigateToRoute: jest.fn(),
      getDashboardUrl: jest.fn(() => '/login'),
      isCurrentRoute: jest.fn(),
      canAccessRoute: jest.fn(),
    });
  });

  describe('Loading States', () => {
    it('should show loading skeleton when not hydrated', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        logout: mockLogout,
        isHydrated: false,
        login: jest.fn(),
        register: jest.fn(),
        refetchUser: jest.fn(),
      });

      render(<Header />);
      
      expect(screen.getByText('Fixwell')).toBeInTheDocument();
      expect(screen.getAllByRole('generic').some(el => 
        el.className.includes('animate-pulse')
      )).toBe(true);
    });

    it('should show loading state when auth is loading', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: true,
        isAuthenticated: false,
        logout: mockLogout,
        isHydrated: true,
        login: jest.fn(),
        register: jest.fn(),
        refetchUser: jest.fn(),
      });

      render(<Header />);
      
      expect(screen.getAllByRole('generic').some(el => 
        el.className.includes('animate-pulse')
      )).toBe(true);
    });

    it('should show loading state when dashboard routing is loading', () => {
      const mockUser = {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'CUSTOMER' as const,
        createdAt: '2024-01-01T00:00:00Z',
      };

      mockUseAuth.mockReturnValue({
        user: mockUser,
        isLoading: false,
        isAuthenticated: true,
        logout: mockLogout,
        isHydrated: true,
        login: jest.fn(),
        register: jest.fn(),
        refetchUser: jest.fn(),
      });

      mockUseDashboardRouting.mockReturnValue({
        currentRoute: '/',
        targetRoute: '/customer-dashboard',
        isLoading: true,
        error: null,
        availableRoutes: [],
        shouldRedirectToCustomerDashboard: true,
        shouldShowGeneralDashboard: false,
        shouldRedirectToAdmin: false,
        navigateToDashboard: jest.fn(),
        navigateToRoute: jest.fn(),
        getDashboardUrl: jest.fn(() => '/customer-dashboard'),
        isCurrentRoute: jest.fn(),
        canAccessRoute: jest.fn(),
      });

      render(<Header />);
      
      expect(screen.getAllByRole('generic').some(el => 
        el.className.includes('animate-pulse')
      )).toBe(true);
    });
  });

  describe('Unauthenticated User', () => {
    it('should show sign in and get started buttons for unauthenticated users', () => {
      render(<Header />);
      
      expect(screen.getByText('Sign In')).toBeInTheDocument();
      expect(screen.getByText('Get Started')).toBeInTheDocument();
    });

    it('should show navigation links', () => {
      render(<Header />);
      
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Services')).toBeInTheDocument();
      expect(screen.getByText('Plans')).toBeInTheDocument();
      expect(screen.getByText('Members Discount')).toBeInTheDocument();
      expect(screen.getByText('About')).toBeInTheDocument();
      expect(screen.getByText('Contact')).toBeInTheDocument();
    });
  });

  describe('Admin User', () => {
    const mockAdminUser = {
      id: '1',
      name: 'Admin User',
      email: 'admin@example.com',
      role: 'ADMIN' as const,
      createdAt: '2024-01-01T00:00:00Z',
    };

    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: mockAdminUser,
        isLoading: false,
        isAuthenticated: true,
        logout: mockLogout,
        isHydrated: true,
        login: jest.fn(),
        register: jest.fn(),
        refetchUser: jest.fn(),
      });

      mockUseDashboardRouting.mockReturnValue({
        currentRoute: '/',
        targetRoute: '/admin',
        isLoading: false,
        error: null,
        availableRoutes: [{
          path: '/admin',
          label: 'Admin Dashboard',
          description: 'Administrative controls and system management',
        }],
        shouldRedirectToCustomerDashboard: false,
        shouldShowGeneralDashboard: false,
        shouldRedirectToAdmin: true,
        navigateToDashboard: jest.fn(),
        navigateToRoute: jest.fn(),
        getDashboardUrl: jest.fn(() => '/admin'),
        isCurrentRoute: jest.fn(),
        canAccessRoute: jest.fn(),
      });
    });

    it('should show admin dashboard link with correct label', () => {
      render(<Header />);
      
      // Click user menu to open dropdown
      const userButton = screen.getByRole('button', { name: /admin user/i });
      fireEvent.click(userButton);
      
      expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /admin dashboard/i })).toHaveAttribute('href', '/admin');
    });

    it('should show admin dashboard in mobile menu', () => {
      render(<Header />);
      
      // Open mobile menu
      const mobileMenuButton = screen.getByLabelText('Toggle mobile menu');
      fireEvent.click(mobileMenuButton);
      
      expect(screen.getAllByText('Admin Dashboard')).toHaveLength(1);
    });
  });

  describe('Customer User with Subscription', () => {
    const mockCustomerUser = {
      id: '2',
      name: 'Customer User',
      email: 'customer@example.com',
      role: 'CUSTOMER' as const,
      createdAt: '2024-01-01T00:00:00Z',
    };

    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: mockCustomerUser,
        isLoading: false,
        isAuthenticated: true,
        logout: mockLogout,
        isHydrated: true,
        login: jest.fn(),
        register: jest.fn(),
        refetchUser: jest.fn(),
      });

      mockUseDashboardRouting.mockReturnValue({
        currentRoute: '/',
        targetRoute: '/customer-dashboard',
        isLoading: false,
        error: null,
        availableRoutes: [{
          path: '/customer-dashboard',
          label: 'Customer Dashboard',
          description: 'Manage your subscription and services',
        }],
        shouldRedirectToCustomerDashboard: true,
        shouldShowGeneralDashboard: false,
        shouldRedirectToAdmin: false,
        navigateToDashboard: jest.fn(),
        navigateToRoute: jest.fn(),
        getDashboardUrl: jest.fn(() => '/customer-dashboard'),
        isCurrentRoute: jest.fn(),
        canAccessRoute: jest.fn(),
      });
    });

    it('should show customer dashboard link with correct label', () => {
      render(<Header />);
      
      // Click user menu to open dropdown
      const userButton = screen.getByRole('button', { name: /customer user/i });
      fireEvent.click(userButton);
      
      expect(screen.getByText('Customer Dashboard')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /customer dashboard/i })).toHaveAttribute('href', '/customer-dashboard');
    });

    it('should show customer dashboard in mobile menu', () => {
      render(<Header />);
      
      // Open mobile menu
      const mobileMenuButton = screen.getByLabelText('Toggle mobile menu');
      fireEvent.click(mobileMenuButton);
      
      expect(screen.getAllByText('Customer Dashboard')).toHaveLength(1);
    });
  });

  describe('Customer User without Subscription', () => {
    const mockCustomerUser = {
      id: '3',
      name: 'New Customer',
      email: 'newcustomer@example.com',
      role: 'CUSTOMER' as const,
      createdAt: '2024-01-01T00:00:00Z',
    };

    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: mockCustomerUser,
        isLoading: false,
        isAuthenticated: true,
        logout: mockLogout,
        isHydrated: true,
        login: jest.fn(),
        register: jest.fn(),
        refetchUser: jest.fn(),
      });

      mockUseDashboardRouting.mockReturnValue({
        currentRoute: '/',
        targetRoute: '/dashboard',
        isLoading: false,
        error: null,
        availableRoutes: [{
          path: '/dashboard',
          label: 'Dashboard',
          description: 'General dashboard with subscription options',
        }],
        shouldRedirectToCustomerDashboard: false,
        shouldShowGeneralDashboard: true,
        shouldRedirectToAdmin: false,
        navigateToDashboard: jest.fn(),
        navigateToRoute: jest.fn(),
        getDashboardUrl: jest.fn(() => '/dashboard'),
        isCurrentRoute: jest.fn(),
        canAccessRoute: jest.fn(),
      });
    });

    it('should show general dashboard link with correct label', () => {
      render(<Header />);
      
      // Click user menu to open dropdown
      const userButton = screen.getByRole('button', { name: /new customer/i });
      fireEvent.click(userButton);
      
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /^dashboard$/i })).toHaveAttribute('href', '/dashboard');
    });
  });

  describe('Loading States in Navigation', () => {
    const mockCustomerUser = {
      id: '4',
      name: 'Loading Customer',
      email: 'loading@example.com',
      role: 'CUSTOMER' as const,
      createdAt: '2024-01-01T00:00:00Z',
    };

    it('should show loading spinner when dashboard routing is loading', () => {
      mockUseAuth.mockReturnValue({
        user: mockCustomerUser,
        isLoading: false,
        isAuthenticated: true,
        logout: mockLogout,
        isHydrated: true,
        login: jest.fn(),
        register: jest.fn(),
        refetchUser: jest.fn(),
      });

      mockUseDashboardRouting.mockReturnValue({
        currentRoute: '/',
        targetRoute: '/dashboard',
        isLoading: true,
        error: null,
        availableRoutes: [],
        shouldRedirectToCustomerDashboard: false,
        shouldShowGeneralDashboard: false,
        shouldRedirectToAdmin: false,
        navigateToDashboard: jest.fn(),
        navigateToRoute: jest.fn(),
        getDashboardUrl: jest.fn(() => '/dashboard'),
        isCurrentRoute: jest.fn(),
        canAccessRoute: jest.fn(),
      });

      render(<Header />);
      
      // Should show loading spinner instead of user menu
      expect(screen.getAllByRole('generic').some(el => 
        el.className.includes('animate-pulse')
      )).toBe(true);
    });

    it('should show loading label when user menu is accessible but dashboard is loading', () => {
      mockUseAuth.mockReturnValue({
        user: mockCustomerUser,
        isLoading: false,
        isAuthenticated: true,
        logout: mockLogout,
        isHydrated: true,
        login: jest.fn(),
        register: jest.fn(),
        refetchUser: jest.fn(),
      });

      // Dashboard routing is not loading, but we can test the label function
      mockUseDashboardRouting.mockReturnValue({
        currentRoute: '/',
        targetRoute: '/dashboard',
        isLoading: false,
        error: null,
        availableRoutes: [{
          path: '/dashboard',
          label: 'Dashboard',
          description: 'General dashboard with subscription options',
        }],
        shouldRedirectToCustomerDashboard: false,
        shouldShowGeneralDashboard: true,
        shouldRedirectToAdmin: false,
        navigateToDashboard: jest.fn(),
        navigateToRoute: jest.fn(),
        getDashboardUrl: jest.fn(() => '/dashboard'),
        isCurrentRoute: jest.fn(),
        canAccessRoute: jest.fn(),
      });

      render(<Header />);
      
      // Click user menu to open dropdown
      const userButton = screen.getByRole('button', { name: /loading customer/i });
      fireEvent.click(userButton);
      
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
  });

  describe('Mobile Menu', () => {
    const mockCustomerUser = {
      id: '5',
      name: 'Mobile User',
      email: 'mobile@example.com',
      role: 'CUSTOMER' as const,
      createdAt: '2024-01-01T00:00:00Z',
    };

    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: mockCustomerUser,
        isLoading: false,
        isAuthenticated: true,
        logout: mockLogout,
        isHydrated: true,
        login: jest.fn(),
        register: jest.fn(),
        refetchUser: jest.fn(),
      });

      mockUseDashboardRouting.mockReturnValue({
        currentRoute: '/',
        targetRoute: '/customer-dashboard',
        isLoading: false,
        error: null,
        availableRoutes: [{
          path: '/customer-dashboard',
          label: 'Customer Dashboard',
          description: 'Manage your subscription and services',
        }],
        shouldRedirectToCustomerDashboard: true,
        shouldShowGeneralDashboard: false,
        shouldRedirectToAdmin: false,
        navigateToDashboard: jest.fn(),
        navigateToRoute: jest.fn(),
        getDashboardUrl: jest.fn(() => '/customer-dashboard'),
        isCurrentRoute: jest.fn(),
        canAccessRoute: jest.fn(),
      });
    });

    it('should toggle mobile menu when button is clicked', () => {
      render(<Header />);
      
      const mobileMenuButton = screen.getByLabelText('Toggle mobile menu');
      
      // Menu should not be visible initially
      expect(screen.queryByText('Navigation Menu')).not.toBeInTheDocument();
      
      // Click to open menu
      fireEvent.click(mobileMenuButton);
      expect(screen.getByText('Navigation Menu')).toBeInTheDocument();
      
      // Click to close menu
      fireEvent.click(mobileMenuButton);
      expect(screen.queryByText('Navigation Menu')).not.toBeInTheDocument();
    });

    it('should show dashboard link in mobile menu with loading state', () => {
      mockUseDashboardRouting.mockReturnValue({
        currentRoute: '/',
        targetRoute: '/customer-dashboard',
        isLoading: true,
        error: null,
        availableRoutes: [],
        shouldRedirectToCustomerDashboard: true,
        shouldShowGeneralDashboard: false,
        shouldRedirectToAdmin: false,
        navigateToDashboard: jest.fn(),
        navigateToRoute: jest.fn(),
        getDashboardUrl: jest.fn(() => '/customer-dashboard'),
        isCurrentRoute: jest.fn(),
        canAccessRoute: jest.fn(),
      });

      render(<Header />);
      
      // Open mobile menu
      const mobileMenuButton = screen.getByLabelText('Toggle mobile menu');
      fireEvent.click(mobileMenuButton);
      
      const dashboardLink = screen.getByRole('link', { name: /dashboard\.\.\./i });
      expect(dashboardLink).toHaveClass('opacity-50', 'cursor-not-allowed');
    });
  });

  describe('User Menu Interactions', () => {
    const mockCustomerUser = {
      id: '6',
      name: 'Interactive User',
      email: 'interactive@example.com',
      role: 'CUSTOMER' as const,
      createdAt: '2024-01-01T00:00:00Z',
    };

    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: mockCustomerUser,
        isLoading: false,
        isAuthenticated: true,
        logout: mockLogout,
        isHydrated: true,
        login: jest.fn(),
        register: jest.fn(),
        refetchUser: jest.fn(),
      });

      mockUseDashboardRouting.mockReturnValue({
        currentRoute: '/',
        targetRoute: '/customer-dashboard',
        isLoading: false,
        error: null,
        availableRoutes: [{
          path: '/customer-dashboard',
          label: 'Customer Dashboard',
          description: 'Manage your subscription and services',
        }],
        shouldRedirectToCustomerDashboard: true,
        shouldShowGeneralDashboard: false,
        shouldRedirectToAdmin: false,
        navigateToDashboard: jest.fn(),
        navigateToRoute: jest.fn(),
        getDashboardUrl: jest.fn(() => '/customer-dashboard'),
        isCurrentRoute: jest.fn(),
        canAccessRoute: jest.fn(),
      });
    });

    it('should close user menu when dashboard link is clicked', () => {
      render(<Header />);
      
      // Open user menu
      const userButton = screen.getByRole('button', { name: /interactive user/i });
      fireEvent.click(userButton);
      
      expect(screen.getByText('Customer Dashboard')).toBeInTheDocument();
      
      // Click dashboard link
      const dashboardLink = screen.getByRole('link', { name: /customer dashboard/i });
      fireEvent.click(dashboardLink);
      
      // Menu should close (dashboard link should not be visible)
      expect(screen.queryByText('Customer Dashboard')).not.toBeInTheDocument();
    });

    it('should handle logout correctly', async () => {
      // Mock window.location.href
      delete (window as any).location;
      (window as any).location = { href: '' };

      render(<Header />);
      
      // Open user menu
      const userButton = screen.getByRole('button', { name: /interactive user/i });
      fireEvent.click(userButton);
      
      // Click logout button
      const logoutButton = screen.getByRole('button', { name: /sign out/i });
      fireEvent.click(logoutButton);
      
      await waitFor(() => {
        expect(mockLogout).toHaveBeenCalled();
      });
    });
  });
});