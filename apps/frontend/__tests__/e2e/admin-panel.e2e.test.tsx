import React from 'react';
import { render, screen, fireEvent, waitFor } from '../utils/test-utils';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { mockUsers, mockSubscriptions, mockAuditLogs } from '../utils/mock-data';

// Mock WebSocket for real-time features
const mockSocket = {
  on: jest.fn(),
  off: jest.fn(),
  emit: jest.fn(),
  connect: jest.fn(),
  disconnect: jest.fn()
};

jest.mock('socket.io-client', () => {
  return jest.fn(() => mockSocket);
});

// Mock API with realistic delays
const createMockApiWithDelay = (data: any, delay = 100) => {
  return jest.fn().mockImplementation(() => 
    new Promise(resolve => setTimeout(() => resolve(data), delay))
  );
};

const mockApi = {
  getUsers: createMockApiWithDelay({
    users: mockUsers,
    total: mockUsers.length,
    page: 1,
    totalPages: 1
  }),
  searchUsers: createMockApiWithDelay({ results: mockUsers }),
  suspendUsers: createMockApiWithDelay({
    success: true,
    processed: 1,
    failed: 0,
    errors: []
  }),
  getAuditLogs: createMockApiWithDelay({
    logs: mockAuditLogs,
    total: mockAuditLogs.length,
    page: 1,
    totalPages: 1
  }),
  getDashboardMetrics: createMockApiWithDelay({
    users: { total: 1000, active: 850, suspended: 150 },
    subscriptions: { total: 500, active: 450, cancelled: 50 },
    revenue: { monthly: 25000, yearly: 300000 }
  }),
  getSystemHealth: createMockApiWithDelay({
    database: { status: 'healthy', responseTime: 12 },
    api: { status: 'healthy', responseTime: 45 },
    memory: { usage: 65, total: 8192 }
  })
};

jest.mock('@/lib/api', () => ({
  adminApi: mockApi
}));

