/**
 * TrendsDashboard - Performance trends visualization and analysis
 * 
 * Displays performance trends, alerts, and historical data for
 * monitoring performance over time and identifying regressions.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { performanceReporter, PerformanceTrend, PerformanceAlert } from './PerformanceReporter';

interface DashboardProps {
  timeframe?: 'hour' | 'day' | 'week' | 'month';
  route?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function TrendsDashboard({ 
  timeframe = 'week', 
  route,
  autoRefresh = true,
  refreshInterval = 30000 
}: DashboardProps) {
  const [trends, setTrends] = useState<PerformanceTrend[]>([]);
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Only show in development or when explicitly enabled
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  useEffect(() => {
    loadData();
    
    if (autoRefresh) {
      const interval = setInterval(loadData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [timeframe, route, autoRefresh, refreshInterval]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Get trends and alerts
      const trendsData = performanceReporter.getTrends(undefined, route);
      const alertsData = performanceReporter.getAlerts(false); // Unacknowledged alerts
      
      setTrends(trendsData);
      setAlerts(alertsData);
      
      // Set default selected metric
      if (!selectedMetric && trendsData.length > 0) {
        setSelectedMetric(trendsData[0].metric);
      }
    } catch (error) {
      console.error('Failed to load trends data:', error);
    } finally {
      setLoading(false);
    }
  };

  const acknowledgeAlert = (alertId: string) => {
    performanceReporter.acknowledgeAlert(alertId);
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const exportData = () => {
    const data = performanceReporter.exportData('json');
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getTrendColor = (trend: PerformanceTrend): string => {
    if (trend.trend === 'improving') return 'text-green-500';
    if (trend.trend === 'degrading') return 'text-red-500';
    return 'text-gray-500';
  };

  const getTrendIcon = (trend: PerformanceTrend): string => {
    if (trend.trend === 'improving') return '📈';
    if (trend.trend === 'degrading') return '📉';
    return '➡️';
  };

  const getSeverityColor = (severity: string): string => {
    return severity === 'critical' ? 'text-red-500' : 'text-yellow-500';
  };

  const getSignificanceColor = (significance: string): string => {
    switch (significance) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  const selectedTrend = trends.find(t => t.metric === selectedMetric);

  return (
    <div className="bg-gray-900 text-white rounded-lg p-6 font-mono">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <span>📊</span>
          Performance Trends Dashboard
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-3 py-1 rounded text-sm"
          >
            {loading ? '🔄' : '↻'} Refresh
          </button>
          <button
            onClick={exportData}
            className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm"
          >
            📥 Export
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">⏳</div>
          <div>Loading performance data...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Alerts Panel */}
          <div className="lg:col-span-1">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span>🚨</span>
              Active Alerts ({alerts.length})
            </h3>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {alerts.length === 0 ? (
                <div className="text-green-400 text-center py-4">
                  ✅ No active alerts
                </div>
              ) : (
                alerts.map((alert) => (
                  <div key={alert.id} className="bg-gray-800 rounded p-3 border-l-4 border-red-500">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`font-semibold ${getSeverityColor(alert.severity)}`}>
                        {alert.severity.toUpperCase()}
                      </span>
                      <button
                        onClick={() => acknowledgeAlert(alert.id)}
                        className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded"
                      >
                        Acknowledge
                      </button>
                    </div>
                    
                    <div className="text-sm mb-2">{alert.message}</div>
                    
                    <div className="text-xs text-gray-400 mb-2">
                      Route: {alert.route} | {new Date(alert.timestamp).toLocaleString()}
                    </div>
                    
                    {alert.recommendations.length > 0 && (
                      <div className="text-xs">
                        <div className="text-blue-400 mb-1">Recommendations:</div>
                        <ul className="space-y-1">
                          {alert.recommendations.slice(0, 2).map((rec, i) => (
                            <li key={i} className="flex items-start gap-1">
                              <span className="text-blue-400">•</span>
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Trends Overview */}
          <div className="lg:col-span-2">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span>📈</span>
              Performance Trends
            </h3>

            {trends.length === 0 ? (
              <div className="text-gray-400 text-center py-8">
                <div className="text-4xl mb-2">📊</div>
                <div>No trend data available yet</div>
                <div className="text-sm mt-2">
                  Trends will appear after collecting performance data over time
                </div>
              </div>
            ) : (
              <>
                {/* Metric Selector */}
                <div className="mb-4">
                  <select
                    value={selectedMetric}
                    onChange={(e) => setSelectedMetric(e.target.value)}
                    className="bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm"
                  >
                    {trends.map((trend) => (
                      <option key={trend.metric} value={trend.metric}>
                        {trend.metric.replace(/_/g, ' ').toUpperCase()} ({trend.route})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selected Trend Details */}
                {selectedTrend && (
                  <div className="bg-gray-800 rounded p-4 mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold">
                        {selectedTrend.metric.replace(/_/g, ' ').toUpperCase()}
                      </h4>
                      <div className="flex items-center gap-2">
                        <span>{getTrendIcon(selectedTrend)}</span>
                        <span className={getTrendColor(selectedTrend)}>
                          {selectedTrend.trend.toUpperCase()}
                        </span>
                        <span className={getSignificanceColor(selectedTrend.significance)}>
                          ({selectedTrend.significance})
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                      <div>
                        <div className="text-gray-400">Change:</div>
                        <div className={getTrendColor(selectedTrend)}>
                          {selectedTrend.changePercent > 0 ? '+' : ''}{selectedTrend.changePercent.toFixed(1)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-400">Data Points:</div>
                        <div>{selectedTrend.dataPoints.length}</div>
                      </div>
                      <div>
                        <div className="text-gray-400">Route:</div>
                        <div>{selectedTrend.route}</div>
                      </div>
                    </div>

                    {/* Simple trend visualization */}
                    <div className="bg-gray-700 rounded p-3">
                      <div className="text-xs text-gray-400 mb-2">Recent Values:</div>
                      <div className="flex items-end gap-1 h-16">
                        {selectedTrend.dataPoints.slice(-20).map((point, index) => {
                          const maxValue = Math.max(...selectedTrend.dataPoints.map(p => p.value));
                          const height = (point.value / maxValue) * 100;
                          
                          return (
                            <div
                              key={index}
                              className={`flex-1 ${getTrendColor(selectedTrend).replace('text-', 'bg-')} rounded-t`}
                              style={{ height: `${height}%`, minHeight: '2px' }}
                              title={`${point.value.toFixed(2)} at ${new Date(point.timestamp).toLocaleTimeString()}`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Trends Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {trends.slice(0, 6).map((trend) => (
                    <div 
                      key={`${trend.metric}_${trend.route}`}
                      className={`bg-gray-800 rounded p-3 cursor-pointer border-2 ${
                        selectedMetric === trend.metric ? 'border-blue-500' : 'border-transparent'
                      }`}
                      onClick={() => setSelectedMetric(trend.metric)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">
                          {trend.metric.replace(/_/g, ' ').toUpperCase()}
                        </span>
                        <span>{getTrendIcon(trend)}</span>
                      </div>
                      
                      <div className="text-xs text-gray-400 mb-1">
                        Route: {trend.route}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className={`text-sm ${getTrendColor(trend)}`}>
                          {trend.trend}
                        </span>
                        <span className={`text-xs ${getTrendColor(trend)}`}>
                          {trend.changePercent > 0 ? '+' : ''}{trend.changePercent.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default TrendsDashboard;