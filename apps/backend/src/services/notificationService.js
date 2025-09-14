import smsService from './sms.js';
import emailService from './email.js';
import { config } from '../config/environment.js';

class NotificationService {
  constructor() {
    this.enableSMS = process.env.ENABLE_SMS_NOTIFICATIONS === 'true';
    this.enableEmail = config.features.emailNotifications;
    this.ownerPhone = process.env.OWNER_PHONE_NUMBER;
    this.managerPhones = process.env.MANAGER_PHONE_NUMBERS?.split(',') || [];
  }

  /**
   * Send notification when new chat is started
   */
  async notifyNewChat(chatData) {
    const { customerName, message, chatId, priority = 'NORMAL' } = chatData;
    
    const notifications = [];

    // SMS notifications
    if (this.enableSMS) {
      // Notify owner
      if (this.ownerPhone) {
        const smsResult = await smsService.sendChatNotification(
          this.ownerPhone,
          customerName,
          message,
          chatId
        );
        notifications.push({ type: 'sms', recipient: 'owner', ...smsResult });
      }

      // Notify managers
      for (const phone of this.managerPhones) {
        if (phone.trim()) {
          const smsResult = await smsService.sendChatNotification(
            phone.trim(),
            customerName,
            message,
            chatId
          );
          notifications.push({ type: 'sms', recipient: 'manager', phone, ...smsResult });
        }
      }

      // Send urgent notification for high priority
      if (priority === 'URGENT' || priority === 'HIGH') {
        const urgentPhones = [this.ownerPhone, ...this.managerPhones].filter(Boolean);
        for (const phone of urgentPhones) {
          const urgentResult = await smsService.sendUrgentNotification(
            phone,
            customerName,
            priority
          );
          notifications.push({ type: 'urgent_sms', recipient: 'all', phone, ...urgentResult });
        }
      }
    }

    // Email notifications
    if (this.enableEmail) {
      const emailData = {
        subject: `New Chat from ${customerName}`,
        html: `
          <h2>New Customer Chat</h2>
          <p><strong>Customer:</strong> ${customerName}</p>
          <p><strong>Message:</strong> ${message}</p>
          <p><strong>Priority:</strong> ${priority}</p>
          <p><strong>Chat ID:</strong> ${chatId}</p>
          <br>
          <a href="${process.env.FRONTEND_URL}/admin?tab=live-chat&chat=${chatId}" 
             style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            View Chat
          </a>
        `
      };

      // Send to owner email (if configured)
      if (config.smtp.user) {
        const emailResult = await emailService.sendEmail(
          config.smtp.user,
          emailData.subject,
          emailData.html
        );
        notifications.push({ type: 'email', recipient: 'owner', ...emailResult });
      }
    }

    return notifications;
  }

  /**
   * Send notification when chat is assigned
   */
  async notifyChatAssigned(chatData, assignedTo) {
    const { customerName, chatId, assignedAgentName } = chatData;
    
    const notifications = [];

    // Notify owner about assignment
    if (this.enableSMS && this.ownerPhone) {
      const body = `Chat from ${customerName} assigned to ${assignedAgentName}`;
      const smsResult = await smsService.sendChatNotification(
        this.ownerPhone,
        'System',
        body,
        chatId
      );
      notifications.push({ type: 'sms', recipient: 'owner', ...smsResult });
    }

    return notifications;
  }

  /**
   * Send notification for offline hours
   */
  async notifyOfflineHours() {
    if (!this.enableSMS) return [];

    const notifications = [];
    const body = "📱 Chat system is now in offline mode. Messages will be queued until business hours.";

    // Notify all managers
    const allPhones = [this.ownerPhone, ...this.managerPhones].filter(Boolean);
    
    for (const phone of allPhones) {
      const smsResult = await smsService.sendChatNotification(
        phone,
        'System',
        body,
        'offline'
      );
      notifications.push({ type: 'sms', recipient: 'all', phone, ...smsResult });
    }

    return notifications;
  }

