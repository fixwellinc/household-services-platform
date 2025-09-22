/**
 * Performance monitoring and metrics collection service
 */

import { logger } from '../utils/logger.js';
import { cacheService } from './cacheService.js';
import { backgroundJobService } from './backgroundJobService.js';

class PerformanceMonitoringService {
  constructor() {
    this.metrics = new Map();
    this.alerts = new Map();
    this.thresholds = {
      slowQuery: 1000,        // 1 second
      highMemory: 0.8,        // 80%
      highCpu: 0.8,           // 80%
      lowCacheHit: 0.9,       // 90%
      highErrorRate: 0.05,    // 5%
      connectionPoolHigh: 0.8  // 80%
    };
    
    this.startMonitoring();
  }

  /**
   * Start performance monitoring
   */
  startMonitoring() {
    // Collect system metrics every 30 seconds
    setInterval(() => {
      this.collectSystemMetrics();
    }, 30000);

    // Collect application metrics every minute
    setInterval(() => {
      this.collectApplicationMetrics();
    }, 60000);

    // Check alerts every 2 minutes
    setInterval(() => {
      this.checkAlerts();
    }, 120000);

    // Clean old metrics every hour
    setInterval(() => {
      this.cleanOldMetrics();
    }, 3600000);

    logger.info('Performance monitoring started');
  }

  /**
   * Collect system-level metrics
   */
  async collectSystemMetrics() {
    try {
      const os = await import('os');
      const process = await import('process');

      // Memory metrics
      const memUsage = process.memoryUsage();
      const totalMemory = os.totalmem();
      const freeMemory = os.freemem();
      const usedMemory = totalMemory - freeMemory;

      // CPU metrics
      const cpus = os.cpus();
      const loadAvg = os.loadavg();

      // Process metrics
      const uptime = process.uptime();
      const pid = process.pid;

      const systemMetrics = {
        timestamp: Date.now(),
        memory: {
          total: totalMemory,
          free: freeMemory,
          used: usedMemory,
          usagePercent: (usedMemory / totalMemory) * 100,
          heap: {
            used: memUsage.heapUsed,
            total: memUsage.heapTotal,
            usagePercent: (memUsage.heapUsed / memUsage.heapTotal) * 100
          },
          rss: memUsage.rss,
          external: memUsage.external
        },
        cpu: {
          count: cpus.length,
          loadAvg: {
            '1m': loadAvg[0],
            '5m': loadAvg[1],
            '15m': loadAvg[2]
          },
          usage: this.calculateCpuUsage(cpus)
        },
        process: {
          uptime,
          pid,
          nodeVersion: process.version,
          platform: process.platform,
          arch: process.arch
        }
      };

      this.recordMetric('system', systemMetrics);

      // Check for system alerts
      this.checkSystemAlerts(systemMetrics);

    } catch (error) {
      logger.error('Failed to collect system metrics:', error);
    }
  }

  /**
   * Collect application-level metrics
   */
  async collectApplicationMetrics() {
    try {
      // Cache metrics
      const cacheStats = await cacheService.getStats();
      
      // Queue metrics
      const queueStats = await backgroundJobService.getQueueStats();

      // Database metrics (if available)
      const dbMetrics = await this.collectDatabaseMetrics();

      // HTTP metrics
      const httpMetrics = this.getHttpMetrics();

      const appMetrics = {
        timestamp: Date.now(),
        cache: cacheStats,
        queues: queueStats,
        database: dbMetrics,
        http: httpMetrics,
        errors: this.getErrorMetrics()
      };

      this.recordMetric('application', appMetrics);

      // Check for application alerts
      this.checkApplicationAlerts(appMetrics);

    } catch (error) {
      logger.error('Failed to collect application metrics:', error);
    }
  }

