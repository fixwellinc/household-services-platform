import prisma from '../config/database.js';
import { getPlanByTier, PLANS, VISIT_FREQUENCIES } from '../config/plans.js';
import { updateSubscription } from './stripe.js';

class EnhancedPlanService {
  /**
   * Enhanced plan change with prorated billing, visit carryover, and perk validation
   * @param {string} userId - User ID
   * @param {string} newTier - New plan tier (STARTER, HOMECARE, PRIORITY)
   * @param {string} billingCycle - Billing cycle (monthly, yearly)
   * @returns {Object} Plan change result with billing preview
   */
  async changePlan(userId, newTier, billingCycle = 'monthly') {
    try {
      // Get current subscription and usage
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { 
          subscription: true,
          subscriptionUsage: true
        }
      });

      if (!user?.subscription) {
        throw new Error('No active subscription found');
      }

      if (user.subscription.status !== 'ACTIVE') {
        throw new Error('Subscription must be active to change plans');
      }

      const currentTier = user.subscription.tier;
      const currentPlan = getPlanByTier(currentTier);
      const newPlan = getPlanByTier(newTier);

      if (!newPlan) {
        throw new Error('Invalid new plan tier');
      }

      if (currentTier === newTier) {
        throw new Error('Already subscribed to this plan');
      }

      // Validate downgrade restrictions based on perk usage
      const downgradePrevention = await this.validateDowngrade(userId, currentTier, newTier);
      if (!downgradePrevention.allowed) {
        throw new Error(downgradePrevention.reason);
      }

      // Calculate prorated billing for upgrades
      const billingCalculation = await this.calculateProratedBilling(
        user.subscription, 
        currentPlan, 
        newPlan, 
        billingCycle
      );

      // Handle visit carryover logic
      const visitCarryover = await this.calculateVisitCarryover(
        userId, 
        currentTier, 
        newTier
      );

      // Determine when the change should take effect
      const isUpgrade = this.isUpgrade(currentTier, newTier);
      const effectiveDate = isUpgrade ? new Date() : user.subscription.currentPeriodEnd;

      // Update subscription in database
      const updatedSubscription = await prisma.subscription.update({
        where: { id: user.subscription.id },
        data: {
          tier: newTier,
          paymentFrequency: billingCycle.toUpperCase(),
          nextPaymentAmount: billingCalculation.nextAmount,
          updatedAt: new Date(),
          // For downgrades, keep current tier until next billing cycle
          ...(isUpgrade ? {} : { 
            // Store pending change for downgrades
            status: 'PENDING_CHANGE'
          })
        }
      });

      // Update Stripe subscription if needed
      if (user.subscription.stripeSubscriptionId && isUpgrade) {
        const newPriceId = newPlan.stripePriceIds[billingCycle];
        await updateSubscription(user.subscription.stripeSubscriptionId, {
          items: [{
            id: user.subscription.stripeSubscriptionId,
            price: newPriceId
          }],
          proration_behavior: 'create_prorations'
        });
      }

      // Apply visit carryover if applicable
      if (visitCarryover.carryoverVisits > 0) {
        await this.applyVisitCarryover(userId, visitCarryover.carryoverVisits);
      }

