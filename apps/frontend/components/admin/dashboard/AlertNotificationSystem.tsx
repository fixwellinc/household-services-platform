"use client";

import React, { useState, useEffect } from 'react';
import { AlertConfig, NotificationChannel } from '@/types/dashboard';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  Mail, 
  MessageSquare, 
  Webhook,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Settings,
  Pause,
  Play,
  Volume2,
  VolumeX,
  Filter,
  Search,
  MoreVertical
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AlertNotification {
  id: string;
  alertId: string;
  alertName: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  status: 'pending' | 'sent' | 'failed' | 'acknowledged';
  channels: Array<{
    type: NotificationChannel['type'];
    target: string;
    status: 'pending' | 'sent' | 'failed';
    sentAt?: Date;
    error?: string;
  }>;
  metadata?: Record<string, any>;
}

interface NotificationSettings {
  enabled: boolean;
  soundEnabled: boolean;
  desktopNotifications: boolean;
  emailDigest: boolean;
  digestFrequency: 'immediate' | 'hourly' | 'daily';
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
  severityFilters: {
    low: boolean;
    medium: boolean;
    high: boolean;
    critical: boolean;
  };
}

interface AlertNotificationSystemProps {
  className?: string;
}

const MOCK_NOTIFICATIONS: AlertNotification[] = [
  {
    id: 'notif-1',
    alertId: 'alert-1',
    alertName: 'High CPU Usage',
    message: 'CPU usage has exceeded 85% threshold (current: 92%)',
    severity: 'high',
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    status: 'sent',
    channels: [
      { type: 'email', target: 'admin@example.com', status: 'sent', sentAt: new Date(Date.now() - 4 * 60 * 1000) },
      { type: 'push', target: 'admin_device', status: 'sent', sentAt: new Date(Date.now() - 4 * 60 * 1000) }
    ]
  },
  {
    id: 'notif-2',
    alertId: 'alert-2',
    alertName: 'Low Disk Space',
    message: 'Disk space is below 10% threshold (current: 7%)',
    severity: 'critical',
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
    status: 'sent',
    channels: [
      { type: 'email', target: 'admin@example.com', status: 'sent', sentAt: new Date(Date.now() - 14 * 60 * 1000) },
      { type: 'sms', target: '+1234567890', status: 'sent', sentAt: new Date(Date.now() - 14 * 60 * 1000) },
      { type: 'webhook', target: 'https://api.slack.com/webhook', status: 'failed', error: 'Connection timeout' }
    ]
  },
  {
    id: 'notif-3',
    alertId: 'alert-3',
    alertName: 'Revenue Target',
    message: 'Daily revenue target achieved (current: $12,500)',
    severity: 'low',
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    status: 'acknowledged',
    channels: [
      { type: 'email', target: 'team@example.com', status: 'sent', sentAt: new Date(Date.now() - 29 * 60 * 1000) }
    ]
  }
];

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: true,
  soundEnabled: true,
  desktopNotifications: true,
  emailDigest: false,
  digestFrequency: 'daily',
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '08:00'
  },
  severityFilters: {
    low: true,
    medium: true,
    high: true,
    critical: true
  }
};