  /**
   * Send notification for unassigned chats (after timeout)
   */
  async notifyUnassignedChat(chatData, timeoutMinutes = 5) {
    const { customerName, message, chatId, createdAt } = chatData;
    
    const notifications = [];

    if (this.enableSMS) {
      const body = `⚠️ Unassigned chat from ${customerName} (${timeoutMinutes}min old). Requires attention!`;
      
      // Notify owner and managers
      const allPhones = [this.ownerPhone, ...this.managerPhones].filter(Boolean);
      
      for (const phone of allPhones) {
        const smsResult = await smsService.sendChatNotification(
          phone,
          'System',
          body,
          chatId
        );
        notifications.push({ type: 'sms', recipient: 'all', phone, ...smsResult });
      }
    }

    return notifications;
  }

  /**
   * Send daily chat summary
   */
  async sendDailySummary(summaryData) {
    const { totalChats, resolvedChats, avgResponseTime, urgentChats } = summaryData;
    
    const notifications = [];

    if (this.enableSMS && this.ownerPhone) {
      const body = `📊 Daily Chat Summary:\n• Total: ${totalChats}\n• Resolved: ${resolvedChats}\n• Avg Response: ${avgResponseTime}min\n• Urgent: ${urgentChats}`;
      
      const smsResult = await smsService.sendChatNotification(
        this.ownerPhone,
        'System',
        body,
        'summary'
      );
      notifications.push({ type: 'sms', recipient: 'owner', ...smsResult });
    }

    return notifications;
  }

  /**
   * Test notification system
   */
  async testNotifications() {
    const testData = {
      customerName: 'Test Customer',
      message: 'This is a test message to verify notification system',
      chatId: 'test-123',
      priority: 'NORMAL'
    };

    const results = await this.notifyNewChat(testData);
    return results;
  }

