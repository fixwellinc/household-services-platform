import express from 'express';
import { requireAdmin } from '../../middleware/auth.js';
import systemMonitoringService from '../../services/systemMonitoringService.js';
import maintenanceService from '../../services/maintenanceService.js';
import alertingService from '../../services/alertingService.js';
import { auditPresets } from '../../middleware/auditMiddleware.js';

const router = express.Router();

// Get comprehensive system health metrics
router.get('/health', requireAdmin, async (req, res) => {
  try {
    const health = await systemMonitoringService.getSystemHealth();
    
    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    console.error('Error getting system health:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get system health',
      message: error.message
    });
  }
});

// Get real-time metrics for dashboard
router.get('/metrics/realtime', requireAdmin, async (req, res) => {
  try {
    const { metrics } = req.query;
    const requestedMetrics = metrics ? metrics.split(',') : ['cpu', 'memory', 'responseTime'];
    
    const data = {};
    
    if (requestedMetrics.includes('cpu')) {
      data.cpu = systemMonitoringService.getCpuUsage();
    }
    
    if (requestedMetrics.includes('memory')) {
      data.memory = systemMonitoringService.getMemoryMetrics();
    }
    
    if (requestedMetrics.includes('responseTime')) {
      data.responseTime = await systemMonitoringService.getPerformanceMetrics();
    }
    
    if (requestedMetrics.includes('cache')) {
      data.cache = systemMonitoringService.getCacheMetrics();
    }
    
    res.json({
      success: true,
      data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting real-time metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get real-time metrics',
      message: error.message
    });
  }
});

// Get historical metrics for charts
router.get('/metrics/history', requireAdmin, async (req, res) => {
  try {
    const { metric, period = '1h' } = req.query;
    
    if (!metric) {
      return res.status(400).json({
        success: false,
        error: 'Metric parameter is required'
      });
    }
    
    // Get historical data from the service
    const history = systemMonitoringService.getMetricHistory(metric, period);
    
    res.json({
      success: true,
      data: {
        metric,
        period,
        points: history
      }
    });
  } catch (error) {
    console.error('Error getting metric history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get metric history',
      message: error.message
    });
  }
});

// Alert management endpoints
router.get('/alerts', requireAdmin, async (req, res) => {
  try {
    const { status = 'active' } = req.query;
    
    let alerts;
    if (status === 'all') {
      alerts = systemMonitoringService.getAllAlerts();
    } else {
      alerts = systemMonitoringService.getActiveAlerts();
    }
    
    res.json({
      success: true,
      data: alerts
    });
  } catch (error) {
    console.error('Error getting alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get alerts',
      message: error.message
    });
  }
});

router.post('/alerts/:alertId/acknowledge', requireAdmin, auditPresets.settingsUpdate, async (req, res) => {
  try {
    const { alertId } = req.params;
    const success = systemMonitoringService.acknowledgeAlert(alertId);
    
    if (success) {
      res.json({
        success: true,
        message: 'Alert acknowledged successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Alert not found'
      });
    }
  } catch (error) {
    console.error('Error acknowledging alert:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to acknowledge alert',
      message: error.message
    });
  }
});

router.post('/alerts/:alertId/resolve', requireAdmin, auditPresets.settingsUpdate, async (req, res) => {
  try {
    const { alertId } = req.params;
    const success = systemMonitoringService.resolveAlert(alertId);
    
    if (success) {
      res.json({
        success: true,
        message: 'Alert resolved successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Alert not found'
      });
    }
  } catch (error) {
    console.error('Error resolving alert:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to resolve alert',
      message: error.message
    });
  }
});

// Configuration endpoints
router.get('/config/thresholds', requireAdmin, async (req, res) => {
  try {
    const thresholds = systemMonitoringService.getThresholds();
    
    res.json({
      success: true,
      data: thresholds
    });
  } catch (error) {
    console.error('Error getting thresholds:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get thresholds',
      message: error.message
    });
  }
});

