/**
 * PerformanceChart - Real-time performance metrics visualization
 * 
 * Provides interactive charts and graphs for visualizing performance
 * metrics over time for development debugging.
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePerformanceContext } from '../components/PerformanceProvider';

interface ChartProps {
  width?: number;
  height?: number;
  maxDataPoints?: number;
  refreshInterval?: number;
}

interface DataPoint {
  timestamp: number;
  value: number;
  label?: string;
}

interface MetricHistory {
  [key: string]: DataPoint[];
}

export function PerformanceChart({ 
  width = 400, 
  height = 200, 
  maxDataPoints = 50,
  refreshInterval = 1000 
}: ChartProps) {
  const { webVitals, bundleReport, componentMetrics, performanceScore } = usePerformanceContext();
  const [metricHistory, setMetricHistory] = useState<MetricHistory>({});
  const [selectedMetric, setSelectedMetric] = useState<string>('performanceScore');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  // Update metric history
  useEffect(() => {
    const updateHistory = () => {
      const timestamp = Date.now();
      
      setMetricHistory(prev => {
        const newHistory = { ...prev };

        // Add performance score
        if (!newHistory.performanceScore) newHistory.performanceScore = [];
        newHistory.performanceScore.push({ timestamp, value: performanceScore });
        
        // Add Web Vitals
        webVitals.forEach((metric) => {
          const key = `webvital_${metric.name}`;
          if (!newHistory[key]) newHistory[key] = [];
          newHistory[key].push({ timestamp, value: metric.value });
        });

        // Add bundle size
        if (bundleReport) {
          const sizeKB = Math.round(bundleReport.totalSize / 1024);
          if (!newHistory.bundleSize) newHistory.bundleSize = [];
          newHistory.bundleSize.push({ timestamp, value: sizeKB });

          if (!newHistory.bundleLoadTime) newHistory.bundleLoadTime = [];
          newHistory.bundleLoadTime.push({ timestamp, value: bundleReport.loadTime });
        }

        // Add component render times (average of all components)
        if (componentMetrics.size > 0) {
          const avgRenderTime = Array.from(componentMetrics.values())
            .reduce((sum, metrics) => sum + metrics.averageRenderTime, 0) / componentMetrics.size;
          
          if (!newHistory.avgComponentRender) newHistory.avgComponentRender = [];
          newHistory.avgComponentRender.push({ timestamp, value: avgRenderTime });
        }

        // Trim history to max data points
        Object.keys(newHistory).forEach(key => {
          if (newHistory[key].length > maxDataPoints) {
            newHistory[key] = newHistory[key].slice(-maxDataPoints);
          }
        });

        return newHistory;
      });
    };

    const interval = setInterval(updateHistory, refreshInterval);
    updateHistory(); // Initial update

    return () => clearInterval(interval);
  }, [webVitals, bundleReport, componentMetrics, performanceScore, maxDataPoints, refreshInterval]);

  // Draw chart
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const data = metricHistory[selectedMetric];
    if (!data || data.length === 0) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Set up chart area
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Find min/max values
    const values = data.map(d => d.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const valueRange = maxValue - minValue || 1;

    // Draw grid
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1;
    
    // Horizontal grid lines
    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // Vertical grid lines
    for (let i = 0; i <= 10; i++) {
      const x = padding + (chartWidth / 10) * i;
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, height - padding);
      ctx.stroke();
    }

    // Draw axes
    ctx.strokeStyle = '#6B7280';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    // Draw data line
    if (data.length > 1) {
      ctx.strokeStyle = getMetricColor(selectedMetric);
      ctx.lineWidth = 2;
      ctx.beginPath();

      data.forEach((point, index) => {
        const x = padding + (chartWidth / (data.length - 1)) * index;
        const y = height - padding - ((point.value - minValue) / valueRange) * chartHeight;

        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();

      // Draw data points
      ctx.fillStyle = getMetricColor(selectedMetric);
      data.forEach((point, index) => {
        const x = padding + (chartWidth / (data.length - 1)) * index;
        const y = height - padding - ((point.value - minValue) / valueRange) * chartHeight;
        
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, 2 * Math.PI);
        ctx.fill();
      });
    }

    // Draw labels
    ctx.fillStyle = '#9CA3AF';
    ctx.font = '12px monospace';
    
    // Y-axis labels
    for (let i = 0; i <= 5; i++) {
      const value = minValue + (valueRange / 5) * (5 - i);
      const y = padding + (chartHeight / 5) * i;
      ctx.fillText(value.toFixed(1), 5, y + 4);
    }

    // X-axis labels (time)
    if (data.length > 1) {
      const startTime = data[0].timestamp;
      const endTime = data[data.length - 1].timestamp;
      const timeRange = endTime - startTime;

      for (let i = 0; i <= 5; i++) {
        const time = startTime + (timeRange / 5) * i;
        const x = padding + (chartWidth / 5) * i;
        const timeStr = new Date(time).toLocaleTimeString();
        ctx.fillText(timeStr, x - 20, height - 10);
      }
    }

    // Draw title
    ctx.fillStyle = '#F3F4F6';
    ctx.font = '14px monospace';
    ctx.fillText(getMetricDisplayName(selectedMetric), padding, 20);

    // Draw current value
    if (data.length > 0) {
      const currentValue = data[data.length - 1].value;
      const valueText = `Current: ${currentValue.toFixed(2)}${getMetricUnit(selectedMetric)}`;
      ctx.fillText(valueText, width - 150, 20);
    }

  }, [metricHistory, selectedMetric, width, height]);

  const getMetricColor = (metric: string): string => {
    const colors: Record<string, string> = {
      performanceScore: '#10B981', // green
      webvital_LCP: '#3B82F6', // blue
      webvital_FID: '#8B5CF6', // purple
      webvital_CLS: '#F59E0B', // yellow
      webvital_TTFB: '#EF4444', // red
      webvital_FCP: '#06B6D4', // cyan
      bundleSize: '#F97316', // orange
      bundleLoadTime: '#EC4899', // pink
      avgComponentRender: '#84CC16', // lime
    };
    return colors[metric] || '#6B7280';
  };

  const getMetricDisplayName = (metric: string): string => {
    const names: Record<string, string> = {
      performanceScore: 'Performance Score',
      webvital_LCP: 'Largest Contentful Paint',
      webvital_FID: 'First Input Delay',
      webvital_CLS: 'Cumulative Layout Shift',
      webvital_TTFB: 'Time to First Byte',
      webvital_FCP: 'First Contentful Paint',
      bundleSize: 'Bundle Size',
      bundleLoadTime: 'Bundle Load Time',
      avgComponentRender: 'Avg Component Render Time',
    };
    return names[metric] || metric;
  };

  const getMetricUnit = (metric: string): string => {
    const units: Record<string, string> = {
      performanceScore: '',
      webvital_LCP: 'ms',
      webvital_FID: 'ms',
      webvital_CLS: '',
      webvital_TTFB: 'ms',
      webvital_FCP: 'ms',
      bundleSize: 'KB',
      bundleLoadTime: 'ms',
      avgComponentRender: 'ms',
    };
    return units[metric] || '';
  };

  const availableMetrics = Object.keys(metricHistory).filter(key => 
    metricHistory[key] && metricHistory[key].length > 0
  );

  return (
    <div className="bg-gray-900 text-white rounded-lg p-4 font-mono">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Performance Metrics</h3>
        <select
          value={selectedMetric}
          onChange={(e) => setSelectedMetric(e.target.value)}
          className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm"
        >
          {availableMetrics.map(metric => (
            <option key={metric} value={metric}>
              {getMetricDisplayName(metric)}
            </option>
          ))}
        </select>
      </div>

      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="border border-gray-700 rounded"
      />

      <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
        <div>
          <div className="text-gray-400">Data Points:</div>
          <div>{metricHistory[selectedMetric]?.length || 0}</div>
        </div>
        <div>
          <div className="text-gray-400">Update Interval:</div>
          <div>{refreshInterval}ms</div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        {availableMetrics.slice(0, 6).map(metric => (
          <div key={metric} className="flex items-center gap-1">
            <div 
              className="w-3 h-3 rounded"
              style={{ backgroundColor: getMetricColor(metric) }}
            />
            <span className="text-gray-300">{getMetricDisplayName(metric)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PerformanceChart;