  /**
   * Calculate CPU usage percentage
   */
  calculateCpuUsage(cpus) {
    let totalIdle = 0;
    let totalTick = 0;

    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    });

    const idle = totalIdle / cpus.length;
    const total = totalTick / cpus.length;
    const usage = 100 - ~~(100 * idle / total);

    return Math.max(0, Math.min(100, usage));
  }

  /**
   * Collect database metrics
   */
  async collectDatabaseMetrics() {
    try {
      // This would integrate with your database monitoring
      // For now, return basic connection info
      return {
        connections: {
          active: 0,
          idle: 0,
          total: 0
        },
        queries: {
          total: 0,
          slow: 0,
          failed: 0,
          avgDuration: 0
        },
        size: {
          total: 0,
          indexes: 0,
          data: 0
        }
      };
    } catch (error) {
      logger.error('Failed to collect database metrics:', error);
      return null;
    }
  }

  /**
   * Get HTTP request metrics
   */
  getHttpMetrics() {
    // This would integrate with your HTTP request tracking
    return {
      requests: {
        total: 0,
        successful: 0,
        failed: 0,
        avgDuration: 0
      },
      responses: {
        '2xx': 0,
        '3xx': 0,
        '4xx': 0,
        '5xx': 0
      },
      endpoints: {}
    };
  }

  /**
   * Get error metrics
   */
  getErrorMetrics() {
    return {
      total: 0,
      byType: {},
      byEndpoint: {},
      recent: []
    };
  }

  /**
   * Record a metric
   */
  recordMetric(type, data) {
    const key = `${type}:${Date.now()}`;
    this.metrics.set(key, data);

    // Also store in cache for external access
    const cacheKey = `metrics:${type}:latest`;
    cacheService.set(cacheKey, data, 300).catch(error => {
      logger.error('Failed to cache metric:', error);
    });
  }

  /**
   * Get metrics by type and time range
   */
  getMetrics(type, startTime, endTime) {
    const results = [];
    
    for (const [key, value] of this.metrics.entries()) {
      if (key.startsWith(`${type}:`)) {
        const timestamp = parseInt(key.split(':')[1]);
        if (timestamp >= startTime && timestamp <= endTime) {
          results.push(value);
        }
      }
    }

    return results.sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Get latest metrics
   */
  getLatestMetrics(type) {
    let latest = null;
    let latestTimestamp = 0;

    for (const [key, value] of this.metrics.entries()) {
      if (key.startsWith(`${type}:`)) {
        const timestamp = parseInt(key.split(':')[1]);
        if (timestamp > latestTimestamp) {
          latestTimestamp = timestamp;
          latest = value;
        }
      }
    }

    return latest;
  }

  /**
   * Check system alerts
   */
  checkSystemAlerts(metrics) {
    const alerts = [];

    // Memory usage alert
    if (metrics.memory.usagePercent > this.thresholds.highMemory * 100) {
      alerts.push({
        type: 'high_memory',
        severity: 'warning',
        message: `High memory usage: ${metrics.memory.usagePercent.toFixed(1)}%`,
        value: metrics.memory.usagePercent,
        threshold: this.thresholds.highMemory * 100
      });
    }

    // CPU usage alert
    if (metrics.cpu.usage > this.thresholds.highCpu * 100) {
      alerts.push({
        type: 'high_cpu',
        severity: 'warning',
        message: `High CPU usage: ${metrics.cpu.usage}%`,
        value: metrics.cpu.usage,
        threshold: this.thresholds.highCpu * 100
      });
    }

    // Load average alert
    if (metrics.cpu.loadAvg['1m'] > metrics.cpu.count * 0.8) {
      alerts.push({
        type: 'high_load',
        severity: 'warning',
        message: `High load average: ${metrics.cpu.loadAvg['1m'].toFixed(2)}`,
        value: metrics.cpu.loadAvg['1m'],
        threshold: metrics.cpu.count * 0.8
      });
    }

    this.processAlerts(alerts);
  }

  /**
   * Check application alerts
   */
  checkApplicationAlerts(metrics) {
    const alerts = [];

    // Cache hit rate alert
    if (metrics.cache.connected && metrics.cache.hitRate < this.thresholds.lowCacheHit * 100) {
      alerts.push({
        type: 'low_cache_hit',
        severity: 'warning',
        message: `Low cache hit rate: ${metrics.cache.hitRate}%`,
        value: metrics.cache.hitRate,
        threshold: this.thresholds.lowCacheHit * 100
      });
    }

    // Queue alerts
    Object.entries(metrics.queues).forEach(([queueName, queueStats]) => {
      if (queueStats.failed > 10) {
        alerts.push({
          type: 'queue_failures',
          severity: 'error',
          message: `High failure count in queue ${queueName}: ${queueStats.failed}`,
          value: queueStats.failed,
          threshold: 10,
          queue: queueName
        });
      }

      if (queueStats.waiting > 100) {
        alerts.push({
          type: 'queue_backlog',
          severity: 'warning',
          message: `High backlog in queue ${queueName}: ${queueStats.waiting}`,
          value: queueStats.waiting,
          threshold: 100,
          queue: queueName
        });
      }
    });

    this.processAlerts(alerts);
  }

  /**
   * Process and handle alerts
   */
  processAlerts(alerts) {
    alerts.forEach(alert => {
      const alertKey = `${alert.type}:${alert.queue || 'system'}`;
      const existingAlert = this.alerts.get(alertKey);
      
      // Check if this is a new alert or escalation
      if (!existingAlert || existingAlert.severity !== alert.severity) {
        this.alerts.set(alertKey, {
          ...alert,
          firstSeen: existingAlert?.firstSeen || Date.now(),
          lastSeen: Date.now(),
          count: (existingAlert?.count || 0) + 1
        });

        // Send alert notification
        this.sendAlert(alert);
      } else {
        // Update existing alert
        existingAlert.lastSeen = Date.now();
        existingAlert.count++;
      }
    });
  }

  /**
   * Send alert notification
   */
  async sendAlert(alert) {
    try {
      logger.warn('Performance alert triggered:', alert);

      // Send to background job for notification processing
      await backgroundJobService.addNotificationJob({
        type: 'performance_alert',
        title: 'Performance Alert',
        message: alert.message,
        data: alert,
        recipients: ['admin'] // Configure admin notification recipients
      });

      // Store alert in cache for dashboard display
      const alertKey = `alert:${Date.now()}:${alert.type}`;
      await cacheService.set(alertKey, alert, 3600); // Store for 1 hour

    } catch (error) {
      logger.error('Failed to send performance alert:', error);
    }
  }

  /**
   * Get active alerts
   */
  getActiveAlerts() {
    const activeAlerts = [];
    const now = Date.now();
    const alertTimeout = 10 * 60 * 1000; // 10 minutes

    for (const [key, alert] of this.alerts.entries()) {
      if (now - alert.lastSeen < alertTimeout) {
        activeAlerts.push(alert);
      }
    }

    return activeAlerts;
  }

  /**
   * Clear alert
   */
  clearAlert(alertType, queue = 'system') {
    const alertKey = `${alertType}:${queue}`;
    return this.alerts.delete(alertKey);
  }

  /**
   * Update alert thresholds
   */
  updateThresholds(newThresholds) {
    this.thresholds = { ...this.thresholds, ...newThresholds };
    logger.info('Performance thresholds updated:', this.thresholds);
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary() {
    const systemMetrics = this.getLatestMetrics('system');
    const appMetrics = this.getLatestMetrics('application');
    const activeAlerts = this.getActiveAlerts();

    return {
      timestamp: Date.now(),
      system: systemMetrics ? {
        memoryUsage: systemMetrics.memory.usagePercent,
        cpuUsage: systemMetrics.cpu.usage,
        loadAverage: systemMetrics.cpu.loadAvg['1m'],
        uptime: systemMetrics.process.uptime
      } : null,
      application: appMetrics ? {
        cacheHitRate: appMetrics.cache.hitRate || 0,
        queueHealth: this.calculateQueueHealth(appMetrics.queues),
        errorRate: this.calculateErrorRate(appMetrics.errors)
      } : null,
      alerts: {
        active: activeAlerts.length,
        critical: activeAlerts.filter(a => a.severity === 'critical').length,
        warnings: activeAlerts.filter(a => a.severity === 'warning').length
      },
      health: this.calculateOverallHealth(systemMetrics, appMetrics, activeAlerts)
    };
  }

  /**
   * Calculate queue health score
   */
  calculateQueueHealth(queueStats) {
    if (!queueStats || Object.keys(queueStats).length === 0) {
      return 100;
    }

    let totalScore = 0;
    let queueCount = 0;

    Object.values(queueStats).forEach(stats => {
      if (stats.error) return;
      
      let score = 100;
      
      // Penalize for failures
      if (stats.failed > 0) {
        score -= Math.min(50, stats.failed * 5);
      }
      
      // Penalize for large backlogs
      if (stats.waiting > 10) {
        score -= Math.min(30, (stats.waiting - 10) * 2);
      }
      
      totalScore += Math.max(0, score);
      queueCount++;
    });

    return queueCount > 0 ? totalScore / queueCount : 100;
  }

  /**
   * Calculate error rate
   */
  calculateErrorRate(errorStats) {
    if (!errorStats || errorStats.total === 0) {
      return 0;
    }

    // This would be calculated based on actual request/error ratios
    return 0;
  }

  /**
   * Calculate overall health score
   */
  calculateOverallHealth(systemMetrics, appMetrics, alerts) {
    let score = 100;

    // System health impact
    if (systemMetrics) {
      if (systemMetrics.memory.usagePercent > 80) score -= 20;
      if (systemMetrics.cpu.usage > 80) score -= 20;
      if (systemMetrics.cpu.loadAvg['1m'] > systemMetrics.cpu.count) score -= 15;
    }

    // Application health impact
    if (appMetrics) {
      const queueHealth = this.calculateQueueHealth(appMetrics.queues);
      score -= (100 - queueHealth) * 0.3;
    }

    // Alert impact
    alerts.forEach(alert => {
      switch (alert.severity) {
        case 'critical':
          score -= 25;
          break;
        case 'error':
          score -= 15;
          break;
        case 'warning':
          score -= 5;
          break;
      }
    });

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Clean old metrics to prevent memory leaks
   */
  cleanOldMetrics() {
    const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago
    let cleaned = 0;

    for (const [key, value] of this.metrics.entries()) {
      if (value.timestamp < cutoff) {
        this.metrics.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.info(`Cleaned ${cleaned} old metrics`);
    }
  }

  /**
   * Export metrics for external analysis
   */
  exportMetrics(type, startTime, endTime) {
    const metrics = this.getMetrics(type, startTime, endTime);
    
    return {
      type,
      startTime,
      endTime,
      count: metrics.length,
      metrics,
      exportedAt: Date.now()
    };
  }

  /**
   * Stop monitoring
   */
  stop() {
    // Clear all intervals (would need to track interval IDs)
    logger.info('Performance monitoring stopped');
  }
}

// Create singleton instance
const performanceMonitoringService = new PerformanceMonitoringService();

export { performanceMonitoringService 
  // Check for performance alerts
  checkAlerts() {
    try {
      const currentMetrics = this.getCurrentMetrics();
      
      // Check memory usage
      if (currentMetrics.memory && currentMetrics.memory.heapUsed > 400 * 1024 * 1024) { // 400MB
        console.warn('⚠️  High memory usage detected:', Math.round(currentMetrics.memory.heapUsed / 1024 / 1024) + 'MB');
        
        // Force garbage collection if available
        if (global.gc) {
          global.gc();
          console.log('🧹 Forced garbage collection');
        }
      }
      
      // Check response times
      if (currentMetrics.responseTime && currentMetrics.responseTime.average > 2000) { // 2 seconds
        console.warn('⚠️  Slow response times detected:', currentMetrics.responseTime.average + 'ms');
      }
      
      // Check error rates
      if (currentMetrics.errors && currentMetrics.errors.rate > 0.05) { // 5% error rate
        console.warn('⚠️  High error rate detected:', (currentMetrics.errors.rate * 100).toFixed(2) + '%');
      }
      
    } catch (error) {
      console.error('❌ Error in checkAlerts:', error.message);
    }
  }

  // Get current metrics snapshot
  getCurrentMetrics() {
    try {
      const memoryUsage = process.memoryUsage();
      
      return {
        memory: {
          heapUsed: memoryUsage.heapUsed,
          heapTotal: memoryUsage.heapTotal,
          rss: memoryUsage.rss
        },
        uptime: process.uptime(),
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('❌ Error getting current metrics:', error.message);
      return {};
    }
  }

  // Clean old metrics to prevent memory leaks
  cleanOldMetrics() {
    try {
      // This is a placeholder - implement based on your metrics storage
      console.log('🧹 Cleaning old metrics...');
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
    } catch (error) {
      console.error('❌ Error cleaning old metrics:', error.message);
    }
  }

};