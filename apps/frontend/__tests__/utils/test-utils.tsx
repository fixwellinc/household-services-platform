import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { SocketProvider } from '@/contexts/SocketContext';

// Mock data for testing
export const mockAdminUser = {
  id: 'admin-1',
  email: 'admin@test.com',
  name: 'Test Admin',
  role: 'ADMIN',
  permissions: ['READ_USERS', 'WRITE_USERS', 'DELETE_USERS', 'BULK_OPERATIONS'],
  lastLoginAt: new Date('2024-01-01'),
  preferences: {
    theme: 'light',
    dashboardLayout: [],
    defaultFilters: {},
    notificationSettings: {
      email: true,
      push: true,
      sms: false
    }
  }
};

export const mockUsers = [
  {
    id: 'user-1',
    email: 'user1@test.com',
    name: 'Test User 1',
    role: 'CUSTOMER',
    status: 'ACTIVE',
    createdAt: new Date('2024-01-01'),
    lastLoginAt: new Date('2024-01-15')
  },
  {
    id: 'user-2',
    email: 'user2@test.com',
    name: 'Test User 2',
    role: 'EMPLOYEE',
    status: 'SUSPENDED',
    createdAt: new Date('2024-01-02'),
    lastLoginAt: new Date('2024-01-10')
  }
];

export const mockSubscriptions = [
  {
    id: 'sub-1',
    userId: 'user-1',
    planId: 'plan-1',
    status: 'ACTIVE',
    currentPeriodStart: new Date('2024-01-01'),
    currentPeriodEnd: new Date('2024-02-01'),
    amount: 2999,
    currency: 'USD'
  },
  {
    id: 'sub-2',
    userId: 'user-2',
    planId: 'plan-2',
    status: 'CANCELLED',
    currentPeriodStart: new Date('2024-01-01'),
    currentPeriodEnd: new Date('2024-02-01'),
    amount: 4999,
    currency: 'USD'
  }
];

export const mockAuditLogs = [
  {
    id: 'audit-1',
    adminId: 'admin-1',
    action: 'USER_UPDATED',
    entityType: 'USER',
    entityId: 'user-1',
    changes: {
      status: { from: 'ACTIVE', to: 'SUSPENDED' }
    },
    metadata: {
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0',
      timestamp: new Date('2024-01-15'),
      sessionId: 'session-1'
    },
    severity: 'medium'
  }
];

// Create a custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <SocketProvider>
            {children}
          </SocketProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };

// Mock API responses
export const mockApiResponse = <T>(data: T, delay = 0) => {
  return new Promise<T>((resolve) => {
    setTimeout(() => resolve(data), delay);
  });
};

export const mockApiError = (message: string, status = 500) => {
  return Promise.reject({
    response: {
      status,
      data: { error: message }
    }
  });
};

// Mock socket events
export const mockSocketEvents = {
  emit: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  connect: jest.fn(),
  disconnect: jest.fn()
};

// Test helpers
export const waitForLoadingToFinish = () => {
  return new Promise(resolve => setTimeout(resolve, 0));
};

export const createMockIntersectionObserver = () => {
  const mockIntersectionObserver = jest.fn();
  mockIntersectionObserver.mockReturnValue({
    observe: () => null,
    unobserve: () => null,
    disconnect: () => null
  });
  window.IntersectionObserver = mockIntersectionObserver;
};

export const createMockResizeObserver = () => {
  const mockResizeObserver = jest.fn();
  mockResizeObserver.mockReturnValue({
    observe: () => null,
    unobserve: () => null,
    disconnect: () => null
  });
  window.ResizeObserver = mockResizeObserver;
};