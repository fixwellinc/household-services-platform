/**
 * Admin performance monitoring routes
 */

import express from 'express';
import { performanceMonitoringService } from '../../services/performanceMonitoringService.js';
import { cacheService } from '../../services/cacheService.js';
import { backgroundJobService } from '../../services/backgroundJobService.js';
import { queryOptimizer } from '../../utils/queryOptimizer.js';
import { logger } from '../../utils/logger.js';

const router = express.Router();

/**
 * Get performance summary
 */
router.get('/summary', async (req, res) => {
  try {
    const summary = performanceMonitoringService.getPerformanceSummary();
    res.json(summary);
  } catch (error) {
    logger.error('Failed to get performance summary:', error);
    res.status(500).json({ error: 'Failed to get performance summary' });
  }
});

/**
 * Get system metrics
 */
router.get('/metrics/system', async (req, res) => {
  try {
    const { startTime, endTime } = req.query;
    const start = startTime ? parseInt(startTime) : Date.now() - 3600000; // Last hour
    const end = endTime ? parseInt(endTime) : Date.now();

    const metrics = performanceMonitoringService.getMetrics('system', start, end);
    
    res.json({
      startTime: start,
      endTime: end,
      count: metrics.length,
      metrics
    });
  } catch (error) {
    logger.error('Failed to get system metrics:', error);
    res.status(500).json({ error: 'Failed to get system metrics' });
  }
});

/**
 * Get application metrics
 */
router.get('/metrics/application', async (req, res) => {
  try {
    const { startTime, endTime } = req.query;
    const start = startTime ? parseInt(startTime) : Date.now() - 3600000; // Last hour
    const end = endTime ? parseInt(endTime) : Date.now();

    const metrics = performanceMonitoringService.getMetrics('application', start, end);
    
    res.json({
      startTime: start,
      endTime: end,
      count: metrics.length,
      metrics
    });
  } catch (error) {
    logger.error('Failed to get application metrics:', error);
    res.status(500).json({ error: 'Failed to get application metrics' });
  }
});

/**
 * Get latest metrics
 */
router.get('/metrics/latest', async (req, res) => {
  try {
    const systemMetrics = performanceMonitoringService.getLatestMetrics('system');
    const appMetrics = performanceMonitoringService.getLatestMetrics('application');

    res.json({
      system: systemMetrics,
      application: appMetrics,
      timestamp: Date.now()
    });
  } catch (error) {
    logger.error('Failed to get latest metrics:', error);
    res.status(500).json({ error: 'Failed to get latest metrics' });
  }
});

/**
 * Get active alerts
 */
router.get('/alerts', async (req, res) => {
  try {
    const alerts = performanceMonitoringService.getActiveAlerts();
    res.json(alerts);
  } catch (error) {
    logger.error('Failed to get alerts:', error);
    res.status(500).json({ error: 'Failed to get alerts' });
  }
});

/**
 * Clear specific alert
 */
router.delete('/alerts/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { queue } = req.query;
    
    const cleared = performanceMonitoringService.clearAlert(type, queue);
    
    res.json({ 
      success: cleared,
      message: cleared ? 'Alert cleared' : 'Alert not found'
    });
  } catch (error) {
    logger.error('Failed to clear alert:', error);
    res.status(500).json({ error: 'Failed to clear alert' });
  }
});

/**
 * Update alert thresholds
 */
router.put('/thresholds', async (req, res) => {
  try {
    const thresholds = req.body;
    
    // Validate thresholds
    const validKeys = [
      'slowQuery', 'highMemory', 'highCpu', 'lowCacheHit', 
      'highErrorRate', 'connectionPoolHigh'
    ];
    
    const validThresholds = {};
    Object.entries(thresholds).forEach(([key, value]) => {
      if (validKeys.includes(key) && typeof value === 'number' && value > 0) {
        validThresholds[key] = value;
      }
    });

    performanceMonitoringService.updateThresholds(validThresholds);
    
    res.json({ 
      success: true,
      message: 'Thresholds updated',
      thresholds: validThresholds
    });
  } catch (error) {
    logger.error('Failed to update thresholds:', error);
    res.status(500).json({ error: 'Failed to update thresholds' });
  }
});

/**
 * Get cache statistics
 */
router.get('/cache/stats', async (req, res) => {
  try {
    const stats = await cacheService.getStats();
    res.json(stats);
  } catch (error) {
    logger.error('Failed to get cache stats:', error);
    res.status(500).json({ error: 'Failed to get cache stats' });
  }
});

/**
 * Clear cache
 */
router.delete('/cache', async (req, res) => {
  try {
    const { pattern } = req.query;
    
    if (pattern) {
      await cacheService.delPattern(pattern);
      res.json({ 
        success: true,
        message: `Cache cleared for pattern: ${pattern}`
      });
    } else {
      await cacheService.flush();
      res.json({ 
        success: true,
        message: 'All cache cleared'
      });
    }
  } catch (error) {
    logger.error('Failed to clear cache:', error);
    res.status(500).json({ error: 'Failed to clear cache' });
  }
});

/**
 * Get queue statistics
 */