      return {
        success: true,
        subscription: updatedSubscription,
        billingPreview: billingCalculation,
        visitCarryover: visitCarryover,
        effectiveDate: effectiveDate,
        isUpgrade: isUpgrade,
        message: isUpgrade 
          ? 'Plan upgraded successfully with immediate effect'
          : 'Plan downgrade scheduled for next billing cycle'
      };

    } catch (error) {
      console.error('Error changing plan:', error);
      throw error;
    }
  }

  /**
   * Validate if downgrade is allowed based on perk usage
   * @param {string} userId - User ID
   * @param {string} currentTier - Current plan tier
   * @param {string} newTier - Target plan tier
   * @returns {Object} Validation result
   */
  async validateDowngrade(userId, currentTier, newTier) {
    try {
      const isDowngrade = !this.isUpgrade(currentTier, newTier);
      
      if (!isDowngrade) {
        return { allowed: true };
      }

      // Get current usage
      const usage = await prisma.subscriptionUsage.findUnique({
        where: { userId }
      });

      if (!usage) {
        return { allowed: true };
      }

      const currentPlan = getPlanByTier(currentTier);
      const newPlan = getPlanByTier(newTier);

      // Check if user has used tier-specific perks that aren't available in lower tier
      const restrictions = [];

      // Priority plan specific perks
      if (currentTier === 'PRIORITY' && newTier !== 'PRIORITY') {
        if (usage.emergencyServiceUsed) {
          restrictions.push('Same-week emergency service has been used this billing cycle');
        }
        
        // Check for smart home setup or other priority-specific services
        // This would be expanded based on actual perk tracking
      }

      // HomeCare plan specific perks
      if (currentTier === 'PRIORITY' && newTier === 'STARTER') {
        if (usage.discountUsed && usage.discountAmount > 0) {
          restrictions.push('Service discounts have been used this billing cycle');
        }
      }

      if (restrictions.length > 0) {
        return {
          allowed: false,
          reason: `Cannot downgrade: ${restrictions.join(', ')}. Please wait until next billing cycle.`,
          restrictions: restrictions
        };
      }

      return { allowed: true };

    } catch (error) {
      console.error('Error validating downgrade:', error);
      return {
        allowed: false,
        reason: 'Unable to validate downgrade eligibility'
      };
    }
  }

  /**
   * Calculate prorated billing for plan changes
   * @param {Object} subscription - Current subscription
   * @param {Object} currentPlan - Current plan details
   * @param {Object} newPlan - New plan details
   * @param {string} billingCycle - Billing cycle
   * @returns {Object} Billing calculation
   */
  async calculateProratedBilling(subscription, currentPlan, newPlan, billingCycle) {
    try {
      const now = new Date();
      const periodEnd = new Date(subscription.currentPeriodEnd);
      const periodStart = new Date(subscription.currentPeriodStart);
      
      // Calculate remaining days in current period
      const totalDays = Math.ceil((periodEnd - periodStart) / (1000 * 60 * 60 * 24));
      const remainingDays = Math.ceil((periodEnd - now) / (1000 * 60 * 60 * 24));
      
      const currentPrice = billingCycle === 'yearly' ? currentPlan.yearlyPrice : currentPlan.monthlyPrice;
      const newPrice = billingCycle === 'yearly' ? newPlan.yearlyPrice : newPlan.monthlyPrice;
      
      // Calculate prorated amounts
      const dailyCurrentRate = currentPrice / totalDays;
      const dailyNewRate = newPrice / totalDays;
      
      const remainingCurrentAmount = dailyCurrentRate * remainingDays;
      const remainingNewAmount = dailyNewRate * remainingDays;
      
      const proratedDifference = remainingNewAmount - remainingCurrentAmount;
      
      // For upgrades, charge the difference immediately
      // For downgrades, credit will be applied at next billing cycle
      const immediateCharge = proratedDifference > 0 ? proratedDifference : 0;
      const creditAmount = proratedDifference < 0 ? Math.abs(proratedDifference) : 0;
      
      return {
        currentPrice: currentPrice,
        newPrice: newPrice,
        proratedDifference: proratedDifference,
        immediateCharge: immediateCharge,
        creditAmount: creditAmount,
        nextAmount: newPrice,
        remainingDays: remainingDays,
        totalDays: totalDays,
        billingCycle: billingCycle
      };

    } catch (error) {
      console.error('Error calculating prorated billing:', error);
      throw error;
    }
  }

  /**
   * Calculate visit carryover for plan changes
   * @param {string} userId - User ID
   * @param {string} currentTier - Current plan tier
   * @param {string} newTier - New plan tier
   * @returns {Object} Visit carryover calculation
   */
  async calculateVisitCarryover(userId, currentTier, newTier) {
    try {
      // Get current visit usage for this billing period
      const usage = await prisma.subscriptionUsage.findUnique({
        where: { userId }
      });

      const currentVisitsPerMonth = VISIT_FREQUENCIES[currentTier] || 1;
      const newVisitsPerMonth = VISIT_FREQUENCIES[newTier] || 1;
      
      // Calculate unused visits from current plan
      // This is a simplified calculation - in a real system you'd track actual visit usage
      const usedVisits = usage ? (usage.priorityBookingCount || 0) : 0;
      const unusedVisits = Math.max(0, currentVisitsPerMonth - usedVisits);
      
      // Carry over up to 2 visits maximum
      const carryoverVisits = Math.min(2, unusedVisits);
      
      return {
        currentVisitsPerMonth: currentVisitsPerMonth,
        newVisitsPerMonth: newVisitsPerMonth,
        unusedVisits: unusedVisits,
        carryoverVisits: carryoverVisits,
        totalVisitsNextPeriod: newVisitsPerMonth + carryoverVisits
      };

    } catch (error) {
      console.error('Error calculating visit carryover:', error);
      return {
        currentVisitsPerMonth: 1,
        newVisitsPerMonth: 1,
        unusedVisits: 0,
        carryoverVisits: 0,
        totalVisitsNextPeriod: 1
      };
    }
  }

  /**
   * Apply visit carryover to user's account
   * @param {string} userId - User ID
   * @param {number} carryoverVisits - Number of visits to carry over
   */
  async applyVisitCarryover(userId, carryoverVisits) {
    try {
      if (carryoverVisits <= 0) return;

      // Update or create subscription usage record
      await prisma.subscriptionUsage.upsert({
        where: { userId },
        update: {
          // Add carryover visits to available visits
          // This would need to be implemented based on how visits are tracked
          updatedAt: new Date()
        },
        create: {
          userId,
          subscriptionId: '', // Would need to get this from subscription
          tier: '', // Would need current tier
          // Initialize with carryover visits
        }
      });

    } catch (error) {
      console.error('Error applying visit carryover:', error);
      throw error;
    }
  }

  /**
   * Determine if plan change is an upgrade
   * @param {string} currentTier - Current plan tier
   * @param {string} newTier - New plan tier
   * @returns {boolean} True if upgrade, false if downgrade
   */
  isUpgrade(currentTier, newTier) {
    const tierHierarchy = {
      'STARTER': 1,
      'HOMECARE': 2,
      'PRIORITY': 3
    };

    return tierHierarchy[newTier] > tierHierarchy[currentTier];
  }

  /**
   * Get plan change preview without making changes
   * @param {string} userId - User ID
   * @param {string} newTier - Target plan tier
   * @param {string} billingCycle - Billing cycle
   * @returns {Object} Preview of plan change
   */
  async getChangePreview(userId, newTier, billingCycle = 'monthly') {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { 
          subscription: true,
          subscriptionUsage: true
        }
      });

      if (!user?.subscription) {
        throw new Error('No active subscription found');
      }

      const currentTier = user.subscription.tier;
      const currentPlan = getPlanByTier(currentTier);
      const newPlan = getPlanByTier(newTier);

      if (!newPlan) {
        throw new Error('Invalid new plan tier');
      }

      // Get validation results
      const downgradePrevention = await this.validateDowngrade(userId, currentTier, newTier);
      
      // Calculate billing preview
      const billingCalculation = await this.calculateProratedBilling(
        user.subscription, 
        currentPlan, 
        newPlan, 
        billingCycle
      );

      // Calculate visit carryover
      const visitCarryover = await this.calculateVisitCarryover(
        userId, 
        currentTier, 
        newTier
      );

      const isUpgrade = this.isUpgrade(currentTier, newTier);

      return {
        currentPlan: currentPlan,
        newPlan: newPlan,
        isUpgrade: isUpgrade,
        canChange: downgradePrevention.allowed,
        restrictions: downgradePrevention.restrictions || [],
        billingPreview: billingCalculation,
        visitCarryover: visitCarryover,
        effectiveDate: isUpgrade ? new Date() : user.subscription.currentPeriodEnd
      };

    } catch (error) {
      console.error('Error generating change preview:', error);
      throw error;
    }
  }
}

export default new EnhancedPlanService();