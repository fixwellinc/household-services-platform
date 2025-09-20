// Mock data for comprehensive testing

export const mockDashboardWidgets = [
  {
    id: 'widget-1',
    type: 'metric' as const,
    title: 'Total Users',
    size: { width: 4, height: 2 },
    position: { x: 0, y: 0 },
    config: {
      dataSource: 'users',
      parameters: { metric: 'count' },
      visualization: { type: 'number', color: 'blue' }
    },
    permissions: ['READ_USERS']
  },
  {
    id: 'widget-2',
    type: 'chart' as const,
    title: 'Revenue Trend',
    size: { width: 8, height: 4 },
    position: { x: 4, y: 0 },
    config: {
      dataSource: 'subscriptions',
      parameters: { timeRange: '30d', metric: 'revenue' },
      visualization: { type: 'line', color: 'green' }
    },
    permissions: ['READ_SUBSCRIPTIONS']
  }
];

export const mockFilterConfigs = [
  {
    key: 'status',
    label: 'Status',
    type: 'select' as const,
    options: [
      { value: 'ACTIVE', label: 'Active' },
      { value: 'SUSPENDED', label: 'Suspended' },
      { value: 'CANCELLED', label: 'Cancelled' }
    ]
  },
  {
    key: 'dateRange',
    label: 'Date Range',
    type: 'dateRange' as const,
    defaultValue: { start: null, end: null }
  },
  {
    key: 'role',
    label: 'Role',
    type: 'multiselect' as const,
    options: [
      { value: 'ADMIN', label: 'Admin' },
      { value: 'EMPLOYEE', label: 'Employee' },
      { value: 'CUSTOMER', label: 'Customer' }
    ]
  }
];

export const mockSearchResults = {
  users: [
    {
      id: 'user-1',
      type: 'user',
      title: 'John Doe',
      subtitle: 'john@example.com',
      metadata: { role: 'CUSTOMER', status: 'ACTIVE' }
    }
  ],
  subscriptions: [
    {
      id: 'sub-1',
      type: 'subscription',
      title: 'Premium Plan',
      subtitle: 'john@example.com',
      metadata: { status: 'ACTIVE', amount: '$29.99' }
    }
  ]
};

export const mockBulkOperations = [
  {
    id: 'bulk-suspend',
    label: 'Suspend Users',
    icon: 'UserX',
    confirmationRequired: true,
    permissions: ['SUSPEND_USERS'],
    maxItems: 100
  },
  {
    id: 'bulk-delete',
    label: 'Delete Users',
    icon: 'Trash2',
    confirmationRequired: true,
    permissions: ['DELETE_USERS'],
    maxItems: 50
  }
];

export const mockPermissions = [
  {
    id: 'perm-1',
    resource: 'users',
    actions: ['read', 'write', 'delete'],
    conditions: { own: true }
  },
  {
    id: 'perm-2',
    resource: 'subscriptions',
    actions: ['read', 'write'],
    conditions: {}
  }
];

export const mockRoles = [
  {
    id: 'role-1',
    name: 'Super Admin',
    description: 'Full system access',
    permissions: mockPermissions,
    isSystem: true
  },
  {
    id: 'role-2',
    name: 'Support Agent',
    description: 'Customer support access',
    permissions: [mockPermissions[0]],
    isSystem: false
  }
];

export const mockCommunicationThreads = [
  {
    id: 'thread-1',
    type: 'chat' as const,
    participants: [
      { id: 'user-1', name: 'John Doe', role: 'customer' },
      { id: 'admin-1', name: 'Support Agent', role: 'admin' }
    ],
    messages: [
      {
        id: 'msg-1',
        senderId: 'user-1',
        content: 'I need help with my subscription',
        timestamp: new Date('2024-01-15T10:00:00Z'),
        type: 'text'
      }
    ],
    status: 'open' as const,
    priority: 'medium' as const,
    tags: ['billing', 'subscription']
  }
];

export const mockSystemMetrics = {
  database: {
    connections: 45,
    maxConnections: 100,
    queryTime: 12.5,
    slowQueries: 3
  },
  api: {
    requestsPerMinute: 150,
    averageResponseTime: 245,
    errorRate: 0.02,
    activeConnections: 23
  },
  memory: {
    used: 1.2,
    total: 4.0,
    percentage: 30
  },
  cpu: {
    usage: 45,
    load: [0.8, 0.9, 1.1]
  }
};

export const mockExportJobs = [
  {
    id: 'export-1',
    type: 'users',
    format: 'csv',
    status: 'completed',
    progress: 100,
    createdAt: new Date('2024-01-15T09:00:00Z'),
    completedAt: new Date('2024-01-15T09:05:00Z'),
    downloadUrl: '/api/exports/export-1/download'
  },
  {
    id: 'export-2',
    type: 'subscriptions',
    format: 'excel',
    status: 'processing',
    progress: 65,
    createdAt: new Date('2024-01-15T10:00:00Z'),
    completedAt: null,
    downloadUrl: null
  }
];

export const mockReportTemplates = [
  {
    id: 'template-1',
    name: 'Monthly User Report',
    description: 'Monthly active users and growth metrics',
    category: 'users',
    fields: ['id', 'email', 'createdAt', 'lastLoginAt', 'status'],
    filters: { status: 'ACTIVE' },
    schedule: { frequency: 'monthly', dayOfMonth: 1 }
  },
  {
    id: 'template-2',
    name: 'Revenue Summary',
    description: 'Monthly revenue and subscription metrics',
    category: 'billing',
    fields: ['subscriptionId', 'amount', 'status', 'createdAt'],
    filters: { status: 'ACTIVE' },
    schedule: { frequency: 'weekly', dayOfWeek: 1 }
  }
];

export const mockAlerts = [
  {
    id: 'alert-1',
    type: 'error' as const,
    title: 'High Error Rate',
    message: 'API error rate exceeded 5% threshold',
    severity: 'high' as const,
    timestamp: new Date('2024-01-15T11:00:00Z'),
    acknowledged: false,
    source: 'api-monitoring'
  },
  {
    id: 'alert-2',
    type: 'warning' as const,
    title: 'Database Connections High',
    message: 'Database connection pool at 85% capacity',
    severity: 'medium' as const,
    timestamp: new Date('2024-01-15T10:30:00Z'),
    acknowledged: true,
    source: 'database-monitoring'
  }
];