"use client";

import React, { useState } from 'react';
import { BaseWidget } from '../BaseWidget';
import { DashboardWidget, AlertWidgetData } from '@/types/dashboard';
import { 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  CheckCircle,
  X,
  Eye,
  EyeOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AlertWidgetProps {
  widget: DashboardWidget;
  data?: AlertWidgetData;
  isLoading?: boolean;
  error?: string;
  isEditing?: boolean;
  isSelected?: boolean;
  onUpdate?: (widget: DashboardWidget) => void;
  onDelete?: (widgetId: string) => void;
  onRefresh?: (widgetId: string) => void;
  onResize?: (widgetId: string, size: { width: number; height: number }) => void;
  onMove?: (widgetId: string, position: { x: number; y: number }) => void;
  onSelect?: (widgetId: string) => void;
  onAcknowledgeAlert?: (alertId: string) => void;
}

export function AlertWidget(props: AlertWidgetProps) {
  const { widget, data, isLoading, onAcknowledgeAlert } = props;
  const [filter, setFilter] = useState<'all' | 'unacknowledged'>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');

  const alerts = data?.value.alerts || [];

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'unacknowledged' && alert.acknowledged) return false;
    if (severityFilter !== 'all' && alert.severity !== severityFilter) return false;
    return true;
  });

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'high':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case 'medium':
        return <Info className="h-4 w-4 text-yellow-500" />;
      case 'low':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'high':
        return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'medium':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'low':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getSeverityBadgeColor = (severity: string) => {
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

  const handleAcknowledge = (alertId: string) => {
    if (onAcknowledgeAlert) {
      onAcknowledgeAlert(alertId);
    }
  };

  const severityCounts = alerts.reduce((acc, alert) => {
    acc[alert.severity] = (acc[alert.severity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const unacknowledgedCount = alerts.filter(alert => !alert.acknowledged).length;

  return (
    <BaseWidget {...props}>
      <div className="flex flex-col h-full">
        {/* Summary Stats */}
        <div className="mb-3 grid grid-cols-2 gap-2">
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">{alerts.length}</div>
            <div className="text-xs text-gray-500">Total Alerts</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-red-600">{unacknowledgedCount}</div>
            <div className="text-xs text-gray-500">Unacknowledged</div>
          </div>
        </div>

        {/* Severity Breakdown */}
        <div className="mb-3 flex flex-wrap gap-1">
          {Object.entries(severityCounts).map(([severity, count]) => (
            <span
              key={severity}
              className={cn(
                "px-2 py-1 text-xs rounded-full capitalize",
                getSeverityBadgeColor(severity)
              )}
            >
              {severity}: {count}
            </span>
          ))}
        </div>

        {/* Filters */}
        <div className="mb-3 flex gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'unacknowledged')}
            className="text-xs border border-gray-200 rounded px-2 py-1 flex-1"
          >
            <option value="all">All Alerts</option>
            <option value="unacknowledged">Unacknowledged</option>
          </select>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="text-xs border border-gray-200 rounded px-2 py-1 flex-1"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        {/* Alerts List */}
        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="animate-pulse space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <p className="text-sm">No alerts to display</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={cn(
                    "p-2 rounded border text-xs",
                    getSeverityColor(alert.severity),
                    alert.acknowledged && "opacity-60"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-2 flex-1">
                      {getSeverityIcon(alert.severity)}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{alert.message}</p>
                        <p className="text-xs opacity-75 mt-1">
                          {new Date(alert.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-1 ml-2">
                      {alert.acknowledged ? (
                        <div className="flex items-center text-green-600">
                          <Eye className="h-3 w-3" />
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAcknowledge(alert.id)}
                          className="h-5 w-5 p-0 hover:bg-white/50"
                          title="Acknowledge alert"
                        >
                          <EyeOff className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Info */}
        {data?.timestamp && (
          <div className="text-xs text-gray-400 text-center mt-2 pt-2 border-t border-gray-200">
            Last updated: {new Date(data.timestamp).toLocaleTimeString()}
          </div>
        )}
      </div>
    </BaseWidget>
  );
}