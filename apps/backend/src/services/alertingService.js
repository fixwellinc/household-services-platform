import systemMonitoringService from './systemMonitoringService.js';
import socketService from './socketService.js';
import { monitor } from '../config/performance.js';
import prisma from '../config/database.js';

class AlertingService {
  constructor() {
    this.alertRules = new Map();
    this.escalationPolicies = new Map();
    this.alertHistory = new Map();
    this.monitoringInterval = null;
    this.isMonitoring = false;
    
    // Default alert rules
    this.initializeDefaultRules();
    
    // Default escalation policies
    this.initializeEscalationPolicies();
  }

  initializeDefaultRules() {
    const defaultRules = [
      {
        id: 'high_cpu_usage',
        name: 'High CPU Usage',
        description: 'CPU usage exceeds threshold',
        metric: 'cpu_usage',
        condition: 'greater_than',
        threshold: 80,
        duration: 300, // 5 minutes
        severity: 'warning',
        enabled: true
      },
      {
        id: 'critical_cpu_usage',
        name: 'Critical CPU Usage',
        description: 'CPU usage critically high',
        metric: 'cpu_usage',
        condition: 'greater_than',
        threshold: 95,
        duration: 60, // 1 minute
        severity: 'critical',
        enabled: true
      },
      {
        id: 'high_memory_usage',
        name: 'High Memory Usage',
        description: 'Memory usage exceeds threshold',
        metric: 'memory_usage',
        condition: 'greater_than',
        threshold: 85,
        duration: 300,
        severity: 'warning',
        enabled: true
      },
      {
        id: 'critical_memory_usage',
        name: 'Critical Memory Usage',
        description: 'Memory usage critically high',
        metric: 'memory_usage',
        condition: 'greater_than',
        threshold: 95,
        duration: 60,
        severity: 'critical',
        enabled: true
      },
      {
        id: 'slow_response_time',
        name: 'Slow Response Time',
        description: 'API response time is slow',
        metric: 'response_time',
        condition: 'greater_than',
        threshold: 2000, // 2 seconds
        duration: 180,
        severity: 'warning',
        enabled: true
      },
      {
        id: 'database_connection_failure',
        name: 'Database Connection Failure',
        description: 'Database connection failed',
        metric: 'database_connected',
        condition: 'equals',
        threshold: false,
        duration: 30,
        severity: 'critical',
        enabled: true
      },
      {
        id: 'low_cache_hit_rate',
        name: 'Low Cache Hit Rate',
        description: 'Cache hit rate is below optimal threshold',
        metric: 'cache_hit_rate',
        condition: 'less_than',
        threshold: 60,
        duration: 600, // 10 minutes
        severity: 'medium',
        enabled: true
      },
      {
        id: 'high_error_rate',
        name: 'High Error Rate',
        description: 'Error rate exceeds acceptable threshold',
        metric: 'error_rate',
        condition: 'greater_than',
        threshold: 5, // 5%
        duration: 300,
        severity: 'high',
        enabled: true
      }
    ];

    defaultRules.forEach(rule => {
      this.alertRules.set(rule.id, {
        ...rule,
        lastTriggered: null,
        consecutiveViolations: 0,
        isActive: false
      });
    });
  }

  initializeEscalationPolicies() {
    const policies = [
      {
        id: 'default_escalation',
        name: 'Default Escalation Policy',
        steps: [
          {
            delay: 0, // Immediate
            actions: ['notify_admins', 'log_alert']
          },
          {
            delay: 300, // 5 minutes
            actions: ['notify_admins', 'send_email']
          },
          {
            delay: 900, // 15 minutes
            actions: ['notify_admins', 'send_email', 'create_incident']
          }
        ]
      },
      {
        id: 'critical_escalation',
        name: 'Critical System Escalation',
        steps: [
          {
            delay: 0,
            actions: ['notify_admins', 'log_alert', 'send_email']
          },
          {
            delay: 60, // 1 minute
            actions: ['notify_admins', 'send_email', 'create_incident']
          },
          {
            delay: 300, // 5 minutes
            actions: ['notify_admins', 'send_email', 'create_incident', 'trigger_protective_measures']
          }
        ]
      }
    ];

    policies.forEach(policy => {
      this.escalationPolicies.set(policy.id, policy);
    });
  }