router.get('/queues/stats', async (req, res) => {
  try {
    const stats = await backgroundJobService.getQueueStats();
    res.json(stats);
  } catch (error) {
    logger.error('Failed to get queue stats:', error);
    res.status(500).json({ error: 'Failed to get queue stats' });
  }
});

/**
 * Get jobs for a specific queue
 */
router.get('/queues/:queueName/jobs', async (req, res) => {
  try {
    const { queueName } = req.params;
    const { types = 'waiting,active,completed,failed', start = 0, end = 20 } = req.query;
    
    const jobTypes = types.split(',');
    const jobs = await backgroundJobService.getJobs(
      queueName, 
      jobTypes, 
      parseInt(start), 
      parseInt(end)
    );
    
    res.json({
      queueName,
      types: jobTypes,
      start: parseInt(start),
      end: parseInt(end),
      jobs
    });
  } catch (error) {
    logger.error('Failed to get queue jobs:', error);
    res.status(500).json({ error: 'Failed to get queue jobs' });
  }
});

/**
 * Pause/resume queue
 */
router.put('/queues/:queueName/:action', async (req, res) => {
  try {
    const { queueName, action } = req.params;
    
    let result;
    switch (action) {
      case 'pause':
        result = await backgroundJobService.pauseQueue(queueName);
        break;
      case 'resume':
        result = await backgroundJobService.resumeQueue(queueName);
        break;
      case 'clean':
        result = await backgroundJobService.cleanQueue(queueName);
        break;
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
    
    res.json({ 
      success: result,
      message: `Queue ${queueName} ${action} ${result ? 'successful' : 'failed'}`
    });
  } catch (error) {
    logger.error(`Failed to ${req.params.action} queue:`, error);
    res.status(500).json({ error: `Failed to ${req.params.action} queue` });
  }
});

/**
 * Get query performance metrics
 */
router.get('/queries/metrics', async (req, res) => {
  try {
    const metrics = queryOptimizer.getMetrics();
    res.json(metrics);
  } catch (error) {
    logger.error('Failed to get query metrics:', error);
    res.status(500).json({ error: 'Failed to get query metrics' });
  }
});

/**
 * Clear query performance metrics
 */
router.delete('/queries/metrics', async (req, res) => {
  try {
    queryOptimizer.clearMetrics();
    res.json({ 
      success: true,
      message: 'Query metrics cleared'
    });
  } catch (error) {
    logger.error('Failed to clear query metrics:', error);
    res.status(500).json({ error: 'Failed to clear query metrics' });
  }
});

/**
 * Export performance data
 */
router.get('/export', async (req, res) => {
  try {
    const { type = 'all', startTime, endTime, format = 'json' } = req.query;
    const start = startTime ? parseInt(startTime) : Date.now() - 86400000; // Last 24 hours
    const end = endTime ? parseInt(endTime) : Date.now();

    const exportData = {
      exportedAt: Date.now(),
      startTime: start,
      endTime: end,
      type
    };

    if (type === 'all' || type === 'system') {
      exportData.systemMetrics = performanceMonitoringService.exportMetrics('system', start, end);
    }

    if (type === 'all' || type === 'application') {
      exportData.applicationMetrics = performanceMonitoringService.exportMetrics('application', start, end);
    }

    if (type === 'all' || type === 'alerts') {
      exportData.alerts = performanceMonitoringService.getActiveAlerts();
    }

    if (type === 'all' || type === 'queries') {
      exportData.queryMetrics = queryOptimizer.getMetrics();
    }

    if (format === 'csv') {
      // Convert to CSV format
      const csv = convertToCSV(exportData);
      res.set({
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="performance-export-${Date.now()}.csv"`
      });
      res.send(csv);
    } else {
      res.json(exportData);
    }
  } catch (error) {
    logger.error('Failed to export performance data:', error);
    res.status(500).json({ error: 'Failed to export performance data' });
  }
});

/**
 * Get health check
 */
router.get('/health', async (req, res) => {
  try {
    const summary = performanceMonitoringService.getPerformanceSummary();
    const health = summary.health;
    
    const status = health >= 80 ? 'healthy' : health >= 60 ? 'degraded' : 'unhealthy';
    const statusCode = health >= 80 ? 200 : health >= 60 ? 200 : 503;
    
    res.status(statusCode).json({
      status,
      health,
      timestamp: Date.now(),
      details: {
        system: summary.system,
        application: summary.application,
        alerts: summary.alerts
      }
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({ 
      status: 'unhealthy',
      error: 'Health check failed'
    });
  }
});

/**
 * Convert data to CSV format
 */
function convertToCSV(data) {
  // Simple CSV conversion - would need more sophisticated handling for complex nested data
  const lines = ['timestamp,type,metric,value'];
  
  // Add system metrics
  if (data.systemMetrics?.metrics) {
    data.systemMetrics.metrics.forEach(metric => {
      lines.push(`${metric.timestamp},system,memory_usage,${metric.memory.usagePercent}`);
      lines.push(`${metric.timestamp},system,cpu_usage,${metric.cpu.usage}`);
      lines.push(`${metric.timestamp},system,load_avg,${metric.cpu.loadAvg['1m']}`);
    });
  }
  
  return lines.join('\n');
}

export default router;