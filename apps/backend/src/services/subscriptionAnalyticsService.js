import prisma from '../config/database.js';

class SubscriptionAnalyticsService {
  constructor(prismaClient = prisma) {
    this.prisma = prismaClient;
  }

  /**
   * Calculate comprehensive subscription analytics
   * @param {Object} options - Analytics options
   * @returns {Object} Analytics data
   */
  async getSubscriptionAnalytics(options = {}) {
    const { timeRange = '30d' } = options;
    const { startDate, endDate } = this.getDateRange(timeRange);

    const [
      revenueData,
      subscriptionData,
      customerData,
      churnData
    ] = await Promise.all([
      this.getRevenueAnalytics(startDate, endDate),
      this.getSubscriptionAnalytics(startDate, endDate),
      this.getCustomerAnalytics(startDate, endDate),
      this.getChurnAnalytics(startDate, endDate)
    ]);

    return {
      revenue: revenueData,
      subscriptions: subscriptionData,
      customers: customerData,
      churn: churnData,
      timeRange,
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Get revenue analytics
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Object} Revenue data
   */
  async getRevenueAnalytics(startDate, endDate) {
    // Get current period revenue
    const currentRevenue = await this.calculatePeriodRevenue(startDate, endDate);
    
    // Get previous period for comparison
    const periodLength = endDate.getTime() - startDate.getTime();
    const prevStartDate = new Date(startDate.getTime() - periodLength);
    const prevEndDate = new Date(endDate.getTime() - periodLength);
    const previousRevenue = await this.calculatePeriodRevenue(prevStartDate, prevEndDate);

    // Calculate growth
    const growth = previousRevenue > 0 
      ? ((currentRevenue.total - previousRevenue.total) / previousRevenue.total) * 100 
      : 0;

    // Get revenue by tier
    const revenueByTier = await this.getRevenueByTier(startDate, endDate);

    // Get monthly trend
    const monthlyTrend = await this.getMonthlyRevenueTrend(startDate, endDate);

    return {
      total: currentRevenue.total,
      monthly: currentRevenue.monthly,
      growth,
      byTier: revenueByTier,
      trend: monthlyTrend
    };
  }

  /**
   * Get subscription analytics
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Object} Subscription data
   */
  async getSubscriptionAnalytics(startDate, endDate) {
    const [
      totalSubs,
      activeSubs,
      newSubs,
      cancellations,
      statusBreakdown
    ] = await Promise.all([
      this.prisma.subscription.count(),
      this.prisma.subscription.count({ where: { status: 'ACTIVE' } }),
      this.prisma.subscription.count({
        where: {
          createdAt: { gte: startDate, lte: endDate }
        }
      }),
      this.prisma.subscription.count({
        where: {
          status: 'CANCELLED',
          updatedAt: { gte: startDate, lte: endDate }
        }
      }),
      this.getSubscriptionStatusBreakdown()
    ]);

    const churnRate = activeSubs > 0 ? (cancellations / activeSubs) : 0;

    return {
      total: totalSubs,
      active: activeSubs,
      churnRate,
      newSubscriptions: newSubs,
      cancellations,
      byStatus: statusBreakdown
    };
  }

  /**
   * Get customer analytics including lifetime value
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Object} Customer data
   */
  async getCustomerAnalytics(startDate, endDate) {
    // Calculate average lifetime value
    const lifetimeValues = await this.calculateLifetimeValues();
    const averageLifetimeValue = lifetimeValues.reduce((sum, ltv) => sum + ltv.value, 0) / lifetimeValues.length || 0;

    // Calculate average monthly spend
    const averageMonthlySpend = await this.calculateAverageMonthlySpend(startDate, endDate);

    // Calculate retention rate
    const retentionRate = await this.calculateRetentionRate(startDate, endDate);

    // Get top customers by LTV
    const topCustomers = await this.getTopCustomersByLTV(10);

    return {
      averageLifetimeValue,
      averageMonthlySpend,
      retentionRate,
      topCustomers
    };
  }

  /**
   * Get churn analytics
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Object} Churn data
   */
  async getChurnAnalytics(startDate, endDate) {
    const [
      totalAtRisk,
      riskDistribution,
      potentialRevenueLoss,
      trendsLastMonth
    ] = await Promise.all([
      this.getTotalAtRiskCustomers(),
      this.getChurnRiskDistribution(),
      this.calculatePotentialRevenueLoss(),
      this.getChurnTrendsLastMonth()
    ]);

    const averageRiskScore = await this.getAverageRiskScore();

    return {
      totalAtRisk,
      highRisk: riskDistribution.high,
      mediumRisk: riskDistribution.medium,
      lowRisk: riskDistribution.low,
      potentialRevenueLoss,
      averageRiskScore,
      trendsLastMonth
    };
  }

  /**
   * Calculate lifetime value for all customers
   * @returns {Array} Array of customer lifetime values
   */
  async calculateLifetimeValues() {
    const subscriptions = await this.prisma.subscription.findMany({
      include: {
        user: true,
        billingAdjustments: {
          where: { status: 'PROCESSED' }
        }
      }
    });

    const lifetimeValues = [];

    for (const subscription of subscriptions) {
      const ltv = await this.calculateCustomerLifetimeValue(subscription);
      lifetimeValues.push({
        userId: subscription.userId,
        email: subscription.user.email,
        value: ltv
      });

      // Update the subscription record with calculated LTV
      await this.prisma.subscription.update({
        where: { id: subscription.id },
        data: { lifetimeValue: ltv }
      });
    }

    return lifetimeValues;
  }

  /**
   * Calculate lifetime value for a specific customer
   * @param {Object} subscription - Subscription object with user and billing data
   * @returns {number} Lifetime value
   */
  async calculateCustomerLifetimeValue(subscription) {
    const subscriptionAge = this.getSubscriptionAgeInMonths(subscription.createdAt);
    
    // Base monthly revenue from subscription tier
    const tierPricing = {
      'STARTER': 29,
      'HOMECARE': 79,
      'PRIORITY': 149
    };
    
    const monthlyRevenue = tierPricing[subscription.tier] || 0;
    
    // Calculate total revenue from subscription
    let totalRevenue = monthlyRevenue * subscriptionAge;
    
    // Add revenue from billing adjustments (additional charges)
    const additionalCharges = subscription.billingAdjustments
      .filter(adj => adj.type === 'debit')
      .reduce((sum, adj) => sum + adj.amount, 0);
    
    // Subtract refunds and credits
    const refundsAndCredits = subscription.billingAdjustments
      .filter(adj => ['credit', 'refund'].includes(adj.type))
      .reduce((sum, adj) => sum + adj.amount, 0);
    
    totalRevenue = totalRevenue + additionalCharges - refundsAndCredits;
    
    // Calculate predicted future value based on churn risk
    const churnRiskScore = subscription.churnRiskScore || 0.5;
    const predictedMonthsRemaining = this.predictRemainingLifetime(churnRiskScore, subscriptionAge);
    const predictedFutureValue = monthlyRevenue * predictedMonthsRemaining;
    
    return Math.max(0, totalRevenue + predictedFutureValue);
  }

  /**
   * Predict remaining customer lifetime based on churn risk
   * @param {number} churnRiskScore - Churn risk score (0-1)
   * @param {number} currentAge - Current subscription age in months
   * @returns {number} Predicted remaining months
   */
  predictRemainingLifetime(churnRiskScore, currentAge) {
    // Base prediction: customers typically stay 24 months on average
    const baseLifetime = 24;
    
    // Adjust based on churn risk (higher risk = shorter predicted lifetime)
    const riskAdjustment = (1 - churnRiskScore) * baseLifetime;
    
    // Loyalty bonus: customers who have stayed longer are likely to stay longer
    const loyaltyBonus = Math.min(currentAge * 0.5, 12);
    
    return Math.max(1, riskAdjustment + loyaltyBonus);
  }

  /**
   * Calculate average monthly spend
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {number} Average monthly spend
   */
  async calculateAverageMonthlySpend(startDate, endDate) {
    const revenue = await this.calculatePeriodRevenue(startDate, endDate);
    const monthsDiff = this.getMonthsDifference(startDate, endDate);
    return monthsDiff > 0 ? revenue.total / monthsDiff : 0;
  }

  /**
   * Calculate retention rate
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {number} Retention rate (0-1)
   */
  async calculateRetentionRate(startDate, endDate) {
    const startOfPeriod = await this.prisma.subscription.count({
      where: {
        status: 'ACTIVE',
        createdAt: { lt: startDate }
      }
    });

    const endOfPeriod = await this.prisma.subscription.count({
      where: {
        status: 'ACTIVE',
        createdAt: { lt: startDate },
        updatedAt: { gte: endDate }
      }
    });

    return startOfPeriod > 0 ? endOfPeriod / startOfPeriod : 0;
  }

  /**
   * Get top customers by lifetime value
   * @param {number} limit - Number of customers to return
   * @returns {Array} Top customers
   */
  async getTopCustomersByLTV(limit = 10) {
    const subscriptions = await this.prisma.subscription.findMany({
      where: { lifetimeValue: { gt: 0 } },
      include: { user: true },
      orderBy: { lifetimeValue: 'desc' },
      take: limit
    });

    return subscriptions.map(sub => ({
      email: sub.user.email,
      tier: sub.tier,
      lifetimeValue: sub.lifetimeValue,
      monthsActive: this.getSubscriptionAgeInMonths(sub.createdAt)
    }));
  }

  /**
   * Calculate period revenue
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Object} Revenue data
   */
  async calculatePeriodRevenue(startDate, endDate) {
    // This is a simplified calculation - in a real system you'd integrate with Stripe
    const activeSubscriptions = await this.prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        createdAt: { lte: endDate }
      }
    });

    const tierPricing = {
      'STARTER': 29,
      'HOMECARE': 79,
      'PRIORITY': 149
    };

    let total = 0;
    for (const sub of activeSubscriptions) {
      const monthlyPrice = tierPricing[sub.tier] || 0;
      const monthsInPeriod = Math.min(
        this.getMonthsDifference(startDate, endDate),
        this.getMonthsDifference(sub.createdAt, endDate)
      );
      total += monthlyPrice * monthsInPeriod;
    }

    const monthsDiff = this.getMonthsDifference(startDate, endDate);
    const monthly = monthsDiff > 0 ? total / monthsDiff : 0;

    return { total, monthly };
  }

  /**
   * Get revenue breakdown by tier
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Array} Revenue by tier
   */
  async getRevenueByTier(startDate, endDate) {
    const subscriptionsByTier = await this.prisma.subscription.groupBy({
      by: ['tier'],
      where: {
        status: 'ACTIVE',
        createdAt: { lte: endDate }
      },
      _count: { tier: true }
    });

    const tierPricing = {
      'STARTER': 29,
      'HOMECARE': 79,
      'PRIORITY': 149
    };

    return subscriptionsByTier.map(group => ({
      tier: group.tier,
      count: group._count.tier,
      revenue: (tierPricing[group.tier] || 0) * group._count.tier * this.getMonthsDifference(startDate, endDate)
    }));
  }

  /**
   * Get monthly revenue trend
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Array} Monthly trend data
   */
  async getMonthlyRevenueTrend(startDate, endDate) {
    const months = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      const monthStart = new Date(current.getFullYear(), current.getMonth(), 1);
      const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);
      
      const revenue = await this.calculatePeriodRevenue(monthStart, monthEnd);
      const subscriptionCount = await this.prisma.subscription.count({
        where: {
          status: 'ACTIVE',
          createdAt: { lte: monthEnd }
        }
      });

      months.push({
        month: monthStart.toISOString().substring(0, 7), // YYYY-MM format
        revenue: revenue.total,
        subscriptions: subscriptionCount
      });

      current.setMonth(current.getMonth() + 1);
    }

    return months;
  }

  /**
   * Get subscription status breakdown
   * @returns {Array} Status breakdown
   */
  async getSubscriptionStatusBreakdown() {
    const statusGroups = await this.prisma.subscription.groupBy({
      by: ['status'],
      _count: { status: true }
    });

    return statusGroups.map(group => ({
      status: group.status,
      count: group._count.status
    }));
  }

  /**
   * Get total at-risk customers
   * @returns {number} Count of at-risk customers
   */
  async getTotalAtRiskCustomers() {
    return await this.prisma.subscription.count({
      where: {
        status: 'ACTIVE',
        churnRiskScore: { gte: 0.4 } // Medium risk and above
      }
    });
  }

  /**
   * Get churn risk distribution
   * @returns {Object} Risk distribution
   */
  async getChurnRiskDistribution() {
    const [high, medium, low] = await Promise.all([
      this.prisma.subscription.count({
        where: { status: 'ACTIVE', churnRiskScore: { gte: 0.7 } }
      }),
      this.prisma.subscription.count({
        where: { status: 'ACTIVE', churnRiskScore: { gte: 0.4, lt: 0.7 } }
      }),
      this.prisma.subscription.count({
        where: { status: 'ACTIVE', churnRiskScore: { lt: 0.4 } }
      })
    ]);

    return { high, medium, low };
  }

  /**
   * Calculate potential revenue loss from churn
   * @returns {number} Potential revenue loss
   */
  async calculatePotentialRevenueLoss() {
    const highRiskSubscriptions = await this.prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        churnRiskScore: { gte: 0.7 }
      }
    });

    const tierPricing = {
      'STARTER': 29,
      'HOMECARE': 79,
      'PRIORITY': 149
    };

    return highRiskSubscriptions.reduce((total, sub) => {
      const monthlyRevenue = tierPricing[sub.tier] || 0;
      // Assume 12 months of lost revenue per churned customer
      return total + (monthlyRevenue * 12);
    }, 0);
  }

  /**
   * Get churn trends for last month
   * @returns {Object} Churn trends
   */
  async getChurnTrendsLastMonth() {
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const thisMonth = new Date();

    const [newHighRisk, improved, churned] = await Promise.all([
      this.prisma.subscription.count({
        where: {
          churnRiskScore: { gte: 0.7 },
          updatedAt: { gte: lastMonth, lte: thisMonth }
        }
      }),
      this.prisma.subscription.count({
        where: {
          churnRiskScore: { lt: 0.4 },
          updatedAt: { gte: lastMonth, lte: thisMonth }
        }
      }),
      this.prisma.subscription.count({
        where: {
          status: 'CANCELLED',
          updatedAt: { gte: lastMonth, lte: thisMonth }
        }
      })
    ]);

    return { newHighRisk, improved, churned };
  }

  /**
   * Get average risk score
   * @returns {number} Average risk score
   */
  async getAverageRiskScore() {
    const result = await this.prisma.subscription.aggregate({
      where: { status: 'ACTIVE' },
      _avg: { churnRiskScore: true }
    });

    return result._avg.churnRiskScore || 0;
  }

  /**
   * Get date range based on time range string
   * @param {string} timeRange - Time range (7d, 30d, 90d, 1y)
   * @returns {Object} Start and end dates
   */
  getDateRange(timeRange) {
    const endDate = new Date();
    const startDate = new Date();

    switch (timeRange) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }

    return { startDate, endDate };
  }

  /**
   * Get subscription age in months
   * @param {Date} createdAt - Creation date
   * @returns {number} Age in months
   */
  getSubscriptionAgeInMonths(createdAt) {
    const now = new Date();
    const created = new Date(createdAt);
    return (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24 * 30);
  }

  /**
   * Get difference in months between two dates
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {number} Difference in months
   */
  getMonthsDifference(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  }

  /**
   * Export analytics data to CSV
   * @param {Object} options - Export options
   * @returns {string} CSV data
   */
  async exportAnalytics(options = {}) {
    const analytics = await this.getSubscriptionAnalytics(options);
    
    // Create CSV headers
    const headers = [
      'Metric',
      'Value',
      'Period',
      'Generated At'
    ];

    // Create CSV rows
    const rows = [
      ['Total Revenue', analytics.revenue.total, options.timeRange, analytics.generatedAt],
      ['Monthly Revenue', analytics.revenue.monthly, options.timeRange, analytics.generatedAt],
      ['Revenue Growth', `${analytics.revenue.growth.toFixed(2)}%`, options.timeRange, analytics.generatedAt],
      ['Active Subscriptions', analytics.subscriptions.active, options.timeRange, analytics.generatedAt],
      ['Churn Rate', `${(analytics.subscriptions.churnRate * 100).toFixed(2)}%`, options.timeRange, analytics.generatedAt],
      ['Average LTV', analytics.customers.averageLifetimeValue.toFixed(2), options.timeRange, analytics.generatedAt],
      ['Retention Rate', `${(analytics.customers.retentionRate * 100).toFixed(2)}%`, options.timeRange, analytics.generatedAt],
      ['At Risk Customers', analytics.churn.totalAtRisk, options.timeRange, analytics.generatedAt],
      ['Potential Revenue Loss', analytics.churn.potentialRevenueLoss, options.timeRange, analytics.generatedAt]
    ];

    // Convert to CSV format
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    return csvContent;
  }
}

export default SubscriptionAnalyticsService;