"use client";

import React, { useState } from 'react';
import { Shield, Users, Eye, Settings } from 'lucide-react';
import { RoleBuilder } from './RoleBuilder';
import { ImpersonationHistory } from './UserImpersonation';
import { PermissionGuard } from '@/hooks/use-permissions';

type TabType = 'roles' | 'impersonation' | 'settings';

export function PermissionManagement() {
  const [activeTab, setActiveTab] = useState<TabType>('roles');

  const tabs = [
    {
      id: 'roles' as TabType,
      label: 'Roles & Permissions',
      icon: Shield,
      permission: 'roles.view',
      description: 'Manage user roles and permissions'
    },
    {
      id: 'impersonation' as TabType,
      label: 'Impersonation History',
      icon: Eye,
      permission: 'audit.view',
      description: 'View user impersonation sessions'
    },
    {
      id: 'settings' as TabType,
      label: 'Permission Settings',
      icon: Settings,
      permission: 'system.configure',
      description: 'Configure permission system settings'
    }
  ];

  const availableTabs = tabs.filter(tab => {
    // For now, we'll show all tabs and let PermissionGuard handle the filtering
    return true;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <Shield className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Permission Management</h1>
          <p className="text-gray-600">Manage user roles, permissions, and access control</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {availableTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <PermissionGuard key={tab.id} permission={tab.permission}>
                <button
                  onClick={() => setActiveTab(tab.id)}
                  className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon
                    className={`-ml-0.5 mr-2 h-5 w-5 ${
                      activeTab === tab.id ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                    }`}
                  />
                  {tab.label}
                </button>
              </PermissionGuard>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'roles' && (
          <PermissionGuard permission="roles.view">
            <RoleBuilder />
          </PermissionGuard>
        )}

        {activeTab === 'impersonation' && (
          <PermissionGuard permission="audit.view">
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Impersonation Activity</h2>
                <p className="text-gray-600">
                  Monitor and review all user impersonation sessions for security and compliance.
                </p>
              </div>
              <ImpersonationHistory />
            </div>
          </PermissionGuard>
        )}

        {activeTab === 'settings' && (
          <PermissionGuard permission="system.configure">
            <PermissionSettings />
          </PermissionGuard>
        )}
      </div>
    </div>
  );
}

// Permission Settings Component
function PermissionSettings() {
  const [loading, setLoading] = useState(false);
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Permission System Settings</h2>
        <p className="text-gray-600">
          Configure global permission system settings and security policies.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Security Settings */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Security Settings</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Require MFA for Admin Actions
                </label>
                <p className="text-xs text-gray-500">
                  Require multi-factor authentication for sensitive admin operations
                </p>
              </div>
              <input
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                defaultChecked={false}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Auto-expire Impersonation Sessions
                </label>
                <p className="text-xs text-gray-500">
                  Automatically end impersonation sessions after 4 hours
                </p>
              </div>
              <input
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                defaultChecked={true}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Log All Permission Checks
                </label>
                <p className="text-xs text-gray-500">
                  Log all permission validation attempts for audit purposes
                </p>
              </div>
              <input
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                defaultChecked={true}
              />
            </div>
          </div>
        </div>

        {/* Role Management Settings */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Role Management</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Allow Custom Roles
                </label>
                <p className="text-xs text-gray-500">
                  Allow creation of custom roles beyond system defaults
                </p>
              </div>
              <input
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                defaultChecked={true}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Role Expiration Warnings
                </label>
                <p className="text-xs text-gray-500">
                  Send notifications before role assignments expire
                </p>
              </div>
              <input
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                defaultChecked={true}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Default Role Expiration (days)
              </label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                defaultValue={365}
                min={1}
                max={3650}
              />
              <p className="text-xs text-gray-500 mt-1">
                Default expiration period for new role assignments
              </p>
            </div>
          </div>
        </div>

        {/* System Information */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">System Information</h3>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Permission System Version:</span>
              <span className="text-sm font-medium text-gray-900">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Last Updated:</span>
              <span className="text-sm font-medium text-gray-900">
                {new Date().toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Permissions:</span>
              <span className="text-sm font-medium text-gray-900">28</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">System Roles:</span>
              <span className="text-sm font-medium text-gray-900">6</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">System Actions</h3>
          
          <div className="space-y-3">
            <button
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Settings'}
            </button>
            
            <button
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Export Permission Configuration
            </button>
            
            <button
              className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
            >
              Reset to Default Permissions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}