"use client";

import React from 'react';
import { BaseWidget } from '../BaseWidget';
import { DashboardWidget, MetricWidgetData } from '@/types/dashboard';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricWidgetProps {
  widget: DashboardWidget;
  data?: MetricWidgetData;
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
}

export function MetricWidget(props: MetricWidgetProps) {
  const { widget, data, isLoading } = props;

  const formatValue = (value: number, unit?: string) => {
    if (unit === 'currency') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    }
    
    if (unit === 'percentage') {
      return `${value.toFixed(1)}%`;
    }
    
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    
    return value.toLocaleString();
  };

  const getTrendIcon = (trend?: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'stable':
        return <Minus className="h-4 w-4 text-gray-500" />;
      default:
        return null;
    }
  };

  const getTrendColor = (trend?: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      case 'stable':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  const calculatePercentageChange = () => {
    if (!data?.previousValue || !data?.value) return null;
    
    const change = ((data.value - data.previousValue) / data.previousValue) * 100;
    return change;
  };

  const percentageChange = calculatePercentageChange();

  return (
    <BaseWidget {...props}>
      <div className="flex flex-col justify-center h-full">
        {isLoading ? (
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        ) : (
          <>
            {/* Main Metric Value */}
            <div className="text-center mb-2">
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {data ? formatValue(data.value, data.unit) : '--'}
              </div>
              
              {/* Trend Indicator */}
              {data?.trend && (
                <div className="flex items-center justify-center space-x-1">
                  {getTrendIcon(data.trend)}
                  {percentageChange !== null && (
                    <span className={cn("text-sm font-medium", getTrendColor(data.trend))}>
                      {percentageChange > 0 ? '+' : ''}{percentageChange.toFixed(1)}%
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Target Progress (if target is set) */}
            {data?.target && (
              <div className="mt-2">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Progress to target</span>
                  <span>{formatValue(data.target, data.unit)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={cn(
                      "h-2 rounded-full transition-all duration-300",
                      data.value >= data.target ? "bg-green-500" : "bg-blue-500"
                    )}
                    style={{
                      width: `${Math.min(100, (data.value / data.target) * 100)}%`
                    }}
                  />
                </div>
                <div className="text-xs text-gray-500 mt-1 text-center">
                  {((data.value / data.target) * 100).toFixed(1)}% of target
                </div>
              </div>
            )}

            {/* Additional Metadata */}
            {data?.metadata && Object.keys(data.metadata).length > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-100">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {Object.entries(data.metadata).slice(0, 4).map(([key, value]) => (
                    <div key={key} className="text-center">
                      <div className="text-gray-500 capitalize">{key}</div>
                      <div className="font-medium text-gray-900">{String(value)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Last Updated */}
            {data?.timestamp && (
              <div className="text-xs text-gray-400 text-center mt-2">
                Updated {new Date(data.timestamp).toLocaleTimeString()}
              </div>
            )}
          </>
        )}
      </div>
    </BaseWidget>
  );
}