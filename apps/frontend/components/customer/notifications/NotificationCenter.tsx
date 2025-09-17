'use client';

import React, { useState, useEffect } from 'react';
import { Notification, NotificationType, NotificationPriority } from '@fixwell/types';
import { Bell, X, AlertTriangle, Info, CheckCircle, Star, ExternalLink } from 'lucide-react';

interface NotificationCenterProps {
  notifications: Notification[];
  onMarkAsRead: (notificationId: string) => void;
  onMarkAllAsRead: () => void;
  onDeleteNotification: (notificationId: string) => void;
  className?: string;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<NotificationType | 'ALL'>('ALL');

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getPriorityIcon = (priority: NotificationPriority) => {
    switch (priority) {
      case 'URGENT':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'HIGH':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'MEDIUM':
        return <Info className="w-4 h-4 text-blue-500" />;
      case 'LOW':
        return <Info className="w-4 h-4 text-gray-500" />;
      default:
        return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPriorityStyles = (priority: NotificationPriority) => {
    switch (priority) {
      case 'URGENT':
        return 'border-l-4 border-red-500 bg-red-50';
      case 'HIGH':
        return 'border-l-4 border-orange-500 bg-orange-50';
      case 'MEDIUM':
        return 'border-l-4 border-blue-500 bg-blue-50';
      case 'LOW':
        return 'border-l-4 border-gray-300 bg-gray-50';
      default:
        return 'border-l-4 border-gray-300 bg-gray-50';
    }
  };

  const getTypeIcon = (type: NotificationType) => {
    switch (type) {
      case 'BILLING':
        return '💳';
      case 'SERVICE':
        return '🔧';
      case 'ACCOUNT':
        return '👤';
      case 'PROMOTION':
        return '🎉';
      default:
        return '📢';
    }
  };

  const filteredNotifications = selectedCategory === 'ALL' 
    ? notifications 
    : notifications.filter(n => n.type === selectedCategory);

  const categorizedNotifications = filteredNotifications.sort((a, b) => {
    // Sort by priority first (urgent first), then by read status, then by date
    const priorityOrder = { 'URGENT': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    if (a.isRead !== b.isRead) {
      return a.isRead ? 1 : -1;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      onMarkAsRead(notification.id);
    }
    if (notification.actionUrl) {
      window.open(notification.actionUrl, '_blank');
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close notifications"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Category Filter */}
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => setSelectedCategory('ALL')}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  selectedCategory === 'ALL'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              {(['BILLING', 'SERVICE', 'ACCOUNT', 'PROMOTION'] as NotificationType[]).map(type => (
                <button
                  key={type}
                  onClick={() => setSelectedCategory(type)}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${
                    selectedCategory === type
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {getTypeIcon(type)} {type.charAt(0) + type.slice(1).toLowerCase()}
                </button>
              ))}
            </div>

            {/* Actions */}
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllAsRead}
                className="text-sm text-blue-600 hover:text-blue-800 mt-2"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {categorizedNotifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No notifications</p>
                <p className="text-sm">You're all caught up!</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {categorizedNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      !notification.isRead ? 'bg-blue-50' : ''
                    } ${getPriorityStyles(notification.priority)}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {getPriorityIcon(notification.priority)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm">{getTypeIcon(notification.type)}</span>
                          <h4 className={`text-sm font-medium ${
                            !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                          }`}>
                            {notification.title}
                          </h4>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-2">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            {new Date(notification.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          
                          <div className="flex items-center gap-2">
                            {notification.actionUrl && (
                              <ExternalLink className="w-3 h-3 text-gray-400" />
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteNotification(notification.id);
                              }}
                              className="text-gray-400 hover:text-red-500 transition-colors"
                              aria-label="Delete notification"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        
                        {notification.actionRequired && notification.actionText && (
                          <button className="mt-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition-colors">
                            {notification.actionText}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;