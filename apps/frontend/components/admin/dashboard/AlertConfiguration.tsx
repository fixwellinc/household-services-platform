"use client";

import React, { useState } from 'react';
import { AlertConfig, NotificationChannel, DashboardWidget } from '@/types/dashboard';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  Plus, 
  Edit3, 
  Trash2, 
  Save, 
  X,
  Bell,
  Mail,
  MessageSquare,
  Webhook,
  ToggleLeft,
  Settings,
  FlaskConical
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AlertConfigurationProps {
  widget: DashboardWidget;
  onUpdate: (widget: DashboardWidget) => void;
  onClose: () => void;
  className?: string;
}

interface AlertFormData {
  name: string;
  condition: {
    field: string;
    operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'ne';
    value: string;
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  notifications: NotificationChannel[];
}

const OPERATORS = [
  { value: 'gt', label: 'Greater than (>)' },
  { value: 'gte', label: 'Greater than or equal (≥)' },
  { value: 'lt', label: 'Less than (<)' },
  { value: 'lte', label: 'Less than or equal (≤)' },
  { value: 'eq', label: 'Equal to (=)' },
  { value: 'ne', label: 'Not equal to (≠)' }
];

const SEVERITY_LEVELS = [
  { value: 'low', label: 'Low', color: 'bg-blue-100 text-blue-800' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
  { value: 'critical', label: 'Critical', color: 'bg-red-100 text-red-800' }
];

const NOTIFICATION_TYPES = [
  { 
    type: 'email', 
    label: 'Email', 
    icon: Mail, 
    placeholder: 'admin@example.com',
    description: 'Send email notifications'
  },
  { 
    type: 'sms', 
    label: 'SMS', 
    icon: MessageSquare, 
    placeholder: '+1234567890',
    description: 'Send SMS notifications'
  },
  { 
    type: 'push', 
    label: 'Push Notification', 
    icon: Bell, 
    placeholder: 'user_id or device_token',
    description: 'Send push notifications'
  },
  { 
    type: 'webhook', 
    label: 'Webhook', 
    icon: Webhook, 
    placeholder: 'https://api.example.com/webhook',
    description: 'Send HTTP webhook'
  }
];

const DEFAULT_ALERT_FORM: AlertFormData = {
  name: '',
  condition: {
    field: 'value',
    operator: 'gt',
    value: ''
  },
  severity: 'medium',
  enabled: true,
  notifications: []
};

export function AlertConfiguration({
  widget,
  onUpdate,
  onClose,
  className
}: AlertConfigurationProps) {
  const [alerts, setAlerts] = useState<AlertConfig[]>(widget.config.alerts || []);
  const [editingAlert, setEditingAlert] = useState<AlertConfig | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<AlertFormData>(DEFAULT_ALERT_FORM);
  const [testingAlert, setTestingAlert] = useState<string | null>(null);

  const handleSave = () => {
    const updatedWidget: DashboardWidget = {
      ...widget,
      config: {
        ...widget.config,
        alerts: alerts
      },
      updatedAt: new Date()
    };
    onUpdate(updatedWidget);
    onClose();
  };

  const handleCreateAlert = () => {
    setIsCreating(true);
    setEditingAlert(null);
    setFormData(DEFAULT_ALERT_FORM);
  };

  const handleEditAlert = (alert: AlertConfig) => {
    setEditingAlert(alert);
    setIsCreating(false);
    setFormData({
      name: alert.name,
      condition: {
        ...alert.condition,
        value: String(alert.condition.value)
      },
      severity: alert.severity,
      enabled: alert.enabled,
      notifications: alert.notifications
    });
  };

  const handleDeleteAlert = (alertId: string) => {
    if (window.confirm('Are you sure you want to delete this alert?')) {
      setAlerts(alerts.filter(alert => alert.id !== alertId));
    }
  };

  const handleToggleAlert = (alertId: string) => {
    setAlerts(alerts.map(alert =>
      alert.id === alertId
        ? { ...alert, enabled: !alert.enabled }
        : alert
    ));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.condition.value.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    const alertData: AlertConfig = {
      id: editingAlert?.id || `alert-${Date.now()}`,
      name: formData.name,
      condition: {
        ...formData.condition,
        value: isNaN(Number(formData.condition.value)) 
          ? formData.condition.value 
          : Number(formData.condition.value)
      },
      severity: formData.severity,
      enabled: formData.enabled,
      notifications: formData.notifications
    };

    if (editingAlert) {
      setAlerts(alerts.map(alert =>
        alert.id === editingAlert.id ? alertData : alert
      ));
    } else {
      setAlerts([...alerts, alertData]);
    }

    setIsCreating(false);
    setEditingAlert(null);
    setFormData(DEFAULT_ALERT_FORM);
  };

  const handleAddNotification = (type: NotificationChannel['type']) => {
    const newNotification: NotificationChannel = {
      type,
      target: '',
      enabled: true
    };
    setFormData({
      ...formData,
      notifications: [...formData.notifications, newNotification]
    });
  };

  const handleUpdateNotification = (index: number, updates: Partial<NotificationChannel>) => {
    const updatedNotifications = formData.notifications.map((notification, i) =>
      i === index ? { ...notification, ...updates } : notification
    );
    setFormData({
      ...formData,
      notifications: updatedNotifications
    });
  };

  const handleRemoveNotification = (index: number) => {
    setFormData({
      ...formData,
      notifications: formData.notifications.filter((_, i) => i !== index)
    });
  };

  const handleTestAlert = async (alertId: string) => {
    setTestingAlert(alertId);
    
    try {
      // Simulate testing the alert
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In a real implementation, this would send a test notification
      alert('Test alert sent successfully!');
    } catch (error) {
      alert('Failed to send test alert');
    } finally {
      setTestingAlert(null);
    }
  };

  const getSeverityColor = (severity: string) => {
    const level = SEVERITY_LEVELS.find(s => s.value === severity);
    return level?.color || 'bg-gray-100 text-gray-800';
  };

  const getAvailableFields = () => {
    // Based on widget type, return available fields for conditions
    switch (widget.type) {
      case 'metric':
        return [
          { value: 'value', label: 'Current Value' },
          { value: 'previousValue', label: 'Previous Value' },
          { value: 'growth', label: 'Growth Rate' }
        ];
      case 'chart':
        return [
          { value: 'latest', label: 'Latest Data Point' },
          { value: 'average', label: 'Average Value' },
          { value: 'trend', label: 'Trend Direction' }
        ];
      case 'table':
        return [
          { value: 'rowCount', label: 'Row Count' },
          { value: 'totalCount', label: 'Total Count' }
        ];
      default:
        return [
          { value: 'value', label: 'Value' }
        ];
    }
  };

  if (isCreating || editingAlert) {
    return (
      <div className={cn("bg-white border-l border-gray-200 w-96 flex flex-col", className)}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {editingAlert ? 'Edit Alert' : 'Create Alert'}
          </h2>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => {
              setIsCreating(false);
              setEditingAlert(null);
              setFormData(DEFAULT_ALERT_FORM);
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleFormSubmit} className="flex-1 overflow-auto p-4 space-y-6">
          {/* Basic Info */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Alert Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter alert name"
              required
            />
          </div>

          {/* Condition */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Condition *
            </label>
            <div className="space-y-3">
              <select
                value={formData.condition.field}
                onChange={(e) => setFormData({
                  ...formData,
                  condition: { ...formData.condition, field: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {getAvailableFields().map(field => (
                  <option key={field.value} value={field.value}>
                    {field.label}
                  </option>
                ))}
              </select>

              <select
                value={formData.condition.operator}
                onChange={(e) => setFormData({
                  ...formData,
                  condition: { ...formData.condition, operator: e.target.value as any }
                })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {OPERATORS.map(op => (
                  <option key={op.value} value={op.value}>
                    {op.label}
                  </option>
                ))}
              </select>

              <input
                type="text"
                value={formData.condition.value}
                onChange={(e) => setFormData({
                  ...formData,
                  condition: { ...formData.condition, value: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter threshold value"
                required
              />
            </div>
          </div>

          {/* Severity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Severity Level
            </label>
            <div className="grid grid-cols-2 gap-2">
              {SEVERITY_LEVELS.map(level => (
                <button
                  key={level.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, severity: level.value as any })}
                  className={cn(
                    "p-2 text-sm font-medium rounded-lg border-2 transition-colors",
                    formData.severity === level.value
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  <Badge className={level.color}>
                    {level.label}
                  </Badge>
                </button>
              ))}
            </div>
          </div>

          {/* Notifications */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Notifications
              </label>
              <div className="relative">
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAddNotification(e.target.value as NotificationChannel['type']);
                      e.target.value = '';
                    }
                  }}
                  className="text-sm border border-gray-200 rounded px-2 py-1"
                >
                  <option value="">Add notification...</option>
                  {NOTIFICATION_TYPES.map(type => (
                    <option key={type.type} value={type.type}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-3">
              {formData.notifications.map((notification, index) => {
                const notificationType = NOTIFICATION_TYPES.find(t => t.type === notification.type);
                const Icon = notificationType?.icon || Bell;

                return (
                  <Card key={index} className="p-3">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-gray-100 rounded">
                        <Icon className="h-4 w-4 text-gray-600" />
                      </div>
                      
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            {notificationType?.label}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveNotification(index)}
                            className="h-6 w-6 p-0 text-red-600"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        
                        <input
                          type="text"
                          value={notification.target}
                          onChange={(e) => handleUpdateNotification(index, { target: e.target.value })}
                          className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder={notificationType?.placeholder}
                        />
                        
                        <label className="flex items-center space-x-2 text-sm">
                          <input
                            type="checkbox"
                            checked={notification.enabled}
                            onChange={(e) => handleUpdateNotification(index, { enabled: e.target.checked })}
                            className="rounded"
                          />
                          <span>Enabled</span>
                        </label>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Enable/Disable */}
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.enabled}
                onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm font-medium text-gray-700">
                Enable this alert
              </span>
            </label>
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsCreating(false);
                setEditingAlert(null);
                setFormData(DEFAULT_ALERT_FORM);
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleFormSubmit}
              className="flex-1"
            >
              <Save className="h-4 w-4 mr-2" />
              {editingAlert ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("bg-white border-l border-gray-200 w-96 flex flex-col", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Alert Configuration</h2>
          <p className="text-sm text-gray-500">{widget.title}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Alert List */}
      <div className="flex-1 overflow-auto p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-900">
            Alerts ({alerts.length})
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCreateAlert}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Alert
          </Button>
        </div>

        {alerts.length === 0 ? (
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-sm font-medium text-gray-900 mb-2">No alerts configured</h3>
            <p className="text-sm text-gray-500 mb-4">
              Create alerts to monitor your widget data and get notified when thresholds are exceeded.
            </p>
            <Button variant="outline" onClick={handleCreateAlert}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Alert
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <Card key={alert.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="text-sm font-medium text-gray-900">
                        {alert.name}
                      </h4>
                      <Badge className={getSeverityColor(alert.severity)}>
                        {alert.severity}
                      </Badge>
                      {!alert.enabled && (
                        <Badge variant="secondary">Disabled</Badge>
                      )}
                    </div>
                    
                    <p className="text-xs text-gray-600 mb-2">
                      When <strong>{alert.condition.field}</strong> is{' '}
                      <strong>
                        {OPERATORS.find(op => op.value === alert.condition.operator)?.label.toLowerCase()}
                      </strong>{' '}
                      <strong>{alert.condition.value}</strong>
                    </p>
                    
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <span>{alert.notifications.length} notification(s)</span>
                      {alert.notifications.length > 0 && (
                        <div className="flex space-x-1">
                          {alert.notifications.slice(0, 3).map((notification, index) => {
                            const type = NOTIFICATION_TYPES.find(t => t.type === notification.type);
                            const Icon = type?.icon || Bell;
                            return (
                              <Icon key={index} className="h-3 w-3" />
                            );
                          })}
                          {alert.notifications.length > 3 && (
                            <span>+{alert.notifications.length - 3}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 ml-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleAlert(alert.id)}
                      className="h-6 w-6 p-0"
                      title={alert.enabled ? 'Disable alert' : 'Enable alert'}
                    >
                      <ToggleLeft className={cn(
                        "h-3 w-3",
                        alert.enabled ? "text-green-600" : "text-gray-400"
                      )} />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTestAlert(alert.id)}
                      disabled={testingAlert === alert.id}
                      className="h-6 w-6 p-0"
                      title="Test alert"
                    >
                      <FlaskConical className={cn(
                        "h-3 w-3",
                        testingAlert === alert.id && "animate-pulse"
                      )} />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditAlert(alert)}
                      className="h-6 w-6 p-0"
                      title="Edit alert"
                    >
                      <Edit3 className="h-3 w-3" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteAlert(alert.id)}
                      className="h-6 w-6 p-0 text-red-600"
                      title="Delete alert"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <Button onClick={handleSave} className="w-full">
          <Save className="h-4 w-4 mr-2" />
          Save Configuration
        </Button>
      </div>
    </div>
  );
}