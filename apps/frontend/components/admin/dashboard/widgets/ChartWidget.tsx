"use client";

import React, { useMemo } from 'react';
import { BaseWidget } from '../BaseWidget';
import { DashboardWidget, ChartWidgetData } from '@/types/dashboard';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface ChartWidgetProps {
  widget: DashboardWidget;
  data?: ChartWidgetData;
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

const DEFAULT_COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
  '#06B6D4', '#F97316', '#84CC16', '#EC4899', '#6366F1'
];

export function ChartWidget(props: ChartWidgetProps) {
  const { widget, data, isLoading } = props;
  const { visualization } = widget.config;

  const chartData = useMemo(() => {
    if (!data?.value) return [];
    
    // Group data by series if multiple series exist
    const seriesMap = new Map<string, any[]>();
    
    data.value.forEach(point => {
      const series = point.series || 'default';
      if (!seriesMap.has(series)) {
        seriesMap.set(series, []);
      }
      seriesMap.get(series)!.push({
        x: point.x,
        y: point.y,
        [series]: point.y
      });
    });

    // For single series, return the data directly
    if (seriesMap.size === 1) {
      return Array.from(seriesMap.values())[0];
    }

    // For multiple series, merge data points by x value
    const mergedData = new Map();
    seriesMap.forEach((points, series) => {
      points.forEach(point => {
        const key = String(point.x);
        if (!mergedData.has(key)) {
          mergedData.set(key, { x: point.x });
        }
        mergedData.get(key)[series] = point.y;
      });
    });

    return Array.from(mergedData.values()).sort((a, b) => {
      if (a.x instanceof Date && b.x instanceof Date) {
        return a.x.getTime() - b.x.getTime();
      }
      return String(a.x).localeCompare(String(b.x));
    });
  }, [data]);

  const seriesNames = useMemo(() => {
    if (!data?.value) return [];
    const series = new Set(data.value.map(point => point.series || 'default'));
    return Array.from(series);
  }, [data]);

  const colors = visualization?.colors || DEFAULT_COLORS;

  const formatXAxisValue = (value: any) => {
    if (value instanceof Date) {
      return value.toLocaleDateString();
    }
    return String(value);
  };

  const formatYAxisValue = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
  };

  const renderChart = () => {
    if (!chartData.length) {
      return (
        <div className="flex items-center justify-center h-full text-gray-500">
          No data available
        </div>
      );
    }

    const commonProps = {
      data: chartData,
      margin: { top: 5, right: 30, left: 20, bottom: 5 }
    };

    switch (visualization?.chartType) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            {visualization?.showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis 
              dataKey="x" 
              tickFormatter={formatXAxisValue}
              fontSize={12}
            />
            <YAxis 
              tickFormatter={formatYAxisValue}
              fontSize={12}
            />
            <Tooltip 
              labelFormatter={formatXAxisValue}
              formatter={(value: number) => [formatYAxisValue(value), '']}
            />
            {visualization?.showLegend && <Legend />}
            {seriesNames.map((series, index) => (
              <Line
                key={series}
                type="monotone"
                dataKey={series}
                stroke={colors[index % colors.length]}
                strokeWidth={2}
                dot={false}
                animationDuration={visualization?.animation ? 1000 : 0}
              />
            ))}
          </LineChart>
        );

      case 'area':
        return (
          <AreaChart {...commonProps}>
            {visualization?.showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis 
              dataKey="x" 
              tickFormatter={formatXAxisValue}
              fontSize={12}
            />
            <YAxis 
              tickFormatter={formatYAxisValue}
              fontSize={12}
            />
            <Tooltip 
              labelFormatter={formatXAxisValue}
              formatter={(value: number) => [formatYAxisValue(value), '']}
            />
            {visualization?.showLegend && <Legend />}
            {seriesNames.map((series, index) => (
              <Area
                key={series}
                type="monotone"
                dataKey={series}
                stackId="1"
                stroke={colors[index % colors.length]}
                fill={colors[index % colors.length]}
                fillOpacity={0.6}
                animationDuration={visualization?.animation ? 1000 : 0}
              />
            ))}
          </AreaChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            {visualization?.showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis 
              dataKey="x" 
              tickFormatter={formatXAxisValue}
              fontSize={12}
            />
            <YAxis 
              tickFormatter={formatYAxisValue}
              fontSize={12}
            />
            <Tooltip 
              labelFormatter={formatXAxisValue}
              formatter={(value: number) => [formatYAxisValue(value), '']}
            />
            {visualization?.showLegend && <Legend />}
            {seriesNames.map((series, index) => (
              <Bar
                key={series}
                dataKey={series}
                fill={colors[index % colors.length]}
                animationDuration={visualization?.animation ? 1000 : 0}
              />
            ))}
          </BarChart>
        );

      case 'pie':
        const pieData = chartData.map((item, index) => ({
          name: String(item.x),
          value: seriesNames.length > 0 ? item[seriesNames[0]] : item.y,
          fill: colors[index % colors.length]
        }));

        return (
          <PieChart {...commonProps}>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              animationDuration={visualization?.animation ? 1000 : 0}
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => [formatYAxisValue(value), '']} />
            {visualization?.showLegend && <Legend />}
          </PieChart>
        );

      default:
        return (
          <LineChart {...commonProps}>
            {visualization?.showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis 
              dataKey="x" 
              tickFormatter={formatXAxisValue}
              fontSize={12}
            />
            <YAxis 
              tickFormatter={formatYAxisValue}
              fontSize={12}
            />
            <Tooltip 
              labelFormatter={formatXAxisValue}
              formatter={(value: number) => [formatYAxisValue(value), '']}
            />
            {visualization?.showLegend && <Legend />}
            {seriesNames.map((series, index) => (
              <Line
                key={series}
                type="monotone"
                dataKey={series}
                stroke={colors[index % colors.length]}
                strokeWidth={2}
                dot={false}
                animationDuration={visualization?.animation ? 1000 : 0}
              />
            ))}
          </LineChart>
        );
    }
  };

  return (
    <BaseWidget {...props}>
      <div className="h-full">
        {isLoading ? (
          <div className="animate-pulse h-full bg-gray-200 rounded"></div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        )}
      </div>
    </BaseWidget>
  );
}