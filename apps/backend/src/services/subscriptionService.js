import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class SubscriptionService {
  // Track when a customer uses a subscription perk
  async trackPerkUsage(userId, perkType, details = {}) {
    try {
      // Get or create subscription usage record
      let usage = await prisma.subscriptionUsage.findUnique({
        where: { userId }
      });

      if (!usage) {
        // Create new usage record
        const user = await prisma.user.findUnique({
          where: { userId },
          include: { subscription: true }
        });

        if (!user || !user.subscription) {
          throw new Error('User has no active subscription');
        }

        usage = await prisma.subscriptionUsage.create({
          data: {
            userId,
            subscriptionId: user.subscription.id,
            tier: user.subscription.tier,
            maxPriorityBookings: this.getMaxPerksByTier(user.subscription.tier, 'priorityBookings'),
            maxDiscountAmount: this.getMaxPerksByTier(user.subscription.tier, 'discountAmount'),
            maxFreeServices: this.getMaxPerksByTier(user.subscription.tier, 'freeServices'),
            maxEmergencyServices: this.getMaxPerksByTier(user.subscription.tier, 'emergencyServices')
          }
        });
      }

      // Update perk usage based on type
      const updateData = {};
      const now = new Date();

      switch (perkType) {
        case 'priorityBooking':
          updateData.priorityBookingUsed = true;
          updateData.priorityBookingUsedAt = now;
          updateData.priorityBookingCount = usage.priorityBookingCount + 1;
          break;
        case 'discount':
          updateData.discountUsed = true;
          updateData.discountUsedAt = now;
          updateData.discountAmount = usage.discountAmount + (details.amount || 0);
          break;
        case 'freeService':
          updateData.freeServiceUsed = true;
          updateData.freeServiceUsedAt = now;
          updateData.freeServiceType = details.serviceType || 'general';
          break;
        case 'emergencyService':
          updateData.emergencyServiceUsed = true;
          updateData.emergencyServiceUsedAt = now;
          break;
        default:
          throw new Error('Invalid perk type');
      }

      // Update usage record
      await prisma.subscriptionUsage.update({
        where: { userId },
        data: updateData
      });

      // Check if any perks have been used and block cancellation
      await this.checkAndBlockCancellation(userId);

      return { success: true, usage: { ...usage, ...updateData } };
    } catch (error) {
      console.error('Error tracking perk usage:', error);
      throw error;
    }
  }

  // Check if any perks have been used and block cancellation
  async checkAndBlockCancellation(userId) {
    try {
      const usage = await prisma.subscriptionUsage.findUnique({
        where: { userId }
      });

      if (!usage) return;

      const hasUsedPerks = usage.priorityBookingUsed || 
                          usage.discountUsed || 
                          usage.freeServiceUsed || 
                          usage.emergencyServiceUsed;

      if (hasUsedPerks) {
        // Get user's subscription
        const user = await prisma.user.findUnique({
          where: { userId },
          include: { subscription: true }
        });

        if (user?.subscription) {
          await prisma.subscription.update({
            where: { id: user.subscription.id },
            data: {
              canCancel: false,
              cancellationBlockedAt: new Date(),
              cancellationBlockedReason: 'Perks have been used'
            }
          });
        }
      }
    } catch (error) {
      console.error('Error checking and blocking cancellation:', error);
    }
  }

  // Get maximum perks allowed by tier
  getMaxPerksByTier(tier, perkType) {
    const limits = {
      STARTER: {
        priorityBookings: 0,
        discountAmount: 0,
        freeServices: 0,
        emergencyServices: 0
      },
      HOMECARE: {
        priorityBookings: 2,
        discountAmount: 50,
        freeServices: 1,
        emergencyServices: 0
      },
      PRIORITY: {
        priorityBookings: 5,
        discountAmount: 100,
        freeServices: 2,
        emergencyServices: 1
      }
    };

    return limits[tier]?.[perkType] || 0;
  }

  // Check if user can use a specific perk
  async canUsePerk(userId, perkType) {
    try {
      const usage = await prisma.subscriptionUsage.findUnique({
        where: { userId }
      });

      if (!usage) return { canUse: false, reason: 'No subscription usage record found' };

      switch (perkType) {
        case 'priorityBooking':
          return {
            canUse: usage.priorityBookingCount < usage.maxPriorityBookings,
            reason: usage.priorityBookingCount >= usage.maxPriorityBookings ? 'Priority booking limit reached' : null
          };
        case 'discount':
          return {
            canUse: usage.discountAmount < usage.maxDiscountAmount,
            reason: usage.discountAmount >= usage.maxDiscountAmount ? 'Discount limit reached' : null
          };
        case 'freeService':
          return {
            canUse: !usage.freeServiceUsed,
            reason: usage.freeServiceUsed ? 'Free service already used' : null
          };
        case 'emergencyService':
          return {
            canUse: !usage.emergencyServiceUsed,
            reason: usage.emergencyServiceUsed ? 'Emergency service already used' : null
          };
        default:
          return { canUse: false, reason: 'Invalid perk type' };
      }
    } catch (error) {
      console.error('Error checking perk usage:', error);
      return { canUse: false, reason: 'Error checking perk availability' };
    }
  }

  // Get subscription usage summary
  async getUsageSummary(userId) {
    try {
      const usage = await prisma.subscriptionUsage.findUnique({
        where: { userId },
        include: {
          user: {
            include: { subscription: true }
          }
        }
      });

      if (!usage) return null;

      return {
        ...usage,
        perksUsed: {
          priorityBooking: usage.priorityBookingUsed,
          discount: usage.discountUsed,
          freeService: usage.freeServiceUsed,
          emergencyService: usage.emergencyServiceUsed
        },
        limits: {
          priorityBookings: usage.maxPriorityBookings,
          discountAmount: usage.maxDiscountAmount,
          freeServices: usage.maxFreeServices,
          emergencyServices: usage.maxEmergencyServices
        }
      };
    } catch (error) {
      console.error('Error getting usage summary:', error);
      throw error;
    }
  }

  // Block subscription cancellation manually
  async blockCancellation(subscriptionId, reason = 'Perks have been used') {
    try {
      const subscription = await prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          canCancel: false,
          cancellationBlockedAt: new Date(),
          cancellationBlockedReason: reason
        }
      });

      return subscription;
    } catch (error) {
      console.error('Error blocking cancellation:', error);
      throw error;
    }
  }

  // Allow subscription cancellation
  async allowCancellation(subscriptionId) {
    try {
      const subscription = await prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          canCancel: true,
          cancellationBlockedAt: null,
          cancellationBlockedReason: null
        }
      });

      return subscription;
    } catch (error) {
      console.error('Error allowing cancellation:', error);
      throw error;
    }
  }
}

export default new SubscriptionService(); 