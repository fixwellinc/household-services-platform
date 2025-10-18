/**
 * Performance Reporting Module
 * 
 * Automated performance reporting, trends tracking, and alerting system
 * for monitoring application performance over time.
 */

export { 
  PerformanceReporter, 
  performanceReporter,
  type PerformanceSnapshot,
  type PerformanceTrend,
  type PerformanceAlert,
  type ReportingConfig
} from './PerformanceReporter';

export { TrendsDashboard } from './TrendsDashboard';

// Convenience exports
export const reportingUtils = {
  /**
   * Generate a performance report for the last 24 hours
   */
  generateDailyReport: (route?: string) => {
    const endTime = Date.now();
    const startTime = endTime - (24 * 60 * 60 * 1000); // 24 hours ago
    return performanceReporter.generateReport(startTime, endTime, route);
  },

  /**
   * Generate a performance report for the last week
   */
  generateWeeklyReport: (route?: string) => {
    const endTime = Date.now();
    const startTime = endTime - (7 * 24 * 60 * 60 * 1000); // 7 days ago
    return performanceReporter.generateReport(startTime, endTime, route);
  },

  /**
   * Get performance trends for a specific metric
   */
  getMetricTrends: (metric: string, route?: string) => {
    return performanceReporter.getTrends(metric, route);
  },

  /**
   * Get unacknowledged alerts
   */
  getActiveAlerts: () => {
    return performanceReporter.getAlerts(false);
  },

  /**
   * Export performance data as JSON
   */
  exportData: () => {
    return performanceReporter.exportData('json');
  },

  /**
   * Clear all performance data
   */
  clearAllData: () => {
    performanceReporter.clearData();
  },
};

export default {
  PerformanceReporter,
  TrendsDashboard,
  performanceReporter,
  reportingUtils,
};