import socketService from './socketService.js';
import winston from 'winston';

// Configure usage tracking logger
const usageLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'usage-tracking' },
  transports: [
    new winston.transports.File({ filename: 'logs/usage.log' }),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  usageLogger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

class UsageTrackingService {
  constructor() {
    this.userUsageCache = new Map(); // Cache for user usage data
  }

  // Track service usage
  async trackServiceUsage(userId, serviceType, subscriptionTier) {
    try {
      const currentUsage = this.getUserUsage(userId);
      
      // Update usage counters
      currentUsage.servicesUsed += 1;
      
      if (serviceType === 'priority_booking') {
        currentUsage.priorityBookings += 1;
      } else if (serviceType === 'emergency_service') {
        currentUsage.emergencyServices += 1;
      }

      // Update cache
      this.userUsageCache.set(userId, currentUsage);

      // Check for warnings
      const warnings = this.checkUsageWarnings(currentUsage, subscriptionTier);

      // Prepare usage update
      const usageUpdate = {
        userId,
        subscriptionId: currentUsage.subscriptionId,
        period: currentUsage.period,
        servicesUsed: currentUsage.servicesUsed,
        discountsSaved: currentUsage.discountsSaved,
        priorityBookings: currentUsage.priorityBookings,
        emergencyServices: currentUsage.emergencyServices,
        limits: this.getLimitsForTier(subscriptionTier),
        warnings
      };

      // Send real-time update
      socketService.notifyCustomerUsageUpdate(userId, usageUpdate);

      // Update perk availability
      this.updatePerkAvailability(userId, subscriptionTier, currentUsage);

      usageLogger.info('Service usage tracked', {
        userId,
        serviceType,
        subscriptionTier,
        newUsage: currentUsage
      });

      return usageUpdate;
    } catch (error) {
      usageLogger.error('Failed to track service usage', {
        userId,
        serviceType,
        error: error.message
      });
      throw error;
    }
  }

  // Track discount usage
  async trackDiscountUsage(userId, discountAmount, subscriptionTier) {
    try {
      const currentUsage = this.getUserUsage(userId);
      
      // Update discount savings
      currentUsage.discountsSaved += discountAmount;

      // Update cache
      this.userUsageCache.set(userId, currentUsage);

      // Check for warnings
      const warnings = this.checkUsageWarnings(currentUsage, subscriptionTier);

      // Prepare usage update
      const usageUpdate = {
        userId,
        subscriptionId: currentUsage.subscriptionId,
        period: currentUsage.period,
        servicesUsed: currentUsage.servicesUsed,
        discountsSaved: currentUsage.discountsSaved,
        priorityBookings: currentUsage.priorityBookings,
        emergencyServices: currentUsage.emergencyServices,
        limits: this.getLimitsForTier(subscriptionTier),
        warnings
      };

      // Send real-time update
      socketService.notifyCustomerUsageUpdate(userId, usageUpdate);

      usageLogger.info('Discount usage tracked', {
        userId,
        discountAmount,
        subscriptionTier,
        totalSavings: currentUsage.discountsSaved
      });

      return usageUpdate;
    } catch (error) {
      usageLogger.error('Failed to track discount usage', {
        userId,
        discountAmount,
        error: error.message
      });
      throw error;
    }
  }

  // Get user usage data (from cache or initialize)
  getUserUsage(userId) {
    if (!this.userUsageCache.has(userId)) {
      // Initialize usage data for new user
      const currentPeriod = new Date().toISOString().slice(0, 7); // YYYY-MM format
      this.userUsageCache.set(userId, {
        subscriptionId: `sub_${userId}`,
        period: currentPeriod,
        servicesUsed: 0,
        discountsSaved: 0,
        priorityBookings: 0,
        emergencyServices: 0
      });
    }
    return { ...this.userUsageCache.get(userId) };
  }

  // Get limits based on subscription tier
  getLimitsForTier(tier) {
    const limits = {
      STARTER: {
        maxPriorityBookings: 2,
        maxDiscountAmount: 100,
        maxEmergencyServices: 0
      },
      HOMECARE: {
        maxPriorityBookings: 5,
        maxDiscountAmount: 300,
        maxEmergencyServices: 1
      },
      PRIORITY: {
        maxPriorityBookings: 10,
        maxDiscountAmount: 500,
        maxEmergencyServices: 3
      }
    };

    return limits[tier] || limits.STARTER;
  }

  // Check for usage warnings
  checkUsageWarnings(usage, tier) {
    const limits = this.getLimitsForTier(tier);
    const warnings = [];

    // Check priority bookings
    if (usage.priorityBookings >= limits.maxPriorityBookings) {
      warnings.push({
        type: 'LIMIT_REACHED',
        message: `You've reached your priority booking limit of ${limits.maxPriorityBookings} for this period.`,
        actionRequired: true,
        suggestedTier: tier === 'STARTER' ? 'HOMECARE' : 'PRIORITY'
      });
    } else if (usage.priorityBookings >= limits.maxPriorityBookings * 0.8) {
      warnings.push({
        type: 'APPROACHING_LIMIT',
        message: `You're approaching your priority booking limit (${usage.priorityBookings}/${limits.maxPriorityBookings}).`,
        actionRequired: false
      });
    }

    // Check emergency services
    if (usage.emergencyServices >= limits.maxEmergencyServices) {
      warnings.push({
        type: 'LIMIT_REACHED',
        message: `You've reached your emergency service limit of ${limits.maxEmergencyServices} for this period.`,
        actionRequired: true,
        suggestedTier: tier === 'STARTER' ? 'HOMECARE' : 'PRIORITY'
      });
    } else if (limits.maxEmergencyServices > 0 && usage.emergencyServices >= limits.maxEmergencyServices * 0.8) {
      warnings.push({
        type: 'APPROACHING_LIMIT',
        message: `You're approaching your emergency service limit (${usage.emergencyServices}/${limits.maxEmergencyServices}).`,
        actionRequired: false
      });
    }

    // Check discount savings
    if (usage.discountsSaved >= limits.maxDiscountAmount) {
      warnings.push({
        type: 'LIMIT_REACHED',
        message: `You've reached your discount savings limit of $${limits.maxDiscountAmount} for this period.`,
        actionRequired: true,
        suggestedTier: tier === 'STARTER' ? 'HOMECARE' : 'PRIORITY'
      });
    } else if (usage.discountsSaved >= limits.maxDiscountAmount * 0.8) {
      warnings.push({
        type: 'APPROACHING_LIMIT',
        message: `You're approaching your discount savings limit ($${usage.discountsSaved}/$${limits.maxDiscountAmount}).`,
        actionRequired: false
      });
    }

    // Suggest upgrade if user is using services heavily
    if (tier === 'STARTER' && usage.servicesUsed >= 8) {
      warnings.push({
        type: 'UPGRADE_SUGGESTED',
        message: 'Based on your usage patterns, upgrading to HOMECARE could provide better value and higher limits.',
        actionRequired: false,
        suggestedTier: 'HOMECARE'
      });
    } else if (tier === 'HOMECARE' && usage.servicesUsed >= 15) {
      warnings.push({
        type: 'UPGRADE_SUGGESTED',
        message: 'Based on your usage patterns, upgrading to PRIORITY could provide better value and unlimited access.',
        actionRequired: false,
        suggestedTier: 'PRIORITY'
      });
    }

    return warnings;
  }

  // Update perk availability based on usage
  updatePerkAvailability(userId, tier, usage) {
    const limits = this.getLimitsForTier(tier);
    const perkUpdates = [];

    // Priority booking availability
    perkUpdates.push({
      perkType: 'priority_booking',
      available: usage.priorityBookings < limits.maxPriorityBookings,
      usageCount: usage.priorityBookings,
      limit: limits.maxPriorityBookings,
      resetDate: this.getNextResetDate(),
      message: usage.priorityBookings >= limits.maxPriorityBookings 
        ? 'Priority booking limit reached for this period'
        : `${limits.maxPriorityBookings - usage.priorityBookings} priority bookings remaining`
    });

    // Emergency service availability
    perkUpdates.push({
      perkType: 'emergency_service',
      available: usage.emergencyServices < limits.maxEmergencyServices,
      usageCount: usage.emergencyServices,
      limit: limits.maxEmergencyServices,
      resetDate: this.getNextResetDate(),
      message: limits.maxEmergencyServices === 0 
        ? 'Emergency services not included in your plan'
        : usage.emergencyServices >= limits.maxEmergencyServices
        ? 'Emergency service limit reached for this period'
        : `${limits.maxEmergencyServices - usage.emergencyServices} emergency services remaining`
    });

    // Discount availability
    perkUpdates.push({
      perkType: 'discount',
      available: usage.discountsSaved < limits.maxDiscountAmount,
      usageCount: usage.discountsSaved,
      limit: limits.maxDiscountAmount,
      resetDate: this.getNextResetDate(),
      message: usage.discountsSaved >= limits.maxDiscountAmount
        ? 'Discount savings limit reached for this period'
        : `$${limits.maxDiscountAmount - usage.discountsSaved} in discounts remaining`
    });

    // Send perk updates
    perkUpdates.forEach(perk => {
      socketService.notifyCustomerPerkUpdate(userId, perk);
    });

    return perkUpdates;
  }

  // Get next reset date (first day of next month)
  getNextResetDate() {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return nextMonth.toISOString();
  }

  // Simulate usage for testing
  async simulateUsage(userId, subscriptionTier = 'HOMECARE') {
    try {
      // Simulate various service usages
      await this.trackServiceUsage(userId, 'regular_service', subscriptionTier);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await this.trackServiceUsage(userId, 'priority_booking', subscriptionTier);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await this.trackDiscountUsage(userId, 50, subscriptionTier);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (subscriptionTier !== 'STARTER') {
        await this.trackServiceUsage(userId, 'emergency_service', subscriptionTier);
      }

      usageLogger.info('Usage simulation completed', { userId, subscriptionTier });
    } catch (error) {
      usageLogger.error('Usage simulation failed', { userId, error: error.message });
    }
  }

  // Reset usage for new period
  resetUsageForPeriod(userId) {
    const currentPeriod = new Date().toISOString().slice(0, 7);
    this.userUsageCache.set(userId, {
      subscriptionId: `sub_${userId}`,
      period: currentPeriod,
      servicesUsed: 0,
      discountsSaved: 0,
      priorityBookings: 0,
      emergencyServices: 0
    });

    usageLogger.info('Usage reset for new period', { userId, period: currentPeriod });
  }

  // Get usage statistics
  getUsageStats() {
    const stats = {
      totalUsers: this.userUsageCache.size,
      totalServices: 0,
      totalSavings: 0,
      averageServicesPerUser: 0
    };

    for (const usage of this.userUsageCache.values()) {
      stats.totalServices += usage.servicesUsed;
      stats.totalSavings += usage.discountsSaved;
    }

    if (stats.totalUsers > 0) {
      stats.averageServicesPerUser = Math.round(stats.totalServices / stats.totalUsers * 100) / 100;
    }

    return stats;
  }
}

export default new UsageTrackingService();