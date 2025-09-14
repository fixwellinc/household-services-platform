import { DashboardWidget, WidgetData, MetricWidgetData, ChartWidgetData, TableWidgetData, AlertWidgetData } from '@/types/dashboard';

export interface DataSourceConfig {
  endpoint: string;
  method: 'GET' | 'POST';
  headers?: Record<string, string>;
  transformResponse?: (data: any) => WidgetData;
  pollInterval?: number;
}

export interface DataStreamConfig {
  socketEvent: string;
  transformData?: (data: any) => WidgetData;
}

// Data source configurations for different widget types
export const DATA_SOURCES: Record<string, DataSourceConfig> = {
  users: {
    endpoint: '/api/admin/dashboard/users',
    method: 'GET',
    transformResponse: (data) => ({
      timestamp: new Date(),
      value: data.count,
      previousValue: data.previousCount,
      trend: data.trend,
      unit: 'count',
      target: data.target,
      metadata: {
        growth: data.growth,
        newToday: data.newToday,
        activeToday: data.activeToday
      }
    } as MetricWidgetData)
  },

  revenue: {
    endpoint: '/api/admin/dashboard/revenue',
    method: 'GET',
    transformResponse: (data) => ({
      timestamp: new Date(),
      value: data.total,
      previousValue: data.previousTotal,
      trend: data.trend,
      unit: 'currency',
      target: data.target,
      metadata: {
        growth: data.growth,
        todayRevenue: data.todayRevenue,
        monthlyRecurring: data.monthlyRecurring
      }
    } as MetricWidgetData)
  },

  bookings: {
    endpoint: '/api/admin/dashboard/bookings',
    method: 'GET',
    transformResponse: (data) => ({
      timestamp: new Date(),
      value: data.activeCount,
      previousValue: data.previousActiveCount,
      trend: data.trend,
      unit: 'count',
      metadata: {
        pending: data.pendingCount,
        completed: data.completedToday,
        cancelled: data.cancelledToday
      }
    } as MetricWidgetData)
  },

  system_alerts: {
    endpoint: '/api/admin/dashboard/alerts',
    method: 'GET',
    transformResponse: (data) => ({
      timestamp: new Date(),
      value: {
        alerts: data.alerts.map((alert: any) => ({
          id: alert.id,
          message: alert.message,
          severity: alert.severity,
          timestamp: new Date(alert.timestamp),
          acknowledged: alert.acknowledged
        }))
      }
    } as AlertWidgetData)
  },

  performance_alerts: {
    endpoint: '/api/admin/dashboard/performance-alerts',
    method: 'GET',
    transformResponse: (data) => ({
      timestamp: new Date(),
      value: {
        alerts: data.alerts.map((alert: any) => ({
          id: alert.id,
          message: alert.message,
          severity: alert.severity,
          timestamp: new Date(alert.timestamp),
          acknowledged: alert.acknowledged
        }))
      }
    } as AlertWidgetData)
  },

  subscriptions: {
    endpoint: '/api/admin/dashboard/subscriptions',
    method: 'GET',
    transformResponse: (data) => {
      if (data.chartData) {
        // Chart data for subscription trends
        return {
          timestamp: new Date(),
          value: data.chartData.map((point: any) => ({
            x: point.date,
            y: point.count,
            series: point.plan || 'default'
          }))
        } as ChartWidgetData;
      } else {
        // Table data for subscription list
        return {
          timestamp: new Date(),
          value: {
            headers: data.headers || ['Customer', 'Plan', 'Status', 'Created', 'Revenue'],
            rows: data.subscriptions || [],
            totalCount: data.totalCount
          }
        } as TableWidgetData;
      }
    }
  }
};

// Real-time data stream configurations
export const DATA_STREAMS: Record<string, DataStreamConfig> = {
  users: {
    socketEvent: 'user:created',
    transformData: (data) => ({
      timestamp: new Date(),
      value: data.newCount,
      metadata: { newUser: data.user }
    } as MetricWidgetData)
  },

  revenue: {
    socketEvent: 'payment:completed',
    transformData: (data) => ({
      timestamp: new Date(),
      value: data.newTotal,
      metadata: { payment: data.payment }
    } as MetricWidgetData)
  },

  bookings: {
    socketEvent: 'booking:created',
    transformData: (data) => ({
      timestamp: new Date(),
      value: data.activeCount,
      metadata: { newBooking: data.booking }
    } as MetricWidgetData)
  },

  system_alerts: {
    socketEvent: 'alert:created',
    transformData: (data) => ({
      timestamp: new Date(),
      value: {
        alerts: [data.alert]
      }
    } as AlertWidgetData)
  }
};

export class DashboardDataService {
  private cache = new Map<string, { data: WidgetData; timestamp: Date }>();
  private cacheTimeout = 30000; // 30 seconds

  async fetchWidgetData(widget: DashboardWidget): Promise<WidgetData> {
    const cacheKey = `${widget.id}-${JSON.stringify(widget.config.parameters)}`;
    const cached = this.cache.get(cacheKey);

    // Return cached data if still valid
    if (cached && Date.now() - cached.timestamp.getTime() < this.cacheTimeout) {
      return cached.data;
    }

    const dataSource = DATA_SOURCES[widget.config.dataSource];
    if (!dataSource) {
      throw new Error(`Unknown data source: ${widget.config.dataSource}`);
    }

    try {
      const url = new URL(dataSource.endpoint, window.location.origin);

      // Add parameters to URL
      Object.entries(widget.config.parameters || {}).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });

      const response = await fetch(url.toString(), {
        method: dataSource.method,
        headers: {
          'Content-Type': 'application/json',
          ...dataSource.headers
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const rawData = await response.json();
      const transformedData = dataSource.transformResponse
        ? dataSource.transformResponse(rawData)
        : rawData;

      // Cache the result
      this.cache.set(cacheKey, {
        data: transformedData,
        timestamp: new Date()
      });

      return transformedData;
    } catch (error) {
      console.error(`Failed to fetch data for widget ${widget.id}:`, error);
      throw error;
    }
  }

  async batchFetchWidgetData(widgets: DashboardWidget[]): Promise<Record<string, WidgetData>> {
    const results: Record<string, WidgetData> = {};

    // Group widgets by data source for potential optimization
    const widgetsBySource = widgets.reduce((acc, widget) => {
      const source = widget.config.dataSource;
      if (!acc[source]) acc[source] = [];
      acc[source].push(widget);
      return acc;
    }, {} as Record<string, DashboardWidget[]>);

    // Fetch data for each group
    await Promise.allSettled(
      Object.entries(widgetsBySource).map(async ([source, sourceWidgets]) => {
        await Promise.allSettled(
          sourceWidgets.map(async (widget) => {
            try {
              results[widget.id] = await this.fetchWidgetData(widget);
            } catch (error) {
              console.error(`Failed to fetch data for widget ${widget.id}:`, error);
              // Don't throw, just skip this widget
            }
          })
        );
      })
    );

    return results;
  }

  clearCache(widgetId?: string) {
    if (widgetId) {
      // Clear cache for specific widget
      const keys = Array.from(this.cache.keys());
      for (const key of keys) {
        if (key.startsWith(widgetId)) {
          this.cache.delete(key);
        }
      }
    } else {
      // Clear all cache
      this.cache.clear();
    }
  }

  getCacheStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.entries()).map(([key, value]) => ({
        key,
        timestamp: value.timestamp,
        age: Date.now() - value.timestamp.getTime()
      }))
    };
  }
}

// Singleton instance
export const dashboardDataService = new DashboardDataService();