export function AlertNotificationSystem({ className }: AlertNotificationSystemProps) {
  const [notifications, setNotifications] = useState<AlertNotification[]>(MOCK_NOTIFICATIONS);
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [filter, setFilter] = useState<'all' | 'unacknowledged' | 'failed'>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  // Request desktop notification permission
  useEffect(() => {
    if (settings.desktopNotifications && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, [settings.desktopNotifications]);

  // Simulate real-time notifications
  useEffect(() => {
    if (!settings.enabled) return;

    const interval = setInterval(() => {
      // Simulate receiving a new notification
      if (Math.random() < 0.1) { // 10% chance every 5 seconds
        const newNotification: AlertNotification = {
          id: `notif-${Date.now()}`,
          alertId: `alert-${Math.floor(Math.random() * 100)}`,
          alertName: 'System Alert',
          message: 'New system alert triggered',
          severity: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)] as any,
          timestamp: new Date(),
          status: 'pending',
          channels: [
            { type: 'email', target: 'admin@example.com', status: 'pending' }
          ]
        };

        setNotifications(prev => [newNotification, ...prev]);

        // Show desktop notification
        if (settings.desktopNotifications && Notification.permission === 'granted') {
          new Notification(newNotification.alertName, {
            body: newNotification.message,
            icon: '/favicon.ico'
          });
        }

        // Play sound
        if (settings.soundEnabled) {
          // In a real implementation, you would play an actual sound
          console.log('🔔 Alert sound played');
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [settings.enabled, settings.desktopNotifications, settings.soundEnabled]);

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unacknowledged' && notification.status === 'acknowledged') return false;
    if (filter === 'failed' && !notification.channels.some(c => c.status === 'failed')) return false;
    if (severityFilter !== 'all' && notification.severity !== severityFilter) return false;
    if (searchTerm && !notification.alertName.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !notification.message.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const handleAcknowledge = (notificationId: string) => {
    setNotifications(notifications.map(notification =>
      notification.id === notificationId
        ? { ...notification, status: 'acknowledged' as const }
        : notification
    ));
  };

  const handleRetryFailed = (notificationId: string) => {
    setNotifications(notifications.map(notification =>
      notification.id === notificationId
        ? {
            ...notification,
            channels: notification.channels.map(channel =>
              channel.status === 'failed'
                ? { ...channel, status: 'pending' as const, error: undefined }
                : channel
            )
          }
        : notification
    ));

    // Simulate retry
    setTimeout(() => {
      setNotifications(prev => prev.map(notification =>
        notification.id === notificationId
          ? {
              ...notification,
              channels: notification.channels.map(channel =>
                channel.status === 'pending'
                  ? { ...channel, status: 'sent' as const, sentAt: new Date() }
                  : channel
              )
            }
          : notification
      ));
    }, 2000);
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all notifications?')) {
      setNotifications([]);
    }
  };

  const getStatusIcon = (status: AlertNotification['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'sent':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'acknowledged':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getChannelIcon = (type: NotificationChannel['type']) => {
    switch (type) {
      case 'email':
        return <Mail className="h-3 w-3" />;
      case 'sms':
        return <MessageSquare className="h-3 w-3" />;
      case 'push':
        return <Bell className="h-3 w-3" />;
      case 'webhook':
        return <Webhook className="h-3 w-3" />;
      default:
        return <Bell className="h-3 w-3" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const unacknowledgedCount = notifications.filter(n => n.status !== 'acknowledged').length;
  const failedCount = notifications.filter(n => n.channels.some(c => c.status === 'failed')).length;

  if (showSettings) {
    return (
      <Card className={cn("p-6", className)}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Notification Settings</h2>
          <Button variant="ghost" size="sm" onClick={() => setShowSettings(false)}>
            ← Back to Notifications
          </Button>
        </div>

        <div className="space-y-6">
          {/* General Settings */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">General</h3>
            <div className="space-y-3">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={settings.enabled}
                  onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">Enable notifications</span>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={settings.soundEnabled}
                  onChange={(e) => setSettings({ ...settings, soundEnabled: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">Play sound for notifications</span>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={settings.desktopNotifications}
                  onChange={(e) => setSettings({ ...settings, desktopNotifications: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">Show desktop notifications</span>
              </label>
            </div>
          </div>

          {/* Email Digest */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">Email Digest</h3>
            <div className="space-y-3">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={settings.emailDigest}
                  onChange={(e) => setSettings({ ...settings, emailDigest: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">Send email digest</span>
              </label>

              {settings.emailDigest && (
                <select
                  value={settings.digestFrequency}
                  onChange={(e) => setSettings({ 
                    ...settings, 
                    digestFrequency: e.target.value as NotificationSettings['digestFrequency']
                  })}
                  className="ml-6 px-3 py-1 text-sm border border-gray-200 rounded"
                >
                  <option value="immediate">Immediate</option>
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                </select>
              )}
            </div>
          </div>

          {/* Quiet Hours */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">Quiet Hours</h3>
            <div className="space-y-3">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={settings.quietHours.enabled}
                  onChange={(e) => setSettings({
                    ...settings,
                    quietHours: { ...settings.quietHours, enabled: e.target.checked }
                  })}
                  className="rounded"
                />
                <span className="text-sm">Enable quiet hours</span>
              </label>

              {settings.quietHours.enabled && (
                <div className="ml-6 flex items-center space-x-2">
                  <input
                    type="time"
                    value={settings.quietHours.start}
                    onChange={(e) => setSettings({
                      ...settings,
                      quietHours: { ...settings.quietHours, start: e.target.value }
                    })}
                    className="px-2 py-1 text-sm border border-gray-200 rounded"
                  />
                  <span className="text-sm text-gray-500">to</span>
                  <input
                    type="time"
                    value={settings.quietHours.end}
                    onChange={(e) => setSettings({
                      ...settings,
                      quietHours: { ...settings.quietHours, end: e.target.value }
                    })}
                    className="px-2 py-1 text-sm border border-gray-200 rounded"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Severity Filters */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">Severity Filters</h3>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(settings.severityFilters).map(([severity, enabled]) => (
                <label key={severity} className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => setSettings({
                      ...settings,
                      severityFilters: {
                        ...settings.severityFilters,
                        [severity]: e.target.checked
                      }
                    })}
                    className="rounded"
                  />
                  <Badge className={getSeverityColor(severity)}>
                    {severity.charAt(0).toUpperCase() + severity.slice(1)}
                  </Badge>
                </label>
              ))}
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn("", className)}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold text-gray-900">Alert Notifications</h2>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSettings({ ...settings, enabled: !settings.enabled })}
                className={cn(
                  "h-8 w-8 p-0",
                  settings.enabled ? "text-green-600" : "text-gray-400"
                )}
              >
                {settings.enabled ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSettings({ ...settings, soundEnabled: !settings.soundEnabled })}
                className={cn(
                  "h-8 w-8 p-0",
                  settings.soundEnabled ? "text-blue-600" : "text-gray-400"
                )}
              >
                {settings.soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={() => setShowSettings(true)}>
              <Settings className="h-4 w-4" />
            </Button>
            
            <Button variant="ghost" size="sm" onClick={handleClearAll}>
              Clear All
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center space-x-4 mt-3">
          <div className="text-sm text-gray-600">
            Total: <span className="font-medium">{notifications.length}</span>
          </div>
          <div className="text-sm text-gray-600">
            Unacknowledged: <span className="font-medium text-orange-600">{unacknowledgedCount}</span>
          </div>
          <div className="text-sm text-gray-600">
            Failed: <span className="font-medium text-red-600">{failedCount}</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 border-b border-gray-200 space-y-3">
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-3 py-1 text-sm border border-gray-200 rounded"
          >
            <option value="all">All Notifications</option>
            <option value="unacknowledged">Unacknowledged</option>
            <option value="failed">Failed</option>
          </select>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-1 text-sm border border-gray-200 rounded"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-h-96 overflow-auto">
        {filteredNotifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-sm font-medium text-gray-900 mb-2">No notifications</h3>
            <p className="text-sm text-gray-500">
              {notifications.length === 0 
                ? "You'll see alert notifications here when they're triggered."
                : "No notifications match your current filters."
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredNotifications.map((notification) => (
              <div key={notification.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    {getStatusIcon(notification.status)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {notification.alertName}
                      </h4>
                      <Badge className={getSeverityColor(notification.severity)}>
                        {notification.severity}
                      </Badge>
                    </div>

                    <p className="text-sm text-gray-600 mb-2">
                      {notification.message}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">
                          {notification.timestamp.toLocaleString()}
                        </span>
                        
                        <div className="flex items-center space-x-1">
                          {notification.channels.map((channel, index) => (
                            <div
                              key={index}
                              className={cn(
                                "flex items-center space-x-1 px-2 py-1 rounded text-xs",
                                channel.status === 'sent' && "bg-green-100 text-green-800",
                                channel.status === 'failed' && "bg-red-100 text-red-800",
                                channel.status === 'pending' && "bg-yellow-100 text-yellow-800"
                              )}
                              title={channel.error || `${channel.type}: ${channel.target}`}
                            >
                              {getChannelIcon(channel.type)}
                              <span>{channel.status}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center space-x-1">
                        {notification.status !== 'acknowledged' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAcknowledge(notification.id)}
                            className="h-6 px-2 text-xs"
                          >
                            Acknowledge
                          </Button>
                        )}
                        
                        {notification.channels.some(c => c.status === 'failed') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRetryFailed(notification.id)}
                            className="h-6 px-2 text-xs text-blue-600"
                          >
                            Retry
                          </Button>
                        )}
                      </div>
                    </div>

                    {notification.channels.some(c => c.error) && (
                      <div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-700">
                        <strong>Errors:</strong>
                        <ul className="mt-1 space-y-1">
                          {notification.channels
                            .filter(c => c.error)
                            .map((channel, index) => (
                              <li key={index}>
                                {channel.type}: {channel.error}
                              </li>
                            ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}