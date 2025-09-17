'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/shared';
import { Badge } from '@/components/ui/shared';
import { 
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  TrendingUp,
  ArrowUp,
  Bell,
  Settings,
  X,
  Eye,
  EyeOff,
  Zap,
  Target,
  Clock,
  RefreshCw
} from 'lucide-react';
import { apiClient } from '@/lib/api';

interface UsageAlert {
  id: string;
  type: 'LIMIT_WARNING' | 'LIMIT_EXCEEDED' | 'UPGRADE_SUGGESTION' | 'USAGE_SPIKE' | 'RENEWAL_REMINDER';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  message: string;
  metric: string;
  currentValue: number;
  threshold: number;
  unit: string;
  suggestedAction: string;
  actionUrl?: string;
  actionText?: string;
  isRead: boolean;
  isDismissed: boolean;
  createdAt: string;
  expiresAt?: string;
  metadata?: {
    planTier?: string;
    suggestedTier?: string;
    potentialSavings?: number;
    usageIncrease?: number;
  };
}

interface AlertPreferences {
  limitWarnings: boolean;
  upgradesSuggestions: boolean;
  usageSpikes: boolean;
  renewalReminders: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  warningThreshold: number; // percentage
}

interface UsageAlertsSystemProps {
  onUpgradeClick?: (suggestedTier: string) => void;
  onSettingsClick?: () => void;
}

const SEVERITY_COLORS = {
  LOW: 'bg-blue-50 border-blue-200 text-blue-800',
  MEDIUM: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  HIGH: 'bg-orange-50 border-orange-200 text-orange-800',
  CRITICAL: 'bg-red-50 border-red-200 text-red-800'
};

const SEVERITY_ICONS = {
  LOW: Info,
  MEDIUM: AlertCircle,
  HIGH: AlertTriangle,
  CRITICAL: AlertTriangle
};

const TYPE_ICONS = {
  LIMIT_WARNING: AlertTriangle,
  LIMIT_EXCEEDED: AlertCircle,
  UPGRADE_SUGGESTION: TrendingUp,
  USAGE_SPIKE: ArrowUp,
  RENEWAL_REMINDER: Clock
};