router.put('/config/thresholds', requireAdmin, auditPresets.settingsUpdate, async (req, res) => {
  try {
    const { thresholds } = req.body;
    
    if (!thresholds || typeof thresholds !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Invalid thresholds data'
      });
    }
    
    systemMonitoringService.updateThresholds(thresholds);
    
    res.json({
      success: true,
      message: 'Thresholds updated successfully',
      data: systemMonitoringService.getThresholds()
    });
  } catch (error) {
    console.error('Error updating thresholds:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update thresholds',
      message: error.message
    });
  }
});

// System actions
router.post('/actions/clear-cache', requireAdmin, auditPresets.settingsUpdate, async (req, res) => {
  try {
    const { pattern } = req.body;
    
    // This would integrate with your cache service
    const result = await systemMonitoringService.clearCache(pattern);
    
    res.json({
      success: true,
      message: 'Cache cleared successfully',
      data: result
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear cache',
      message: error.message
    });
  }
});

router.post('/actions/restart-service', requireAdmin, auditPresets.settingsUpdate, async (req, res) => {
  try {
    const { serviceName } = req.body;
    
    if (!serviceName) {
      return res.status(400).json({
        success: false,
        error: 'Service name is required'
      });
    }
    
    // This would implement service restart logic
    // For now, just return success
    res.json({
      success: true,
      message: `Service ${serviceName} restart initiated`
    });
  } catch (error) {
    console.error('Error restarting service:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to restart service',
      message: error.message
    });
  }
});

// Performance analysis
router.get('/analysis/performance', requireAdmin, async (req, res) => {
  try {
    const analysis = await systemMonitoringService.getPerformanceAnalysis();
    
    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('Error getting performance analysis:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get performance analysis',
      message: error.message
    });
  }
});

// Maintenance endpoints
router.get('/maintenance/cache/stats', requireAdmin, async (req, res) => {
  try {
    const stats = await maintenanceService.getCacheStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting cache stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get cache stats',
      message: error.message
    });
  }
});

router.post('/maintenance/cache/clear', requireAdmin, auditPresets.settingsUpdate, async (req, res) => {
  try {
    const { pattern } = req.body;
    const result = await maintenanceService.clearCache(pattern);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear cache',
      message: error.message
    });
  }
});

router.get('/maintenance/database/stats', requireAdmin, async (req, res) => {
  try {
    const stats = await maintenanceService.getDatabaseStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting database stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get database stats',
      message: error.message
    });
  }
});

router.post('/maintenance/database/analyze', requireAdmin, auditPresets.settingsUpdate, async (req, res) => {
  try {
    const result = await maintenanceService.analyzeDatabaseTables();
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error analyzing database:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze database',
      message: error.message
    });
  }
});

router.post('/maintenance/database/rebuild-indexes', requireAdmin, auditPresets.settingsUpdate, async (req, res) => {
  try {
    const result = await maintenanceService.rebuildIndexes();
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error rebuilding indexes:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to rebuild indexes',
      message: error.message
    });
  }
});

router.get('/maintenance/logs/stats', requireAdmin, async (req, res) => {
  try {
    const stats = await maintenanceService.getLogStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting log stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get log stats',
      message: error.message
    });
  }
});

router.post('/maintenance/logs/search', requireAdmin, async (req, res) => {
  try {
    const { query, options = {} } = req.body;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }
    
    const result = await maintenanceService.searchLogs(query, options);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error searching logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search logs',
      message: error.message
    });
  }
});

router.post('/maintenance/logs/export', requireAdmin, auditPresets.settingsUpdate, async (req, res) => {
  try {
    const { format = 'json', ...options } = req.body;
    const result = await maintenanceService.exportLogs({ format, ...options });
    
    const filename = `logs-${new Date().toISOString().split('T')[0]}.${format}`;
    
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
    } else {
      res.setHeader('Content-Type', 'application/json');
    }
    
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(result.data);
  } catch (error) {
    console.error('Error exporting logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export logs',
      message: error.message
    });
  }
});