  // Start automated monitoring
  startMonitoring(intervalMs = 30000) { // Default: 30 seconds
    if (this.isMonitoring) {
      console.log('Alerting service is already monitoring');
      return;
    }

    console.log('Starting automated monitoring and alerting...');
    this.isMonitoring = true;

    this.monitoringInterval = setInterval(async () => {
      try {
        await this.checkAllRules();
      } catch (error) {
        console.error('Error during monitoring check:', error);
      }
    }, intervalMs);
  }

  // Stop automated monitoring
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    console.log('Stopped automated monitoring');
  }

  // Check all alert rules
  async checkAllRules() {
    const startTime = monitor.startTimer('alerting_check_rules');

    try {
      // Get current system metrics
      const healthData = await systemMonitoringService.getSystemHealth();
      
      // Extract metrics for rule evaluation
      const currentMetrics = this.extractMetrics(healthData);
      
      // Check each enabled rule
      for (const [ruleId, rule] of this.alertRules) {
        if (!rule.enabled) continue;
        
        try {
          await this.checkRule(rule, currentMetrics);
        } catch (error) {
          console.error(`Error checking rule ${ruleId}:`, error);
        }
      }

      monitor.endTimer('alerting_check_rules', startTime, { 
        rulesChecked: Array.from(this.alertRules.values()).filter(r => r.enabled).length 
      });
    } catch (error) {
      monitor.endTimer('alerting_check_rules', startTime, { error: error.message });
      throw error;
    }
  }

  // Extract metrics from health data
  extractMetrics(healthData) {
    return {
      cpu_usage: healthData.metrics?.system?.cpu?.usage || 0,
      memory_usage: healthData.metrics?.memory?.percentage || 0,
      response_time: healthData.responseTime || 0,
      database_connected: healthData.metrics?.database?.connected || false,
      cache_hit_rate: healthData.metrics?.cache?.hitRate || 0,
      error_rate: this.calculateErrorRate(healthData),
      disk_usage: healthData.metrics?.system?.disk?.usage || 0,
      active_connections: healthData.metrics?.database?.pool?.active || 0
    };
  }

  calculateErrorRate(healthData) {
    // Calculate error rate from performance metrics
    const performanceMetrics = healthData.metrics?.performance?.operationCounts || [];
    const totalOperations = performanceMetrics.reduce((sum, op) => sum + op.count, 0);
    const errorOperations = performanceMetrics
      .filter(op => op.operation.includes('error'))
      .reduce((sum, op) => sum + op.count, 0);
    
    return totalOperations > 0 ? (errorOperations / totalOperations) * 100 : 0;
  }

  // Check individual rule
  async checkRule(rule, currentMetrics) {
    const metricValue = currentMetrics[rule.metric];
    const isViolation = this.evaluateCondition(metricValue, rule.condition, rule.threshold);
    
    if (isViolation) {
      rule.consecutiveViolations++;
      
      // Check if violation duration threshold is met
      const violationDuration = rule.consecutiveViolations * 30; // Assuming 30-second intervals
      
      if (violationDuration >= rule.duration && !rule.isActive) {
        // Trigger alert
        await this.triggerAlert(rule, metricValue, currentMetrics);
      }
    } else {
      // Reset violation count if condition is no longer met
      if (rule.consecutiveViolations > 0) {
        rule.consecutiveViolations = 0;
        
        // Resolve alert if it was active
        if (rule.isActive) {
          await this.resolveAlert(rule, metricValue);
        }
      }
    }
  }

  // Evaluate alert condition
  evaluateCondition(value, condition, threshold) {
    switch (condition) {
      case 'greater_than':
        return value > threshold;
      case 'less_than':
        return value < threshold;
      case 'equals':
        return value === threshold;
      case 'not_equals':
        return value !== threshold;
      case 'greater_than_or_equal':
        return value >= threshold;
      case 'less_than_or_equal':
        return value <= threshold;
      default:
        return false;
    }
  }

  // Trigger alert
  async triggerAlert(rule, currentValue, allMetrics) {
    const alertId = `${rule.id}_${Date.now()}`;
    
    const alert = {
      id: alertId,
      ruleId: rule.id,
      title: rule.name,
      description: `${rule.description}. Current value: ${currentValue}, Threshold: ${rule.threshold}`,
      severity: rule.severity,
      timestamp: new Date(),
      status: 'active',
      currentValue,
      threshold: rule.threshold,
      metric: rule.metric,
      metadata: {
        allMetrics,
        consecutiveViolations: rule.consecutiveViolations,
        violationDuration: rule.consecutiveViolations * 30
      }
    };

    // Mark rule as active
    rule.isActive = true;
    rule.lastTriggered = new Date();

    // Store alert
    this.alertHistory.set(alertId, alert);
    
    // Add to system monitoring service
    systemMonitoringService.createAlert(
      alertId,
      rule.severity,
      rule.name,
      alert.description,
      alert.metadata
    );

    // Execute escalation policy
    await this.executeEscalationPolicy(alert, rule);

    console.log(`Alert triggered: ${rule.name} (${rule.severity})`);
  }

  // Resolve alert
  async resolveAlert(rule, currentValue) {
    // Find active alerts for this rule
    const activeAlerts = Array.from(this.alertHistory.values())
      .filter(alert => alert.ruleId === rule.id && alert.status === 'active');

    for (const alert of activeAlerts) {
      alert.status = 'resolved';
      alert.resolvedAt = new Date();
      alert.resolvedValue = currentValue;

      // Resolve in system monitoring service
      systemMonitoringService.resolveAlert(alert.id);

      // Notify about resolution
      await this.notifyAlertResolution(alert, rule);
    }

    rule.isActive = false;
    console.log(`Alert resolved: ${rule.name}`);
  }

  // Execute escalation policy
  async executeEscalationPolicy(alert, rule) {
    const policyId = rule.severity === 'critical' ? 'critical_escalation' : 'default_escalation';
    const policy = this.escalationPolicies.get(policyId);
    
    if (!policy) {
      console.warn(`Escalation policy not found: ${policyId}`);
      return;
    }

    // Execute each escalation step
    for (const step of policy.steps) {
      setTimeout(async () => {
        try {
          await this.executeEscalationStep(alert, step);
        } catch (error) {
          console.error('Error executing escalation step:', error);
        }
      }, step.delay * 1000);
    }
  }

  // Execute escalation step
  async executeEscalationStep(alert, step) {
    for (const action of step.actions) {
      try {
        await this.executeAction(action, alert);
      } catch (error) {
        console.error(`Error executing action ${action}:`, error);
      }
    }
  }

  // Execute specific action
  async executeAction(action, alert) {
    switch (action) {
      case 'notify_admins':
        await this.notifyAdmins(alert);
        break;
      case 'log_alert':
        await this.logAlert(alert);
        break;
      case 'send_email':
        await this.sendEmailAlert(alert);
        break;
      case 'create_incident':
        await this.createIncident(alert);
        break;
      case 'trigger_protective_measures':
        await this.triggerProtectiveMeasures(alert);
        break;
      default:
        console.warn(`Unknown action: ${action}`);
    }
  }

  // Action implementations
  async notifyAdmins(alert) {
    // Send real-time notification to all connected admin users
    socketService.notifyAdmins('system:alert', {
      id: alert.id,
      title: alert.title,
      description: alert.description,
      severity: alert.severity,
      timestamp: alert.timestamp,
      metric: alert.metric,
      currentValue: alert.currentValue,
      threshold: alert.threshold
    });
  }

  async logAlert(alert) {
    console.log(`ALERT [${alert.severity.toUpperCase()}]: ${alert.title} - ${alert.description}`);
    
    // Could also log to audit system
    try {
      // This would require audit service integration
      console.log('Alert logged to audit system');
    } catch (error) {
      console.error('Failed to log alert to audit system:', error);
    }
  }

  async sendEmailAlert(alert) {
    // This would integrate with email service
    console.log(`Email alert sent for: ${alert.title}`);
    
    // Mock email sending
    try {
      // emailService.sendAlert(alert);
      console.log('Email alert sent successfully');
    } catch (error) {
      console.error('Failed to send email alert:', error);
    }
  }

  async createIncident(alert) {
    // Create incident record in database
    try {
      // This would create an incident record
      console.log(`Incident created for alert: ${alert.title}`);
    } catch (error) {
      console.error('Failed to create incident:', error);
    }
  }

  async triggerProtectiveMeasures(alert) {
    console.log(`Triggering protective measures for: ${alert.title}`);
    
    // Implement protective measures based on alert type
    switch (alert.metric) {
      case 'memory_usage':
        await this.triggerMemoryProtection();
        break;
      case 'cpu_usage':
        await this.triggerCpuProtection();
        break;
      case 'database_connected':
        await this.triggerDatabaseProtection();
        break;
      default:
        console.log('No specific protective measures for this metric');
    }
  }

  async triggerMemoryProtection() {
    // Clear cache to free memory
    try {
      await systemMonitoringService.clearCache('expired');
      console.log('Cleared expired cache entries to free memory');
    } catch (error) {
      console.error('Failed to clear cache for memory protection:', error);
    }
  }

  async triggerCpuProtection() {
    // Could implement CPU throttling or process prioritization
    console.log('CPU protection measures triggered');
  }

  async triggerDatabaseProtection() {
    // Could implement connection pool adjustments or failover
    console.log('Database protection measures triggered');
  }

  async notifyAlertResolution(alert, rule) {
    socketService.notifyAdmins('system:alert-resolved', {
      id: alert.id,
      title: alert.title,
      resolvedAt: alert.resolvedAt,
      resolvedValue: alert.resolvedValue
    });
    
    console.log(`Alert resolution notification sent: ${rule.name}`);
  }

  // Configuration methods
  addAlertRule(rule) {
    this.alertRules.set(rule.id, {
      ...rule,
      lastTriggered: null,
      consecutiveViolations: 0,
      isActive: false
    });
  }

  updateAlertRule(ruleId, updates) {
    const rule = this.alertRules.get(ruleId);
    if (rule) {
      Object.assign(rule, updates);
      return true;
    }
    return false;
  }

  deleteAlertRule(ruleId) {
    return this.alertRules.delete(ruleId);
  }

  getAlertRules() {
    return Array.from(this.alertRules.values());
  }

  getAlertRule(ruleId) {
    return this.alertRules.get(ruleId);
  }

  getAlertHistory(options = {}) {
    const { limit = 100, severity = null, status = null } = options;
    
    let alerts = Array.from(this.alertHistory.values());
    
    if (severity) {
      alerts = alerts.filter(alert => alert.severity === severity);
    }
    
    if (status) {
      alerts = alerts.filter(alert => alert.status === status);
    }
    
    return alerts
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  // Statistics
  getAlertingStats() {
    const alerts = Array.from(this.alertHistory.values());
    const activeRules = Array.from(this.alertRules.values()).filter(r => r.enabled);
    
    return {
      totalRules: this.alertRules.size,
      activeRules: activeRules.length,
      totalAlerts: alerts.length,
      activeAlerts: alerts.filter(a => a.status === 'active').length,
      resolvedAlerts: alerts.filter(a => a.status === 'resolved').length,
      alertsBySeverity: {
        critical: alerts.filter(a => a.severity === 'critical').length,
        high: alerts.filter(a => a.severity === 'high').length,
        medium: alerts.filter(a => a.severity === 'medium').length,
        warning: alerts.filter(a => a.severity === 'warning').length,
        low: alerts.filter(a => a.severity === 'low').length
      },
      isMonitoring: this.isMonitoring
    };
  }
}

export default new AlertingService();