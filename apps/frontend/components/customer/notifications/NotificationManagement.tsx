'use client';

import React, { useState } from 'react';
import { Notification, NotificationType, NotificationPriority } from '@fixwell/types';
import { Settings, Archive, Trash2, Bell, BellOff, Filter, Download, Search } from 'lucide-react';

interface NotificationPreferences {
  email: {
    billing: boolean;
    service: boolean;
    account: boolean;
    promotion: boolean;
  };
  push: {
    billing: boolean;
    service: boolean;
    account: boolean;
    promotion: boolean;
  };
  minimumPriority: NotificationPriority;
}

interface NotificationManagementProps {
  notifications: Notification[];
  archivedNotifications: Notification[];
  preferences: NotificationPreferences;
  onUpdatePreferences: (preferences: NotificationPreferences) => void;
  onArchiveNotification: (notificationId: string) => void;
  onDeleteNotification: (notificationId: string) => void;
  onRestoreNotification: (notificationId: string) => void;
  onBulkAction: (action: 'archive' | 'delete', notificationIds: string[]) => void;
  onExportNotifications: () => void;
}

const NotificationManagement: React.FC<NotificationManagementProps> = ({
  notifications,
  archivedNotifications,
  preferences,
  onUpdatePreferences,
  onArchiveNotification,
  onDeleteNotification,
  onRestoreNotification,
  onBulkAction,
  onExportNotifications
}) => {
  const [activeTab, setActiveTab] = useState<'active' | 'archived' | 'preferences'>('active');
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<NotificationType | 'ALL'>('ALL');
  const [filterPriority, setFilterPriority] = useState<NotificationPriority | 'ALL'>('ALL');

  const handlePreferenceChange = (
    category: 'email' | 'push',
    type: NotificationType,
    enabled: boolean
  ) => {
    const updatedPreferences = {
      ...preferences,
      [category]: {
        ...preferences[category],
        [type.toLowerCase()]: enabled
      }
    };
    onUpdatePreferences(updatedPreferences);
  };

  const handleMinimumPriorityChange = (priority: NotificationPriority) => {
    onUpdatePreferences({
      ...preferences,
      minimumPriority: priority
    });
  };

  const handleSelectNotification = (notificationId: string) => {
    setSelectedNotifications(prev => 
      prev.includes(notificationId)
        ? prev.filter(id => id !== notificationId)
        : [...prev, notificationId]
    );
  };

  const handleSelectAll = (notificationList: Notification[]) => {
    const allIds = notificationList.map(n => n.id);
    setSelectedNotifications(
      selectedNotifications.length === allIds.length ? [] : allIds
    );
  };

  const filterNotifications = (notificationList: Notification[]) => {
    return notificationList.filter(notification => {
      const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           notification.message.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'ALL' || notification.type === filterType;
      const matchesPriority = filterPriority === 'ALL' || notification.priority === filterPriority;
      
      return matchesSearch && matchesType && matchesPriority;
    });
  };

  const filteredActiveNotifications = filterNotifications(notifications);
  const filteredArchivedNotifications = filterNotifications(archivedNotifications);

  const renderNotificationList = (notificationList: Notification[], isArchived = false) => (
    <div className="space-y-3">
      {/* Bulk Actions */}
      {selectedNotifications.length > 0 && (
        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
          <span className="text-sm text-blue-700">
            {selectedNotifications.length} selected
          </span>
          <div className="flex gap-2">
            {!isArchived && (
              <button
                onClick={() => {
                  onBulkAction('archive', selectedNotifications);
                  setSelectedNotifications([]);
                }}
                className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded hover:bg-blue-200 transition-colors"
              >
                <Archive className="w-3 h-3 inline mr-1" />
                Archive
              </button>
            )}
            <button
              onClick={() => {
                onBulkAction('delete', selectedNotifications);
                setSelectedNotifications([]);
              }}
              className="px-3 py-1 bg-red-100 text-red-700 text-sm rounded hover:bg-red-200 transition-colors"
            >
              <Trash2 className="w-3 h-3 inline mr-1" />
              Delete
            </button>
          </div>
        </div>
      )}

      {notificationList.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No notifications found</p>
        </div>
      ) : (
        notificationList.map((notification) => (
          <div
            key={notification.id}
            className={`p-4 border rounded-lg ${
              selectedNotifications.includes(notification.id)
                ? 'border-blue-300 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            } transition-colors`}
          >
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={selectedNotifications.includes(notification.id)}
                onChange={() => handleSelectNotification(notification.id)}
                className="mt-1"
              />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-medium text-gray-900">
                    {notification.title}
                  </h4>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    notification.priority === 'URGENT' ? 'bg-red-100 text-red-700' :
                    notification.priority === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                    notification.priority === 'MEDIUM' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {notification.priority}
                  </span>
                  <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                    {notification.type}
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 mb-2">
                  {notification.message}
                </p>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    {new Date(notification.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                  
                  <div className="flex items-center gap-2">
                    {isArchived ? (
                      <button
                        onClick={() => onRestoreNotification(notification.id)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Restore
                      </button>
                    ) : (
                      <button
                        onClick={() => onArchiveNotification(notification.id)}
                        className="text-gray-600 hover:text-gray-800"
                        title="Archive"
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => onDeleteNotification(notification.id)}
                      className="text-red-600 hover:text-red-800"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Notification Management</h2>
        <button
          onClick={onExportNotifications}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {[
            { id: 'active', label: 'Active', count: notifications.length },
            { id: 'archived', label: 'Archived', count: archivedNotifications.length },
            { id: 'preferences', label: 'Preferences' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'preferences' ? (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Preferences</h3>
            
            {/* Minimum Priority */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Priority Level
              </label>
              <select
                value={preferences.minimumPriority}
                onChange={(e) => handleMinimumPriorityChange(e.target.value as NotificationPriority)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="LOW">All notifications (Low and above)</option>
                <option value="MEDIUM">Medium and above</option>
                <option value="HIGH">High and above</option>
                <option value="URGENT">Urgent only</option>
              </select>
            </div>

            {/* Email Notifications */}
            <div className="mb-6">
              <h4 className="text-md font-medium text-gray-900 mb-3">Email Notifications</h4>
              <div className="space-y-3">
                {(['BILLING', 'SERVICE', 'ACCOUNT', 'PROMOTION'] as NotificationType[]).map((type) => (
                  <label key={type} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={preferences.email[type.toLowerCase() as keyof typeof preferences.email]}
                      onChange={(e) => handlePreferenceChange('email', type, e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      {type.charAt(0) + type.slice(1).toLowerCase()} notifications
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Push Notifications */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-3">Push Notifications</h4>
              <div className="space-y-3">
                {(['BILLING', 'SERVICE', 'ACCOUNT', 'PROMOTION'] as NotificationType[]).map((type) => (
                  <label key={type} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={preferences.push[type.toLowerCase() as keyof typeof preferences.push]}
                      onChange={(e) => handlePreferenceChange('push', type, e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      {type.charAt(0) + type.slice(1).toLowerCase()} notifications
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Search and Filters */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search notifications..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as NotificationType | 'ALL')}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ALL">All Types</option>
                <option value="BILLING">Billing</option>
                <option value="SERVICE">Service</option>
                <option value="ACCOUNT">Account</option>
                <option value="PROMOTION">Promotion</option>
              </select>
              
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value as NotificationPriority | 'ALL')}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ALL">All Priorities</option>
                <option value="URGENT">Urgent</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
            
            {/* Select All */}
            <div className="mt-4 flex items-center gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedNotifications.length > 0}
                  onChange={() => handleSelectAll(
                    activeTab === 'active' ? filteredActiveNotifications : filteredArchivedNotifications
                  )}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
                <span className="ml-2 text-sm text-gray-700">Select All</span>
              </label>
            </div>
          </div>

          {/* Notification List */}
          {activeTab === 'active' 
            ? renderNotificationList(filteredActiveNotifications)
            : renderNotificationList(filteredArchivedNotifications, true)
          }
        </div>
      )}
    </div>
  );
};

export default NotificationManagement;