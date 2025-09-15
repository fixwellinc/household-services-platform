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

  /**
   * Get churn predictions with enhanced data
   * @param {Object} options - Filter options
   * @returns {Array} Enhanced churn predictions
   */
  async getChurnPredictions(options = {}) {
    const { riskLevel = 'ALL', limit = 50 } = options;
    
    let whereClause = { status: 'ACTIVE' };
    
    if (riskLevel !== 'ALL') {
      const riskThresholds = {
        'CRITICAL': { gte: 0.8 },
        'HIGH': { gte: 0.6, lt: 0.8 },
        'MEDIUM': { gte: 0.4, lt: 0.6 },
        'LOW': { lt: 0.4 }
      };
      
      if (riskThresholds[riskLevel]) {
        whereClause.churnRiskScore = riskThresholds[riskLevel];
      }
    }

    const subscriptions = await this.prisma.subscription.findMany({
      where: whereClause,
      include: {
        user: true,
        subscriptionPauses: true,
        additionalProperties: true,
        subscriptionUsage: true,
        rewardCredits: true
      },
      orderBy: { churnRiskScore: 'desc' },
      take: limit
    });

    const predictions = [];
    
    for (const subscription of subscriptions) {
      const riskAnalysis = await this.calculateChurnRiskScore(subscription.userId);
      const lifetimeValue = await this.calculateLifetimeValue(subscription);
      const predictedChurnDate = this.predictChurnDate(riskAnalysis.riskScore);
      const recommendedActions = this.getRecommendedActions(riskAnalysis);

      predictions.push({
        id: subscription.id,
        userId: subscription.userId,
        email: subscription.user.email,
        name: subscription.user.name,
        tier: subscription.tier,
        churnRiskScore: riskAnalysis.riskScore / 100, // Convert to 0-1 scale
        riskLevel: riskAnalysis.riskLevel,
        lifetimeValue,
        monthsActive: this.getSubscriptionAgeInMonths(subscription.createdAt),
        lastActivity: subscription.user.updatedAt,
        predictedChurnDate,
        riskFactors: riskAnalysis.riskFactors,
        recommendedActions
      });
    }

    return predictions;
  }

  /**
   * Calculate lifetime value for a subscription
   * @param {Object} subscription - Subscription object
   * @returns {number} Lifetime value
   */
  async calculateLifetimeValue(subscription) {
    const subscriptionAge = this.getSubscriptionAgeInMonths(subscription.createdAt);
    
    const tierPricing = {
      'STARTER': 29,
      'HOMECARE': 79,
      'PRIORITY': 149
    };
    
    const monthlyRevenue = tierPricing[subscription.tier] || 0;
    const historicalRevenue = monthlyRevenue * subscriptionAge;
    
    // Predict future value based on churn risk
    const churnRiskScore = subscription.churnRiskScore || 0.5;
    const predictedMonthsRemaining = this.predictRemainingLifetime(churnRiskScore, subscriptionAge);
    const predictedFutureValue = monthlyRevenue * predictedMonthsRemaining;
    
    return historicalRevenue + predictedFutureValue;
  }

  /**
   * Predict remaining customer lifetime
   * @param {number} churnRiskScore - Churn risk score (0-100)
   * @param {number} currentAge - Current age in months
   * @returns {number} Predicted remaining months
   */
  predictRemainingLifetime(churnRiskScore, currentAge) {
    const baseLifetime = 24;
    const riskAdjustment = (1 - (churnRiskScore / 100)) * baseLifetime;
    const loyaltyBonus = Math.min(currentAge * 0.5, 12);
    
    return Math.max(1, riskAdjustment + loyaltyBonus);
  }

  /**
   * Predict churn date based on risk score
   * @param {number} riskScore - Risk score (0-100)
   * @returns {string} Predicted churn date
   */
  predictChurnDate(riskScore) {
    const daysUntilChurn = Math.max(7, 365 * (1 - (riskScore / 100)));
    const churnDate = new Date();
    churnDate.setDate(churnDate.getDate() + daysUntilChurn);
    return churnDate.toISOString();
  }

  /**
   * Get recommended actions based on risk analysis
   * @param {Object} riskAnalysis - Risk analysis result
   * @returns {Array} Recommended actions
   */
  getRecommendedActions(riskAnalysis) {
    const actions = [];
    const { riskScore, riskFactors } = riskAnalysis;

    if (riskScore >= 80) {
      actions.push({
        action: 'Immediate personal outreach',
        priority: 'HIGH',
        description: 'Schedule urgent call with retention specialist',
        estimatedImpact: 0.7
      });
      actions.push({
        action: 'Offer significant discount',
        priority: 'HIGH',
        description: 'Provide 50% discount for next 3 months',
        estimatedImpact: 0.6
      });
    } else if (riskScore >= 60) {
      actions.push({
        action: 'Send retention email campaign',
        priority: 'MEDIUM',
        description: 'Personalized email with usage tips and offers',
        estimatedImpact: 0.4
      });
      
      if (riskFactors.some(f => f.factor === 'Low perk utilization')) {
        actions.push({
          action: 'Perk utilization guide',
          priority: 'MEDIUM',
          description: 'Send guide on maximizing subscription benefits',
          estimatedImpact: 0.3
        });
      }
    } else if (riskScore >= 40) {
      actions.push({
        action: 'Engagement campaign',
        priority: 'LOW',
        description: 'Include in next newsletter with tips and offers',
        estimatedImpact: 0.2
      });
    }

    return actions;
  }

  /**
   * Get churn metrics summary
   * @returns {Object} Churn metrics
   */
  async getChurnMetrics() {
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
   * Get total at-risk customers
   * @returns {number} Count of at-risk customers
   */
  async getTotalAtRiskCustomers() {
    return await this.prisma.subscription.count({
      where: {
        status: 'ACTIVE',
        churnRiskScore: { gte: 40 } // Medium risk and above
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
        where: { status: 'ACTIVE', churnRiskScore: { gte: 70 } }
      }),
      this.prisma.subscription.count({
        where: { status: 'ACTIVE', churnRiskScore: { gte: 40, lt: 70 } }
      }),
      this.prisma.subscription.count({
        where: { status: 'ACTIVE', churnRiskScore: { lt: 40 } }
      })
    ]);

    return { high, medium, low };
  }

  /**
   * Calculate potential revenue loss
   * @returns {number} Potential revenue loss
   */
  async calculatePotentialRevenueLoss() {
    const highRiskSubscriptions = await this.prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        churnRiskScore: { gte: 70 }
      }
    });

    const tierPricing = {
      'STARTER': 29,
      'HOMECARE': 79,
      'PRIORITY': 149
    };

    return highRiskSubscriptions.reduce((total, sub) => {
      const monthlyRevenue = tierPricing[sub.tier] || 0;
      return total + (monthlyRevenue * 12); // 12 months of lost revenue
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
          churnRiskScore: { gte: 70 },
          updatedAt: { gte: lastMonth, lte: thisMonth }
        }
      }),
      this.prisma.subscription.count({
        where: {
          churnRiskScore: { lt: 40 },
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
   * @returns {number} Average risk score (0-1)
   */
  async getAverageRiskScore() {
    const result = await this.prisma.subscription.aggregate({
      where: { status: 'ACTIVE' },
      _avg: { churnRiskScore: true }
    });

    return (result._avg.churnRiskScore || 0) / 100; // Convert to 0-1 scale
  }

  /**
   * Run automated retention workflow
   * @param {string} campaignType - Type of campaign to run
   * @param {Array} customerIds - Customer IDs to target
   * @returns {Object} Campaign result
   */
  async runRetentionCampaign(campaignType, customerIds) {
    const results = {
      success: true,
      processed: 0,
      failed: 0,
      errors: []
    };

    for (const customerId of customerIds) {
      try {
        await this.executeRetentionAction(campaignType, customerId);
        results.processed++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          customerId,
          error: error.message
        });
      }
    }

    if (results.failed > 0) {
      results.success = false;
    }

    return results;
  }

  /**
   * Execute specific retention action
   * @param {string} actionType - Type of action
   * @param {string} customerId - Customer ID
   */
  async executeRetentionAction(actionType, customerId) {
    const user = await this.prisma.user.findUnique({
      where: { id: customerId },
      include: { subscription: true }
    });

    if (!user || !user.subscription) {
      throw new Error('Customer or subscription not found');
    }

    switch (actionType) {
      case 'EMAIL':
        await this.sendRetentionEmail(user);
        break;
      case 'DISCOUNT':
        await this.applyRetentionDiscount(user.subscription);
        break;
      case 'CALL':
        await this.scheduleRetentionCall(user);
        break;
      case 'CREDIT':
        await this.applyAccountCredit(user.subscription);
        break;
      default:
        throw new Error(`Unknown retention action: ${actionType}`);
    }

    // Log the retention action
    await this.logRetentionAction(customerId, actionType);
  }

  /**
   * Send retention email
   * @param {Object} user - User object
   */
  async sendRetentionEmail(user) {
    // This would integrate with your email service
    console.log(`Sending retention email to ${user.email}`);
    
    // In a real implementation, you would:
    // 1. Get the appropriate email template
    // 2. Personalize the content
    // 3. Send via your email service (SendGrid, etc.)
    // 4. Track the email send
  }

  /**
   * Apply retention discount
   * @param {Object} subscription - Subscription object
   */
  async applyRetentionDiscount(subscription) {
    // Create a billing adjustment for the discount
    await this.prisma.billingAdjustment.create({
      data: {
        subscriptionId: subscription.id,
        type: 'discount',
        amount: 25, // $25 discount
        reason: 'Retention campaign discount',
        description: 'Automated retention discount applied',
        effectiveDate: new Date(),
        status: 'APPROVED',
        requiresApproval: false,
        createdBy: 'system' // System-generated
      }
    });
  }

  /**
   * Schedule retention call
   * @param {Object} user - User object
   */
  async scheduleRetentionCall(user) {
    // This would integrate with your CRM or scheduling system
    console.log(`Scheduling retention call for ${user.email}`);
    
    // In a real implementation, you would:
    // 1. Create a task in your CRM
    // 2. Assign to a retention specialist
    // 3. Set priority based on churn risk
    // 4. Track the call outcome
  }

  /**
   * Apply account credit
   * @param {Object} subscription - Subscription object
   */
  async applyAccountCredit(subscription) {
    // Create a credit transaction
    await this.prisma.creditTransaction.create({
      data: {
        subscriptionId: subscription.id,
        type: 'CREDIT',
        amount: 15, // $15 credit
        description: 'Retention campaign credit'
      }
    });

    // Update subscription available credits
    await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        availableCredits: {
          increment: 15
        }
      }
    });
  }

  /**
   * Log retention action
   * @param {string} customerId - Customer ID
   * @param {string} actionType - Action type
   */
  async logRetentionAction(customerId, actionType) {
    // This would log to your audit system
    console.log(`Retention action logged: ${actionType} for customer ${customerId}`);
    
    // In a real implementation, you would create an audit log entry
  }

  /**
   * Get retention campaigns
   * @returns {Array} Available retention campaigns
   */
  async getRetentionCampaigns() {
    // This would come from a database table in a real implementation
    return [
      {
        id: 'email_engagement',
        name: 'Email Engagement Campaign',
        type: 'EMAIL',
        targetRiskLevel: 'MEDIUM',
        description: 'Personalized email with usage tips and service reminders',
        isActive: true,
        successRate: 0.25,
        totalSent: 150,
        responses: 38
      },
      {
        id: 'discount_offer',
        name: 'Retention Discount Offer',
        type: 'DISCOUNT',
        targetRiskLevel: 'HIGH',
        description: '25% discount for next 2 months',
        isActive: true,
        successRate: 0.45,
        totalSent: 75,
        responses: 34
      },
      {
        id: 'personal_outreach',
        name: 'Personal Retention Call',
        type: 'CALL',
        targetRiskLevel: 'CRITICAL',
        description: 'Direct call from retention specialist',
        isActive: true,
        successRate: 0.65,
        totalSent: 25,
        responses: 16
      },
      {
        id: 'account_credit',
        name: 'Account Credit Bonus',
        type: 'CREDIT',
        targetRiskLevel: 'HIGH',
        description: '$15 account credit for immediate use',
        isActive: true,
        successRate: 0.35,
        totalSent: 50,
        responses: 18
      }
    ];
  }
}

export default ChurnPredictionService;