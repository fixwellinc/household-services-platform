import { logger } from '../utils/logger.js';
import { performance } from 'perf_hooks';

/**
 * Appointment Performance Monitoring Service
 * Tracks and monitors performance metrics for appointment operations
 */
class AppointmentPerformanceService {
  constructor() {
    this.metrics = new Map();
    this.thresholds = {
      availability_calculation: 1000, // 1 second
      appointment_creation: 2000, // 2 seconds
      appointment_update: 1500, // 1.5 seconds
      calendar_sync: 5000, // 5 seconds
      database_query: 500, // 500ms
      cache_operation: 50 // 50ms
    };
    
    this.performanceHistory = [];
    this.maxHistorySize = 1000;
    
    // Initialize metric counters
    this.resetMetrics();
  }

  /**
   * Reset all metrics
   */
  resetMetrics() {
    this.metrics.set('total_operations', 0);
    this.metrics.set('slow_operations', 0);
    this.metrics.set('failed_operations', 0);
    this.metrics.set('cache_hits', 0);
    this.metrics.set('cache_misses', 0);
    this.metrics.set('database_queries', 0);
    this.metrics.set('api_requests', 0);
    
    // Operation-specific metrics
    Object.keys(this.thresholds).forEach(operation => {
      this.metrics.set(`${operation}_count`, 0);
      this.metrics.set(`${operation}_total_time`, 0);
      this.metrics.set(`${operation}_avg_time`, 0);
      this.metrics.set(`${operation}_max_time`, 0);
      this.metrics.set(`${operation}_min_time`, Infinity);
    });
  }

