import emailService from './email.js';
import smsService from './sms.js';
import notificationService from './notificationService.js';

/**
 * SmartNotificationService - Enhanced notification system for payment reminders,
 * failure handling, and usage-based upgrade suggestions
 */
class SmartNotificationService {
  constructor(prisma) {
    this.prisma = prisma;
    this.retrySchedule = [1, 3, 7]; // Days between retry attempts
    this.gracePeriodDays = 7;
  }

  /**
   * Send payment reminder notification
   * @param {string} userId - User ID
   * @param {Object} reminderData - Payment reminder details
   */
  async sendPaymentReminder(userId, reminderData) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { subscription: true }
      });

      if (!user || !user.subscription) {
        throw new Error('User or subscription not found');
      }

      const { daysUntilDue, amount, dueDate } = reminderData;
      
      // Determine reminder urgency
      const urgency = daysUntilDue <= 1 ? 'URGENT' : daysUntilDue <= 2 ? 'HIGH' : 'NORMAL';
      
      const emailData = {
        to: user.email,
        subject: this._getPaymentReminderSubject(daysUntilDue, urgency),
        html: this._generatePaymentReminderEmail(user, {
          ...reminderData,
          urgency,
          tier: user.subscription.tier
        })
      };

      // Send email notification
      const emailResult = await emailService.sendEmail(emailData);

      // Send SMS for urgent reminders if enabled
      let smsResult = null;
      if (urgency === 'URGENT' && user.phone && user.notifications?.sms) {
        const smsMessage = `URGENT: Your ${user.subscription.tier} subscription payment of $${amount} is due ${daysUntilDue === 0 ? 'today' : 'tomorrow'}. Update payment method to avoid service interruption.`;
        smsResult = await smsService.sendChatNotification(
          user.phone,
          'Fixwell Services',
          smsMessage,
          'payment-reminder'
        );
      }

      // Log notification
      await this._logNotification({
        userId,
        type: 'PAYMENT_REMINDER',
        channel: smsResult ? 'EMAIL_SMS' : 'EMAIL',
        urgency,
        metadata: { daysUntilDue, amount, dueDate }
      });

      return {
        success: true,
        emailSent: emailResult.success,
        smsSent: smsResult?.success || false,
        urgency
      };

    } catch (error) {
      console.error('Error sending payment reminder:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Handle payment failure with escalating notifications
   * @param {string} userId - User ID
   * @param {Object} failureData - Payment failure details
   */
  async handlePaymentFailure(userId, failureData) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { subscription: true }
      });

      if (!user || !user.subscription) {
        throw new Error('User or subscription not found');
      }

      const { attemptNumber = 1, lastFailureReason, nextRetryDate } = failureData;
      
      // Calculate grace period end date
      const gracePeriodEnd = new Date();
      gracePeriodEnd.setDate(gracePeriodEnd.getDate() + this.gracePeriodDays);

      // Send immediate failure notification
      const failureNotification = await notificationService.sendPaymentFailureNotification(
        user.email,
        user.name,
        {
          startDate: new Date(),
          endDate: gracePeriodEnd,
          gracePeriodDays: this.gracePeriodDays,
          tier: user.subscription.tier,
          nextRetryDate: nextRetryDate || new Date(Date.now() + 24 * 60 * 60 * 1000),
          failureReason: lastFailureReason
        }
      );

      // Schedule escalating notifications
      await this._scheduleEscalatingNotifications(userId, {
        gracePeriodEnd,
        attemptNumber,
        tier: user.subscription.tier
      });

      // Update subscription status to indicate payment failure
      await this.prisma.subscription.update({
        where: { id: user.subscription.id },
        data: {
          isPaused: true,
          pauseStartDate: new Date(),
          pauseEndDate: gracePeriodEnd,
          status: 'PAST_DUE'
        }
      });

      // Log notification
      await this._logNotification({
        userId,
        type: 'PAYMENT_FAILURE',
        channel: 'EMAIL',
        urgency: 'HIGH',
        metadata: { attemptNumber, gracePeriodEnd, lastFailureReason }
      });

      return {
        success: true,
        gracePeriodEnd,
        notificationSent: failureNotification.success
      };

    } catch (error) {
      console.error('Error handling payment failure:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send usage-based upgrade suggestions
   * @param {string} userId - User ID
   * @param {Object} usageData - Usage analysis data
   */
  async sendUpgradeSuggestion(userId, usageData) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { 
          subscription: true,
          subscriptionUsage: true
        }
      });

      if (!user || !user.subscription) {
        throw new Error('User or subscription not found');
      }

      const { 
        currentUsage, 
        planLimit, 
        utilizationRate, 
        suggestedTier, 
        potentialSavings 
      } = usageData;

      // Only send if utilization is high (>80%) and there's a higher tier available
      if (utilizationRate < 0.8 || !suggestedTier) {
        return { success: false, reason: 'Upgrade not recommended based on usage' };
      }

      const emailData = {
        to: user.email,
        subject: `Maximize Your Savings - Upgrade to ${suggestedTier} Plan`,
        html: this._generateUpgradeEmail(user, {
          currentTier: user.subscription.tier,
          suggestedTier,
          currentUsage,
          planLimit,
          utilizationRate,
          potentialSavings
        })
      };

      const emailResult = await emailService.sendEmail(emailData);

      // Log notification
      await this._logNotification({
        userId,
        type: 'UPGRADE_SUGGESTION',
        channel: 'EMAIL',
        urgency: 'NORMAL',
        metadata: { suggestedTier, utilizationRate, potentialSavings }
      });

      return {
        success: true,
        emailSent: emailResult.success,
        suggestedTier,
        potentialSavings
      };

    } catch (error) {
      console.error('Error sending upgrade suggestion:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send engagement reminder for inactive users
   * @param {string} userId - User ID
   * @param {Object} engagementData - Engagement analysis data
   */
  async sendEngagementReminder(userId, engagementData) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { subscription: true }
      });

      if (!user || !user.subscription) {
        throw new Error('User or subscription not found');
      }

      const { daysSinceLastService, suggestedServices, tier } = engagementData;

      const emailData = {
        to: user.email,
        subject: `We Miss You! Your ${tier} Plan Benefits Are Waiting`,
        html: this._generateEngagementEmail(user, {
          daysSinceLastService,
          suggestedServices,
          tier
        })
      };

      const emailResult = await emailService.sendEmail(emailData);

      // Log notification
      await this._logNotification({
        userId,
        type: 'ENGAGEMENT_REMINDER',
        channel: 'EMAIL',
        urgency: 'NORMAL',
        metadata: { daysSinceLastService, suggestedServices }
      });

      return {
        success: true,
        emailSent: emailResult.success,
        daysSinceLastService
      };

    } catch (error) {
      console.error('Error sending engagement reminder:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Schedule escalating notifications during grace period
   * @private
   */
  async _scheduleEscalatingNotifications(userId, scheduleData) {
    const { gracePeriodEnd, attemptNumber, tier } = scheduleData;
    const now = new Date();
    const gracePeriodDays = Math.ceil((gracePeriodEnd - now) / (1000 * 60 * 60 * 24));

    // Schedule notifications at 50% and 80% of grace period
    const midGracePeriod = new Date(now.getTime() + (gracePeriodDays * 0.5 * 24 * 60 * 60 * 1000));
    const lateGracePeriod = new Date(now.getTime() + (gracePeriodDays * 0.8 * 24 * 60 * 60 * 1000));

    // In a production system, you would use a job queue like Bull or Agenda
    // For now, we'll log the scheduled notifications
    console.log(`Scheduled escalating notifications for user ${userId}:`, {
      midGracePeriod,
      lateGracePeriod,
      gracePeriodEnd
    });

    return {
      midGracePeriodNotification: midGracePeriod,
      lateGracePeriodNotification: lateGracePeriod,
      finalNotification: gracePeriodEnd
    };
  }

  /**
   * Generate payment reminder email HTML
   * @private
   */
  _generatePaymentReminderEmail(user, reminderData) {
    const { daysUntilDue, amount, dueDate, urgency, tier } = reminderData;
    
    const urgencyColor = urgency === 'URGENT' ? '#dc3545' : urgency === 'HIGH' ? '#fd7e14' : '#007bff';
    const urgencyText = urgency === 'URGENT' ? 'URGENT' : urgency === 'HIGH' ? 'Important' : 'Friendly Reminder';
    
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: ${urgencyColor}; color: white; padding: 15px; text-align: center; border-radius: 8px 8px 0 0;">
          <h2 style="margin: 0; color: white;">${urgencyText}: Payment Due ${daysUntilDue === 0 ? 'Today' : daysUntilDue === 1 ? 'Tomorrow' : `in ${daysUntilDue} days`}</h2>
        </div>
        
        <div style="padding: 30px; border: 1px solid #dee2e6; border-top: none; border-radius: 0 0 8px 8px;">
          <p>Hi ${user.name},</p>
          
          <p>Your ${tier} subscription payment is due ${daysUntilDue === 0 ? 'today' : daysUntilDue === 1 ? 'tomorrow' : `on ${new Date(dueDate).toLocaleDateString()}`}.</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #495057;">Payment Details</h3>
            <p><strong>Amount Due:</strong> $${amount}</p>
            <p><strong>Plan:</strong> ${tier}</p>
            <p><strong>Due Date:</strong> ${new Date(dueDate).toLocaleDateString()}</p>
          </div>
          
          ${urgency === 'URGENT' ? `
            <div style="background: #f8d7da; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc3545;">
              <h4 style="margin-top: 0; color: #721c24;">Action Required</h4>
              <p>To avoid service interruption, please update your payment method immediately.</p>
            </div>
          ` : ''}
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/dashboard/subscription" 
               style="background: ${urgencyColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Update Payment Method
            </a>
          </div>
          
          <p>Questions? Contact our support team - we're here to help!</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; color: #6c757d; font-size: 14px;">
            <p>This is an automated reminder. Please do not reply to this email.</p>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Generate upgrade suggestion email HTML
   * @private
   */
  _generateUpgradeEmail(user, upgradeData) {
    const { currentTier, suggestedTier, currentUsage, planLimit, utilizationRate, potentialSavings } = upgradeData;
    
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h2 style="margin: 0; color: white;">💡 Smart Upgrade Recommendation</h2>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Based on your usage patterns</p>
        </div>
        
        <div style="padding: 30px; border: 1px solid #dee2e6; border-top: none; border-radius: 0 0 8px 8px;">
          <p>Hi ${user.name},</p>
          
          <p>We've analyzed your service usage and found an opportunity to save money while getting more value!</p>
          
          <div style="background: #e7f3ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #0066cc;">Your Usage Analysis</h3>
            <div style="display: flex; justify-content: space-between; margin: 10px 0;">
              <span><strong>Current Plan:</strong> ${currentTier}</span>
              <span><strong>Usage:</strong> ${currentUsage}/${planLimit} (${Math.round(utilizationRate * 100)}%)</span>
            </div>
            <div style="background: #cce7ff; height: 10px; border-radius: 5px; margin: 10px 0;">
              <div style="background: ${utilizationRate > 0.9 ? '#dc3545' : utilizationRate > 0.8 ? '#fd7e14' : '#28a745'}; height: 100%; width: ${Math.round(utilizationRate * 100)}%; border-radius: 5px;"></div>
            </div>
          </div>
          
          <div style="background: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
            <h3 style="margin-top: 0; color: #155724;">💰 Recommended: ${suggestedTier} Plan</h3>
            <p><strong>Potential Monthly Savings:</strong> $${potentialSavings}</p>
            <p>With your current usage pattern, upgrading to ${suggestedTier} would give you better value and more flexibility.</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/dashboard/subscription/upgrade?plan=${suggestedTier}" 
               style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Upgrade to ${suggestedTier}
            </a>
          </div>
          
          <p>This recommendation is based on your last 30 days of usage. You can always change your plan later if your needs change.</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; color: #6c757d; font-size: 14px;">
            <p>This is a personalized recommendation. You can opt out of these suggestions in your notification preferences.</p>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Generate engagement reminder email HTML
   * @private
   */
  _generateEngagementEmail(user, engagementData) {
    const { daysSinceLastService, suggestedServices, tier } = engagementData;
    
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h2 style="margin: 0; color: white;">🏠 We Miss You!</h2>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Your ${tier} benefits are waiting</p>
        </div>
        
        <div style="padding: 30px; border: 1px solid #dee2e6; border-top: none; border-radius: 0 0 8px 8px;">
          <p>Hi ${user.name},</p>
          
          <p>It's been ${daysSinceLastService} days since your last service, and we wanted to check in! Your ${tier} plan includes amazing benefits that are ready when you need them.</p>
          
          <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #856404;">🔧 Suggested Services for You</h3>
            <ul style="margin: 10px 0; padding-left: 20px;">
              ${suggestedServices.map(service => `<li>${service}</li>`).join('')}
            </ul>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #495057;">Your ${tier} Plan Includes:</h3>
            <ul style="margin: 10px 0; padding-left: 20px;">
              ${tier === 'STARTER' ? `
                <li>Monthly 30-minute visits</li>
                <li>Priority scheduling</li>
                <li>24/7 emergency support</li>
                <li>FREE annual home inspection</li>
              ` : tier === 'HOMECARE' ? `
                <li>Monthly 1-hour visits</li>
                <li>Gutter cleaning & seasonal maintenance</li>
                <li>10% off larger projects</li>
                <li>FREE annual deep cleaning</li>
              ` : `
                <li>2 visits monthly (2 hours total)</li>
                <li>Same-week emergency callouts</li>
                <li>Smart home setup & TV mounting</li>
                <li>Dedicated account manager</li>
              `}
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/dashboard/book-service" 
               style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Schedule a Service
            </a>
          </div>
          
          <p>Ready to get back to a worry-free home? We're here whenever you need us!</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; color: #6c757d; font-size: 14px;">
            <p>You can adjust your notification preferences anytime in your dashboard.</p>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Get payment reminder subject based on urgency
   * @private
   */
  _getPaymentReminderSubject(daysUntilDue, urgency) {
    if (urgency === 'URGENT') {
      return daysUntilDue === 0 
        ? 'URGENT: Payment Due Today - Fixwell Services'
        : 'URGENT: Payment Due Tomorrow - Fixwell Services';
    } else if (urgency === 'HIGH') {
      return `Important: Payment Due in ${daysUntilDue} Days - Fixwell Services`;
    } else {
      return `Payment Reminder: Due in ${daysUntilDue} Days - Fixwell Services`;
    }
  }

  /**
   * Log notification for analytics and tracking
   * @private
   */
  async _logNotification(logData) {
    try {
      // In a production system, you would store this in a notifications log table
      console.log('Notification logged:', {
        timestamp: new Date().toISOString(),
        ...logData
      });
      
      // Could also store in database for analytics
      // await this.prisma.notificationLog.create({ data: logData });
      
      return true;
    } catch (error) {
      console.error('Error logging notification:', error);
      return false;
    }
  }
}

export default SmartNotificationService;