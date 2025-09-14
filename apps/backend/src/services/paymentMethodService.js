import Stripe from 'stripe';
import emailService from './email.js';
import smsService from './sms.js';

/**
 * PaymentMethodService - Manages payment methods, expiration monitoring,
 * and automatic payment retry with smart scheduling
 */
class PaymentMethodService {
  constructor(prisma) {
    this.prisma = prisma;
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    this.retrySchedule = [1, 3, 7]; // Days between retry attempts
    this.maxRetryAttempts = 3;
  }

  /**
   * Update payment method for a customer
   * @param {string} userId - User ID
   * @param {string} paymentMethodId - Stripe payment method ID
   */
  async updatePaymentMethod(userId, paymentMethodId) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { subscription: true }
      });

      if (!user || !user.subscription) {
        throw new Error('User or subscription not found');
      }

      // Attach payment method to customer
      await this.stripe.paymentMethods.attach(paymentMethodId, {
        customer: user.subscription.stripeCustomerId,
      });

      // Set as default payment method
      await this.stripe.customers.update(user.subscription.stripeCustomerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });

      // Update subscription's default payment method
      if (user.subscription.stripeSubscriptionId) {
        await this.stripe.subscriptions.update(user.subscription.stripeSubscriptionId, {
          default_payment_method: paymentMethodId,
        });
      }

      // Get payment method details for validation
      const paymentMethod = await this.stripe.paymentMethods.retrieve(paymentMethodId);
      
      // Check if card is expiring soon and schedule reminder
      if (paymentMethod.card) {
        await this._scheduleExpirationReminder(userId, paymentMethod.card);
      }

      // Log payment method update
      await this._logPaymentMethodUpdate(userId, {
        paymentMethodId,
        type: paymentMethod.type,
        last4: paymentMethod.card?.last4,
        expiryMonth: paymentMethod.card?.exp_month,
        expiryYear: paymentMethod.card?.exp_year
      });

      return {
        success: true,
        paymentMethod: {
          id: paymentMethodId,
          type: paymentMethod.type,
          last4: paymentMethod.card?.last4,
          expiryMonth: paymentMethod.card?.exp_month,
          expiryYear: paymentMethod.card?.exp_year,
          brand: paymentMethod.card?.brand
        }
      };

    } catch (error) {
      console.error('Error updating payment method:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get customer's payment methods
   * @param {string} userId - User ID
   */
  async getPaymentMethods(userId) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { subscription: true }
      });

      if (!user || !user.subscription?.stripeCustomerId) {
        throw new Error('User or Stripe customer not found');
      }

      const paymentMethods = await this.stripe.paymentMethods.list({
        customer: user.subscription.stripeCustomerId,
        type: 'card',
      });

      const formattedMethods = paymentMethods.data.map(pm => ({
        id: pm.id,
        type: pm.type,
        last4: pm.card?.last4,
        expiryMonth: pm.card?.exp_month,
        expiryYear: pm.card?.exp_year,
        brand: pm.card?.brand,
        isExpiringSoon: this._isCardExpiringSoon(pm.card?.exp_month, pm.card?.exp_year)
      }));

      return {
        success: true,
        paymentMethods: formattedMethods
      };

    } catch (error) {
      console.error('Error getting payment methods:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Remove payment method
   * @param {string} userId - User ID
   * @param {string} paymentMethodId - Payment method ID to remove
   */
  async removePaymentMethod(userId, paymentMethodId) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { subscription: true }
      });

      if (!user || !user.subscription) {
        throw new Error('User or subscription not found');
      }

      // Check if this is the only payment method
      const paymentMethods = await this.stripe.paymentMethods.list({
        customer: user.subscription.stripeCustomerId,
        type: 'card',
      });

      if (paymentMethods.data.length <= 1) {
        throw new Error('Cannot remove the only payment method. Please add another payment method first.');
      }

      // Detach payment method
      await this.stripe.paymentMethods.detach(paymentMethodId);

      return { success: true };

    } catch (error) {
      console.error('Error removing payment method:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Monitor expiring payment methods and send reminders
   */
  async monitorExpiringPaymentMethods() {
    try {
      // Get all active subscriptions
      const subscriptions = await this.prisma.subscription.findMany({
        where: { 
          status: 'ACTIVE',
          stripeCustomerId: { not: null }
        },
        include: { user: true }
      });

      const expiringCards = [];

      for (const subscription of subscriptions) {
        try {
          const paymentMethods = await this.stripe.paymentMethods.list({
            customer: subscription.stripeCustomerId,
            type: 'card',
          });

          for (const pm of paymentMethods.data) {
            if (pm.card && this._isCardExpiringSoon(pm.card.exp_month, pm.card.exp_year)) {
              expiringCards.push({
                userId: subscription.userId,
                user: subscription.user,
                paymentMethod: pm,
                daysUntilExpiry: this._getDaysUntilExpiry(pm.card.exp_month, pm.card.exp_year)
              });
            }
          }
        } catch (error) {
          console.error(`Error checking payment methods for subscription ${subscription.id}:`, error);
        }
      }

      // Send expiration reminders
      const reminderResults = [];
      for (const expiring of expiringCards) {
        const reminderResult = await this.sendExpirationReminder(
          expiring.userId,
          {
            last4: expiring.paymentMethod.card.last4,
            brand: expiring.paymentMethod.card.brand,
            expiryMonth: expiring.paymentMethod.card.exp_month,
            expiryYear: expiring.paymentMethod.card.exp_year,
            daysUntilExpiry: expiring.daysUntilExpiry
          }
        );
        reminderResults.push(reminderResult);
      }

      return {
        success: true,
        expiringCardsFound: expiringCards.length,
        remindersSent: reminderResults.filter(r => r.success).length
      };

    } catch (error) {
      console.error('Error monitoring expiring payment methods:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send expiration reminder notification
   * @param {string} userId - User ID
   * @param {Object} cardData - Card expiration details
   */
  async sendExpirationReminder(userId, cardData) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { subscription: true }
      });

      if (!user) {
        throw new Error('User not found');
      }

      const { last4, brand, expiryMonth, expiryYear, daysUntilExpiry } = cardData;
      
      const urgency = daysUntilExpiry <= 7 ? 'URGENT' : daysUntilExpiry <= 14 ? 'HIGH' : 'NORMAL';

      const emailData = {
        to: user.email,
        subject: this._getExpirationReminderSubject(daysUntilExpiry, urgency),
        html: this._generateExpirationReminderEmail(user, {
          last4,
          brand,
          expiryMonth,
          expiryYear,
          daysUntilExpiry,
          urgency,
          tier: user.subscription?.tier
        })
      };

      const emailResult = await emailService.sendEmail(emailData);

      // Send SMS for urgent reminders if enabled
      let smsResult = null;
      if (urgency === 'URGENT' && user.phone && user.notifications?.sms) {
        const smsMessage = `URGENT: Your ${brand} card ending in ${last4} expires in ${daysUntilExpiry} days. Update your payment method to avoid service interruption.`;
        smsResult = await smsService.sendChatNotification(
          user.phone,
          'Fixwell Services',
          smsMessage,
          'card-expiration'
        );
      }

      // Log notification
      await this._logExpirationReminder(userId, {
        last4,
        brand,
        daysUntilExpiry,
        urgency
      });

      return {
        success: true,
        emailSent: emailResult.success,
        smsSent: smsResult?.success || false,
        urgency
      };

    } catch (error) {
      console.error('Error sending expiration reminder:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Retry failed payment with smart scheduling
   * @param {string} userId - User ID
   * @param {Object} retryData - Payment retry details
   */
  async retryFailedPayment(userId, retryData) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { subscription: true }
      });

      if (!user || !user.subscription) {
        throw new Error('User or subscription not found');
      }

      const { attemptNumber = 1, lastFailureReason, paymentIntentId } = retryData;

      // Check if we've exceeded max retry attempts
      if (attemptNumber > this.maxRetryAttempts) {
        return {
          success: false,
          error: 'Maximum retry attempts exceeded',
          shouldSuspend: true
        };
      }

      // Calculate next retry date based on smart scheduling
      const nextRetryDate = this._calculateNextRetryDate(attemptNumber);

      // Attempt to retry the payment
      let retryResult = null;
      if (paymentIntentId) {
        try {
          // Confirm the payment intent again
          retryResult = await this.stripe.paymentIntents.confirm(paymentIntentId);
        } catch (stripeError) {
          console.error('Stripe payment retry failed:', stripeError);
          retryResult = { status: 'failed', last_payment_error: stripeError };
        }
      }

      const isSuccessful = retryResult?.status === 'succeeded';

      if (isSuccessful) {
        // Payment succeeded - update subscription status
        await this.prisma.subscription.update({
          where: { id: user.subscription.id },
          data: {
            status: 'ACTIVE',
            isPaused: false,
            pauseStartDate: null,
            pauseEndDate: null
          }
        });

        // Send success notification
        await this._sendPaymentRecoveryNotification(userId);
      } else {
        // Schedule next retry if within limits
        if (attemptNumber < this.maxRetryAttempts) {
          await this._scheduleNextRetry(userId, {
            attemptNumber: attemptNumber + 1,
            nextRetryDate,
            lastFailureReason: retryResult?.last_payment_error?.message || lastFailureReason
          });
        }
      }

      // Log retry attempt
      await this._logPaymentRetry(userId, {
        attemptNumber,
        isSuccessful,
        nextRetryDate: isSuccessful ? null : nextRetryDate,
        failureReason: retryResult?.last_payment_error?.message
      });

      return {
        success: isSuccessful,
        attemptNumber,
        nextRetryDate: isSuccessful ? null : nextRetryDate,
        shouldSuspend: attemptNumber >= this.maxRetryAttempts && !isSuccessful
      };

    } catch (error) {
      console.error('Error retrying failed payment:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if card is expiring soon (within 30 days)
   * @private
   */
  _isCardExpiringSoon(expMonth, expYear) {
    if (!expMonth || !expYear) return false;
    
    const now = new Date();
    const expiryDate = new Date(expYear, expMonth - 1); // Month is 0-indexed
    const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
    
    return expiryDate <= thirtyDaysFromNow;
  }

  /**
   * Get days until card expiry
   * @private
   */
  _getDaysUntilExpiry(expMonth, expYear) {
    if (!expMonth || !expYear) return 0;
    
    const now = new Date();
    const expiryDate = new Date(expYear, expMonth - 1);
    const diffTime = expiryDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  }

  /**
   * Calculate next retry date based on attempt number
   * @private
   */
  _calculateNextRetryDate(attemptNumber) {
    const retryDays = this.retrySchedule[Math.min(attemptNumber - 1, this.retrySchedule.length - 1)];
    const nextRetryDate = new Date();
    nextRetryDate.setDate(nextRetryDate.getDate() + retryDays);
    return nextRetryDate;
  }

  /**
   * Schedule expiration reminder
   * @private
   */
  async _scheduleExpirationReminder(userId, cardData) {
    const daysUntilExpiry = this._getDaysUntilExpiry(cardData.exp_month, cardData.exp_year);
    
    // Schedule reminders at 30, 14, and 7 days before expiry
    const reminderDays = [30, 14, 7];
    const scheduledReminders = [];

    for (const days of reminderDays) {
      if (daysUntilExpiry > days) {
        const reminderDate = new Date();
        reminderDate.setDate(reminderDate.getDate() + (daysUntilExpiry - days));
        scheduledReminders.push({
          date: reminderDate,
          daysBeforeExpiry: days
        });
      }
    }

    // In a production system, you would use a job queue
    console.log(`Scheduled expiration reminders for user ${userId}:`, scheduledReminders);
    
    return scheduledReminders;
  }

  /**
   * Schedule next payment retry
   * @private
   */
  async _scheduleNextRetry(userId, retryData) {
    // In a production system, you would use a job queue like Bull or Agenda
    console.log(`Scheduled payment retry for user ${userId}:`, retryData);
    return retryData;
  }

  /**
   * Send payment recovery notification
   * @private
   */
  async _sendPaymentRecoveryNotification(userId) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { subscription: true }
      });

      if (!user) return;

      const emailData = {
        to: user.email,
        subject: 'Payment Successful - Service Restored - Fixwell Services',
        html: this._generatePaymentRecoveryEmail(user)
      };

      await emailService.sendEmail(emailData);
    } catch (error) {
      console.error('Error sending payment recovery notification:', error);
    }
  }

  /**
   * Generate expiration reminder email HTML
   * @private
   */
  _generateExpirationReminderEmail(user, cardData) {
    const { last4, brand, expiryMonth, expiryYear, daysUntilExpiry, urgency, tier } = cardData;
    
    const urgencyColor = urgency === 'URGENT' ? '#dc3545' : urgency === 'HIGH' ? '#fd7e14' : '#007bff';
    const urgencyText = urgency === 'URGENT' ? 'URGENT' : urgency === 'HIGH' ? 'Important' : 'Reminder';
    
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: ${urgencyColor}; color: white; padding: 15px; text-align: center; border-radius: 8px 8px 0 0;">
          <h2 style="margin: 0; color: white;">${urgencyText}: Card Expiring ${daysUntilExpiry <= 7 ? 'Soon' : `in ${daysUntilExpiry} days`}</h2>
        </div>
        
        <div style="padding: 30px; border: 1px solid #dee2e6; border-top: none; border-radius: 0 0 8px 8px;">
          <p>Hi ${user.name},</p>
          
          <p>Your ${brand} card ending in ${last4} will expire on ${expiryMonth}/${expiryYear}${daysUntilExpiry <= 7 ? ' (in just ' + daysUntilExpiry + ' days!)' : ''}.</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #495057;">Card Details</h3>
            <p><strong>Card:</strong> ${brand} ending in ${last4}</p>
            <p><strong>Expires:</strong> ${expiryMonth}/${expiryYear}</p>
            <p><strong>Days Remaining:</strong> ${daysUntilExpiry}</p>
            ${tier ? `<p><strong>Plan:</strong> ${tier}</p>` : ''}
          </div>
          
          ${urgency === 'URGENT' ? `
            <div style="background: #f8d7da; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc3545;">
              <h4 style="margin-top: 0; color: #721c24;">Action Required</h4>
              <p>To avoid service interruption, please update your payment method immediately.</p>
            </div>
          ` : ''}
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/dashboard/subscription/payment-methods" 
               style="background: ${urgencyColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Update Payment Method
            </a>
          </div>
          
          <p>Updating your payment method is quick and secure. Your subscription will continue without interruption.</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; color: #6c757d; font-size: 14px;">
            <p>This is an automated reminder. Please do not reply to this email.</p>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Generate payment recovery email HTML
   * @private
   */
  _generatePaymentRecoveryEmail(user) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #28a745; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h2 style="margin: 0; color: white;">✅ Payment Successful!</h2>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Your service has been restored</p>
        </div>
        
        <div style="padding: 30px; border: 1px solid #dee2e6; border-top: none; border-radius: 0 0 8px 8px;">
          <p>Hi ${user.name},</p>
          
          <p>Great news! Your payment has been successfully processed and your subscription is now fully active.</p>
          
          <div style="background: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
            <h3 style="margin-top: 0; color: #155724;">Service Restored</h3>
            <p><strong>Status:</strong> Active</p>
            <p><strong>Next Billing:</strong> ${user.subscription?.currentPeriodEnd ? new Date(user.subscription.currentPeriodEnd).toLocaleDateString() : 'Next cycle'}</p>
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
      </div>
    `;
  }

  /**
   * Get expiration reminder subject
   * @private
   */
  _getExpirationReminderSubject(daysUntilExpiry, urgency) {
    if (urgency === 'URGENT') {
      return `URGENT: Card Expires in ${daysUntilExpiry} Days - Fixwell Services`;
    } else if (urgency === 'HIGH') {
      return `Important: Card Expiring Soon - Fixwell Services`;
    } else {
      return `Payment Method Expiring in ${daysUntilExpiry} Days - Fixwell Services`;
    }
  }

  /**
   * Log payment method update
   * @private
   */
  async _logPaymentMethodUpdate(userId, updateData) {
    console.log('Payment method updated:', {
      timestamp: new Date().toISOString(),
      userId,
      ...updateData
    });
  }

  /**
   * Log expiration reminder
   * @private
   */
  async _logExpirationReminder(userId, reminderData) {
    console.log('Expiration reminder sent:', {
      timestamp: new Date().toISOString(),
      userId,
      ...reminderData
    });
  }

  /**
   * Log payment retry attempt
   * @private
   */
  async _logPaymentRetry(userId, retryData) {
    console.log('Payment retry attempted:', {
      timestamp: new Date().toISOString(),
      userId,
      ...retryData
    });
  }
}

export default PaymentMethodService;