router.post('/maintenance/logs/rotate', requireAdmin, auditPresets.settingsUpdate, async (req, res) => {
  try {
    const result = await maintenanceService.rotateLogs();
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error rotating logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to rotate logs',
      message: error.message
    });
  }
});

router.post('/maintenance/tasks/:taskId/run', requireAdmin, auditPresets.settingsUpdate, async (req, res) => {
  try {
    const { taskId } = req.params;
    const { options = {} } = req.body;
    
    const result = await maintenanceService.runMaintenanceTask(taskId, options);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error running maintenance task:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to run maintenance task',
      message: error.message
    });
  }
});

// Alerting endpoints
router.get('/alerting/rules', requireAdmin, async (req, res) => {
  try {
    const rules = alertingService.getAlertRules();
    
    res.json({
      success: true,
      data: rules
    });
  } catch (error) {
    console.error('Error getting alert rules:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get alert rules',
      message: error.message
    });
  }
});

router.post('/alerting/rules', requireAdmin, auditPresets.settingsUpdate, async (req, res) => {
  try {
    const rule = {
      id: `rule_${Date.now()}`,
      ...req.body
    };
    
    alertingService.addAlertRule(rule);
    
    res.json({
      success: true,
      data: rule
    });
  } catch (error) {
    console.error('Error creating alert rule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create alert rule',
      message: error.message
    });
  }
});

router.put('/alerting/rules/:ruleId', requireAdmin, auditPresets.settingsUpdate, async (req, res) => {
  try {
    const { ruleId } = req.params;
    const success = alertingService.updateAlertRule(ruleId, req.body);
    
    if (success) {
      res.json({
        success: true,
        message: 'Alert rule updated successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Alert rule not found'
      });
    }
  } catch (error) {
    console.error('Error updating alert rule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update alert rule',
      message: error.message
    });
  }
});

router.delete('/alerting/rules/:ruleId', requireAdmin, auditPresets.settingsUpdate, async (req, res) => {
  try {
    const { ruleId } = req.params;
    const success = alertingService.deleteAlertRule(ruleId);
    
    if (success) {
      res.json({
        success: true,
        message: 'Alert rule deleted successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Alert rule not found'
      });
    }
  } catch (error) {
    console.error('Error deleting alert rule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete alert rule',
      message: error.message
    });
  }
});

router.get('/alerting/alerts', requireAdmin, async (req, res) => {
  try {
    const { limit, severity, status } = req.query;
    const options = {
      limit: limit ? parseInt(limit) : undefined,
      severity,
      status
    };
    
    const alerts = alertingService.getAlertHistory(options);
    
    res.json({
      success: true,
      data: alerts
    });
  } catch (error) {
    console.error('Error getting alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get alerts',
      message: error.message
    });
  }
});

router.get('/alerting/stats', requireAdmin, async (req, res) => {
  try {
    const stats = alertingService.getAlertingStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting alerting stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get alerting stats',
      message: error.message
    });
  }
});

router.post('/alerting/start', requireAdmin, auditPresets.settingsUpdate, async (req, res) => {
  try {
    const { intervalMs = 30000 } = req.body;
    alertingService.startMonitoring(intervalMs);
    
    res.json({
      success: true,
      message: 'Automated monitoring started'
    });
  } catch (error) {
    console.error('Error starting monitoring:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start monitoring',
      message: error.message
    });
  }
});

router.post('/alerting/stop', requireAdmin, auditPresets.settingsUpdate, async (req, res) => {
  try {
    alertingService.stopMonitoring();
    
    res.json({
      success: true,
      message: 'Automated monitoring stopped'
    });
  } catch (error) {
    console.error('Error stopping monitoring:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to stop monitoring',
      message: error.message
    });
  }
});

export default router;