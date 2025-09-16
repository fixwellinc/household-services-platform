import prisma from '../config/database.js';

class SubscriptionService {
  async getSubscriptionAnalytics() {
    try {
      // Get basic subscription counts
      const [
        totalSubscriptions,
        activeSubscriptions,
        pausedSubscriptions,
        cancelledSubscriptions
      ] = await Promise.all([
        prisma.subscription.count(),
        prisma.subscription.count({ where: { status: 'ACTIVE' } }),
        prisma.subscription.count({ where: { isPaused: true } }),
        prisma.subscription.count({ where: { status: 'CANCELLED' } })
      ]);

      // Calculate revenue metrics (mock data for now)
      const totalRevenue = activeSubscriptions * 150; // Rough estimate
      const monthlyRecurringRevenue = activeSubscriptions * 50; // Rough estimate
      const averageLifetimeValue = totalRevenue / Math.max(totalSubscriptions, 1);

      // Calculate churn rate (mock calculation)
      const churnRate = cancelledSubscriptions / Math.max(totalSubscriptions, 1);
      
      // Count high risk subscriptions (mock - those with churn score > 0.7)
      const highRiskSubscriptions = await prisma.subscription.count({
        where: {
          churnRiskScore: { gte: 0.7 }
        }
      });

      return {
        totalSubscriptions,
        activeSubscriptions,
        pausedSubscriptions,
        cancelledSubscriptions,
        totalRevenue,
        monthlyRecurringRevenue,
        averageLifetimeValue,
        churnRate,
        highRiskSubscriptions
      };
    } catch (error) {
      console.error('Error getting subscription analytics:', error);
      // Return mock data if database fails
      return {
        totalSubscriptions: 0,
        activeSubscriptions: 0,
        pausedSubscriptions: 0,
        cancelledSubscriptions: 0,
        totalRevenue: 0,
        monthlyRecurringRevenue: 0,
        averageLifetimeValue: 0,
        churnRate: 0,
        highRiskSubscriptions: 0
      };
    }
  }

  async getUsageSummary(userId) {
    try {
      // Mock usage data - in real implementation, this would come from usage tracking
      return {
        currentPeriodUsage: {
          bookings: 5,
          serviceRequests: 3,
          chatMessages: 25
        },
        limits: {
          bookings: 10,
          serviceRequests: 5,
          chatMessages: 100
        },
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting usage summary:', error);
      return {
        currentPeriodUsage: {
          bookings: 0,
          serviceRequests: 0,
          chatMessages: 0
        },
        limits: {
          bookings: 0,
          serviceRequests: 0,
          chatMessages: 0
        },
        lastUpdated: new Date().toISOString()
      };
    }
  }

  async trackPerkUsage(userId, perkType, details = {}) {
    try {
      // Mock implementation - in real app, this would track perk usage
      console.log(`Tracking perk usage for user ${userId}: ${perkType}`, details);
      return { success: true };
    } catch (error) {
      console.error('Error tracking perk usage:', error);
      throw error;
    }
  }

  async canUsePerk(userId, perkType) {
    try {
      // Mock implementation - in real app, this would check perk limits
      return true;
    } catch (error) {
      console.error('Error checking perk usage:', error);
      return false;
    }
  }
}

export default new SubscriptionService();