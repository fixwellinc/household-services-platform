"use client";

import React from 'react';
import { useAdminNavigation } from '@/hooks/use-admin-navigation';
import { useAdminRealtime } from '@/hooks/use-admin-realtime';
import { 
  Users, 
  DollarSign, 
  Calendar, 
  Activity,
  TrendingUp,
  TrendingDown,
  Bell,
  MessageSquare
} from 'lucide-react';

// Import existing admin components
import EnhancedAnalytics from './EnhancedAnalytics';
import { DashboardContainer } from './dashboard/DashboardContainer';
import { UserManagement } from './users/UserManagement';
import { SubscriptionManagement } from './subscriptions/SubscriptionManagement';
import AuditLogs from './AuditLogs';
import { AdminErrorBoundary, AdminErrorFallback } from './ErrorBoundary';
import { ToastContainer } from './NotificationToast';

export function AdminDashboard() {
  const { activeTab } = useAdminNavigation();
  const { notifications, unreadCount } = useAdminRealtime();

  // Mock data - in real implementation, this would come from API
  const dashboardStats = {
    totalUsers: 1250,
    totalRevenue: 45600,
    totalBookings: 89,
    activeSessions: 12,
    userGrowth: 8.2,
    revenueGrowth: 12.5,
    bookingGrowth: -2.1,
    sessionGrowth: 15.3
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'analytics':
        return (
          <AdminErrorBoundary
            fallback={<AdminErrorFallback error={new Error('Analytics failed to load')} resetError={() => window.location.reload()} />}
          >
            <EnhancedAnalytics />
          </AdminErrorBoundary>
        );

      case 'users':
        return (
          <AdminErrorBoundary
            fallback={<AdminErrorFallback error={new Error('User management failed to load')} resetError={() => window.location.reload()} />}
          >
            <div className="p-6">
              <UserManagement />
            </div>
          </AdminErrorBoundary>
        );

      case 'subscriptions':
        return (
          <AdminErrorBoundary
            fallback={<AdminErrorFallback error={new Error('Subscription management failed to load')} resetError={() => window.location.reload()} />}
          >
            <SubscriptionManagement />
          </AdminErrorBoundary>
        );

      case 'email-blast':
        return (
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Email Marketing</h2>
            <p className="text-gray-600">Enhanced email marketing interface coming soon...</p>
          </div>
        );

      case 'live-chat':
        return (
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Live Chat</h2>
            <p className="text-gray-600">Enhanced live chat interface coming soon...</p>
          </div>
        );

      case 'mobile-notifications':
        return (
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Push Notifications</h2>
            <p className="text-gray-600">Enhanced push notification interface coming soon...</p>
          </div>
        );

      case 'audit':
        return (
          <AdminErrorBoundary
            fallback={<AdminErrorFallback error={new Error('Audit logs failed to load')} resetError={() => window.location.reload()} />}
          >
            <div className="p-6">
              <AuditLogs />
            </div>
          </AdminErrorBoundary>
        );

      case 'reports':
        return (
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Reports</h2>
            <p className="text-gray-600">Report generation interface coming soon...</p>
          </div>
        );

      case 'monitoring':
        return (
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">System Health</h2>
            <p className="text-gray-600">System monitoring interface coming soon...</p>
          </div>
        );

      case 'settings':
        return (
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Settings</h2>
            <p className="text-gray-600">Enhanced settings interface coming soon...</p>
          </div>
        );

      default:
        return (
          <AdminErrorBoundary
            fallback={<AdminErrorFallback error={new Error('Dashboard failed to load')} resetError={() => window.location.reload()} />}
          >
            <DashboardContainer
              onLayoutSave={async (layout) => {
                try {
                  const response = await fetch('/api/admin/dashboard/layouts', {
                    method: layout.id ? 'PUT' : 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(layout),
                  });

                  if (!response.ok) {
                    throw new Error('Failed to save layout');
                  }

                  const result = await response.json();
                  console.log('Layout saved successfully:', result);
                } catch (error) {
                  console.error('Error saving layout:', error);
                  throw error;
                }
              }}
              onLayoutLoad={async () => {
                try {
                  const response = await fetch('/api/admin/dashboard/layouts?userId=admin');

                  if (!response.ok) {
                    throw new Error('Failed to load layouts');
                  }

                  const result = await response.json();

                  // Return the first layout or create a default one
                  if (result.layouts && result.layouts.length > 0) {
                    return result.layouts[0];
                  } else {
                    throw new Error('No saved layouts found');
                  }
                } catch (error) {
                  console.error('Error loading layout:', error);
                  throw error;
                }
              }}
            />
          </AdminErrorBoundary>
        );
    }
  };

  return (
    <>
      {renderContent()}
      <ToastContainer />
    </>
  );
}