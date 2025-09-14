import prisma from '../config/database.js';
import { pauseSubscription as pauseStripeSubscription, resumeSubscription as resumeStripeSubscription } from './stripe.js';
import notificationService from './notificationService.js';

class SubscriptionPauseService {
  /**
   * Pause a subscription due to payment failure
   * @param {string} subscriptionId - The subscription ID to pause
   * @param {string} reason - Reason for pausing (e.g., 'PAYMENT_FAILED')
   * @param {number} gracePeriodDays - Grace period in days before full suspension (default: 7)
   * @returns {Object} Pause details
   */
  async pauseSubscriptionForPaymentFailure(subscriptionId, reason = 'PAYMENT_FAILED', gracePeriodDays = 7) {
    try {
      // Get subscription with user details
      const subscription = await prisma.subscription.findUnique({
        where: { id: subscriptionId },
        include: { 
          user: true,
          subscriptionPauses: {
            where: { status: 'ACTIVE' }
          }
        }
      });

      if (!subscription) {
        throw new Error('Subscription not found');
      }

      // Check if subscription is already paused
      if (subscription.isPaused || subscription.subscriptionPauses.length > 0) {
        console.log('Subscription is already paused, skipping pause operation');
        return { message: 'Subscription already paused' };
      }

      // Calculate pause dates - grace period for payment retry
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + gracePeriodDays);

      // Create pause record
      const pauseRecord = await prisma.subscriptionPause.create({
        data: {
          subscriptionId,
          startDate,
          endDate,
          reason,
          status: 'ACTIVE'
        }
      });

      // Update subscription status to PAST_DUE instead of paused initially
      await prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          status: 'PAST_DUE',
          isPaused: true,
          pauseStartDate: startDate,
          pauseEndDate: endDate
        }
      });

      // Don't pause Stripe subscription immediately - let Stripe handle retry logic
      // Stripe will automatically retry failed payments and update status

      // Schedule grace period expiration check
      await this.scheduleGracePeriodExpiration(subscriptionId, endDate);

      // Send payment failure notification with grace period info
      await notificationService.sendPaymentFailureNotification(
        subscription.user.email,
        subscription.user.name,
        {
          startDate,
          endDate,
          gracePeriodDays,
          tier: subscription.tier,
          nextRetryDate: this.calculateNextRetryDate(startDate)
        }
      );

      return {
        pauseId: pauseRecord.id,
        startDate,
        endDate,
        gracePeriodDays,
        reason,
        message: 'Subscription paused due to payment failure - grace period active'
      };

    } catch (error) {
      console.error('Error pausing subscription for payment failure:', error);
      throw error;
    }
  }

  /**
   * Manually pause a subscription (admin only or special cases)
   * @param {string} subscriptionId - The subscription ID to pause
   * @param {number} durationDays - Duration in days
   * @param {string} reason - Reason for pausing
   * @returns {Object} Pause details
   */
  async pauseSubscriptionManually(subscriptionId, durationDays, reason = 'MANUAL_PAUSE') {
    try {
      // Get subscription with user details
      const subscription = await prisma.subscription.findUnique({
        where: { id: subscriptionId },
        include: { 
          user: true,
          subscriptionPauses: {
            where: { status: 'ACTIVE' }
          }
        }
      });

      if (!subscription) {
        throw new Error('Subscription not found');
      }

      // Check if subscription is already paused
      if (subscription.isPaused || subscription.subscriptionPauses.length > 0) {
        throw new Error('Subscription is already paused');
      }

      // Calculate pause dates
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + durationDays);

      // Create pause record
      const pauseRecord = await prisma.subscriptionPause.create({
        data: {
          subscriptionId,
          startDate,
          endDate,
          reason,
          status: 'ACTIVE'
        }
      });

      // Update subscription status
      await prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          isPaused: true,
          pauseStartDate: startDate,
          pauseEndDate: endDate
        }
      });

      // Pause Stripe subscription if it exists
      if (subscription.stripeSubscriptionId) {
        try {
          await pauseStripeSubscription(subscription.stripeSubscriptionId, {
            behavior: 'void',
            prorate: false
          });
        } catch (stripeError) {
          console.error('Error pausing Stripe subscription:', stripeError);
          // Continue with local pause even if Stripe fails
        }
      }

      // Schedule automatic resume
      await this.scheduleAutomaticResume(subscriptionId, endDate);

      return {
        pauseId: pauseRecord.id,
        startDate,
        endDate,
        durationDays,
        reason,
        message: 'Subscription paused manually'
      };

    } catch (error) {
      console.error('Error pausing subscription manually:', error);
      throw error;
    }
  }

  /**
   * Resume a paused subscription
   * @param {string} subscriptionId - The subscription ID to resume
   * @returns {Object} Resume details
   */
  async resumeSubscription(subscriptionId) {
    try {
      // Get subscription with pause details
      const subscription = await prisma.subscription.findUnique({
        where: { id: subscriptionId },
        include: { 
          user: true,
          subscriptionPauses: {
            where: { status: 'ACTIVE' }
          }
        }
      });

      if (!subscription) {
        throw new Error('Subscription not found');
      }

      // Check if subscription is paused
      if (!subscription.isPaused || subscription.subscriptionPauses.length === 0) {
        throw new Error('Subscription is not currently paused');
      }

      const activePause = subscription.subscriptionPauses[0];

      // Update pause record to completed
      await prisma.subscriptionPause.update({
        where: { id: activePause.id },
        data: { status: 'COMPLETED' }
      });

      // Update subscription status
      await prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          isPaused: false,
          pauseStartDate: null,
          pauseEndDate: null,
          status: 'ACTIVE'
        }
      });

      // Resume Stripe subscription if it exists
      if (subscription.stripeSubscriptionId) {
        try {
          await resumeStripeSubscription(subscription.stripeSubscriptionId);
        } catch (stripeError) {
          console.error('Error resuming Stripe subscription:', stripeError);
          // Continue with local resume even if Stripe fails
        }
      }

      // Send resume confirmation notification
      await notificationService.sendResumeConfirmation(
        subscription.user.email,
        subscription.user.name,
        {
          resumeDate: new Date(),
          tier: subscription.tier,
          pauseDuration: this.calculatePauseDuration(activePause.startDate, new Date())
        }
      );

      return {
        resumeDate: new Date(),
        pauseDuration: this.calculatePauseDuration(activePause.startDate, new Date()),
        message: 'Subscription resumed successfully'
      };

    } catch (error) {
      console.error('Error resuming subscription:', error);
      throw error;
    }
  }

  /**
   * Get pause status for a subscription
   * @param {string} subscriptionId - The subscription ID
   * @returns {Object} Pause status details
   */
  async getPauseStatus(subscriptionId) {
    try {
      const subscription = await prisma.subscription.findUnique({
        where: { id: subscriptionId },
        include: {
          subscriptionPauses: {
            orderBy: { createdAt: 'desc' },
            take: 5 // Get last 5 pause records
          }
        }
      });

      if (!subscription) {
        throw new Error('Subscription not found');
      }

      const activePause = subscription.subscriptionPauses.find(p => p.status === 'ACTIVE');

      return {
        isPaused: subscription.isPaused,
        currentPause: activePause ? {
          id: activePause.id,
          startDate: activePause.startDate,
          endDate: activePause.endDate,
          reason: activePause.reason,
          daysRemaining: this.calculateDaysRemaining(activePause.endDate)
        } : null,
        pauseHistory: subscription.subscriptionPauses.map(pause => ({
          id: pause.id,
          startDate: pause.startDate,
          endDate: pause.endDate,
          reason: pause.reason,
          status: pause.status,
          duration: this.calculatePauseDuration(pause.startDate, pause.endDate)
        })),
        canPause: !subscription.isPaused && subscription.status === 'ACTIVE'
      };

    } catch (error) {
      console.error('Error getting pause status:', error);
      throw error;
    }
  }

  /**
   * Validate if a subscription is eligible for pausing
   * @param {string} subscriptionId - The subscription ID
   * @returns {boolean} Eligibility status
   */
  async validatePauseEligibility(subscriptionId) {
    try {
      // Get subscription with usage details
      const subscription = await prisma.subscription.findUnique({
        where: { id: subscriptionId },
        include: {
          user: {
            include: { subscriptionUsage: true }
          }
        }
      });

      if (!subscription) {
        throw new Error('Subscription not found');
      }

      // Check for active service appointments
      const activeBookings = await prisma.booking.count({
        where: {
          customerId: subscription.userId,
          status: { in: ['PENDING', 'CONFIRMED'] },
          scheduledDate: { gte: new Date() }
        }
      });

      if (activeBookings > 0) {
        throw new Error('Cannot pause subscription with active service appointments. Please reschedule or complete pending services first.');
      }

      // Additional validation: Check if user has recent perk usage that might affect pause
      const usage = subscription.user.subscriptionUsage;
      if (usage) {
        const recentPerkUsage = [
          usage.priorityBookingUsedAt,
          usage.discountUsedAt,
          usage.freeServiceUsedAt,
          usage.emergencyServiceUsedAt
        ].filter(date => date && this.isWithinDays(date, 30)); // Check last 30 days

        if (recentPerkUsage.length > 0) {
          console.log('Warning: Recent perk usage detected, but pause is still allowed as per requirements');
        }
      }

      return true;

    } catch (error) {
      console.error('Error validating pause eligibility:', error);
      throw error;
    }
  }

  /**
   * Schedule automatic resume for a paused subscription
   * @param {string} subscriptionId - The subscription ID
   * @param {Date} resumeDate - When to resume the subscription
   */
  async scheduleAutomaticResume(subscriptionId, resumeDate) {
    try {
      // In a production environment, this would integrate with a job scheduler
      // For now, we'll create a simple database record that can be processed by a cron job
      
      // Note: This is a simplified implementation
      // In production, you would use a proper job queue like Bull, Agenda, or similar
      console.log(`Scheduled automatic resume for subscription ${subscriptionId} on ${resumeDate}`);
      
      // Store the resume schedule in the database for processing by a background job
      // This could be expanded to use a proper job queue system
      
    } catch (error) {
      console.error('Error scheduling automatic resume:', error);
      // Don't throw error as this is not critical for the pause operation
    }
  }

  /**
   * Schedule grace period expiration check
   * @param {string} subscriptionId - The subscription ID
   * @param {Date} expirationDate - When the grace period expires
   */
  async scheduleGracePeriodExpiration(subscriptionId, expirationDate) {
    try {
      console.log(`Scheduled grace period expiration check for subscription ${subscriptionId} on ${expirationDate}`);
      // In production, this would schedule a job to check if payment was resolved
      // If not resolved by expiration date, fully suspend the subscription
    } catch (error) {
      console.error('Error scheduling grace period expiration:', error);
    }
  }

  /**
   * Calculate next payment retry date
   * @param {Date} failureDate - When the payment failed
   * @returns {Date} Next retry date
   */
  calculateNextRetryDate(failureDate) {
    const nextRetry = new Date(failureDate);
    nextRetry.setDate(nextRetry.getDate() + 3); // Retry in 3 days
    return nextRetry;
  }

  /**
   * Handle successful payment after failure (resume from pause)
   * @param {string} subscriptionId - The subscription ID
   * @returns {Object} Resume details
   */
  async handlePaymentRecovered(subscriptionId) {
    try {
      // Get subscription with pause details
      const subscription = await prisma.subscription.findUnique({
        where: { id: subscriptionId },
        include: { 
          user: true,
          subscriptionPauses: {
            where: { status: 'ACTIVE' }
          }
        }
      });

      if (!subscription) {
        throw new Error('Subscription not found');
      }

      // Check if subscription is paused due to payment failure
      const paymentFailurePause = subscription.subscriptionPauses.find(
        pause => pause.reason === 'PAYMENT_FAILED'
      );

      if (!paymentFailurePause) {
        console.log('No payment failure pause found, skipping recovery');
        return { message: 'No payment failure pause to recover from' };
      }

      // Resume the subscription
      await this.resumeSubscription(subscriptionId);

      // Send recovery notification
      await notificationService.sendPaymentRecoveryNotification(
        subscription.user.email,
        subscription.user.name,
        {
          recoveryDate: new Date(),
          tier: subscription.tier
        }
      );

      return {
        message: 'Subscription recovered from payment failure',
        recoveryDate: new Date()
      };

    } catch (error) {
      console.error('Error handling payment recovery:', error);
      throw error;
    }
  }

  /**
   * Process grace period expirations (to be called by a cron job)
   */
  async processGracePeriodExpirations() {
    try {
      const now = new Date();
      
      // Find subscriptions with expired grace periods
      const expiredGracePeriods = await prisma.subscription.findMany({
        where: {
          isPaused: true,
          status: 'PAST_DUE',
          pauseEndDate: { lte: now }
        },
        include: {
          user: true,
          subscriptionPauses: {
            where: { 
              status: 'ACTIVE',
              reason: 'PAYMENT_FAILED'
            }
          }
        }
      });

      for (const subscription of expiredGracePeriods) {
        try {
          // Fully suspend the subscription
          await prisma.subscription.update({
            where: { id: subscription.id },
            data: {
              status: 'SUSPENDED'
            }
          });

          // Send suspension notification
          await notificationService.sendSubscriptionSuspensionNotification(
            subscription.user.email,
            subscription.user.name,
            {
              suspensionDate: now,
              tier: subscription.tier,
              gracePeriodExpired: true
            }
          );

          console.log(`Suspended subscription ${subscription.id} after grace period expiration`);
        } catch (error) {
          console.error(`Error suspending subscription ${subscription.id}:`, error);
        }
      }

      return {
        processed: expiredGracePeriods.length,
        message: `Processed ${expiredGracePeriods.length} grace period expirations`
      };

    } catch (error) {
      console.error('Error processing grace period expirations:', error);
      throw error;
    }
  }

  /**
   * Process automatic resumes (to be called by a cron job)
   */
  async processAutomaticResumes() {
    try {
      const now = new Date();
      
      // Find subscriptions that should be automatically resumed
      const subscriptionsToResume = await prisma.subscription.findMany({
        where: {
          isPaused: true,
          pauseEndDate: { lte: now }
        },
        include: {
          subscriptionPauses: {
            where: { status: 'ACTIVE' }
          }
        }
      });

      for (const subscription of subscriptionsToResume) {
        try {
          await this.resumeSubscription(subscription.id);
          console.log(`Automatically resumed subscription ${subscription.id}`);
        } catch (error) {
          console.error(`Error auto-resuming subscription ${subscription.id}:`, error);
        }
      }

      return {
        processed: subscriptionsToResume.length,
        message: `Processed ${subscriptionsToResume.length} automatic resumes`
      };

    } catch (error) {
      console.error('Error processing automatic resumes:', error);
      throw error;
    }
  }

  /**
   * Calculate days remaining until resume
   * @param {Date} endDate - The pause end date
   * @returns {number} Days remaining
   */
  calculateDaysRemaining(endDate) {
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }

  /**
   * Calculate pause duration in days
   * @param {Date} startDate - Pause start date
   * @param {Date} endDate - Pause end date
   * @returns {number} Duration in days
   */
  calculatePauseDuration(startDate, endDate) {
    const diffTime = endDate.getTime() - startDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Check if a date is within specified number of days from now
   * @param {Date} date - Date to check
   * @param {number} days - Number of days
   * @returns {boolean} Whether date is within the specified days
   */
  isWithinDays(date, days) {
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return diffDays <= days;
  }

  /**
   * Get pause statistics for analytics
   * @returns {Object} Pause statistics
   */
  async getPauseStatistics() {
    try {
      const totalPauses = await prisma.subscriptionPause.count();
      const activePauses = await prisma.subscriptionPause.count({
        where: { status: 'ACTIVE' }
      });
      const completedPauses = await prisma.subscriptionPause.count({
        where: { status: 'COMPLETED' }
      });

      // Average pause duration
      const pauseRecords = await prisma.subscriptionPause.findMany({
        where: { status: { in: ['ACTIVE', 'COMPLETED'] } },
        select: { startDate: true, endDate: true }
      });

      const avgDuration = pauseRecords.length > 0 
        ? pauseRecords.reduce((sum, pause) => {
            return sum + this.calculatePauseDuration(pause.startDate, pause.endDate);
          }, 0) / pauseRecords.length
        : 0;

      return {
        totalPauses,
        activePauses,
        completedPauses,
        averageDurationDays: Math.round(avgDuration),
        pauseRate: totalPauses > 0 ? (activePauses / totalPauses * 100).toFixed(2) : 0
      };

    } catch (error) {
      console.error('Error getting pause statistics:', error);
      throw error;
    }
  }
}

export default new SubscriptionPauseService();