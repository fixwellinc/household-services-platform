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