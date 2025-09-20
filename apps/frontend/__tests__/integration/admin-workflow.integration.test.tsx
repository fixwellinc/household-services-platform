import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '../utils/test-utils';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { mockUsers, mockSubscriptions, mockAuditLogs } from '../utils/mock-data';

// Mock API calls
const mockApi = {
  getUsers: jest.fn(),
  searchUsers: jest.fn(),
  suspendUsers: jest.fn(),
  getAuditLogs: jest.fn(),
  getDashboardMetrics: jest.fn(),
  getSystemHealth: jest.fn()
};

jest.mock('@/lib/api', () => ({
  adminApi: mockApi
}));

// Mock router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    back: jest.fn()
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/admin'
}));

describe('Admin Workflow Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default API responses
    mockApi.getUsers.mockResolvedValue({
      users: mockUsers,
      total: mockUsers.length,
      page: 1,
      totalPages: 1
    });
    
    mockApi.getDashboardMetrics.mockResolvedValue({
      users: { total: 1000, active: 850, suspended: 150 },
      subscriptions: { total: 500, active: 450, cancelled: 50 },
      revenue: { monthly: 25000, yearly: 300000 }
    });
    
    mockApi.getSystemHealth.mockResolvedValue({
      database: { status: 'healthy', responseTime: 12 },
      api: { status: 'healthy', responseTime: 45 },
      memory: { usage: 65, total: 8192 }
    });
  });

  describe('Complete User Management Workflow', () => {
    it('should allow admin to search, select, and bulk suspend users', async () => {
      mockApi.searchUsers.mockResolvedValue({
        results: mockUsers.filter(u => u.name.includes('Test'))
      });
      
      mockApi.suspendUsers.mockResolvedValue({
        success: true,
        processed: 1,
        failed: 0,
        errors: []
      });

      render(<AdminDashboard />);

      // Navigate to user management
      const userManagementLink = screen.getByText('User Management');
      fireEvent.click(userManagementLink);

      await waitFor(() => {
        expect(screen.getByText('Users')).toBeInTheDocument();
      });

      // Search for users
      const searchInput = screen.getByPlaceholderText('Search users...');
      fireEvent.change(searchInput, { target: { value: 'Test User' } });

      await waitFor(() => {
        expect(mockApi.searchUsers).toHaveBeenCalledWith('Test User');
      });

      // Select users for bulk operation
      const userCheckboxes = screen.getAllByRole('checkbox');
      fireEvent.click(userCheckboxes[1]); // First user checkbox (skip header)

      // Verify bulk operations toolbar appears
      await waitFor(() => {
        expect(screen.getByText('1 items selected')).toBeInTheDocument();
      });

      // Execute bulk suspension
      const suspendButton = screen.getByText('Suspend Users');
      fireEvent.click(suspendButton);

      // Fill suspension reason
      const reasonInput = screen.getByLabelText('Suspension Reason');
      fireEvent.change(reasonInput, { target: { value: 'Policy violation' } });

      // Confirm suspension
      const confirmButton = screen.getByText('Confirm Suspension');
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockApi.suspendUsers).toHaveBeenCalledWith(
          [mockUsers[0].id],
          'Policy violation'
        );
      });

      // Verify success message
      await waitFor(() => {
        expect(screen.getByText('Successfully suspended 1 user(s)')).toBeInTheDocument();
      });
    });

    it('should handle user detail view and individual actions', async () => {
      render(<AdminDashboard />);

      // Navigate to user management
      fireEvent.click(screen.getByText('User Management'));

      await waitFor(() => {
        expect(screen.getByText('Test User 1')).toBeInTheDocument();
      });

      // Click on user to view details
      const userRow = screen.getByText('Test User 1').closest('tr');
      const viewButton = within(userRow!).getByLabelText('View details');
      fireEvent.click(viewButton);

      // Verify user details panel opens
      await waitFor(() => {
        expect(screen.getByText('User Details')).toBeInTheDocument();
        expect(screen.getByText('user1@test.com')).toBeInTheDocument();
      });

      // Test individual user actions
      const actionsButton = screen.getByLabelText('User actions');
      fireEvent.click(actionsButton);

      expect(screen.getByText('Edit User')).toBeInTheDocument();
      expect(screen.getByText('Suspend User')).toBeInTheDocument();
      expect(screen.getByText('View Activity')).toBeInTheDocument();
    });
  });

  describe('Dashboard and Monitoring Workflow', () => {
    it('should display real-time dashboard with interactive widgets', async () => {
      render(<AdminDashboard />);

      // Verify dashboard loads with metrics
      await waitFor(() => {
        expect(screen.getByText('1,000')).toBeInTheDocument(); // Total users
        expect(screen.getByText('500')).toBeInTheDocument(); // Total subscriptions
        expect(screen.getByText('$25,000')).toBeInTheDocument(); // Monthly revenue
      });

      // Test widget interaction
      const userMetricWidget = screen.getByTestId('users-metric-widget');
      fireEvent.click(userMetricWidget);

      // Should navigate to user management
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/admin/users');
      });
    });

    it('should handle system health monitoring and alerts', async () => {
      mockApi.getSystemHealth.mockResolvedValue({
        database: { status: 'warning', responseTime: 150 },
        api: { status: 'healthy', responseTime: 45 },
        memory: { usage: 85, total: 8192 }
      });

      render(<AdminDashboard />);

      // Navigate to system monitoring
      fireEvent.click(screen.getByText('System Health'));

      await waitFor(() => {
        expect(screen.getByText('System Health Dashboard')).toBeInTheDocument();
      });

      // Verify health indicators
      await waitFor(() => {
        expect(screen.getByText('Database: Warning')).toBeInTheDocument();
        expect(screen.getByText('Memory: 85%')).toBeInTheDocument();
      });

      // Test alert acknowledgment
      const alertItem = screen.getByText('High memory usage detected');
      const acknowledgeButton = within(alertItem.closest('.alert-item')!).getByText('Acknowledge');
      fireEvent.click(acknowledgeButton);

      await waitFor(() => {
        expect(screen.getByText('Alert acknowledged')).toBeInTheDocument();
      });
    });
  });

  describe('Search and Filter Workflow', () => {
    it('should support advanced search with filters', async () => {
      mockApi.searchUsers.mockResolvedValue({
        results: mockUsers.filter(u => u.role === 'CUSTOMER')
      });

      render(<AdminDashboard />);

      // Navigate to user management
      fireEvent.click(screen.getByText('User Management'));

      await waitFor(() => {
        expect(screen.getByText('Users')).toBeInTheDocument();
      });

      // Open advanced filters
      const filtersButton = screen.getByText('Filters');
      fireEvent.click(filtersButton);

      // Apply role filter
      const roleFilter = screen.getByLabelText('Role');
      fireEvent.change(roleFilter, { target: { value: 'CUSTOMER' } });

      // Apply status filter
      const statusFilter = screen.getByLabelText('Status');
      fireEvent.change(statusFilter, { target: { value: 'ACTIVE' } });

      // Apply filters
      const applyButton = screen.getByText('Apply Filters');
      fireEvent.click(applyButton);

      await waitFor(() => {
        expect(mockApi.searchUsers).toHaveBeenCalledWith('', {
          role: 'CUSTOMER',
          status: 'ACTIVE'
        });
      });

      // Verify filtered results
      await waitFor(() => {
        expect(screen.getByText('Showing filtered results')).toBeInTheDocument();
      });
    });

    it('should save and load search configurations', async () => {
      render(<AdminDashboard />);

      fireEvent.click(screen.getByText('User Management'));

      await waitFor(() => {
        expect(screen.getByText('Users')).toBeInTheDocument();
      });

      // Set up filters
      fireEvent.click(screen.getByText('Filters'));
      
      const roleFilter = screen.getByLabelText('Role');
      fireEvent.change(roleFilter, { target: { value: 'CUSTOMER' } });

      // Save search configuration
      const saveButton = screen.getByText('Save Search');
      fireEvent.click(saveButton);

      const searchNameInput = screen.getByLabelText('Search Name');
      fireEvent.change(searchNameInput, { target: { value: 'Active Customers' } });

      const confirmSaveButton = screen.getByText('Save');
      fireEvent.click(confirmSaveButton);

      await waitFor(() => {
        expect(screen.getByText('Search saved successfully')).toBeInTheDocument();
      });

      // Load saved search
      const savedSearchesButton = screen.getByText('Saved Searches');
      fireEvent.click(savedSearchesButton);

      const savedSearch = screen.getByText('Active Customers');
      fireEvent.click(savedSearch);

      await waitFor(() => {
        expect(roleFilter).toHaveValue('CUSTOMER');
      });
    });
  });

  describe('Audit Trail Workflow', () => {
    it('should display and filter audit logs', async () => {
      mockApi.getAuditLogs.mockResolvedValue({
        logs: mockAuditLogs,
        total: mockAuditLogs.length,
        page: 1,
        totalPages: 1
      });

      render(<AdminDashboard />);

      // Navigate to audit logs
      fireEvent.click(screen.getByText('Audit Logs'));

      await waitFor(() => {
        expect(screen.getByText('Audit Trail')).toBeInTheDocument();
      });

      // Verify audit logs are displayed
      await waitFor(() => {
        expect(screen.getByText('USER_UPDATED')).toBeInTheDocument();
        expect(screen.getByText('admin-1')).toBeInTheDocument();
      });

      // Filter by action type
      const actionFilter = screen.getByLabelText('Action Type');
      fireEvent.change(actionFilter, { target: { value: 'USER_UPDATED' } });

      await waitFor(() => {
        expect(mockApi.getAuditLogs).toHaveBeenCalledWith({
          action: 'USER_UPDATED',
          page: 1,
          limit: 10
        });
      });

      // View audit log details
      const logRow = screen.getByText('USER_UPDATED').closest('tr');
      const viewButton = within(logRow!).getByLabelText('View details');
      fireEvent.click(viewButton);

      await waitFor(() => {
        expect(screen.getByText('Audit Log Details')).toBeInTheDocument();
        expect(screen.getByText('Changes Made')).toBeInTheDocument();
      });
    });

    it('should export audit logs', async () => {
      const mockExportApi = jest.fn().mockResolvedValue({
        downloadUrl: '/api/admin/audit-logs/export/123'
      });

      mockApi.exportAuditLogs = mockExportApi;

      render(<AdminDashboard />);

      fireEvent.click(screen.getByText('Audit Logs'));

      await waitFor(() => {
        expect(screen.getByText('Audit Trail')).toBeInTheDocument();
      });

      // Export audit logs
      const exportButton = screen.getByText('Export');
      fireEvent.click(exportButton);

      // Select export format
      const csvOption = screen.getByLabelText('CSV');
      fireEvent.click(csvOption);

      const confirmExportButton = screen.getByText('Export Logs');
      fireEvent.click(confirmExportButton);

      await waitFor(() => {
        expect(mockExportApi).toHaveBeenCalledWith({
          format: 'csv',
          filters: {}
        });
      });

      await waitFor(() => {
        expect(screen.getByText('Export completed')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle API errors gracefully', async () => {
      mockApi.getUsers.mockRejectedValue(new Error('API Error'));

      render(<AdminDashboard />);

      fireEvent.click(screen.getByText('User Management'));

      await waitFor(() => {
        expect(screen.getByText('Failed to load users')).toBeInTheDocument();
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });

      // Test retry functionality
      mockApi.getUsers.mockResolvedValue({
        users: mockUsers,
        total: mockUsers.length,
        page: 1,
        totalPages: 1
      });

      const retryButton = screen.getByText('Retry');
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText('Test User 1')).toBeInTheDocument();
      });
    });

    it('should handle network connectivity issues', async () => {
      // Simulate network error
      mockApi.getUsers.mockRejectedValue(new Error('Network Error'));

      render(<AdminDashboard />);

      fireEvent.click(screen.getByText('User Management'));

      await waitFor(() => {
        expect(screen.getByText('Connection lost')).toBeInTheDocument();
        expect(screen.getByText('Check your internet connection')).toBeInTheDocument();
      });
    });

    it('should handle permission errors', async () => {
      mockApi.getUsers.mockRejectedValue({
        response: { status: 403, data: { error: 'Insufficient permissions' } }
      });

      render(<AdminDashboard />);

      fireEvent.click(screen.getByText('User Management'));

      await waitFor(() => {
        expect(screen.getByText('Access Denied')).toBeInTheDocument();
        expect(screen.getByText('You do not have permission to view this resource')).toBeInTheDocument();
      });
    });
  });

  describe('Performance and Loading States', () => {
    it('should show loading states during data fetching', async () => {
      // Delay API response
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

      // Should show loading state
      expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('Test User 1')).toBeInTheDocument();
      }, { timeout: 2000 });

      // Loading state should be gone
      expect(screen.queryByTestId('loading-skeleton')).not.toBeInTheDocument();
    });

    it('should handle large datasets with virtual scrolling', async () => {
      const largeUserSet = Array.from({ length: 1000 }, (_, i) => ({
        id: `user-${i}`,
        name: `User ${i}`,
        email: `user${i}@test.com`,
        role: 'CUSTOMER',
        status: 'ACTIVE'
      }));

      mockApi.getUsers.mockResolvedValue({
        users: largeUserSet,
        total: largeUserSet.length,
        page: 1,
        totalPages: 100
      });

      render(<AdminDashboard />);

      fireEvent.click(screen.getByText('User Management'));

      await waitFor(() => {
        expect(screen.getByTestId('virtual-list')).toBeInTheDocument();
      });

      // Verify only visible items are rendered
      const renderedUsers = screen.getAllByText(/User \d+/);
      expect(renderedUsers.length).toBeLessThan(100); // Should be much less than 1000
    });
  });
});