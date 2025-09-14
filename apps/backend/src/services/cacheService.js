import { cacheUtils, cacheKeys, monitor } from '../config/performance.js';
import prisma from '../config/database.js';

class CacheService {
  constructor() {
    this.defaultTTL = 600; // 10 minutes
    this.shortTTL = 300; // 5 minutes
    this.longTTL = 1800; // 30 minutes
  }

  // Subscription caching
  async getSubscription(userId) {
    const key = cacheKeys.subscription(userId);
    return cacheUtils.get(key) || await this.refreshSubscriptionCache(userId);
  }

  async refreshSubscriptionCache(userId) {
    const startTime = monitor.startTimer('cache_refresh_subscription');
    
    try {
      const subscription = await prisma.subscription.findUnique({
        where: { userId },
        include: {
          paymentFrequencies: {
            orderBy: { createdAt: 'desc' },
            take: 1
          },
          subscriptionPauses: {
            where: { status: 'ACTIVE' },
            orderBy: { startDate: 'desc' },
            take: 1
          },
          additionalProperties: true,
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              notifications: true
            }
          }
        }
      });

      if (subscription) {
        const key = cacheKeys.subscription(userId);
        cacheUtils.set(key, subscription, this.defaultTTL);
      }

      monitor.endTimer('cache_refresh_subscription', startTime, { userId, found: !!subscription });
      return subscription;
    } catch (error) {
      monitor.endTimer('cache_refresh_subscription', startTime, { userId, error: error.message });
      throw error;
    }
  }

  async invalidateSubscriptionCache(userId) {
    const key = cacheKeys.subscription(userId);
    cacheUtils.del(key);
    
    // Also invalidate related caches
    cacheUtils.del(cacheKeys.subscriptionAnalytics(userId));
    cacheUtils.del(cacheKeys.rewardCredits(userId));
    cacheUtils.del(cacheKeys.churnRisk(userId));
  }

  // Payment frequency options caching
  async getPaymentFrequencyOptions(tier) {
    const key = cacheKeys.paymentFrequencyOptions(tier);
    let options = cacheUtils.get(key);
    
    if (!options) {
      const startTime = monitor.startTimer('cache_refresh_payment_options');
      
      // Calculate payment options based on tier
      options = this.calculatePaymentFrequencyOptions(tier);
      cacheUtils.set(key, options, this.longTTL); // Cache for 30 minutes
      
      monitor.endTimer('cache_refresh_payment_options', startTime, { tier });
    }
    
    return options;
  }

  calculatePaymentFrequencyOptions(tier) {
    const basePrices = {
      'STARTER': 19.99,
      'HOMECARE': 29.99,
      'PREMIUM': 49.99
    };

    const basePrice = basePrices[tier] || 29.99;
    
    return {
      MONTHLY: {
        frequency: 'MONTHLY',
        amount: basePrice,
        discount: 0,
        savings: 0,
        label: 'Monthly',
        description: 'Billed monthly'
      },
      YEARLY: {
        frequency: 'YEARLY',
        amount: basePrice * 12 * 0.9, // 10% discount
        discount: 0.1,
        savings: basePrice * 12 * 0.1,
        label: 'Yearly',
        description: 'Billed yearly (10% savings)'
      }
    };
  }

  // Reward credits caching
  async getRewardCredits(userId) {
    const key = cacheKeys.rewardCredits(userId);
    let credits = cacheUtils.get(key);
    
    if (!credits) {
      const startTime = monitor.startTimer('cache_refresh_reward_credits');
      
      credits = await prisma.rewardCredit.findMany({
        where: { 
          userId,
          usedAt: null,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        },
        orderBy: { earnedAt: 'asc' }
      });
      
      cacheUtils.set(key, credits, this.shortTTL); // Cache for 5 minutes
      monitor.endTimer('cache_refresh_reward_credits', startTime, { userId, count: credits.length });
    }
    
    return credits;
  }

  async invalidateRewardCreditsCache(userId) {
    const key = cacheKeys.rewardCredits(userId);
    cacheUtils.del(key);
  }

  // Additional properties caching
  async getAdditionalProperties(subscriptionId) {
    const key = cacheKeys.additionalProperties(subscriptionId);
    let properties = cacheUtils.get(key);
    
    if (!properties) {
      const startTime = monitor.startTimer('cache_refresh_additional_properties');
      
      properties = await prisma.additionalProperty.findMany({
        where: { subscriptionId },
        orderBy: { addedAt: 'desc' }
      });
      
      cacheUtils.set(key, properties, this.defaultTTL);
      monitor.endTimer('cache_refresh_additional_properties', startTime, { subscriptionId, count: properties.length });
    }
    
    return properties;
  }

  async invalidateAdditionalPropertiesCache(subscriptionId) {
    const key = cacheKeys.additionalProperties(subscriptionId);
    cacheUtils.del(key);
  }

  // Analytics caching
  async getAnalyticsMetrics(type, period = '30d') {
    const key = cacheKeys.analyticsMetrics(type, period);
    let metrics = cacheUtils.get(key);
    
    if (!metrics) {
      const startTime = monitor.startTimer('cache_refresh_analytics');
      
      metrics = await this.calculateAnalyticsMetrics(type, period);
      cacheUtils.set(key, metrics, this.longTTL); // Cache for 30 minutes
      
      monitor.endTimer('cache_refresh_analytics', startTime, { type, period });
    }
    
    return metrics;
  }

  async calculateAnalyticsMetrics(type, period) {
    const periodDays = parseInt(period.replace('d', ''));
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    switch (type) {
      case 'subscription_growth':
        return await prisma.subscription.groupBy({
          by: ['tier', 'status'],
          where: {
            createdAt: { gte: startDate }
          },
          _count: true
        });

      case 'payment_frequency_distribution':
        return await prisma.subscription.groupBy({
          by: ['paymentFrequency'],
          where: {
            status: 'ACTIVE',
            createdAt: { gte: startDate }
          },
          _count: true,
          _avg: {
            lifetimeValue: true
          }
        });

      case 'churn_analysis':
        return await prisma.subscription.groupBy({
          by: ['tier'],
          where: {
            updatedAt: { gte: startDate },
            status: { in: ['CANCELLED', 'SUSPENDED'] }
          },
          _count: true
        });

      default:
        return {};
    }
  }

  // Churn risk caching
  async getChurnRisk(userId) {
    const key = cacheKeys.churnRisk(userId);
    let risk = cacheUtils.get(key);
    
    if (!risk) {
      const startTime = monitor.startTimer('cache_refresh_churn_risk');
      
      const subscription = await this.getSubscription(userId);
      if (subscription) {
        risk = {
          score: subscription.churnRiskScore || 0,
          factors: await this.calculateChurnFactors(subscription),
          lastUpdated: new Date()
        };
        
        cacheUtils.set(key, risk, this.defaultTTL);
      }
      
      monitor.endTimer('cache_refresh_churn_risk', startTime, { userId, score: risk?.score });
    }
    
    return risk;
  }

  async calculateChurnFactors(subscription) {
    const factors = [];
    
    // Payment failures
    if (subscription.isPaused) {
      factors.push({ factor: 'payment_issues', weight: 0.3, description: 'Recent payment failures' });
    }
    
    // Low engagement (placeholder - would need usage data)
    const daysSinceCreated = Math.floor((new Date() - subscription.createdAt) / (1000 * 60 * 60 * 24));
    if (daysSinceCreated > 90) {
      factors.push({ factor: 'long_term_customer', weight: -0.1, description: 'Long-term customer' });
    }
    
    // Multiple properties (positive indicator)
    if (subscription.additionalProperties?.length > 0) {
      factors.push({ factor: 'multiple_properties', weight: -0.2, description: 'Multiple properties' });
    }
    
    return factors;
  }

  // User notification preferences caching
  async getUserNotificationPreferences(userId) {
    const key = cacheKeys.userNotificationPreferences(userId);
    let preferences = cacheUtils.get(key);
    
    if (!preferences) {
      const startTime = monitor.startTimer('cache_refresh_notification_prefs');
      
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { notifications: true }
      });
      
      preferences = user?.notifications || {
        email: true,
        sms: false,
        paymentReminders: true,
        serviceReminders: true,
        promotions: false
      };
      
      cacheUtils.set(key, preferences, this.longTTL);
      monitor.endTimer('cache_refresh_notification_prefs', startTime, { userId });
    }
    
    return preferences;
  }

  async invalidateUserNotificationPreferencesCache(userId) {
    const key = cacheKeys.userNotificationPreferences(userId);
    cacheUtils.del(key);
  }

  // Bulk cache operations
  async warmupCache(userIds) {
    const startTime = monitor.startTimer('cache_warmup');
    
    try {
      const promises = userIds.map(async (userId) => {
        await Promise.all([
          this.refreshSubscriptionCache(userId),
          this.getRewardCredits(userId),
          this.getUserNotificationPreferences(userId)
        ]);
      });
      
      await Promise.all(promises);
      monitor.endTimer('cache_warmup', startTime, { userCount: userIds.length });
    } catch (error) {
      monitor.endTimer('cache_warmup', startTime, { userCount: userIds.length, error: error.message });
      throw error;
    }
  }

  // Cache maintenance
  async clearExpiredEntries() {
    const startTime = monitor.startTimer('cache_maintenance');
    
    try {
      // Clear analytics caches older than 1 hour
      const analyticsPattern = 'analytics:.*';
      const clearedCount = cacheUtils.clearPattern(analyticsPattern);
      
      monitor.endTimer('cache_maintenance', startTime, { clearedCount });
      return clearedCount;
    } catch (error) {
      monitor.endTimer('cache_maintenance', startTime, { error: error.message });
      throw error;
    }
  }

  // Cache statistics
  getStats() {
    return {
      cache: cacheUtils.getStats(),
      performance: monitor.getMetrics()
    };
  }
}

export default new CacheService();