describe('Admin Panel E2E Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset socket mock
    mockSocket.on.mockClear();
    mockSocket.emit.mockClear();
  });

  describe('Complete Admin Journey', () => {
    it('should complete full admin workflow from login to user management', async () => {
      render(<AdminDashboard />);

      // 1. Dashboard should load with metrics
      await waitFor(() => {
        expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
        expect(screen.getByText('1,000')).toBeInTheDocument(); // Total users
      });

      // 2. Navigate to user management
      const userManagementLink = screen.getByText('User Management');
      fireEvent.click(userManagementLink);

      await waitFor(() => {
        expect(screen.getByText('User Management')).toBeInTheDocument();
        expect(screen.getByText('Test User 1')).toBeInTheDocument();
      });

      // 3. Search for specific user
      const searchInput = screen.getByPlaceholderText('Search users...');
      fireEvent.change(searchInput, { target: { value: 'Test User 1' } });

      await waitFor(() => {
        expect(mockApi.searchUsers).toHaveBeenCalledWith('Test User 1');
      });

      // 4. Select user and perform bulk action
      const userCheckbox = screen.getAllByRole('checkbox')[1]; // Skip header checkbox
      fireEvent.click(userCheckbox);

      await waitFor(() => {
        expect(screen.getByText('1 items selected')).toBeInTheDocument();
      });

      // 5. Execute bulk suspension
      const suspendButton = screen.getByText('Suspend Users');
      fireEvent.click(suspendButton);

      // 6. Fill suspension form
      const reasonInput = screen.getByLabelText('Suspension Reason');
      fireEvent.change(reasonInput, { target: { value: 'Policy violation' } });

      const confirmButton = screen.getByText('Confirm Suspension');
      fireEvent.click(confirmButton);

      // 7. Verify operation completion
      await waitFor(() => {
        expect(mockApi.suspendUsers).toHaveBeenCalledWith(
          [mockUsers[0].id],
          'Policy violation'
        );
      });

      await waitFor(() => {
        expect(screen.getByText('Successfully suspended 1 user(s)')).toBeInTheDocument();
      });

      // 8. Navigate to audit logs to verify action was logged
      const auditLogsLink = screen.getByText('Audit Logs');
      fireEvent.click(auditLogsLink);

      await waitFor(() => {
        expect(screen.getByText('Audit Trail')).toBeInTheDocument();
        expect(screen.getByText('USER_UPDATED')).toBeInTheDocument();
      });
    });

    it('should handle complete subscription management workflow', async () => {
      render(<AdminDashboard />);

      // Navigate to subscription management
      const subscriptionLink = screen.getByText('Subscriptions');
      fireEvent.click(subscriptionLink);

      await waitFor(() => {
        expect(screen.getByText('Subscription Management')).toBeInTheDocument();
      });

      // Search for subscription
      const searchInput = screen.getByPlaceholderText('Search subscriptions...');
      fireEvent.change(searchInput, { target: { value: 'premium' } });

      await waitFor(() => {
        expect(screen.getByText('Premium Plan')).toBeInTheDocument();
      });

      // View subscription details
      const subscriptionRow = screen.getByText('Premium Plan').closest('tr');
      const viewButton = subscriptionRow?.querySelector('[aria-label="View details"]');
      fireEvent.click(viewButton!);

      await waitFor(() => {
        expect(screen.getByText('Subscription Details')).toBeInTheDocument();
        expect(screen.getByText('Billing History')).toBeInTheDocument();
      });

      // Perform billing adjustment
      const adjustmentButton = screen.getByText('Billing Adjustment');
      fireEvent.click(adjustmentButton);

      const adjustmentAmount = screen.getByLabelText('Adjustment Amount');
      fireEvent.change(adjustmentAmount, { target: { value: '10.00' } });

      const adjustmentReason = screen.getByLabelText('Reason');
      fireEvent.change(adjustmentReason, { target: { value: 'Customer service credit' } });

      const applyButton = screen.getByText('Apply Adjustment');
      fireEvent.click(applyButton);

      await waitFor(() => {
        expect(screen.getByText('Billing adjustment applied successfully')).toBeInTheDocument();
      });
    });
  });

  describe('Real-time Features E2E', () => {
    it('should handle real-time dashboard updates', async () => {
      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
      });

      // Verify WebSocket connection was established
      expect(mockSocket.on).toHaveBeenCalledWith('dashboard-update', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('system-alert', expect.any(Function));

      // Simulate real-time dashboard update
      const dashboardUpdateCallback = mockSocket.on.mock.calls.find(
        call => call[0] === 'dashboard-update'
      )?.[1];

      const updatedMetrics = {
        users: { total: 1001, active: 851, suspended: 150 },
        subscriptions: { total: 501, active: 451, cancelled: 50 }
      };

      dashboardUpdateCallback?.(updatedMetrics);

      await waitFor(() => {
        expect(screen.getByText('1,001')).toBeInTheDocument(); // Updated user count
        expect(screen.getByText('501')).toBeInTheDocument(); // Updated subscription count
      });
    });

    it('should handle real-time system alerts', async () => {
      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
      });

      // Simulate system alert
      const alertCallback = mockSocket.on.mock.calls.find(
        call => call[0] === 'system-alert'
      )?.[1];

      const alert = {
        id: 'alert-1',
        type: 'error',
        title: 'Database Connection Issue',
        message: 'Database response time exceeded threshold',
        severity: 'high'
      };

      alertCallback?.(alert);

      await waitFor(() => {
        expect(screen.getByText('Database Connection Issue')).toBeInTheDocument();
        expect(screen.getByText('Database response time exceeded threshold')).toBeInTheDocument();
      });

      // Acknowledge alert
      const acknowledgeButton = screen.getByText('Acknowledge');
      fireEvent.click(acknowledgeButton);

      await waitFor(() => {
        expect(screen.getByText('Alert acknowledged')).toBeInTheDocument();
      });
    });

    it('should handle real-time user activity updates', async () => {
      render(<AdminDashboard />);

      // Navigate to user management
      fireEvent.click(screen.getByText('User Management'));

      await waitFor(() => {
        expect(screen.getByText('User Management')).toBeInTheDocument();
      });

      // Simulate real-time user status update
      const userUpdateCallback = mockSocket.on.mock.calls.find(
        call => call[0] === 'user-update'
      )?.[1];

      const userUpdate = {
        userId: 'user-1',
        status: 'SUSPENDED',
        lastActivity: new Date().toISOString()
      };

      userUpdateCallback?.(userUpdate);

      await waitFor(() => {
        expect(screen.getByText('SUSPENDED')).toBeInTheDocument();
      });
    });
  });

  describe('Performance and Stress Testing', () => {
    it('should handle large dataset operations efficiently', async () => {
      // Mock large dataset
      const largeUserSet = Array.from({ length: 10000 }, (_, i) => ({
        id: `user-${i}`,
        name: `User ${i}`,
        email: `user${i}@test.com`,
        role: 'CUSTOMER',
        status: 'ACTIVE'
      }));

      mockApi.getUsers.mockResolvedValue({
        users: largeUserSet.slice(0, 100), // Paginated
        total: largeUserSet.length,
        page: 1,
        totalPages: 100
      });

      const startTime = performance.now();

      render(<AdminDashboard />);

      fireEvent.click(screen.getByText('User Management'));

      await waitFor(() => {
        expect(screen.getByText('User 0')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const loadTime = endTime - startTime;

      // Should load within reasonable time (2 seconds)
      expect(loadTime).toBeLessThan(2000);

      // Test virtual scrolling performance
      const virtualList = screen.getByTestId('virtual-list');
      expect(virtualList).toBeInTheDocument();

      // Simulate scrolling through large dataset
      fireEvent.scroll(virtualList, { target: { scrollTop: 5000 } });

      // Should handle scrolling without performance issues
      await waitFor(() => {
        expect(screen.getByText(/User \d+/)).toBeInTheDocument();
      });
    });

    it('should handle concurrent bulk operations', async () => {
      const bulkOperationPromises = Array.from({ length: 5 }, (_, i) =>
        mockApi.suspendUsers.mockResolvedValue({
          success: true,
          processed: 10,
          failed: 0,
          errors: []
        })
      );

      render(<AdminDashboard />);

      fireEvent.click(screen.getByText('User Management'));

      await waitFor(() => {
        expect(screen.getByText('User Management')).toBeInTheDocument();
      });

      // Select multiple users
      const selectAllCheckbox = screen.getAllByRole('checkbox')[0];
      fireEvent.click(selectAllCheckbox);

      // Execute multiple bulk operations rapidly
      const suspendButton = screen.getByText('Suspend Users');
      
      for (let i = 0; i < 5; i++) {
        fireEvent.click(suspendButton);
        
        const reasonInput = screen.getByLabelText('Suspension Reason');
        fireEvent.change(reasonInput, { target: { value: `Bulk operation ${i}` } });
        
        const confirmButton = screen.getByText('Confirm Suspension');
        fireEvent.click(confirmButton);
      }

      // Should handle concurrent operations gracefully
      await waitFor(() => {
        expect(screen.getByText('Operation in progress')).toBeInTheDocument();
      });
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should recover from network failures', async () => {
      // Start with network failure
      mockApi.getUsers.mockRejectedValue(new Error('Network Error'));

      render(<AdminDashboard />);

      fireEvent.click(screen.getByText('User Management'));

      await waitFor(() => {
        expect(screen.getByText('Connection lost')).toBeInTheDocument();
      });

      // Simulate network recovery
      mockApi.getUsers.mockResolvedValue({
        users: mockUsers,
        total: mockUsers.length,
        page: 1,
        totalPages: 1
      });

      // Auto-retry should work
      await waitFor(() => {
        expect(screen.getByText('Test User 1')).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should handle partial system failures gracefully', async () => {
      // Mock partial API failures
      mockApi.getUsers.mockResolvedValue({
        users: mockUsers,
        total: mockUsers.length,
        page: 1,
        totalPages: 1
      });

      mockApi.getSystemHealth.mockRejectedValue(new Error('Health check failed'));

      render(<AdminDashboard />);

      // Dashboard should still load with user data
      await waitFor(() => {
        expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
      });

      // System health widget should show error state
      await waitFor(() => {
        expect(screen.getByText('Health check unavailable')).toBeInTheDocument();
      });

      // Other functionality should remain working
      fireEvent.click(screen.getByText('User Management'));

      await waitFor(() => {
        expect(screen.getByText('Test User 1')).toBeInTheDocument();
      });
    });

    it('should maintain data consistency during failures', async () => {
      render(<AdminDashboard />);

      fireEvent.click(screen.getByText('User Management'));

      await waitFor(() => {
        expect(screen.getByText('User Management')).toBeInTheDocument();
      });

      // Select user for bulk operation
      const userCheckbox = screen.getAllByRole('checkbox')[1];
      fireEvent.click(userCheckbox);

      // Mock bulk operation failure
      mockApi.suspendUsers.mockRejectedValue(new Error('Operation failed'));

      const suspendButton = screen.getByText('Suspend Users');
      fireEvent.click(suspendButton);

      const reasonInput = screen.getByLabelText('Suspension Reason');
      fireEvent.change(reasonInput, { target: { value: 'Test suspension' } });

      const confirmButton = screen.getByText('Confirm Suspension');
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText('Operation failed')).toBeInTheDocument();
      });

      // User selection should be maintained for retry
      expect(screen.getByText('1 items selected')).toBeInTheDocument();

      // Retry should be available
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });
  });

  describe('Accessibility and Usability E2E', () => {
    it('should support complete keyboard navigation workflow', async () => {
      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
      });

      // Navigate using keyboard
      const userManagementLink = screen.getByText('User Management');
      userManagementLink.focus();
      fireEvent.keyDown(userManagementLink, { key: 'Enter' });

      await waitFor(() => {
        expect(screen.getByText('User Management')).toBeInTheDocument();
      });

      // Navigate through user table using keyboard
      const userTable = screen.getByRole('table');
      fireEvent.keyDown(userTable, { key: 'ArrowDown' });

      expect(document.activeElement).toHaveAttribute('data-row-index', '0');

      // Select user using keyboard
      fireEvent.keyDown(document.activeElement!, { key: ' ' }); // Space to select

      await waitFor(() => {
        expect(screen.getByText('1 items selected')).toBeInTheDocument();
      });

      // Navigate to bulk actions using Tab
      fireEvent.keyDown(document.activeElement!, { key: 'Tab' });
      fireEvent.keyDown(document.activeElement!, { key: 'Enter' });

      // Should open bulk actions menu
      await waitFor(() => {
        expect(screen.getByText('Suspend Users')).toBeInTheDocument();
      });
    });

    it('should work with screen readers', async () => {
      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
      });

      // Verify ARIA labels and roles
      expect(screen.getByRole('navigation')).toHaveAttribute('aria-label', 'Admin navigation');
      expect(screen.getByRole('main')).toHaveAttribute('aria-label', 'Admin dashboard content');

      // Navigate to user management
      fireEvent.click(screen.getByText('User Management'));

      await waitFor(() => {
        const userTable = screen.getByRole('table');
        expect(userTable).toHaveAttribute('aria-label', 'Users table');
      });

      // Verify table accessibility
      const columnHeaders = screen.getAllByRole('columnheader');
      expect(columnHeaders[0]).toHaveAttribute('aria-sort');

      // Verify row accessibility
      const rows = screen.getAllByRole('row');
      expect(rows[1]).toHaveAttribute('aria-selected', 'false');
    });

    it('should support high contrast mode', async () => {
      // Mock high contrast preference
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

      // Verify high contrast styles are applied
      const dashboard = screen.getByTestId('admin-dashboard');
      expect(dashboard).toHaveClass('high-contrast');

      // Test that all interactive elements are visible in high contrast
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        const styles = window.getComputedStyle(button);
        expect(parseInt(styles.borderWidth)).toBeGreaterThan(0);
      });
    });
  });
});