export default function UsageAlertsSystem({ 
  onUpgradeClick, 
  onSettingsClick 
}: UsageAlertsSystemProps) {
  const [alerts, setAlerts] = useState<UsageAlert[]>([]);
  const [preferences, setPreferences] = useState<AlertPreferences>({
    limitWarnings: true,
    upgradesSuggestions: true,
    usageSpikes: true,
    renewalReminders: true,
    emailNotifications: true,
    pushNotifications: false,
    warningThreshold: 80
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDismissed, setShowDismissed] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'UNREAD' | 'HIGH_PRIORITY'>('UNREAD');

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch current usage alerts
      const response = await apiClient.request<{
        success: boolean;
        alerts: UsageAlert[];
        preferences: AlertPreferences;
        message: string;
      }>('/customer/usage/alerts');

      if (response.success) {
        setAlerts(response.alerts);
        setPreferences(response.preferences);
      } else {
        // Fallback to mock data for development
        setAlerts(getMockAlerts());
      }
    } catch (err) {
      console.error('Failed to fetch usage alerts:', err);
      // Use mock data as fallback
      setAlerts(getMockAlerts());
      setError('Unable to load real-time alerts. Showing sample data.');
    } finally {
      setLoading(false);
    }
  };

  const getMockAlerts = (): UsageAlert[] => [
    {
      id: '1',
      type: 'LIMIT_WARNING',
      severity: 'HIGH',
      title: 'Approaching Service Limit',
      message: 'You have used 8 out of 10 monthly services. Consider upgrading to avoid service interruption.',
      metric: 'Monthly Services',
      currentValue: 8,
      threshold: 10,
      unit: 'services',
      suggestedAction: 'Upgrade to PRIORITY plan for unlimited services',
      actionUrl: '/upgrade',
      actionText: 'Upgrade Now',
      isRead: false,
      isDismissed: false,
      createdAt: new Date().toISOString(),
      metadata: {
        planTier: 'HOMECARE',
        suggestedTier: 'PRIORITY',
        potentialSavings: 150
      }
    },
    {
      id: '2',
      type: 'USAGE_SPIKE',
      severity: 'MEDIUM',
      title: 'Usage Increase Detected',
      message: 'Your service usage has increased by 40% compared to last month. This trend may affect your budget.',
      metric: 'Monthly Usage',
      currentValue: 12,
      threshold: 8,
      unit: 'services',
      suggestedAction: 'Review your usage patterns or consider upgrading',
      isRead: false,
      isDismissed: false,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      metadata: {
        usageIncrease: 40
      }
    },
    {
      id: '3',
      type: 'UPGRADE_SUGGESTION',
      severity: 'LOW',
      title: 'Upgrade Recommendation',
      message: 'Based on your usage patterns, upgrading to PRIORITY could save you $75 per month.',
      metric: 'Potential Savings',
      currentValue: 75,
      threshold: 50,
      unit: 'USD',
      suggestedAction: 'Upgrade to PRIORITY plan',
      actionUrl: '/upgrade',
      actionText: 'View Plans',
      isRead: true,
      isDismissed: false,
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      metadata: {
        planTier: 'HOMECARE',
        suggestedTier: 'PRIORITY',
        potentialSavings: 75
      }
    },
    {
      id: '4',
      type: 'RENEWAL_REMINDER',
      severity: 'MEDIUM',
      title: 'Subscription Renewal',
      message: 'Your subscription will renew in 3 days. Review your plan to ensure it meets your needs.',
      metric: 'Days Until Renewal',
      currentValue: 3,
      threshold: 7,
      unit: 'days',
      suggestedAction: 'Review subscription details',
      actionUrl: '/subscription',
      actionText: 'Review Plan',
      isRead: false,
      isDismissed: false,
      createdAt: new Date(Date.now() - 259200000).toISOString(),
      expiresAt: new Date(Date.now() + 259200000).toISOString()
    }
  ];

  const markAsRead = async (alertId: string) => {
    try {
      await apiClient.request('/customer/usage/alerts/read', {
        method: 'POST',
        body: JSON.stringify({ alertId })
      });

      setAlerts(prev => prev.map(alert => 
        alert.id === alertId ? { ...alert, isRead: true } : alert
      ));
    } catch (err) {
      console.error('Failed to mark alert as read:', err);
      // Update locally anyway
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId ? { ...alert, isRead: true } : alert
      ));
    }
  };

  const dismissAlert = async (alertId: string) => {
    try {
      await apiClient.request('/customer/usage/alerts/dismiss', {
        method: 'POST',
        body: JSON.stringify({ alertId })
      });

      setAlerts(prev => prev.map(alert => 
        alert.id === alertId ? { ...alert, isDismissed: true } : alert
      ));
    } catch (err) {
      console.error('Failed to dismiss alert:', err);
      // Update locally anyway
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId ? { ...alert, isDismissed: true } : alert
      ));
    }
  };

  const handleAlertAction = (alert: UsageAlert) => {
    if (!alert.isRead) {
      markAsRead(alert.id);
    }

    if (alert.type === 'UPGRADE_SUGGESTION' && alert.metadata?.suggestedTier && onUpgradeClick) {
      onUpgradeClick(alert.metadata.suggestedTier);
    } else if (alert.actionUrl) {
      window.location.href = alert.actionUrl;
    }
  };

  useEffect(() => {
    fetchAlerts();
    
    // Set up real-time updates
    const interval = setInterval(fetchAlerts, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const filteredAlerts = alerts.filter(alert => {
    if (!showDismissed && alert.isDismissed) return false;
    
    switch (filter) {
      case 'UNREAD':
        return !alert.isRead;
      case 'HIGH_PRIORITY':
        return alert.severity === 'HIGH' || alert.severity === 'CRITICAL';
      default:
        return true;
    }
  });

  const getAlertStats = () => {
    const total = alerts.filter(a => !a.isDismissed).length;
    const unread = alerts.filter(a => !a.isRead && !a.isDismissed).length;
    const critical = alerts.filter(a => (a.severity === 'HIGH' || a.severity === 'CRITICAL') && !a.isDismissed).length;
    
    return { total, unread, critical };
  };

  const renderAlert = (alert: UsageAlert) => {
    const SeverityIcon = SEVERITY_ICONS[alert.severity];
    const TypeIcon = TYPE_ICONS[alert.type];
    
    return (
      <Card 
        key={alert.id} 
        className={`transition-all duration-200 hover:shadow-md ${
          !alert.isRead ? 'ring-2 ring-blue-200' : ''
        } ${alert.isDismissed ? 'opacity-60' : ''}`}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-full ${SEVERITY_COLORS[alert.severity]}`}>
                <SeverityIcon className="h-4 w-4" />
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-gray-900">{alert.title}</h4>
                  {!alert.isRead && (
                    <Badge className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5">
                      New
                    </Badge>
                  )}
                  <Badge className={`${SEVERITY_COLORS[alert.severity]} text-xs px-2 py-0.5`}>
                    {alert.severity.toLowerCase()}
                  </Badge>
                </div>
                
                <p className="text-sm text-gray-600 mb-2">{alert.message}</p>
                
                <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                  <span className="flex items-center gap-1">
                    <TypeIcon className="h-3 w-3" />
                    {alert.metric}
                  </span>
                  <span>
                    {alert.currentValue} / {alert.threshold} {alert.unit}
                  </span>
                  <span>
                    {new Date(alert.createdAt).toLocaleDateString()}
                  </span>
                </div>
                
                {alert.suggestedAction && (
                  <p className="text-sm font-medium text-blue-600 mb-3">
                    💡 {alert.suggestedAction}
                  </p>
                )}
                
                {alert.metadata && (
                  <div className="text-xs text-gray-600 space-y-1">
                    {alert.metadata.potentialSavings && (
                      <div>Potential savings: ${alert.metadata.potentialSavings}/month</div>
                    )}
                    {alert.metadata.usageIncrease && (
                      <div>Usage increase: +{alert.metadata.usageIncrease}%</div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              {!alert.isRead && (
                <button
                  onClick={() => markAsRead(alert.id)}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Mark as read"
                >
                  <Eye className="h-4 w-4" />
                </button>
              )}
              
              <button
                onClick={() => dismissAlert(alert.id)}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                title="Dismiss alert"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          {alert.actionText && (
            <div className="flex gap-2">
              <button
                onClick={() => handleAlertAction(alert)}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {alert.actionText}
              </button>
              
              {!alert.isRead && (
                <button
                  onClick={() => markAsRead(alert.id)}
                  className="px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Mark as Read
                </button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const stats = getAlertStats();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading usage alerts...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Usage Alerts
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Stay informed about your usage patterns and optimization opportunities
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={fetchAlerts}
            className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          
          {onSettingsClick && (
            <button
              onClick={onSettingsClick}
              className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Settings className="h-4 w-4" />
              Settings
            </button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">{error}</p>
        </div>
      )}

      {/* Alert Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-blue-700">Total Alerts</div>
          </CardContent>
        </Card>
        
        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.unread}</div>
            <div className="text-sm text-orange-700">Unread</div>
          </CardContent>
        </Card>
        
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
            <div className="text-sm text-red-700">High Priority</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Filter:</span>
          <div className="flex gap-1">
            {['ALL', 'UNREAD', 'HIGH_PRIORITY'].map((filterType) => (
              <button
                key={filterType}
                onClick={() => setFilter(filterType as any)}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  filter === filterType
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {filterType.toLowerCase().replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
        
        <button
          onClick={() => setShowDismissed(!showDismissed)}
          className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-700"
        >
          {showDismissed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {showDismissed ? 'Hide' : 'Show'} dismissed
        </button>
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {filteredAlerts.length > 0 ? (
          filteredAlerts.map(renderAlert)
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <h4 className="font-medium text-gray-900 mb-2">All caught up!</h4>
              <p className="text-gray-600">
                {filter === 'UNREAD' 
                  ? 'No unread alerts at the moment.'
                  : filter === 'HIGH_PRIORITY'
                  ? 'No high priority alerts.'
                  : 'No alerts to display.'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Real-time Update Indicator */}
      <div className="flex items-center justify-center text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span>Real-time updates enabled</span>
        </div>
      </div>
    </div>
  );
}