  /**
   * Start timing an operation
   */
  startTimer(operationType, operationId = null) {
    const timerId = operationId || `${operationType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = performance.now();
    
    return {
      timerId,
      operationType,
      startTime,
      end: (success = true, metadata = {}) => {
        return this.endTimer(timerId, operationType, startTime, success, metadata);
      }
    };
  }

  /**
   * End timing an operation
   */
  endTimer(timerId, operationType, startTime, success = true, metadata = {}) {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // Update metrics
    this.updateMetrics(operationType, duration, success, metadata);
    
    // Log performance data
    this.logPerformance(timerId, operationType, duration, success, metadata);
    
    // Store in history
    this.addToHistory({
      timerId,
      operationType,
      duration,
      success,
      metadata,
      timestamp: new Date()
    });

    return duration;
  }

  /**
   * Update performance metrics
   */
  updateMetrics(operationType, duration, success, metadata) {
    // Update total operations
    this.metrics.set('total_operations', this.metrics.get('total_operations') + 1);
    
    if (!success) {
      this.metrics.set('failed_operations', this.metrics.get('failed_operations') + 1);
    }

    // Check if operation is slow
    const threshold = this.thresholds[operationType] || 1000;
    if (duration > threshold) {
      this.metrics.set('slow_operations', this.metrics.get('slow_operations') + 1);
    }

    // Update operation-specific metrics
    const countKey = `${operationType}_count`;
    const totalTimeKey = `${operationType}_total_time`;
    const avgTimeKey = `${operationType}_avg_time`;
    const maxTimeKey = `${operationType}_max_time`;
    const minTimeKey = `${operationType}_min_time`;

    const currentCount = this.metrics.get(countKey) || 0;
    const currentTotalTime = this.metrics.get(totalTimeKey) || 0;
    const currentMaxTime = this.metrics.get(maxTimeKey) || 0;
    const currentMinTime = this.metrics.get(minTimeKey) || Infinity;

    this.metrics.set(countKey, currentCount + 1);
    this.metrics.set(totalTimeKey, currentTotalTime + duration);
    this.metrics.set(avgTimeKey, (currentTotalTime + duration) / (currentCount + 1));
    this.metrics.set(maxTimeKey, Math.max(currentMaxTime, duration));
    this.metrics.set(minTimeKey, Math.min(currentMinTime, duration));

    // Update cache metrics if applicable
    if (metadata.cacheHit !== undefined) {
      if (metadata.cacheHit) {
        this.metrics.set('cache_hits', this.metrics.get('cache_hits') + 1);
      } else {
        this.metrics.set('cache_misses', this.metrics.get('cache_misses') + 1);
      }
    }

    // Update database query count
    if (metadata.databaseQueries) {
      this.metrics.set('database_queries', 
        this.metrics.get('database_queries') + metadata.databaseQueries);
    }
  }

  /**
   * Log performance data
   */
  logPerformance(timerId, operationType, duration, success, metadata) {
    const threshold = this.thresholds[operationType] || 1000;
    const logLevel = duration > threshold ? 'warn' : 'debug';
    
    const logData = {
      timerId,
      operationType,
      duration: Math.round(duration * 100) / 100, // Round to 2 decimal places
      success,
      threshold,
      slow: duration > threshold,
      ...metadata
    };

    logger[logLevel](`Performance: ${operationType}`, logData);

    // Log critical performance issues
    if (duration > threshold * 2) {
      logger.error(`Critical performance issue: ${operationType}`, {
        ...logData,
        severity: 'critical'
      });
    }
  }

  /**
   * Add performance data to history
   */
  addToHistory(performanceData) {
    this.performanceHistory.push(performanceData);
    
    // Maintain history size limit
    if (this.performanceHistory.length > this.maxHistorySize) {
      this.performanceHistory.shift();
    }
  }

  /**
   * Get current performance metrics
   */
  getMetrics() {
    const metrics = {};
    for (const [key, value] of this.metrics.entries()) {
      metrics[key] = value === Infinity ? 0 : value;
    }

    // Calculate cache hit rate
    const cacheHits = metrics.cache_hits || 0;
    const cacheMisses = metrics.cache_misses || 0;
    const totalCacheOperations = cacheHits + cacheMisses;
    
    metrics.cache_hit_rate = totalCacheOperations > 0 ? 
      Math.round((cacheHits / totalCacheOperations) * 100) / 100 : 0;

    // Calculate success rate
    const totalOps = metrics.total_operations || 0;
    const failedOps = metrics.failed_operations || 0;
    
    metrics.success_rate = totalOps > 0 ? 
      Math.round(((totalOps - failedOps) / totalOps) * 100) / 100 : 0;

    // Calculate slow operation rate
    const slowOps = metrics.slow_operations || 0;
    metrics.slow_operation_rate = totalOps > 0 ? 
      Math.round((slowOps / totalOps) * 100) / 100 : 0;

    return metrics;
  }

  /**
   * Get performance history
   */
  getHistory(limit = 100, operationType = null) {
    let history = [...this.performanceHistory];
    
    if (operationType) {
      history = history.filter(item => item.operationType === operationType);
    }
    
    return history
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Get performance summary for a specific operation type
   */
  getOperationSummary(operationType) {
    const countKey = `${operationType}_count`;
    const avgTimeKey = `${operationType}_avg_time`;
    const maxTimeKey = `${operationType}_max_time`;
    const minTimeKey = `${operationType}_min_time`;
    const totalTimeKey = `${operationType}_total_time`;

    const count = this.metrics.get(countKey) || 0;
    const avgTime = this.metrics.get(avgTimeKey) || 0;
    const maxTime = this.metrics.get(maxTimeKey) || 0;
    const minTime = this.metrics.get(minTimeKey);
    const totalTime = this.metrics.get(totalTimeKey) || 0;
    const threshold = this.thresholds[operationType] || 1000;

    // Get recent history for this operation
    const recentHistory = this.getHistory(50, operationType);
    const slowOperations = recentHistory.filter(item => item.duration > threshold).length;
    const failedOperations = recentHistory.filter(item => !item.success).length;
    const totalHistoryCount = recentHistory.length;

    return {
      operationType,
      count,
      avgTime: Math.round(avgTime * 100) / 100,
      maxTime: Math.round(maxTime * 100) / 100,
      minTime: minTime === Infinity ? 0 : Math.round(minTime * 100) / 100,
      totalTime: Math.round(totalTime * 100) / 100,
      threshold,
      slowOperations,
      failedOperations,
      successRate: totalHistoryCount > 0 ? Math.round(((totalHistoryCount - failedOperations) / totalHistoryCount) * 100) / 100 : 0,
      slowRate: totalHistoryCount > 0 ? Math.round((slowOperations / totalHistoryCount) * 100) / 100 : 0
    };
  }

  /**
   * Get top slow operations
   */
  getTopSlowOperations(limit = 10) {
    return this.performanceHistory
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit)
      .map(item => ({
        timerId: item.timerId,
        operationType: item.operationType,
        duration: Math.round(item.duration * 100) / 100,
        timestamp: item.timestamp,
        success: item.success,
        metadata: item.metadata
      }));
  }

  /**
   * Monitor database query performance
   */
  monitorDatabaseQuery(queryType, query) {
    return this.startTimer('database_query', `db_${queryType}_${Date.now()}`);
  }

  /**
   * Monitor cache operation performance
   */
  monitorCacheOperation(operation, key) {
    return this.startTimer('cache_operation', `cache_${operation}_${key}`);
  }

  /**
   * Monitor availability calculation performance
   */
  monitorAvailabilityCalculation(date, serviceType) {
    const id = `availability_${date}_${serviceType || 'all'}`;
    return this.startTimer('availability_calculation', id);
  }

  /**
   * Monitor appointment operation performance
   */
  monitorAppointmentOperation(operation, appointmentId) {
    const id = `appointment_${operation}_${appointmentId}`;
    return this.startTimer(`appointment_${operation}`, id);
  }

  /**
   * Monitor calendar sync performance
   */
  monitorCalendarSync(provider, operation) {
    const id = `calendar_${provider}_${operation}`;
    return this.startTimer('calendar_sync', id);
  }

  /**
   * Generate performance report
   */
  generateReport() {
    const metrics = this.getMetrics();
    const operationTypes = Object.keys(this.thresholds);
    const operationSummaries = operationTypes.map(type => this.getOperationSummary(type));
    const topSlowOperations = this.getTopSlowOperations(5);

    return {
      timestamp: new Date(),
      overview: {
        totalOperations: metrics.total_operations,
        successRate: metrics.success_rate,
        slowOperationRate: metrics.slow_operation_rate,
        cacheHitRate: metrics.cache_hit_rate,
        averageResponseTime: this.calculateOverallAverageTime()
      },
      operations: operationSummaries,
      topSlowOperations,
      recommendations: this.generateRecommendations(metrics, operationSummaries)
    };
  }

  /**
   * Calculate overall average response time
   */
  calculateOverallAverageTime() {
    const operationTypes = Object.keys(this.thresholds);
    let totalTime = 0;
    let totalCount = 0;

    operationTypes.forEach(type => {
      const count = this.metrics.get(`${type}_count`) || 0;
      const total = this.metrics.get(`${type}_total_time`) || 0;
      totalTime += total;
      totalCount += count;
    });

    return totalCount > 0 ? Math.round((totalTime / totalCount) * 100) / 100 : 0;
  }

  /**
   * Generate performance recommendations
   */
  generateRecommendations(metrics, operationSummaries) {
    const recommendations = [];

    // Cache hit rate recommendations
    if (metrics.cache_hit_rate < 0.7) {
      recommendations.push({
        type: 'cache',
        priority: 'high',
        message: `Cache hit rate is ${metrics.cache_hit_rate}. Consider increasing cache TTL or warming up cache.`
      });
    }

    // Slow operation recommendations
    operationSummaries.forEach(summary => {
      if (summary.slowRate > 0.1) {
        recommendations.push({
          type: 'performance',
          priority: summary.slowRate > 0.3 ? 'critical' : 'medium',
          message: `${summary.operationType} has ${summary.slowRate * 100}% slow operations. Consider optimization.`
        });
      }

      if (summary.avgTime > summary.threshold * 0.8) {
        recommendations.push({
          type: 'performance',
          priority: 'medium',
          message: `${summary.operationType} average time (${summary.avgTime}ms) is approaching threshold (${summary.threshold}ms).`
        });
      }
    });

    // Database query recommendations
    if (metrics.database_queries > metrics.total_operations * 2) {
      recommendations.push({
        type: 'database',
        priority: 'medium',
        message: 'High database query ratio detected. Consider query optimization or caching.'
      });
    }

    return recommendations;
  }

  /**
   * Clear performance history
   */
  clearHistory() {
    const historySize = this.performanceHistory.length;
    this.performanceHistory = [];
    logger.info(`Cleared performance history: ${historySize} entries`);
    return historySize;
  }

  /**
   * Set custom threshold for an operation
   */
  setThreshold(operationType, threshold) {
    this.thresholds[operationType] = threshold;
    logger.info(`Updated threshold for ${operationType}: ${threshold}ms`);
  }
}

// Create singleton instance
const appointmentPerformanceService = new AppointmentPerformanceService();

export default appointmentPerformanceService;