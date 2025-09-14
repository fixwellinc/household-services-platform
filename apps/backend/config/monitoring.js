const winston = require('winston');
const { createPrometheusMetrics } = require('prom-client');

// Production monitoring configuration for flexible payment options
class MonitoringConfig {
  constructor() {
    this.initializeLogger();
    this.initializeMetrics();
    this.initializeAlerts();
  }

  initializeLogger() {
    // Production logging configuration
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: { service: 'fixwell-payment-system' },
      transports: [
        // Error log file
        new winston.transports.File({ 
          filename: process.env.ERROR_LOG_FILE || '/var/log/fixwell/error.log', 
          level: 'error',
          maxsize: 5242880, // 5MB
          maxFiles: 5
        }),
        // Combined log file
        new winston.transports.File({ 
          filename: process.env.LOG_FILE || '/var/log/fixwell/app.log',
          maxsize: 5242880, // 5MB
          maxFiles: 10
        })
      ]
    });

    // Add console logging for development
    if (process.env.NODE_ENV !== 'production') {
      this.logger.add(new winston.transports.Console({
        format: winston.format.simple()
      }));
    }
  }

  initializeMetrics() {
    // Prometheus metrics for monitoring
    this.metrics = {
      // Payment processing metrics
      paymentAttempts: new (require('prom-client')).Counter({
        name: 'payment_attempts_total',
        help: 'Total number of payment attempts',
        labelNames: ['frequency', 'status', 'plan_tier']
      }),

      paymentFailures: new (require('prom-client')).Counter({
        name: 'payment_failures_total',
        help: 'Total number of payment failures',
        labelNames: ['reason', 'plan_tier', 'retry_attempt']
      }),

      subscriptionPauses: new (require('prom-client')).Counter({
        name: 'subscription_pauses_total',
        help: 'Total number of subscription pauses',
        labelNames: ['reason', 'plan_tier']
      }),

      subscriptionResumes: new (require('prom-client')).Counter({
        name: 'subscription_resumes_total',
        help: 'Total number of subscription resumes',
        labelNames: ['plan_tier', 'pause_duration']
      }),

      // Revenue metrics
      monthlyRecurringRevenue: new (require('prom-client')).Gauge({
        name: 'monthly_recurring_revenue',
        help: 'Current monthly recurring revenue',
        labelNames: ['plan_tier', 'payment_frequency']
      }),

      churnRate: new (require('prom-client')).Gauge({
        name: 'churn_rate',
        help: 'Current churn rate',
        labelNames: ['plan_tier', 'time_period']
      }),

      // System performance metrics
      apiResponseTime: new (require('prom-client')).Histogram({
        name: 'api_response_time_seconds',
        help: 'API response time in seconds',
        labelNames: ['endpoint', 'method', 'status_code'],
        buckets: [0.1, 0.5, 1, 2, 5]
      }),

      databaseQueryTime: new (require('prom-client')).Histogram({
        name: 'database_query_time_seconds',
        help: 'Database query time in seconds',
        labelNames: ['query_type', 'table'],
        buckets: [0.01, 0.05, 0.1, 0.5, 1]
      }),

      // Business metrics
      rewardCreditsIssued: new (require('prom-client')).Counter({
        name: 'reward_credits_issued_total',
        help: 'Total reward credits issued',
        labelNames: ['credit_type', 'amount_range']
      }),

      additionalPropertiesAdded: new (require('prom-client')).Counter({
        name: 'additional_properties_added_total',
        help: 'Total additional properties added',
        labelNames: ['plan_tier']
      }),

      // Alert thresholds
      highChurnRiskCustomers: new (require('prom-client')).Gauge({
        name: 'high_churn_risk_customers',
        help: 'Number of customers with high churn risk',
        labelNames: ['risk_level', 'plan_tier']
      })
    };
  }

  initializeAlerts() {
    // Alert configuration for critical metrics
    this.alertThresholds = {
      // Payment failure rate > 5%
      paymentFailureRate: 0.05,
      
      // Churn rate > 10%
      churnRate: 0.10,
      
      // API response time > 2 seconds
      apiResponseTime: 2.0,
      
      // Database query time > 1 second
      databaseQueryTime: 1.0,
      
      // High churn risk customers > 50
      highChurnRiskCustomers: 50,
      
      // Subscription pause rate > 15%
      subscriptionPauseRate: 0.15
    };

    // Alert channels configuration
    this.alertChannels = {
      email: process.env.ALERT_EMAIL || 'alerts@fixwell.com',
      slack: process.env.SLACK_WEBHOOK_URL,
      pagerduty: process.env.PAGERDUTY_INTEGRATION_KEY,
      sms: process.env.ALERT_PHONE_NUMBER
    };
  }

  // Log payment events
  logPaymentEvent(event, data) {
    this.logger.info('Payment event', {
      event,
      subscriptionId: data.subscriptionId,
      amount: data.amount,
      frequency: data.frequency,
      status: data.status,
      timestamp: new Date().toISOString()
    });

    // Update metrics
    this.metrics.paymentAttempts.inc({
      frequency: data.frequency,
      status: data.status,
      plan_tier: data.planTier
    });

    if (data.status === 'failed') {
      this.metrics.paymentFailures.inc({
        reason: data.failureReason,
        plan_tier: data.planTier,
        retry_attempt: data.retryAttempt || 1
      });
    }
  }

  // Log subscription pause events
  logSubscriptionPause(subscriptionId, reason, planTier) {
    this.logger.warn('Subscription paused', {
      subscriptionId,
      reason,
      planTier,
      timestamp: new Date().toISOString()
    });

    this.metrics.subscriptionPauses.inc({
      reason,
      plan_tier: planTier
    });
  }

  // Log subscription resume events
  logSubscriptionResume(subscriptionId, planTier, pauseDuration) {
    this.logger.info('Subscription resumed', {
      subscriptionId,
      planTier,
      pauseDuration,
      timestamp: new Date().toISOString()
    });

    this.metrics.subscriptionResumes.inc({
      plan_tier: planTier,
      pause_duration: pauseDuration
    });
  }

  // Log critical errors
  logCriticalError(error, context) {
    this.logger.error('Critical error', {
      error: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString()
    });

    // Send immediate alert for critical errors
    this.sendAlert('critical_error', {
      message: error.message,
      context,
      timestamp: new Date().toISOString()
    });
  }

  // Update revenue metrics
  updateRevenueMetrics(mrr, planTier, paymentFrequency) {
    this.metrics.monthlyRecurringRevenue.set(
      { plan_tier: planTier, payment_frequency: paymentFrequency },
      mrr
    );
  }

  // Update churn metrics
  updateChurnMetrics(churnRate, planTier, timePeriod) {
    this.metrics.churnRate.set(
      { plan_tier: planTier, time_period: timePeriod },
      churnRate
    );

    // Alert if churn rate exceeds threshold
    if (churnRate > this.alertThresholds.churnRate) {
      this.sendAlert('high_churn_rate', {
        churnRate,
        planTier,
        timePeriod,
        threshold: this.alertThresholds.churnRate
      });
    }
  }

  // Send alerts
  async sendAlert(alertType, data) {
    const alertMessage = this.formatAlertMessage(alertType, data);
    
    try {
      // Send email alert
      if (this.alertChannels.email) {
        await this.sendEmailAlert(alertMessage);
      }

      // Send Slack alert
      if (this.alertChannels.slack) {
        await this.sendSlackAlert(alertMessage);
      }

      // Send SMS for critical alerts
      if (alertType === 'critical_error' && this.alertChannels.sms) {
        await this.sendSMSAlert(alertMessage);
      }

      this.logger.info('Alert sent', { alertType, channels: Object.keys(this.alertChannels) });
    } catch (error) {
      this.logger.error('Failed to send alert', { error: error.message, alertType });
    }
  }

  formatAlertMessage(alertType, data) {
    const messages = {
      critical_error: `🚨 CRITICAL ERROR: ${data.message}\nContext: ${JSON.stringify(data.context)}`,
      high_churn_rate: `⚠️ HIGH CHURN RATE: ${(data.churnRate * 100).toFixed(2)}% for ${data.planTier} (threshold: ${(data.threshold * 100).toFixed(2)}%)`,
      payment_failure_spike: `💳 PAYMENT FAILURE SPIKE: ${data.failureRate}% failure rate detected`,
      subscription_pause_spike: `⏸️ SUBSCRIPTION PAUSE SPIKE: ${data.pauseRate}% pause rate detected`,
      high_api_latency: `🐌 HIGH API LATENCY: ${data.responseTime}s average response time`
    };

    return messages[alertType] || `Alert: ${alertType} - ${JSON.stringify(data)}`;
  }

  async sendEmailAlert(message) {
    // Implementation would depend on your email service
    // This is a placeholder for the actual email sending logic
    console.log('Email alert:', message);
  }

  async sendSlackAlert(message) {
    // Implementation would depend on your Slack integration
    // This is a placeholder for the actual Slack webhook logic
    console.log('Slack alert:', message);
  }

  async sendSMSAlert(message) {
    // Implementation would depend on your SMS service (Twilio)
    // This is a placeholder for the actual SMS sending logic
    console.log('SMS alert:', message);
  }

  // Health check endpoint data
  getHealthMetrics() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || '1.0.0'
    };
  }

  // Export metrics for Prometheus scraping
  getMetrics() {
    return require('prom-client').register.metrics();
  }
}

module.exports = new MonitoringConfig();