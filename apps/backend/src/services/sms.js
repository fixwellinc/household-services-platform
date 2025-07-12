import twilio from 'twilio';
import { config } from '../config/environment.js';

// Initialize Twilio client
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

class SMSService {
  constructor() {
    this.client = twilioClient;
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER;
  }

  /**
   * Send SMS notification to owner/manager
   */
  async sendChatNotification(phoneNumber, customerName, message, chatId) {
    try {
      const body = `🔔 New chat from ${customerName}: "${message.substring(0, 100)}${message.length > 100 ? '...' : ''}"\n\nView: ${process.env.FRONTEND_URL}/admin?tab=live-chat&chat=${chatId}`;
      
      const result = await this.client.messages.create({
        body,
        from: this.fromNumber,
        to: phoneNumber
      });

      console.log(`SMS sent to ${phoneNumber}:`, result.sid);
      return { success: true, sid: result.sid };
    } catch (error) {
      console.error('SMS sending failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send urgent notification for high priority chats
   */
  async sendUrgentNotification(phoneNumber, customerName, priority) {
    try {
      const body = `🚨 URGENT: ${priority} priority chat from ${customerName}\n\nRequires immediate attention!`;
      
      const result = await this.client.messages.create({
        body,
        from: this.fromNumber,
        to: phoneNumber
      });

      console.log(`Urgent SMS sent to ${phoneNumber}:`, result.sid);
      return { success: true, sid: result.sid };
    } catch (error) {
      console.error('Urgent SMS sending failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send notification to multiple recipients (owners/managers)
   */
  async sendBulkNotification(phoneNumbers, customerName, message, chatId) {
    const results = [];
    
    for (const phoneNumber of phoneNumbers) {
      const result = await this.sendChatNotification(phoneNumber, customerName, message, chatId);
      results.push({ phoneNumber, ...result });
    }
    
    return results;
  }

  /**
   * Verify phone number format
   */
  validatePhoneNumber(phoneNumber) {
    // Basic validation - should be in E.164 format
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(phoneNumber);
  }

  /**
   * Format phone number to E.164
   */
  formatPhoneNumber(phoneNumber) {
    // Remove all non-digit characters except +
    let cleaned = phoneNumber.replace(/[^\d+]/g, '');
    
    // If it doesn't start with +, assume US number
    if (!cleaned.startsWith('+')) {
      if (cleaned.startsWith('1') && cleaned.length === 11) {
        cleaned = '+' + cleaned;
      } else if (cleaned.length === 10) {
        cleaned = '+1' + cleaned;
      }
    }
    
    return cleaned;
  }
}

export default new SMSService(); 