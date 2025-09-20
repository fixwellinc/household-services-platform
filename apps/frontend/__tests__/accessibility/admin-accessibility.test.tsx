import React from 'react';
import { render, screen, fireEvent, waitFor } from '../utils/test-utils';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { EnhancedDataTable } from '@/components/admin/EnhancedDataTable';
import { GlobalSearch } from '@/components/admin/search/GlobalSearch';
import { mockUsers, mockDashboardWidgets } from '../utils/mock-data';
import { axe, toHaveNoViolations } from 'jest-axe';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock APIs
const mockApi = {
  getUsers: jest.fn().mockResolvedValue({
    users: mockUsers,
    total: mockUsers.length,
    page: 1,
    totalPages: 1
  }),
  getDashboardMetrics: jest.fn().mockResolvedValue({
    users: { total: 1000, active: 850 },
    subscriptions: { total: 500, active: 450 }
  })
};

jest.mock('@/lib/api', () => ({
  adminApi: mockApi
}));

describe('Admin Panel Accessibility Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('WCAG 2.1 AA Compliance', () => {
    it('should have no accessibility violations on dashboard', async () => {
      const { container } = render(<AdminDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
      });

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations on data table', async () => {
      const columns = [
        { key: 'name', label: 'Name', sortable: true },
        { key: 'email', label: 'Email', sortable: true },
        { key: 'role', label: 'Role', sortable: false }
      ];

      const { container } = render(
        <EnhancedDataTable
          data={mockUsers}
          columns={columns}
          loading={false}
          selectable
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations on search component', async () => {
      const { container } = render(
        <GlobalSearch
          onResultSelect={jest.fn()}
          placeholder="Search users..."
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should support full keyboard navigation in dashboard', async () => {
      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
      });

      // Test Tab navigation through main navigation
      const firstNavItem = screen.getByText('Dashboard');
      firstNavItem.focus();
      expect(document.activeElement).toBe(firstNavItem);

      // Navigate to next item
      fireEvent.keyDown(firstNavItem, { key: 'Tab' });
      const secondNavItem = screen.getByText('User Management');
      expect(document.activeElement).toBe(secondNavItem);

      // Test Enter key activation
      fireEvent.keyDown(secondNavItem, { key: 'Enter' });
      await waitFor(() => {
        expect(screen.getByText('User Management')).toBeInTheDocument();
      });
    });

    it('should support keyboard navigation in data table', async () => {
      const columns = [
        { key: 'name', label: 'Name', sortable: true },
        { key: 'email', label: 'Email', sortable: true }
      ];

      render(
        <EnhancedDataTable
          data={mockUsers}
          columns={columns}
          loading={false}
          selectable
        />
      );

      const table = screen.getByRole('table');
      
      // Focus table and navigate with arrow keys
      table.focus();
      fireEvent.keyDown(table, { key: 'ArrowDown' });
      
      // Should focus first data row
      expect(document.activeElement).toHaveAttribute('data-row-index', '0');

      // Navigate to next row
      fireEvent.keyDown(document.activeElement!, { key: 'ArrowDown' });
      expect(document.activeElement).toHaveAttribute('data-row-index', '1');

      // Navigate to previous row
      fireEvent.keyDown(document.activeElement!, { key: 'ArrowUp' });
      expect(document.activeElement).toHaveAttribute('data-row-index', '0');

      // Select row with Space
      fireEvent.keyDown(document.activeElement!, { key: ' ' });
      expect(screen.getByText('1 items selected')).toBeInTheDocument();
    });

    it('should support keyboard navigation in search', async () => {
      const mockResults = {
        users: [
          { id: 'user-1', type: 'user', title: 'John Doe', subtitle: 'john@example.com' }
        ]
      };

      const mockSearchApi = jest.fn().mockResolvedValue(mockResults);
      jest.doMock('@/lib/api', () => ({
        searchApi: { globalSearch: mockSearchApi }
      }));

      render(<GlobalSearch onResultSelect={jest.fn()} />);

      const searchInput = screen.getByRole('searchbox');
      
      // Type in search
      fireEvent.change(searchInput, { target: { value: 'john' } });
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Navigate results with arrow keys
      fireEvent.keyDown(searchInput, { key: 'ArrowDown' });
      expect(document.activeElement).toHaveTextContent('John Doe');

      // Select result with Enter
      fireEvent.keyDown(document.activeElement!, { key: 'Enter' });
      // Should trigger onResultSelect callback
    });

    it('should trap focus in modal dialogs', async () => {
      render(<AdminDashboard />);

      // Navigate to user management and trigger bulk operation
      fireEvent.click(screen.getByText('User Management'));
      
      await waitFor(() => {
        expect(screen.getByText('User Management')).toBeInTheDocument();
      });

      // Select user and open bulk operation dialog
      const checkbox = screen.getAllByRole('checkbox')[1];
      fireEvent.click(checkbox);
      
      const suspendButton = screen.getByText('Suspend Users');
      fireEvent.click(suspendButton);

      await waitFor(() => {
        expect(screen.getByText('Confirm Bulk Operation')).toBeInTheDocument();
      });

      // Focus should be trapped within modal
      const modal = screen.getByRole('dialog');
      const focusableElements = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      // Tab from last element should go to first
      lastElement.focus();
      fireEvent.keyDown(lastElement, { key: 'Tab' });
      expect(document.activeElement).toBe(firstElement);

      // Shift+Tab from first element should go to last
      firstElement.focus();
      fireEvent.keyDown(firstElement, { key: 'Tab', shiftKey: true });
      expect(document.activeElement).toBe(lastElement);
    });
  });

  describe('Screen Reader Support', () => {
    it('should have proper ARIA labels and roles', async () => {
      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
      });

      // Check main navigation
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveAttribute('aria-label', 'Admin navigation');

      // Check main content area
      const main = screen.getByRole('main');
      expect(main).toHaveAttribute('aria-label', 'Admin dashboard content');

      // Check dashboard widgets
      const widgets = screen.getAllByRole('region');
      widgets.forEach(widget => {
        expect(widget).toHaveAttribute('aria-labelledby');
      });
    });

    it('should announce dynamic content changes', async () => {
      render(<AdminDashboard />);

      // Navigate to user management
      fireEvent.click(screen.getByText('User Management'));

      await waitFor(() => {
        expect(screen.getByText('User Management')).toBeInTheDocument();
      });

      // Check for live region announcements
      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');

      // Perform bulk operation
      const checkbox = screen.getAllByRole('checkbox')[1];
      fireEvent.click(checkbox);

      await waitFor(() => {
        expect(liveRegion).toHaveTextContent('1 items selected');
      });
    });

    it('should provide descriptive table headers and captions', async () => {
      const columns = [
        { key: 'name', label: 'Full Name', sortable: true },
        { key: 'email', label: 'Email Address', sortable: true },
        { key: 'role', label: 'User Role', sortable: false }
      ];

      render(
        <EnhancedDataTable
          data={mockUsers}
          columns={columns}
          loading={false}
          caption="List of system users with their details"
        />
      );

      const table = screen.getByRole('table');
      expect(table).toHaveAccessibleName('List of system users with their details');

      // Check column headers
      const nameHeader = screen.getByRole('columnheader', { name: /full name/i });
      expect(nameHeader).toHaveAttribute('aria-sort');

      const emailHeader = screen.getByRole('columnheader', { name: /email address/i });
      expect(emailHeader).toHaveAttribute('aria-sort');

      const roleHeader = screen.getByRole('columnheader', { name: /user role/i });
      expect(roleHeader).not.toHaveAttribute('aria-sort');
    });

    it('should provide form labels and descriptions', async () => {
      render(<AdminDashboard />);

      // Navigate to user management and open user form
      fireEvent.click(screen.getByText('User Management'));
      
      await waitFor(() => {
        expect(screen.getByText('User Management')).toBeInTheDocument();
      });

      const addUserButton = screen.getByText('Add User');
      fireEvent.click(addUserButton);

      await waitFor(() => {
        expect(screen.getByText('Add New User')).toBeInTheDocument();
      });

      // Check form accessibility
      const nameInput = screen.getByLabelText('Full Name');
      expect(nameInput).toHaveAttribute('aria-required', 'true');
      expect(nameInput).toHaveAttribute('aria-describedby');

      const emailInput = screen.getByLabelText('Email Address');
      expect(emailInput).toHaveAttribute('aria-required', 'true');
      expect(emailInput).toHaveAttribute('aria-describedby');

      const roleSelect = screen.getByLabelText('User Role');
      expect(roleSelect).toHaveAttribute('aria-required', 'true');
    });

    it('should announce loading states', async () => {
      // Mock delayed API response
      mockApi.getUsers.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          users: mockUsers,
          total: mockUsers.length,
          page: 1,
          totalPages: 1
        }), 1000))
      );

      render(<AdminDashboard />);

      fireEvent.click(screen.getByText('User Management'));

      // Should announce loading state
      await waitFor(() => {
        const loadingRegion = screen.getByRole('status');
        expect(loadingRegion).toHaveTextContent('Loading users');
      });

      // Should announce completion
      await waitFor(() => {
        const statusRegion = screen.getByRole('status');
        expect(statusRegion).toHaveTextContent('Users loaded successfully');
      }, { timeout: 2000 });
    });
  });

  describe('Visual Accessibility', () => {
    it('should meet color contrast requirements', async () => {
      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
      });

      // Test with axe-core color contrast rules
      const { container } = render(<AdminDashboard />);
      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true }
        }
      });

      expect(results).toHaveNoViolations();
    });

    it('should support high contrast mode', async () => {
      // Mock high contrast media query
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(prefers-contrast: high)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });

      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
      });

      // Check that high contrast styles are applied
      const dashboard = screen.getByTestId('admin-dashboard');
      expect(dashboard).toHaveClass('high-contrast');

      // Verify button contrast
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        const styles = window.getComputedStyle(button);
        expect(parseInt(styles.borderWidth)).toBeGreaterThan(0);
      });
    });

    it('should support reduced motion preferences', async () => {
      // Mock reduced motion preference
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });

      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
      });

      // Check that animations are disabled
      const animatedElements = screen.getAllByTestId(/animated-/);
      animatedElements.forEach(element => {
        const styles = window.getComputedStyle(element);
        expect(styles.animationDuration).toBe('0s');
        expect(styles.transitionDuration).toBe('0s');
      });
    });

    it('should be usable at 200% zoom', async () => {
      // Mock viewport at 200% zoom
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 640, // Half of normal 1280px
      });

      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 360, // Half of normal 720px
      });

      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
      });

      // Check that content is still accessible
      expect(screen.getByText('User Management')).toBeVisible();
      expect(screen.getByText('Subscriptions')).toBeVisible();

      // Check that interactive elements are still clickable
      const userManagementLink = screen.getByText('User Management');
      expect(userManagementLink).toBeVisible();
      
      fireEvent.click(userManagementLink);
      
      await waitFor(() => {
        expect(screen.getByText('User Management')).toBeInTheDocument();
      });
    });
  });

  describe('Mobile Accessibility', () => {
    it('should be accessible on mobile devices', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 667,
      });

      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
      });

      // Check mobile navigation
      const mobileMenuButton = screen.getByLabelText('Open navigation menu');
      expect(mobileMenuButton).toBeVisible();

      fireEvent.click(mobileMenuButton);

      await waitFor(() => {
        expect(screen.getByRole('navigation')).toHaveAttribute('aria-expanded', 'true');
      });

      // Check touch targets are large enough (44px minimum)
      const touchTargets = screen.getAllByRole('button');
      touchTargets.forEach(target => {
        const rect = target.getBoundingClientRect();
        expect(Math.min(rect.width, rect.height)).toBeGreaterThanOrEqual(44);
      });
    });

    it('should support touch gestures', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      const columns = [
        { key: 'name', label: 'Name', sortable: true },
        { key: 'email', label: 'Email', sortable: true }
      ];

      render(
        <EnhancedDataTable
          data={mockUsers}
          columns={columns}
          loading={false}
          selectable
        />
      );

      const table = screen.getByRole('table');
      
      // Test swipe gestures for row actions
      const firstRow = screen.getAllByRole('row')[1]; // Skip header
      
      fireEvent.touchStart(firstRow, {
        touches: [{ clientX: 100, clientY: 100 }]
      });
      
      fireEvent.touchMove(firstRow, {
        touches: [{ clientX: 50, clientY: 100 }]
      });
      
      fireEvent.touchEnd(firstRow);

      // Should reveal row actions
      await waitFor(() => {
        expect(screen.getByLabelText('Row actions')).toBeVisible();
      });
    });
  });

  describe('Error Accessibility', () => {
    it('should announce errors to screen readers', async () => {
      // Mock API error
      mockApi.getUsers.mockRejectedValue(new Error('Failed to load users'));

      render(<AdminDashboard />);

      fireEvent.click(screen.getByText('User Management'));

      await waitFor(() => {
        const errorRegion = screen.getByRole('alert');
        expect(errorRegion).toHaveTextContent('Failed to load users');
      });

      // Error should be announced immediately
      expect(errorRegion).toHaveAttribute('aria-live', 'assertive');
    });

    it('should provide accessible error recovery options', async () => {
      mockApi.getUsers.mockRejectedValue(new Error('Network error'));

      render(<AdminDashboard />);

      fireEvent.click(screen.getByText('User Management'));

      await waitFor(() => {
        expect(screen.getByText('Failed to load users')).toBeInTheDocument();
      });

      // Check retry button accessibility
      const retryButton = screen.getByText('Retry');
      expect(retryButton).toHaveAttribute('aria-describedby');
      
      const description = document.getElementById(retryButton.getAttribute('aria-describedby')!);
      expect(description).toHaveTextContent('Attempt to reload the user data');
    });
  });

  describe('Form Accessibility', () => {
    it('should provide accessible form validation', async () => {
      render(<AdminDashboard />);

      fireEvent.click(screen.getByText('User Management'));
      
      await waitFor(() => {
        expect(screen.getByText('User Management')).toBeInTheDocument();
      });

      const addUserButton = screen.getByText('Add User');
      fireEvent.click(addUserButton);

      await waitFor(() => {
        expect(screen.getByText('Add New User')).toBeInTheDocument();
      });

      // Submit form without required fields
      const submitButton = screen.getByText('Create User');
      fireEvent.click(submitButton);

      await waitFor(() => {
        // Check that validation errors are announced
        const nameInput = screen.getByLabelText('Full Name');
        expect(nameInput).toHaveAttribute('aria-invalid', 'true');
        expect(nameInput).toHaveAttribute('aria-describedby');
        
        const errorMessage = document.getElementById(nameInput.getAttribute('aria-describedby')!);
        expect(errorMessage).toHaveTextContent('Full name is required');
      });
    });

    it('should group related form fields', async () => {
      render(<AdminDashboard />);

      fireEvent.click(screen.getByText('User Management'));
      
      await waitFor(() => {
        const addUserButton = screen.getByText('Add User');
        fireEvent.click(addUserButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Add New User')).toBeInTheDocument();
      });

      // Check fieldset grouping
      const personalInfoFieldset = screen.getByRole('group', { name: /personal information/i });
      expect(personalInfoFieldset).toBeInTheDocument();

      const accountInfoFieldset = screen.getByRole('group', { name: /account information/i });
      expect(accountInfoFieldset).toBeInTheDocument();
    });
  });
});