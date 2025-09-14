'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EnhancedDataTable } from './EnhancedDataTable';
import { BulkOperationProgress } from './BulkOperationProgress';
import { useBulkOperations } from '@/hooks/use-bulk-operations';

// Mock data for demonstration
const mockUsers = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    status: 'ACTIVE',
    role: 'CUSTOMER',
    createdAt: '2024-01-15T10:30:00Z'
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    status: 'ACTIVE',
    role: 'CUSTOMER',
    createdAt: '2024-01-16T14:20:00Z'
  },
  {
    id: '3',
    name: 'Bob Johnson',
    email: 'bob@example.com',
    status: 'INACTIVE',
    role: 'CUSTOMER',
    createdAt: '2024-01-17T09:15:00Z'
  },
  {
    id: '4',
    name: 'Alice Brown',
    email: 'alice@example.com',
    status: 'SUSPENDED',
    role: 'CUSTOMER',
    createdAt: '2024-01-18T16:45:00Z'
  },
  {
    id: '5',
    name: 'Charlie Wilson',
    email: 'charlie@example.com',
    status: 'ACTIVE',
    role: 'EMPLOYEE',
    createdAt: '2024-01-19T11:30:00Z'
  }
];

const mockSubscriptions = [
  {
    id: 'sub_1',
    userId: '1',
    planName: 'Premium',
    status: 'ACTIVE',
    amount: 29.99,
    createdAt: '2024-01-15T10:30:00Z'
  },
  {
    id: 'sub_2',
    userId: '2',
    planName: 'Basic',
    status: 'ACTIVE',
    amount: 9.99,
    createdAt: '2024-01-16T14:20:00Z'
  },
  {
    id: 'sub_3',
    userId: '3',
    planName: 'Premium',
    status: 'CANCELLED',
    amount: 29.99,
    createdAt: '2024-01-17T09:15:00Z'
  }
];

const userColumns = [
  {
    key: 'name',
    label: 'Name',
    sortable: true
  },
  {
    key: 'email',
    label: 'Email',
    sortable: true
  },
  {
    key: 'status',
    label: 'Status',
    sortable: true,
    render: (value: string) => (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        value === 'ACTIVE' ? 'bg-green-100 text-green-800' :
        value === 'INACTIVE' ? 'bg-yellow-100 text-yellow-800' :
        'bg-red-100 text-red-800'
      }`}>
        {value}
      </span>
    )
  },
  {
    key: 'role',
    label: 'Role',
    sortable: true
  },
  {
    key: 'createdAt',
    label: 'Created',
    sortable: true,
    render: (value: string) => new Date(value).toLocaleDateString()
  }
];

const subscriptionColumns = [
  {
    key: 'planName',
    label: 'Plan',
    sortable: true
  },
  {
    key: 'status',
    label: 'Status',
    sortable: true,
    render: (value: string) => (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        value === 'ACTIVE' ? 'bg-green-100 text-green-800' :
        value === 'CANCELLED' ? 'bg-red-100 text-red-800' :
        'bg-yellow-100 text-yellow-800'
      }`}>
        {value}
      </span>
    )
  },
  {
    key: 'amount',
    label: 'Amount',
    sortable: true,
    render: (value: number) => `$${value.toFixed(2)}`
  },
  {
    key: 'createdAt',
    label: 'Created',
    sortable: true,
    render: (value: string) => new Date(value).toLocaleDateString()
  }
];

export function BulkOperationsDemo() {
  const [activeTab, setActiveTab] = useState<'users' | 'subscriptions'>('users');
  const { activeOperations } = useBulkOperations();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Bulk Operations Framework Demo</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            This demo showcases the bulk operations framework with safety controls, 
            progress tracking, and comprehensive audit logging.
          </p>
          
          <div className="flex space-x-1 mb-6">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'users'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Users
            </button>
            <button
              onClick={() => setActiveTab('subscriptions')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'subscriptions'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Subscriptions
            </button>
          </div>

          {activeTab === 'users' && (
            <EnhancedDataTable
              title="User Management"
              data={mockUsers}
              columns={userColumns}
              entityType="user"
              enableBulkOperations={true}
            />
          )}

          {activeTab === 'subscriptions' && (
            <EnhancedDataTable
              title="Subscription Management"
              data={mockSubscriptions}
              columns={subscriptionColumns}
              entityType="subscription"
              enableBulkOperations={true}
            />
          )}
        </CardContent>
      </Card>

      {/* Active Operations Progress */}
      {activeOperations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Active Bulk Operations</CardTitle>
          </CardHeader>
          <CardContent>
            <BulkOperationProgress operations={activeOperations} />
          </CardContent>
        </Card>
      )}

      {/* Features Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Framework Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium text-green-700 mb-2">Safety Controls</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Confirmation dialogs for destructive operations</li>
                <li>• Rate limiting and batch processing</li>
                <li>• Permission-based operation access</li>
                <li>• Validation before execution</li>
              </ul>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium text-blue-700 mb-2">Progress Tracking</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Real-time progress updates</li>
                <li>• Cancellation support</li>
                <li>• Detailed error reporting</li>
                <li>• Operation status monitoring</li>
              </ul>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium text-purple-700 mb-2">Audit & Logging</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Comprehensive audit trails</li>
                <li>• Operation metadata capture</li>
                <li>• Error tracking and analysis</li>
                <li>• Compliance reporting</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}