  /**
   * Send subscription pause confirmation
   */
  async sendPauseConfirmation(email, customerName, pauseDetails) {
    const { startDate, endDate, reason, tier } = pauseDetails;
    
    if (!this.enableEmail) return { success: false, reason: 'Email notifications disabled' };

    const formatDate = (date) => new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const subject = `Subscription Paused - Fixwell Services`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Subscription Paused Successfully</h2>
        
        <p>Hi ${customerName},</p>
        
        <p>Your ${tier} subscription has been paused as requested.</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #495057;">Pause Details</h3>
          <p><strong>Pause Start:</strong> ${formatDate(startDate)}</p>
          <p><strong>Resume Date:</strong> ${formatDate(endDate)}</p>
          ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
        </div>
        
        <div style="background: #e7f3ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h4 style="margin-top: 0; color: #0066cc;">What happens during the pause:</h4>
          <ul style="margin: 10px 0;">
            <li>No billing will occur during the pause period</li>
            <li>Service scheduling will be suspended</li>
            <li>Your plan tier and pricing will be preserved</li>
            <li>Your subscription will automatically resume on ${formatDate(endDate)}</li>
          </ul>
        </div>
        
        <p>If you need to resume your subscription early or have any questions, please contact our support team.</p>
        
        <p>Thank you for choosing Fixwell Services!</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; color: #6c757d; font-size: 14px;">
          <p>This is an automated message. Please do not reply to this email.</p>
        </div>
      </div>
    `;

    try {
      const result = await emailService.sendEmail(email, subject, html);
      return { success: true, ...result };
    } catch (error) {
      console.error('Error sending pause confirmation:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send subscription resume confirmation
   */
  async sendResumeConfirmation(email, customerName, resumeDetails) {
    const { resumeDate, tier, pauseDuration } = resumeDetails;
    
    if (!this.enableEmail) return { success: false, reason: 'Email notifications disabled' };

    const formatDate = (date) => new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const subject = `Subscription Resumed - Fixwell Services`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #28a745;">Welcome Back!</h2>
        
        <p>Hi ${customerName},</p>
        
        <p>Your ${tier} subscription has been successfully resumed and is now active.</p>
        
        <div style="background: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
          <h3 style="margin-top: 0; color: #155724;">Resume Details</h3>
          <p><strong>Resumed On:</strong> ${formatDate(resumeDate)}</p>
          <p><strong>Pause Duration:</strong> ${pauseDuration} days</p>
          <p><strong>Plan:</strong> ${tier}</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h4 style="margin-top: 0; color: #495057;">What's restored:</h4>
          <ul style="margin: 10px 0;">
            <li>Full access to all ${tier} plan benefits</li>
            <li>Service scheduling is now available</li>
            <li>Regular billing cycle has resumed</li>
            <li>All previous perks and usage limits are preserved</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/dashboard" 
             style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Access Your Dashboard
          </a>
        </div>
        
        <p>Ready to schedule your next service? We're here to help!</p>
        
        <p>Thank you for choosing Fixwell Services!</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; color: #6c757d; font-size: 14px;">
          <p>This is an automated message. Please do not reply to this email.</p>
        </div>
      </div>
    `;

    try {
      const result = await emailService.sendEmail(email, subject, html);
      return { success: true, ...result };
    } catch (error) {
      console.error('Error sending resume confirmation:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send payment failure notification with grace period info
   */
  async sendPaymentFailureNotification(email, customerName, failureDetails) {
    const { startDate, endDate, gracePeriodDays, tier, nextRetryDate } = failureDetails;
    
    if (!this.enableEmail) return { success: false, reason: 'Email notifications disabled' };

    const formatDate = (date) => new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const subject = `Payment Failed - Action Required - Fixwell Services`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc3545;">Payment Failed</h2>
        
        <p>Hi ${customerName},</p>
        
        <p>We were unable to process your payment for your ${tier} subscription. Don't worry - your account is still active for the next ${gracePeriodDays} days.</p>
        
        <div style="background: #f8d7da; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc3545;">
          <h3 style="margin-top: 0; color: #721c24;">Payment Details</h3>
          <p><strong>Failed on:</strong> ${formatDate(startDate)}</p>
          <p><strong>Grace period ends:</strong> ${formatDate(endDate)}</p>
          <p><strong>Next retry:</strong> ${formatDate(nextRetryDate)}</p>
          <p><strong>Plan:</strong> ${tier}</p>
        </div>
        
        <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h4 style="margin-top: 0; color: #856404;">What happens next:</h4>
          <ul style="margin: 10px 0;">
            <li>Your services remain active for ${gracePeriodDays} days</li>
            <li>We'll automatically retry payment on ${formatDate(nextRetryDate)}</li>
            <li>Update your payment method to avoid service interruption</li>
            <li>If payment isn't resolved, your account will be suspended on ${formatDate(endDate)}</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/dashboard/subscription" 
             style="background: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Update Payment Method
          </a>
        </div>
        
        <p>If you have any questions or need assistance, please contact our support team immediately.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; color: #6c757d; font-size: 14px;">
          <p>This is an automated message. Please do not reply to this email.</p>
        </div>
      </div>
    `;

    try {
      const result = await emailService.sendEmail(email, subject, html);
      return { success: true, ...result };
    } catch (error) {
      console.error('Error sending payment failure notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send payment recovery notification
   */
  async sendPaymentRecoveryNotification(email, customerName, recoveryDetails) {
    const { recoveryDate, tier } = recoveryDetails;
    
    if (!this.enableEmail) return { success: false, reason: 'Email notifications disabled' };

    const formatDate = (date) => new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const subject = `Payment Successful - Service Restored - Fixwell Services`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #28a745;">Payment Successful!</h2>
        
        <p>Hi ${customerName},</p>
        
        <p>Great news! Your payment has been successfully processed and your ${tier} subscription is now fully active.</p>
        
        <div style="background: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
          <h3 style="margin-top: 0; color: #155724;">Service Restored</h3>
          <p><strong>Payment processed:</strong> ${formatDate(recoveryDate)}</p>
          <p><strong>Plan:</strong> ${tier}</p>
          <p><strong>Status:</strong> Active</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h4 style="margin-top: 0; color: #495057;">What's restored:</h4>
          <ul style="margin: 10px 0;">
            <li>Full access to all ${tier} plan benefits</li>
            <li>Service scheduling is now available</li>
            <li>Regular billing cycle has resumed</li>
            <li>All previous perks and usage limits are active</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/dashboard" 
             style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Access Your Dashboard
          </a>
        </div>
        
        <p>Thank you for resolving the payment issue quickly. We're here to help whenever you need us!</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; color: #6c757d; font-size: 14px;">
          <p>This is an automated message. Please do not reply to this email.</p>
        </div>
      </div>
    `;

    try {
      const result = await emailService.sendEmail(email, subject, html);
      return { success: true, ...result };
    } catch (error) {
      console.error('Error sending payment recovery notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send subscription suspension notification
   */
  async sendSubscriptionSuspensionNotification(email, customerName, suspensionDetails) {
    const { suspensionDate, tier, gracePeriodExpired } = suspensionDetails;
    
    if (!this.enableEmail) return { success: false, reason: 'Email notifications disabled' };

    const formatDate = (date) => new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const subject = `Subscription Suspended - Fixwell Services`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc3545;">Subscription Suspended</h2>
        
        <p>Hi ${customerName},</p>
        
        <p>Your ${tier} subscription has been suspended due to ${gracePeriodExpired ? 'unresolved payment issues' : 'payment failure'}.</p>
        
        <div style="background: #f8d7da; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc3545;">
          <h3 style="margin-top: 0; color: #721c24;">Suspension Details</h3>
          <p><strong>Suspended on:</strong> ${formatDate(suspensionDate)}</p>
          <p><strong>Plan:</strong> ${tier}</p>
          <p><strong>Reason:</strong> ${gracePeriodExpired ? 'Grace period expired' : 'Payment failure'}</p>
        </div>
        
        <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h4 style="margin-top: 0; color: #856404;">What this means:</h4>
          <ul style="margin: 10px 0;">
            <li>Service scheduling is no longer available</li>
            <li>Plan benefits are suspended</li>
            <li>Your account data is preserved</li>
            <li>You can reactivate anytime by updating payment</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/dashboard/subscription" 
             style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Reactivate Subscription
          </a>
        </div>
        
        <p>To reactivate your subscription, simply update your payment method and your service will be restored immediately.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; color: #6c757d; font-size: 14px;">
          <p>This is an automated message. Please do not reply to this email.</p>
        </div>
      </div>
    `;

    try {
      const result = await emailService.sendEmail(email, subject, html);
      return { success: true, ...result };
    } catch (error) {
      console.error('Error sending suspension notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get notification settings (persistent)
   */
  async getNotificationSettings() {
    try {
      // Import prisma dynamically to avoid circular dependencies
      const { default: prisma } = await import('../config/database.js');
      const keys = [
        'smsEnabled',
        'ownerPhone',
        'managerPhones',
        'notificationTypes'
      ];
      const settings = await prisma.setting.findMany({ where: { key: { in: keys } } });
      const map = Object.fromEntries(settings.map(s => [s.key, s.value]));
      await prisma.$disconnect();
      return {
        smsEnabled: map.smsEnabled === undefined ? (process.env.ENABLE_SMS_NOTIFICATIONS === 'true') : map.smsEnabled === 'true',
        ownerPhone: map.ownerPhone || process.env.OWNER_PHONE_NUMBER || '',
        managerPhones: map.managerPhones || process.env.MANAGER_PHONE_NUMBERS || '',
        notificationTypes: map.notificationTypes ? map.notificationTypes.split(',') : (process.env.SMS_NOTIFICATION_TYPES ? process.env.SMS_NOTIFICATION_TYPES.split(',') : ['new_chat', 'urgent_chat'])
      };
    } catch (error) {
      console.error('Failed to load notification settings:', error);
      return {
        smsEnabled: process.env.ENABLE_SMS_NOTIFICATIONS === 'true',
        ownerPhone: process.env.OWNER_PHONE_NUMBER || '',
        managerPhones: process.env.MANAGER_PHONE_NUMBERS || '',
        notificationTypes: process.env.SMS_NOTIFICATION_TYPES ? process.env.SMS_NOTIFICATION_TYPES.split(',') : ['new_chat', 'urgent_chat']
      };
    }
  }
}

export default new NotificationService(); 