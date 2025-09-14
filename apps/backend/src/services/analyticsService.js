class AnalyticsService {
  constructor(prismaClient) {
    this.prisma = prismaClient;
  }

  /**
   * Calculate churn rate by plan tier and payment frequency
   * @param {Object} options - Filter options
   * @returns {Object} Churn rate metrics
   */
  async calculateChurnRate(options = {}) {
    const { startDate, endDate, tier, paymentFrequency } = options;
    
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const whereClause = {
      ...dateFilter,
      ...(tier && { tier }),
      ...(paymentFrequency && { paymentFrequency })
    };

    // Get total subscriptions created in period
    const totalSubscriptions = await this.prisma.subscription.count({
      where: whereClause
    });

    // Get cancelled subscriptions in period
    const cancelledSubscriptions = await this.prisma.subscription.count({
      where: {
        ...whereClause,
        status: 'CANCELLED'
      }
    });

    // Calculate churn rate by tier
    const churnByTier = await this.prisma.subscription.groupBy({
      by: ['tier'],
      where: {
        ...dateFilter,
        status: 'CANCELLED'
      },
      _count: { tier: true }
    });

    // Calculate churn rate by payment frequency
    const churnByFrequency = await this.prisma.subscription.groupBy({
      by: ['paymentFrequency'],
      where: {
        ...dateFilter,
        status: 'CANCELLED'
      },
      _count: { paymentFrequency: true }
    });

    const overallChurnRate = totalSubscriptions > 0 ? 
      (cancelledSubscriptions / totalSubscriptions) * 100 : 0;

    return {
      overallChurnRate: Math.round(overallChurnRate * 100) / 100,
      totalSubscriptions,
      cancelledSubscriptions,
      churnByTier: churnByTier.map(item => ({
        tier: item.tier,
        count: item._count.tier,
        rate: totalSubscriptions > 0 ? 
          Math.round((item._count.tier / totalSubscriptions) * 10000) / 100 : 0
      })),
      churnByFrequency: churnByFrequency.map(item => ({
        frequency: item.paymentFrequency,
        count: item._count.paymentFrequency,
        rate: totalSubscriptions > 0 ? 
          Math.round((item._count.paymentFrequency / totalSubscriptions) * 10000) / 100 : 0
      }))
    };
  }

  /**
   * Calculate Customer Lifetime Value (CLV) analysis
   * @param {Object} options - Filter options
   * @returns {Object} CLV metrics
   */
  async calculateCustomerLifetimeValue(options = {}) {
    const { tier, paymentFrequency } = options;

    const whereClause = {
      status: 'ACTIVE',
      ...(tier && { tier }),
      ...(paymentFrequency && { paymentFrequency })
    };

    // Get all active subscriptions with user data
    const subscriptions = await this.prisma.subscription.findMany({
      where: whereClause,
      include: {
        user: true,
        additionalProperties: true
      }
    });

    // Calculate average subscription duration (in months)
    const now = new Date();
    let totalDurationMonths = 0;
    let totalRevenue = 0;
    let validSubscriptions = 0;

    const clvByTier = {};
    const clvByFrequency = {};

    for (const subscription of subscriptions) {
      const createdAt = new Date(subscription.createdAt);
      const durationMonths = Math.max(1, 
        (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30)
      );

      // Calculate monthly revenue based on tier and frequency
      let monthlyRevenue = this.getBasePriceByTier(subscription.tier);
      
      // Adjust for payment frequency discounts
      if (subscription.paymentFrequency === 'YEARLY') {
        monthlyRevenue *= 0.9; // 10% discount for yearly
      }

      // Add additional property fees
      const additionalPropertyRevenue = subscription.additionalProperties.length * 
        (monthlyRevenue * 0.5);
      monthlyRevenue += additionalPropertyRevenue;

      const lifetimeValue = monthlyRevenue * durationMonths;

      totalDurationMonths += durationMonths;
      totalRevenue += lifetimeValue;
      validSubscriptions++;

      // Group by tier
      if (!clvByTier[subscription.tier]) {
        clvByTier[subscription.tier] = { total: 0, count: 0 };
      }
      clvByTier[subscription.tier].total += lifetimeValue;
      clvByTier[subscription.tier].count++;

      // Group by frequency
      if (!clvByFrequency[subscription.paymentFrequency]) {
        clvByFrequency[subscription.paymentFrequency] = { total: 0, count: 0 };
      }
      clvByFrequency[subscription.paymentFrequency].total += lifetimeValue;
      clvByFrequency[subscription.paymentFrequency].count++;
    }

    const averageCLV = validSubscriptions > 0 ? totalRevenue / validSubscriptions : 0;
    const averageDuration = validSubscriptions > 0 ? totalDurationMonths / validSubscriptions : 0;

    return {
      averageCLV: Math.round(averageCLV * 100) / 100,
      averageDurationMonths: Math.round(averageDuration * 100) / 100,
      totalActiveSubscriptions: validSubscriptions,
      totalMonthlyRevenue: Math.round(totalRevenue * 100) / 100,
      clvByTier: Object.entries(clvByTier).map(([tier, data]) => ({
        tier,
        averageCLV: Math.round((data.total / data.count) * 100) / 100,
        count: data.count
      })),
      clvByFrequency: Object.entries(clvByFrequency).map(([frequency, data]) => ({
        frequency,
        averageCLV: Math.round((data.total / data.count) * 100) / 100,
        count: data.count
      }))
    };
  }

  /**
   * Get revenue trends analysis
   * @param {Object} options - Filter options
   * @returns {Object} Revenue trend metrics
   */
  async getRevenueTrends(options = {}) {
    const { months = 12 } = options;
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    // Get monthly revenue data
    const monthlyData = [];
    for (let i = 0; i < months; i++) {
      const monthStart = new Date(startDate);
      monthStart.setMonth(monthStart.getMonth() + i);
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);

      const subscriptions = await this.prisma.subscription.findMany({
        where: {
          createdAt: {
            gte: monthStart,
            lt: monthEnd
          },
          status: { in: ['ACTIVE', 'CANCELLED'] }
        },
        include: {
          additionalProperties: true
        }
      });

      let monthlyRevenue = 0;
      let newSubscriptions = 0;
      let cancelledSubscriptions = 0;

      for (const subscription of subscriptions) {
        const basePrice = this.getBasePriceByTier(subscription.tier);
        let revenue = basePrice;

        if (subscription.paymentFrequency === 'YEARLY') {
          revenue *= 0.9 * 12; // Yearly discount and full year
        }

        revenue += subscription.additionalProperties.length * (basePrice * 0.5);
        monthlyRevenue += revenue;

        if (subscription.status === 'ACTIVE') {
          newSubscriptions++;
        } else if (subscription.status === 'CANCELLED') {
          cancelledSubscriptions++;
        }
      }

      monthlyData.push({
        month: monthStart.toISOString().slice(0, 7), // YYYY-MM format
        revenue: Math.round(monthlyRevenue * 100) / 100,
        newSubscriptions,
        cancelledSubscriptions,
        netGrowth: newSubscriptions - cancelledSubscriptions
      });
    }

    // Calculate growth rates
    const revenueGrowthRates = [];
    for (let i = 1; i < monthlyData.length; i++) {
      const current = monthlyData[i].revenue;
      const previous = monthlyData[i - 1].revenue;
      const growthRate = previous > 0 ? ((current - previous) / previous) * 100 : 0;
      revenueGrowthRates.push({
        month: monthlyData[i].month,
        growthRate: Math.round(growthRate * 100) / 100
      });
    }

    return {
      monthlyData,
      revenueGrowthRates,
      totalRevenue: monthlyData.reduce((sum, month) => sum + month.revenue, 0),
      averageMonthlyRevenue: monthlyData.length > 0 ? 
        monthlyData.reduce((sum, month) => sum + month.revenue, 0) / monthlyData.length : 0
    };
  }

  /**
   * Calculate perk utilization rates
   * @returns {Object} Perk utilization metrics
   */
  async getPerkUtilization() {
    const totalUsage = await this.prisma.subscriptionUsage.count();
    
    const perkUsage = await this.prisma.subscriptionUsage.aggregate({
      _count: {
        priorityBookingUsed: true,
        discountUsed: true,
        freeServiceUsed: true,
        emergencyServiceUsed: true
      },
      where: {
        OR: [
          { priorityBookingUsed: true },
          { discountUsed: true },
          { freeServiceUsed: true },
          { emergencyServiceUsed: true }
        ]
      }
    });

    // Get usage by tier
    const usageByTier = await this.prisma.subscriptionUsage.groupBy({
      by: ['tier'],
      _count: {
        priorityBookingUsed: true,
        discountUsed: true,
        freeServiceUsed: true,
        emergencyServiceUsed: true
      },
      where: {
        OR: [
          { priorityBookingUsed: true },
          { discountUsed: true },
          { freeServiceUsed: true },
          { emergencyServiceUsed: true }
        ]
      }
    });

    const utilizationRates = {
      priorityBooking: totalUsage > 0 ? 
        (perkUsage._count.priorityBookingUsed / totalUsage) * 100 : 0,
      discount: totalUsage > 0 ? 
        (perkUsage._count.discountUsed / totalUsage) * 100 : 0,
      freeService: totalUsage > 0 ? 
        (perkUsage._count.freeServiceUsed / totalUsage) * 100 : 0,
      emergencyService: totalUsage > 0 ? 
        (perkUsage._count.emergencyServiceUsed / totalUsage) * 100 : 0
    };

    return {
      totalSubscriptionsWithUsage: totalUsage,
      utilizationRates: Object.entries(utilizationRates).map(([perk, rate]) => ({
        perk,
        utilizationRate: Math.round(rate * 100) / 100
      })),
      usageByTier: usageByTier.map(tier => ({
        tier: tier.tier,
        priorityBookingUsage: tier._count.priorityBookingUsed,
        discountUsage: tier._count.discountUsed,
        freeServiceUsage: tier._count.freeServiceUsed,
        emergencyServiceUsage: tier._count.emergencyServiceUsed
      }))
    };
  }

  /**
   * Helper method to get base price by tier
   * @param {string} tier - Subscription tier
   * @returns {number} Base monthly price
   */
  getBasePriceByTier(tier) {
    const prices = {
      'STARTER': 29.99,
      'HOMECARE': 49.99,
      'PRIORITY': 99.99
    };
    return prices[tier] || 0;
  }
}

export default AnalyticsService;