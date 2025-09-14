"use client";

import React from 'react';
import { ChevronRight, Home, Clock, Star } from 'lucide-react';
import { NavigationItem } from '../../../types/admin';
import { useAdminNavigation } from '../../../hooks/use-admin-navigation';

interface AdminBreadcrumbProps {
  activeTab: string;
  navigationItems: NavigationItem[];
}

export function AdminBreadcrumb({ activeTab, navigationItems }: AdminBreadcrumbProps) {
  const { getRecentItems, getFavoriteItems } = useAdminNavigation();
  const activeItem = navigationItems.find(item => item.id === activeTab);
  const recentItems = getRecentItems();
  const favoriteItems = getFavoriteItems();
  
  if (!activeItem) return null;

  // Build breadcrumb path
  const breadcrumbPath = [
    { name: 'Admin', icon: Home, href: '/admin' },
    { name: activeItem.name, icon: activeItem.icon }
  ];

  const isFavorite = favoriteItems.some(item => item.id === activeTab);
  const isRecent = recentItems.some(item => item.id === activeTab);

  return (
    <div className="mb-6">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-3">
        {breadcrumbPath.map((item, index) => (
          <React.Fragment key={index}>
            {index > 0 && <ChevronRight className="h-4 w-4" />}
            <div className="flex items-center space-x-1">
              <item.icon className="h-4 w-4" />
              <span className={index === breadcrumbPath.length - 1 ? 'font-medium text-gray-900' : 'hover:text-gray-700'}>
                {item.name}
              </span>
            </div>
          </React.Fragment>
        ))}
      </nav>
      
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-gray-900">{activeItem.name}</h1>
            
            {/* Status Indicators */}
            <div className="flex items-center space-x-2">
              {isFavorite && (
                <div className="flex items-center text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full text-xs">
                  <Star className="h-3 w-3 mr-1 fill-current" />
                  Favorite
                </div>
              )}
              
              {isRecent && (
                <div className="flex items-center text-blue-600 bg-blue-50 px-2 py-1 rounded-full text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  Recent
                </div>
              )}
              
              {activeItem.badge && (
                <div className={`flex items-center px-2 py-1 rounded-full text-xs ${
                  activeItem.badge.variant === 'error' ? 'bg-red-100 text-red-800' :
                  activeItem.badge.variant === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {activeItem.badge.count} {activeItem.badge.variant === 'error' ? 'issues' : 
                                           activeItem.badge.variant === 'warning' ? 'pending' : 'items'}
                </div>
              )}
            </div>
          </div>
          
          <p className="text-gray-600 mt-2">
            {getPageDescription(activeItem.id)}
          </p>
          
          {/* Context Information */}
          {getContextInfo(activeItem.id) && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                {getContextInfo(activeItem.id)}
              </p>
            </div>
          )}
        </div>
        
        {/* Quick Actions */}
        <div className="flex items-center space-x-2 ml-4">
          {getQuickActions(activeItem.id).map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                action.variant === 'primary' 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {action.icon && <action.icon className="h-4 w-4 mr-2" />}
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function getPageDescription(tabId: string): string {
  const descriptions: Record<string, string> = {
    dashboard: 'Overview of your platform metrics and quick actions',
    analytics: 'Detailed analytics and performance insights',
    users: 'Manage user accounts, roles, and permissions',
    subscriptions: 'Monitor and manage customer subscriptions',
    'email-blast': 'Send marketing emails and manage templates',
    'live-chat': 'Monitor and respond to customer conversations',
    'mobile-notifications': 'Send push notifications to mobile users',
    settings: 'Configure system settings and preferences',
    audit: 'View audit logs and system activity',
    reports: 'Generate and export system reports',
    monitoring: 'System health and performance monitoring'
  };
  
  return descriptions[tabId] || 'Manage your application from here';
}

function getContextInfo(tabId: string): string | null {
  const contextInfo: Record<string, string> = {
    users: 'Tip: Use bulk operations to efficiently manage multiple users at once.',
    subscriptions: 'Monitor subscription health and identify churn risks early.',
    audit: 'All administrative actions are automatically logged for compliance.',
    monitoring: 'System alerts are configured to notify you of critical issues.'
  };
  
  return contextInfo[tabId] || null;
}

interface QuickAction {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  variant: 'primary' | 'secondary';
}

function getQuickActions(tabId: string): QuickAction[] {
  const actions: Record<string, QuickAction[]> = {
    dashboard: [
      {
        label: 'Refresh Data',
        onClick: () => window.location.reload(),
        variant: 'secondary'
      }
    ],
    users: [
      {
        label: 'Add User',
        onClick: () => console.log('Add user'),
        variant: 'primary'
      },
      {
        label: 'Export Users',
        onClick: () => console.log('Export users'),
        variant: 'secondary'
      }
    ],
    subscriptions: [
      {
        label: 'New Subscription',
        onClick: () => console.log('New subscription'),
        variant: 'primary'
      }
    ],
    audit: [
      {
        label: 'Export Logs',
        onClick: () => console.log('Export logs'),
        variant: 'secondary'
      }
    ]
  };
  
  return actions[tabId] || [];
}