import prisma from '../config/database.js';
import notificationPreferenceService from './notificationPreferenceService.js';
import appointmentNotificationService from './appointmentNotificationService.js';
import smsService from './sms.js';
import winston from 'winston';

// Configure notification delivery logger
const deliveryLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'notification-delivery' },
  transports: [
    new winston.transports.File({ filename: 'logs/notifications.log' }),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  deliveryLogger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

class NotificationDeliveryService {
  constructor() {
    this.retryQueue = new Map(); // In-memory retry queue
    this.isProcessingRetries = false;
  }

  /**
   * Send a notification to a user
   * @param {Object} notificationData - Notification data
   * @returns {Promise<Object>} Delivery record
   */
  async sendNotification(notificationData) {
    try {
      const {
        userId,
        appointmentId,
        type, // email, sms, push
        channel, // appointment_confirmation, appointment_reminder, etc.
        recipient,
        subject,
        content,
        metadata = {}
      } = notificationData;

      // Validate required fields
      this._validateNotificationData(notificationData);

      // Check if user should receive this notification
      const shouldReceive = await notificationPreferenceService.shouldReceiveNotification(
        userId,
        channel,
        type
      );

      if (!shouldReceive) {
        deliveryLogger.info('Notification skipped due to user preferences', {
          userId,
          channel,
          type
        });
        return null;
      }

      // Get delivery settings
      const deliverySettings = await notificationPreferenceService.getDeliverySettings(userId);

      // Create delivery record
      const delivery = await prisma.notificationDelivery.create({
        data: {
          userId,
          appointmentId,
          type,
          channel,
          recipient,
          subject,
          content,
          status: 'PENDING',
          attempts: 0,
          maxAttempts: deliverySettings.maxRetryAttempts,
          metadata
        }
      });

      // Attempt to send the notification
      await this._attemptDelivery(delivery);

      return delivery;
    } catch (error) {
      deliveryLogger.error('Error sending notification', {
        notificationData,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Send appointment notification with fallback channels
   * @param {Object} appointmentData - Appointment data
   * @param {string} notificationType - Type of notification
   * @param {Object} templateData - Template data for rendering
   * @returns {Promise<Array>} Array of delivery records
   */
  async sendAppointmentNotification(appointmentData, notificationType, templateData = {}) {
    try {
      const { customerId, customerEmail, customerPhone } = appointmentData;

      // Get user preferences
      const preferences = await notificationPreferenceService.getUserPreferences(customerId);
      const deliveries = [];

      // Prepare template data
      const mergedTemplateData = {
        ...templateData,
        appointment: appointmentData,
        customerName: appointmentData.customerName,
        serviceType: appointmentData.serviceType,
        scheduledDate: appointmentData.scheduledDate,
        propertyAddress: appointmentData.propertyAddress
      };

      // Try email first if enabled
      if (preferences.emailEnabled && customerEmail) {
        try {
          const emailContent = await this._renderTemplate(notificationType, 'email', mergedTemplateData);
          const emailDelivery = await this.sendNotification({
            userId: customerId,
            appointmentId: appointmentData.id,
            type: 'email',
            channel: notificationType,
            recipient: customerEmail,
            subject: emailContent.subject,
            content: emailContent.content,
            metadata: mergedTemplateData
          });
          if (emailDelivery) deliveries.push(emailDelivery);
        } catch (error) {
          deliveryLogger.warn('Email notification failed, trying fallback', {
            userId: customerId,
            error: error.message
          });
        }
      }

      // Try SMS as fallback if email failed or is disabled
      if (preferences.smsEnabled && customerPhone && deliveries.length === 0) {
        try {
          const smsContent = await this._renderTemplate(notificationType, 'sms', mergedTemplateData);
          const smsDelivery = await this.sendNotification({
            userId: customerId,
            appointmentId: appointmentData.id,
            type: 'sms',
            channel: notificationType,
            recipient: customerPhone,
            content: smsContent.content,
            metadata: mergedTemplateData
          });
          if (smsDelivery) deliveries.push(smsDelivery);
        } catch (error) {
          deliveryLogger.warn('SMS notification failed', {
            userId: customerId,
            error: error.message
          });
        }
      }

      // Try push notification as final fallback
      if (preferences.pushEnabled && deliveries.length === 0) {
        try {
          const pushContent = await this._renderTemplate(notificationType, 'push', mergedTemplateData);
          const pushDelivery = await this.sendNotification({
            userId: customerId,
            appointmentId: appointmentData.id,
            type: 'push',
            channel: notificationType,
            recipient: customerId, // User ID for push notifications
            subject: pushContent.subject,
            content: pushContent.content,
            metadata: mergedTemplateData
          });
          if (pushDelivery) deliveries.push(pushDelivery);
        } catch (error) {
          deliveryLogger.warn('Push notification failed', {
            userId: customerId,
            error: error.message
          });
        }
      }

      return deliveries;
    } catch (error) {
      deliveryLogger.error('Error sending appointment notification', {
        appointmentId: appointmentData.id,
        notificationType,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Send admin notification to all eligible admins
   * @param {string} notificationType - Type of notification
   * @param {Object} data - Notification data
   * @returns {Promise<Array>} Array of delivery records
   */
  async sendAdminNotification(notificationType, data) {
    try {
      const adminRecipients = await notificationPreferenceService.getAdminNotificationRecipients(notificationType);
      const deliveries = [];

      for (const admin of adminRecipients) {
        const preferences = admin.notificationPreferences;
        
        // Try email first for admins
        if (preferences.emailEnabled && admin.email) {
          try {
            const emailContent = await this._renderTemplate(notificationType, 'email', {
              ...data,
              adminName: admin.name,
              adminEmail: admin.email
            });

            const delivery = await this.sendNotification({
              userId: admin.id,
              type: 'email',
              channel: notificationType,
              recipient: admin.email,
              subject: emailContent.subject,
              content: emailContent.content,
              metadata: data
            });

            if (delivery) deliveries.push(delivery);
          } catch (error) {
            deliveryLogger.warn('Admin email notification failed', {
              adminId: admin.id,
              error: error.message
            });
          }
        }

        // Try SMS if email failed and SMS is enabled
        if (preferences.smsEnabled && admin.phone && !deliveries.some(d => d.userId === admin.id)) {
          try {
            const smsContent = await this._renderTemplate(notificationType, 'sms', {
              ...data,
              adminName: admin.name
            });

            const delivery = await this.sendNotification({
              userId: admin.id,
              type: 'sms',
              channel: notificationType,
              recipient: admin.phone,
              content: smsContent.content,
              metadata: data
            });

            if (delivery) deliveries.push(delivery);
          } catch (error) {
            deliveryLogger.warn('Admin SMS notification failed', {
              adminId: admin.id,
              error: error.message
            });
          }
        }
      }

      return deliveries;
    } catch (error) {
      deliveryLogger.error('Error sending admin notification', {
        notificationType,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Retry failed notifications
   * @returns {Promise<number>} Number of notifications retried
   */
  async retryFailedNotifications() {
    if (this.isProcessingRetries) {
      deliveryLogger.info('Retry process already running, skipping');
      return 0;
    }

    this.isProcessingRetries = true;
    let retriedCount = 0;

    try {
      // Get failed notifications that are eligible for retry
      const failedDeliveries = await prisma.notificationDelivery.findMany({
        where: {
          status: 'FAILED',
          OR: [
            { lastAttemptAt: null },
            {
              lastAttemptAt: {
                lt: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
              }
            }
          ]
        },
        take: 50 // Limit batch size
      });

      for (const delivery of failedDeliveries) {
        try {
          // Only retry if attempts < maxAttempts
          if (delivery.attempts < delivery.maxAttempts) {
            await this._attemptDelivery(delivery);
            retriedCount++;
          }
        } catch (error) {
          deliveryLogger.warn('Retry attempt failed', {
            deliveryId: delivery.id,
            error: error.message
          });
        }
      }

      deliveryLogger.info('Completed retry process', { retriedCount });
      return retriedCount;
    } catch (error) {
      deliveryLogger.error('Error in retry process', {
        error: error.message
      });
      throw error;
    } finally {
      this.isProcessingRetries = false;
    }
  }

  /**
   * Get delivery statistics
   * @param {Object} filters - Optional filters
   * @returns {Promise<Object>} Delivery statistics
   */
  async getDeliveryStats(filters = {}) {
    try {
      const { startDate, endDate, type, channel } = filters;
      
      const where = {};
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) where.createdAt.lte = new Date(endDate);
      }
      if (type) where.type = type;
      if (channel) where.channel = channel;

      const [
        totalDeliveries,
        sentDeliveries,
        failedDeliveries,
        pendingDeliveries,
        retryDeliveries
      ] = await Promise.all([
        prisma.notificationDelivery.count({ where }),
        prisma.notificationDelivery.count({ where: { ...where, status: 'SENT' } }),
        prisma.notificationDelivery.count({ where: { ...where, status: 'FAILED' } }),
        prisma.notificationDelivery.count({ where: { ...where, status: 'PENDING' } }),
        prisma.notificationDelivery.count({ where: { ...where, status: 'RETRY' } })
      ]);

      return {
        total: totalDeliveries,
        sent: sentDeliveries,
        failed: failedDeliveries,
        pending: pendingDeliveries,
        retry: retryDeliveries,
        successRate: totalDeliveries > 0 ? (sentDeliveries / totalDeliveries) * 100 : 0,
        failureRate: totalDeliveries > 0 ? (failedDeliveries / totalDeliveries) * 100 : 0
      };
    } catch (error) {
      deliveryLogger.error('Error getting delivery stats', {
        filters,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get delivery history for a user
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Delivery history with pagination
   */
  async getUserDeliveryHistory(userId, options = {}) {
    try {
      const { page = 1, limit = 20, type, channel, status } = options;
      
      const where = { userId };
      if (type) where.type = type;
      if (channel) where.channel = channel;
      if (status) where.status = status;

      const skip = (page - 1) * limit;

      const [deliveries, totalCount] = await Promise.all([
        prisma.notificationDelivery.findMany({
          where,
          include: {
            appointment: {
              select: {
                id: true,
                serviceType: true,
                scheduledDate: true,
                status: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit
        }),
        prisma.notificationDelivery.count({ where })
      ]);

      return {
        deliveries,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasNext: page * limit < totalCount,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      deliveryLogger.error('Error getting user delivery history', {
        userId,
        options,
        error: error.message
      });
      throw error;
    }
  }

  // Private helper methods

  /**
   * Attempt to deliver a notification
   * @param {Object} delivery - Delivery record
   */
  async _attemptDelivery(delivery) {
    try {
      let success = false;
      let failureReason = null;

      // Update attempt count and timestamp
      await prisma.notificationDelivery.update({
        where: { id: delivery.id },
        data: {
          attempts: delivery.attempts + 1,
          lastAttemptAt: new Date(),
          status: 'RETRY'
        }
      });

      // Attempt delivery based on type
      switch (delivery.type.toLowerCase()) {
        case 'email':
          success = await this._sendEmail(delivery);
          break;
        case 'sms':
          success = await this._sendSMS(delivery);
          break;
        case 'push':
          success = await this._sendPush(delivery);
          break;
        default:
          throw new Error(`Unsupported notification type: ${delivery.type}`);
      }

      // Update delivery status
      const finalStatus = success ? 'SENT' : 'FAILED';
      const updateData = {
        status: finalStatus,
        updatedAt: new Date()
      };

      if (success) {
        updateData.sentAt = new Date();
      } else {
        updateData.failureReason = failureReason || 'Delivery failed';
      }

      await prisma.notificationDelivery.update({
        where: { id: delivery.id },
        data: updateData
      });

      deliveryLogger.info('Delivery attempt completed', {
        deliveryId: delivery.id,
        type: delivery.type,
        success,
        attempts: delivery.attempts + 1
      });

    } catch (error) {
      // Mark as failed
      await prisma.notificationDelivery.update({
        where: { id: delivery.id },
        data: {
          status: 'FAILED',
          failureReason: error.message,
          updatedAt: new Date()
        }
      });

      deliveryLogger.error('Delivery attempt failed', {
        deliveryId: delivery.id,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Send email notification
   * @param {Object} delivery - Delivery record
   * @returns {Promise<boolean>} Success status
   */
  async _sendEmail(delivery) {
    try {
      await appointmentNotificationService.sendEmail({
        to: delivery.recipient,
        subject: delivery.subject,
        html: delivery.content,
        metadata: delivery.metadata
      });
      return true;
    } catch (error) {
      deliveryLogger.error('Email delivery failed', {
        deliveryId: delivery.id,
        recipient: delivery.recipient,
        error: error.message
      });
      return false;
    }
  }

  /**
   * Send SMS notification
   * @param {Object} delivery - Delivery record
   * @returns {Promise<boolean>} Success status
   */
  async _sendSMS(delivery) {
    try {
      await smsService.sendSMS(delivery.recipient, delivery.content);
      return true;
    } catch (error) {
      deliveryLogger.error('SMS delivery failed', {
        deliveryId: delivery.id,
        recipient: delivery.recipient,
        error: error.message
      });
      return false;
    }
  }

  /**
   * Send push notification
   * @param {Object} delivery - Delivery record
   * @returns {Promise<boolean>} Success status
   */
  async _sendPush(delivery) {
    try {
      // TODO: Implement push notification service
      deliveryLogger.info('Push notification would be sent', {
        deliveryId: delivery.id,
        recipient: delivery.recipient
      });
      return true; // Mock success for now
    } catch (error) {
      deliveryLogger.error('Push delivery failed', {
        deliveryId: delivery.id,
        recipient: delivery.recipient,
        error: error.message
      });
      return false;
    }
  }

  /**
   * Render notification template
   * @param {string} channel - Notification channel
   * @param {string} type - Notification type
   * @param {Object} data - Template data
   * @returns {Promise<Object>} Rendered content
   */
  async _renderTemplate(channel, type, data) {
    try {
      // Get template from database
      const template = await prisma.notificationTemplate.findFirst({
        where: {
          channel,
          type,
          isActive: true
        }
      });

      if (!template) {
        // Use default template
        return this._getDefaultTemplate(channel, type, data);
      }

      // Render template with data
      const content = this._interpolateTemplate(template.content, data);
      const subject = template.subject ? this._interpolateTemplate(template.subject, data) : undefined;

      return { content, subject };
    } catch (error) {
      deliveryLogger.error('Template rendering failed', {
        channel,
        type,
        error: error.message
      });
      // Fallback to default template
      return this._getDefaultTemplate(channel, type, data);
    }
  }

  /**
   * Get default template for notification
   * @param {string} channel - Notification channel
   * @param {string} type - Notification type
   * @param {Object} data - Template data
   * @returns {Object} Default template content
   */
  _getDefaultTemplate(channel, type, data) {
    const templates = {
      appointment_confirmation: {
        email: {
          subject: 'Appointment Confirmation - {{serviceType}}',
          content: `
            <h2>Appointment Confirmed</h2>
            <p>Dear {{customerName}},</p>
            <p>Your appointment has been confirmed:</p>
            <ul>
              <li><strong>Service:</strong> {{serviceType}}</li>
              <li><strong>Date & Time:</strong> {{scheduledDate}}</li>
              <li><strong>Address:</strong> {{propertyAddress}}</li>
            </ul>
            <p>We look forward to serving you!</p>
          `
        },
        sms: {
          content: 'Appointment confirmed for {{serviceType}} on {{scheduledDate}} at {{propertyAddress}}. Thank you!'
        }
      },
      appointment_reminder: {
        email: {
          subject: 'Appointment Reminder - {{serviceType}}',
          content: `
            <h2>Appointment Reminder</h2>
            <p>Dear {{customerName}},</p>
            <p>This is a reminder of your upcoming appointment:</p>
            <ul>
              <li><strong>Service:</strong> {{serviceType}}</li>
              <li><strong>Date & Time:</strong> {{scheduledDate}}</li>
              <li><strong>Address:</strong> {{propertyAddress}}</li>
            </ul>
            <p>Please ensure someone is available at the scheduled time.</p>
          `
        },
        sms: {
          content: 'Reminder: {{serviceType}} appointment tomorrow at {{scheduledDate}}. Address: {{propertyAddress}}'
        }
      }
    };

    const template = templates[channel]?.[type] || {
      content: 'Notification: {{channel}} - {{type}}'
    };

    return {
      subject: template.subject ? this._interpolateTemplate(template.subject, data) : undefined,
      content: this._interpolateTemplate(template.content, data)
    };
  }

  /**
   * Interpolate template with data
   * @param {string} template - Template string
   * @param {Object} data - Data to interpolate
   * @returns {string} Interpolated string
   */
  _interpolateTemplate(template, data) {
    return template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, path) => {
      const value = this._getNestedValue(data, path);
      return value !== undefined ? String(value) : match;
    });
  }

  /**
   * Get nested value from object
   * @param {Object} obj - Object to search
   * @param {string} path - Dot-separated path
   * @returns {*} Value at path
   */
  _getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Validate notification data
   * @param {Object} data - Notification data to validate
   */
  _validateNotificationData(data) {
    const required = ['userId', 'type', 'channel', 'recipient', 'content'];
    
    for (const field of required) {
      if (!data[field]) {
        throw new Error(`${field} is required`);
      }
    }

    const validTypes = ['email', 'sms', 'push'];
    if (!validTypes.includes(data.type.toLowerCase())) {
      throw new Error(`Invalid notification type: ${data.type}`);
    }

    // Validate recipient format based on type
    if (data.type === 'email' && !this._isValidEmail(data.recipient)) {
      throw new Error('Invalid email address');
    }

    if (data.type === 'sms' && !this._isValidPhone(data.recipient)) {
      throw new Error('Invalid phone number');
    }
  }

  /**
   * Validate email address
   * @param {string} email - Email to validate
   * @returns {boolean} Is valid email
   */
  _isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate phone number
   * @param {string} phone - Phone to validate
   * @returns {boolean} Is valid phone
   */
  _isValidPhone(phone) {
    const phoneRegex = /^[\+]?[1-9][\d]{3,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  }
}

export default new NotificationDeliveryService();