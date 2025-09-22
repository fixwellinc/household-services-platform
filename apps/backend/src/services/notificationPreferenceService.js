import prisma from '../config/database.js';
import winston from 'winston';

// Configure notification preference logger
const notificationLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'notification-preferences' },
  transports: [
    new winston.transports.File({ filename: 'logs/notifications.log' }),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  notificationLogger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

class NotificationPreferenceService {
  /**
   * Get notification preferences for a user
   * @param {string} userId - The user ID
   * @returns {Promise<Object>} The user's notification preferences
   */
  async getUserPreferences(userId) {
    try {
      let preferences = await prisma.notificationPreference.findUnique({
        where: { userId }
      });

      // Create default preferences if none exist
      if (!preferences) {
        preferences = await this.createDefaultPreferences(userId);
      }

      return preferences;
    } catch (error) {
      notificationLogger.error('Error getting user preferences', {
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Create default notification preferences for a user
   * @param {string} userId - The user ID
   * @returns {Promise<Object>} The created preferences
   */
  async createDefaultPreferences(userId) {
    try {
      const preferences = await prisma.notificationPreference.create({
        data: {
          userId,
          emailEnabled: true,
          smsEnabled: false,
          pushEnabled: true,
          appointmentConfirmation: true,
          appointmentReminder: true,
          appointmentCancellation: true,
          appointmentReschedule: true,
          appointmentStatusChange: true,
          newBookingAlert: true,
          urgentAppointmentAlert: true,
          dailyAppointmentSummary: true,
          reminderHoursBefore: 24,
          maxRetryAttempts: 3,
          retryIntervalMinutes: 30
        }
      });

      notificationLogger.info('Created default preferences', {
        userId,
        preferencesId: preferences.id
      });

      return preferences;
    } catch (error) {
      notificationLogger.error('Error creating default preferences', {
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Update notification preferences for a user
   * @param {string} userId - The user ID
   * @param {Object} updates - The preference updates
   * @returns {Promise<Object>} The updated preferences
   */
  async updateUserPreferences(userId, updates) {
    try {
      // Validate updates
      this._validatePreferenceUpdates(updates);

      const preferences = await prisma.notificationPreference.upsert({
        where: { userId },
        update: {
          ...updates,
          updatedAt: new Date()
        },
        create: {
          userId,
          ...updates,
          // Fill in defaults for any missing fields
          emailEnabled: updates.emailEnabled ?? true,
          smsEnabled: updates.smsEnabled ?? false,
          pushEnabled: updates.pushEnabled ?? true,
          appointmentConfirmation: updates.appointmentConfirmation ?? true,
          appointmentReminder: updates.appointmentReminder ?? true,
          appointmentCancellation: updates.appointmentCancellation ?? true,
          appointmentReschedule: updates.appointmentReschedule ?? true,
          appointmentStatusChange: updates.appointmentStatusChange ?? true,
          newBookingAlert: updates.newBookingAlert ?? true,
          urgentAppointmentAlert: updates.urgentAppointmentAlert ?? true,
          dailyAppointmentSummary: updates.dailyAppointmentSummary ?? true,
          reminderHoursBefore: updates.reminderHoursBefore ?? 24,
          maxRetryAttempts: updates.maxRetryAttempts ?? 3,
          retryIntervalMinutes: updates.retryIntervalMinutes ?? 30
        }
      });

      notificationLogger.info('Updated user preferences', {
        userId,
        preferencesId: preferences.id,
        updates: Object.keys(updates)
      });

      return preferences;
    } catch (error) {
      notificationLogger.error('Error updating user preferences', {
        userId,
        updates,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get admin notification preferences
   * @returns {Promise<Array>} Array of admin users with their preferences
   */
  async getAdminPreferences() {
    try {
      const adminUsers = await prisma.user.findMany({
        where: { role: 'ADMIN' },
        include: {
          notificationPreferences: true
        }
      });

      // Create default preferences for admins who don't have them
      const adminsWithPreferences = await Promise.all(
        adminUsers.map(async (admin) => {
          if (!admin.notificationPreferences) {
            const preferences = await this.createDefaultPreferences(admin.id);
            return { ...admin, notificationPreferences: preferences };
          }
          return admin;
        })
      );

      return adminsWithPreferences;
    } catch (error) {
      notificationLogger.error('Error getting admin preferences', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Check if a user should receive a specific type of notification
   * @param {string} userId - The user ID
   * @param {string} notificationType - The notification type
   * @param {string} channel - The notification channel (email, sms, push)
   * @returns {Promise<boolean>} Whether the user should receive the notification
   */
  async shouldReceiveNotification(userId, notificationType, channel) {
    try {
      const preferences = await this.getUserPreferences(userId);

      // Check if the channel is enabled
      const channelEnabled = this._isChannelEnabled(preferences, channel);
      if (!channelEnabled) {
        return false;
      }

      // Check if the specific notification type is enabled
      const typeEnabled = this._isNotificationTypeEnabled(preferences, notificationType);
      
      return typeEnabled;
    } catch (error) {
      notificationLogger.error('Error checking notification permission', {
        userId,
        notificationType,
        channel,
        error: error.message
      });
      // Default to allowing notifications if there's an error
      return true;
    }
  }

  /**
   * Get users who should receive admin notifications
   * @param {string} notificationType - The notification type
   * @returns {Promise<Array>} Array of admin users who should receive the notification
   */
  async getAdminNotificationRecipients(notificationType) {
    try {
      const adminPreferences = await this.getAdminPreferences();

      return adminPreferences.filter(admin => {
        const preferences = admin.notificationPreferences;
        return this._isNotificationTypeEnabled(preferences, notificationType);
      });
    } catch (error) {
      notificationLogger.error('Error getting admin notification recipients', {
        notificationType,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get notification delivery settings for a user
   * @param {string} userId - The user ID
   * @returns {Promise<Object>} Delivery settings
   */
  async getDeliverySettings(userId) {
    try {
      const preferences = await this.getUserPreferences(userId);

      return {
        reminderHoursBefore: preferences.reminderHoursBefore,
        maxRetryAttempts: preferences.maxRetryAttempts,
        retryIntervalMinutes: preferences.retryIntervalMinutes,
        enabledChannels: {
          email: preferences.emailEnabled,
          sms: preferences.smsEnabled,
          push: preferences.pushEnabled
        }
      };
    } catch (error) {
      notificationLogger.error('Error getting delivery settings', {
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Bulk update preferences for multiple users
   * @param {Array} userUpdates - Array of {userId, updates} objects
   * @returns {Promise<Array>} Array of updated preferences
   */
  async bulkUpdatePreferences(userUpdates) {
    try {
      const results = await Promise.all(
        userUpdates.map(({ userId, updates }) =>
          this.updateUserPreferences(userId, updates)
        )
      );

      notificationLogger.info('Bulk updated preferences', {
        userCount: userUpdates.length
      });

      return results;
    } catch (error) {
      notificationLogger.error('Error bulk updating preferences', {
        userCount: userUpdates.length,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get notification statistics
   * @returns {Promise<Object>} Notification preference statistics
   */
  async getNotificationStats() {
    try {
      const [
        totalUsers,
        emailEnabledCount,
        smsEnabledCount,
        pushEnabledCount,
        appointmentReminderEnabledCount
      ] = await Promise.all([
        prisma.notificationPreference.count(),
        prisma.notificationPreference.count({ where: { emailEnabled: true } }),
        prisma.notificationPreference.count({ where: { smsEnabled: true } }),
        prisma.notificationPreference.count({ where: { pushEnabled: true } }),
        prisma.notificationPreference.count({ where: { appointmentReminder: true } })
      ]);

      return {
        totalUsers,
        channelStats: {
          email: {
            enabled: emailEnabledCount,
            percentage: totalUsers > 0 ? (emailEnabledCount / totalUsers) * 100 : 0
          },
          sms: {
            enabled: smsEnabledCount,
            percentage: totalUsers > 0 ? (smsEnabledCount / totalUsers) * 100 : 0
          },
          push: {
            enabled: pushEnabledCount,
            percentage: totalUsers > 0 ? (pushEnabledCount / totalUsers) * 100 : 0
          }
        },
        appointmentReminders: {
          enabled: appointmentReminderEnabledCount,
          percentage: totalUsers > 0 ? (appointmentReminderEnabledCount / totalUsers) * 100 : 0
        }
      };
    } catch (error) {
      notificationLogger.error('Error getting notification stats', {
        error: error.message
      });
      throw error;
    }
  }

  // Private helper methods

  /**
   * Validate preference updates
   * @param {Object} updates - The preference updates to validate
   */
  _validatePreferenceUpdates(updates) {
    const validBooleanFields = [
      'emailEnabled', 'smsEnabled', 'pushEnabled',
      'appointmentConfirmation', 'appointmentReminder', 'appointmentCancellation',
      'appointmentReschedule', 'appointmentStatusChange', 'newBookingAlert',
      'urgentAppointmentAlert', 'dailyAppointmentSummary'
    ];

    const validNumberFields = [
      'reminderHoursBefore', 'maxRetryAttempts', 'retryIntervalMinutes'
    ];

    for (const [key, value] of Object.entries(updates)) {
      if (validBooleanFields.includes(key)) {
        if (typeof value !== 'boolean') {
          throw new Error(`${key} must be a boolean value`);
        }
      } else if (validNumberFields.includes(key)) {
        if (typeof value !== 'number' || value < 0) {
          throw new Error(`${key} must be a non-negative number`);
        }
      } else if (key !== 'updatedAt') {
        throw new Error(`Invalid preference field: ${key}`);
      }
    }

    // Validate specific number ranges
    if (updates.reminderHoursBefore !== undefined) {
      if (updates.reminderHoursBefore < 1 || updates.reminderHoursBefore > 168) {
        throw new Error('reminderHoursBefore must be between 1 and 168 hours');
      }
    }

    if (updates.maxRetryAttempts !== undefined) {
      if (updates.maxRetryAttempts < 0 || updates.maxRetryAttempts > 10) {
        throw new Error('maxRetryAttempts must be between 0 and 10');
      }
    }

    if (updates.retryIntervalMinutes !== undefined) {
      if (updates.retryIntervalMinutes < 1 || updates.retryIntervalMinutes > 1440) {
        throw new Error('retryIntervalMinutes must be between 1 and 1440 minutes');
      }
    }
  }

  /**
   * Check if a notification channel is enabled for a user
   * @param {Object} preferences - User preferences
   * @param {string} channel - Notification channel
   * @returns {boolean} Whether the channel is enabled
   */
  _isChannelEnabled(preferences, channel) {
    switch (channel.toLowerCase()) {
      case 'email':
        return preferences.emailEnabled;
      case 'sms':
        return preferences.smsEnabled;
      case 'push':
        return preferences.pushEnabled;
      default:
        return false;
    }
  }

  /**
   * Check if a notification type is enabled for a user
   * @param {Object} preferences - User preferences
   * @param {string} notificationType - Notification type
   * @returns {boolean} Whether the notification type is enabled
   */
  _isNotificationTypeEnabled(preferences, notificationType) {
    switch (notificationType) {
      case 'appointment_confirmation':
        return preferences.appointmentConfirmation;
      case 'appointment_reminder':
        return preferences.appointmentReminder;
      case 'appointment_cancellation':
        return preferences.appointmentCancellation;
      case 'appointment_reschedule':
        return preferences.appointmentReschedule;
      case 'appointment_status_change':
        return preferences.appointmentStatusChange;
      case 'new_booking_alert':
        return preferences.newBookingAlert;
      case 'urgent_appointment_alert':
        return preferences.urgentAppointmentAlert;
      case 'daily_appointment_summary':
        return preferences.dailyAppointmentSummary;
      default:
        return true; // Default to enabled for unknown types
    }
  }
}

export default new NotificationPreferenceService();