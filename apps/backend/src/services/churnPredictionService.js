class ChurnPredictionService {
  constructor(prismaClient) {
    this.prisma = prismaClient;
  }

  /**
   * Calculate churn risk score for a specific user
   * @param {string} userId - User ID to analyze
   * @returns {Object} Churn risk analysis
   */
  async calculateChurnRiskScore(userId) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscription: {
          include: {
            subscriptionPauses: true,
            additionalProperties: true
          }
        },
        subscriptionUsage: true,
        rewardCredits: true
      }
    });

    if (!user || !user.subscription) {
      return { riskScore: 0, factors: [], recommendation: 'No active subscription' };
    }

    let riskScore = 0;
    const riskFactors = [];
    const protectiveFactors = [];

    // Factor 1: Subscription age (newer subscriptions have higher churn risk)
    const subscriptionAge = this.getSubscriptionAgeInMonths(user.subscription.createdAt);
    if (subscriptionAge < 3) {
      riskScore += 25;
      riskFactors.push({
        factor: 'New subscription',
        impact: 25,
        description: 'Subscription is less than 3 months old'
      });
    } else if (subscriptionAge > 12) {
      riskScore -= 10;
      protectiveFactors.push({
        factor: 'Loyal customer',
        impact: -10,
        description: 'Subscription is over 12 months old'
      });
    }

    // Factor 2: Payment frequency (yearly subscribers are less likely to churn)
    if (user.subscription.paymentFrequency === 'YEARLY') {
      riskScore -= 15;
      protectiveFactors.push({
        factor: 'Annual payment',
        impact: -15,
        description: 'Yearly subscribers have lower churn rates'
      });
    }

    // Factor 3: Subscription pauses (multiple pauses indicate higher risk)
    const pauseCount = user.subscription.subscriptionPauses.length;
    if (pauseCount > 2) {
      riskScore += 20;
      riskFactors.push({
        factor: 'Multiple pauses',
        impact: 20,
        description: `Subscription has been paused ${pauseCount} times`
      });
    } else if (pauseCount === 1) {
      riskScore += 10;
      riskFactors.push({
        factor: 'Previous pause',
        impact: 10,
        description: 'Subscription has been paused once'
      });
    }

    // Factor 4: Perk utilization (low usage indicates higher churn risk)
    if (user.subscriptionUsage) {
      const perkUsageScore = this.calculatePerkUsageScore(user.subscriptionUsage);
      if (perkUsageScore < 0.3) {
        riskScore += 15;
        riskFactors.push({
          factor: 'Low perk utilization',
          impact: 15,
          description: 'Customer rarely uses subscription perks'
        });
      } else if (perkUsageScore > 0.7) {
        riskScore -= 10;
        protectiveFactors.push({
          factor: 'High perk utilization',
          impact: -10,
          description: 'Customer actively uses subscription perks'
        });
      }
    }

    // Factor 5: Additional properties (indicates higher engagement)
    if (user.subscription.additionalProperties.length > 0) {
      riskScore -= 20;
      protectiveFactors.push({
        factor: 'Multiple properties',
        impact: -20,
        description: `Customer has ${user.subscription.additionalProperties.length} additional properties`
      });
    }

    // Factor 6: Reward credits (engaged customers earn more credits)
    const totalCredits = user.rewardCredits.reduce((sum, credit) => sum + credit.amount, 0);
    if (totalCredits > 50) {
      riskScore -= 10;
      protectiveFactors.push({
        factor: 'High reward engagement',
        impact: -10,
        description: `Customer has earned $${totalCredits} in rewards`
      });
    }

    // Factor 7: Recent booking activity
    const recentBookings = await this.getRecentBookingActivity(userId);
    if (recentBookings === 0) {
      riskScore += 20;
      riskFactors.push({
        factor: 'No recent bookings',
        impact: 20,
        description: 'No bookings in the last 60 days'
      });
    } else if (recentBookings > 3) {
      riskScore -= 5;
      protectiveFactors.push({
        factor: 'Active booking behavior',
        impact: -5,
        description: `${recentBookings} bookings in the last 60 days`
      });
    }

    // Factor 8: Subscription tier (higher tiers have lower churn)
    if (user.subscription.tier === 'PRIORITY') {
      riskScore -= 10;
      protectiveFactors.push({
        factor: 'Premium tier',
        impact: -10,
        description: 'Priority tier customers have lower churn rates'
      });
    } else if (user.subscription.tier === 'STARTER') {
      riskScore += 5;
      riskFactors.push({
        factor: 'Basic tier',
        impact: 5,
        description: 'Starter tier has higher churn rates'
      });
    }

    // Normalize risk score to 0-100 range
    riskScore = Math.max(0, Math.min(100, riskScore + 50));

    const riskLevel = this.getRiskLevel(riskScore);
    const recommendation = this.getRetentionRecommendation(riskScore, riskFactors);

    return {
      userId,
      riskScore: Math.round(riskScore * 100) / 100,
      riskLevel,
      riskFactors,
      protectiveFactors,
      recommendation,
      calculatedAt: new Date().toISOString()
    };
  }

  /**
   * Get churn risk scores for all active subscribers
   * @param {Object} options - Filter options
   * @returns {Array} Array of risk scores
   */
  async getBulkChurnRiskScores(options = {}) {
    const { limit = 100, riskThreshold = 70 } = options;

    const activeSubscriptions = await this.prisma.subscription.findMany({
      where: { status: 'ACTIVE' },
      include: { user: true },
      take: limit
    });

    const riskScores = [];
    for (const subscription of activeSubscriptions) {
      const riskAnalysis = await this.calculateChurnRiskScore(subscription.userId);
      if (riskAnalysis.riskScore >= riskThreshold) {
        riskScores.push(riskAnalysis);
      }
    }

    // Sort by risk score descending
    riskScores.sort((a, b) => b.riskScore - a.riskScore);

    return riskScores;
  }

  /**
   * Update churn risk scores in database
   * @param {string} userId - User ID
   * @param {number} riskScore - Calculated risk score
   */
  async updateChurnRiskScore(userId, riskScore) {
    await this.prisma.subscription.update({
      where: { userId },
      data: { churnRiskScore: riskScore }
    });
  }

  /**
   * Calculate subscription age in months
   * @param {Date} createdAt - Subscription creation date
   * @returns {number} Age in months
   */
  getSubscriptionAgeInMonths(createdAt) {
    const now = new Date();
    const created = new Date(createdAt);
    return (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24 * 30);
  }

  /**
   * Calculate perk usage score (0-1)
   * @param {Object} subscriptionUsage - Usage data
   * @returns {number} Usage score
   */
  calculatePerkUsageScore(subscriptionUsage) {
    const perksUsed = [
      subscriptionUsage.priorityBookingUsed,
      subscriptionUsage.discountUsed,
      subscriptionUsage.freeServiceUsed,
      subscriptionUsage.emergencyServiceUsed
    ].filter(Boolean).length;

    return perksUsed / 4; // Normalize to 0-1
  }

  /**
   * Get recent booking activity count
   * @param {string} userId - User ID
   * @returns {number} Number of recent bookings
   */
  async getRecentBookingActivity(userId) {
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    return await this.prisma.booking.count({
      where: {
        customerId: userId,
        createdAt: { gte: sixtyDaysAgo }
      }
    });
  }

  /**
   * Get risk level description
   * @param {number} riskScore - Risk score (0-100)
   * @returns {string} Risk level
   */
  getRiskLevel(riskScore) {
    if (riskScore >= 80) return 'CRITICAL';
    if (riskScore >= 60) return 'HIGH';
    if (riskScore >= 40) return 'MEDIUM';
    if (riskScore >= 20) return 'LOW';
    return 'MINIMAL';
  }

  /**
   * Get retention recommendation based on risk factors
   * @param {number} riskScore - Risk score
   * @param {Array} riskFactors - Array of risk factors
   * @returns {string} Recommendation
   */
  getRetentionRecommendation(riskScore, riskFactors) {
    if (riskScore >= 80) {
      return 'URGENT: Contact customer immediately with retention offer';
    }
    
    if (riskScore >= 60) {
      const hasLowUsage = riskFactors.some(f => f.factor === 'Low perk utilization');
      const hasNoBookings = riskFactors.some(f => f.factor === 'No recent bookings');
      
      if (hasLowUsage) {
        return 'Send perk utilization guide and offer free consultation';
      }
      if (hasNoBookings) {
        return 'Reach out with service reminders and seasonal offers';
      }
      return 'Proactive outreach with personalized offers recommended';
    }
    
    if (riskScore >= 40) {
      return 'Monitor closely and consider engagement campaigns';
    }
    
    return 'Customer appears stable, continue regular engagement';
  }
}

export default ChurnPredictionService;