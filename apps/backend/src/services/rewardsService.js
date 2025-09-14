import prisma from '../config/database.js';

/**
 * RewardsService handles credit management, referral tracking, and loyalty programs
 * Implements referral rewards (one month free per referral) and loyalty milestones (12-month bonus)
 */
class RewardsService {
  constructor() {
    // Reward types
    this.REWARD_TYPES = {
      REFERRAL: 'REFERRAL',
      LOYALTY: 'LOYALTY', 
      BONUS: 'BONUS'
    };

    // Loyalty milestone configurations
    this.LOYALTY_MILESTONES = {
      12: { // 12 months
        type: 'FREE_SERVICE_VISIT',
        description: '12-month loyalty bonus: One free service visit',
        creditValue: 0 // This is a service credit, not monetary
      },
      24: { // 24 months
        type: 'PRIORITY_SERVICES',
        description: '24-month milestone: Priority emergency services',
        creditValue: 0
      },
      36: { // 36 months
        type: 'ADDITIONAL_DISCOUNT',
        description: '36-month milestone: Additional 5% discount on all services',
        creditValue: 0
      }
    };

    // Credit expiration settings
    this.CREDIT_EXPIRATION_MONTHS = 12; // Credits expire after 12 months
    this.REFERRAL_REVERSAL_MONTHS = 3; // Reverse referral if referee cancels within 3 months
  }

  /**
   * Process a referral and award credits to the referrer
   * @param {string} referrerId - ID of the user who made the referral
   * @param {string} refereeId - ID of the new user who was referred
   * @param {string} refereeSubscriptionId - Subscription ID of the referee
   * @returns {Object} Referral processing result
   */
  async processReferral(referrerId, refereeId, refereeSubscriptionId) {
    try {
      if (!prisma) {
        throw new Error('Database not configured');
      }

      // Validate inputs
      if (!referrerId || !refereeId || !refereeSubscriptionId) {
        throw new Error('Referrer ID, referee ID, and referee subscription ID are required');
      }

      // Prevent self-referrals
      if (referrerId === refereeId) {
        throw new Error('Users cannot refer themselves');
      }

      // Check if referrer exists and has an active subscription
      const referrer = await prisma.user.findUnique({
        where: { id: referrerId },
        include: { subscription: true }
      });

      if (!referrer) {
        throw new Error('Referrer not found');
      }

      if (!referrer.subscription || referrer.subscription.status !== 'ACTIVE') {
        throw new Error('Referrer must have an active subscription to earn referral rewards');
      }

      // Check if referee exists and has the specified subscription
      const referee = await prisma.user.findUnique({
        where: { id: refereeId },
        include: { subscription: true }
      });

      if (!referee) {
        throw new Error('Referee not found');
      }

      if (!referee.subscription || referee.subscription.id !== refereeSubscriptionId) {
        throw new Error('Invalid referee subscription');
      }

      // Check if referee has made their first payment (subscription is active)
      if (referee.subscription.status !== 'ACTIVE') {
        throw new Error('Referee must have an active subscription (first payment completed) to award referral credit');
      }

      // Check if this referral has already been processed
      const existingReferral = await prisma.rewardCredit.findFirst({
        where: {
          userId: referrerId,
          type: this.REWARD_TYPES.REFERRAL,
          description: {
            contains: refereeId
          }
        }
      });

      if (existingReferral) {
        throw new Error('Referral reward has already been processed for this referee');
      }

      // Calculate one month free credit (based on referrer's plan)
      const monthlyAmount = this.calculateMonthlySubscriptionAmount(referrer.subscription.tier);
      
      // Create expiration date (12 months from now)
      const expirationDate = new Date();
      expirationDate.setMonth(expirationDate.getMonth() + this.CREDIT_EXPIRATION_MONTHS);

      // Award referral credit
      const referralCredit = await prisma.rewardCredit.create({
        data: {
          userId: referrerId,
          amount: monthlyAmount,
          type: this.REWARD_TYPES.REFERRAL,
          description: `Referral reward: One month free for referring user ${refereeId}`,
          earnedAt: new Date(),
          expiresAt: expirationDate
        }
      });

      // Update referrer's available credits
      await prisma.subscription.update({
        where: { id: referrer.subscription.id },
        data: {
          availableCredits: {
            increment: monthlyAmount
          }
        }
      });

      return {
        success: true,
        referralCredit,
        creditAmount: monthlyAmount,
        expiresAt: expirationDate,
        message: `Referral reward of $${monthlyAmount.toFixed(2)} (one month free) awarded successfully`
      };

    } catch (error) {
      console.error('Error processing referral:', error);
      throw error;
    }
  }

  /**
   * Check and award loyalty milestones for a user
   * @param {string} userId - User ID to check for loyalty milestones
   * @returns {Object} Loyalty milestone check result
   */
  async checkLoyaltyMilestones(userId) {
    try {
      if (!prisma) {
        throw new Error('Database not configured');
      }

      if (!userId) {
        throw new Error('User ID is required');
      }

      // Get user with subscription
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { 
          subscription: true,
          rewardCredits: {
            where: { type: this.REWARD_TYPES.LOYALTY }
          }
        }
      });

      if (!user || !user.subscription) {
        throw new Error('User or subscription not found');
      }

      // Calculate subscription duration in months
      const subscriptionStart = user.subscription.createdAt;
      const now = new Date();
      const monthsDiff = this.calculateMonthsDifference(subscriptionStart, now);

      const awardedMilestones = [];
      const eligibleMilestones = [];

      // Check each milestone
      for (const [months, milestone] of Object.entries(this.LOYALTY_MILESTONES)) {
        const monthsRequired = parseInt(months);
        
        if (monthsDiff >= monthsRequired) {
          eligibleMilestones.push({ months: monthsRequired, ...milestone });
          
          // Check if this milestone has already been awarded
          const existingMilestone = user.rewardCredits.find(credit => 
            credit.description.includes(`${monthsRequired}-month`)
          );

          if (!existingMilestone) {
            // Award the milestone
            const milestoneCredit = await prisma.rewardCredit.create({
              data: {
                userId: userId,
                amount: milestone.creditValue,
                type: this.REWARD_TYPES.LOYALTY,
                description: `${monthsRequired}-month ${milestone.description}`,
                earnedAt: new Date(),
                expiresAt: null // Loyalty rewards don't expire
              }
            });

            awardedMilestones.push({
              months: monthsRequired,
              credit: milestoneCredit,
              ...milestone
            });
          }
        }
      }

      return {
        success: true,
        subscriptionMonths: monthsDiff,
        eligibleMilestones,
        awardedMilestones,
        message: awardedMilestones.length > 0 
          ? `Awarded ${awardedMilestones.length} loyalty milestone(s)`
          : 'No new loyalty milestones to award'
      };

    } catch (error) {
      console.error('Error checking loyalty milestones:', error);
      throw error;
    }
  }

  /**
   * Get user's credit balance and transaction history
   * @param {string} userId - User ID
   * @returns {Object} Credit balance and history
   */
  async getUserCredits(userId) {
    try {
      if (!prisma) {
        throw new Error('Database not configured');
      }

      if (!userId) {
        throw new Error('User ID is required');
      }

      // Get user with subscription and all credits
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          subscription: true,
          rewardCredits: {
            orderBy: { earnedAt: 'desc' }
          }
        }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Calculate available credits (unused and not expired)
      const now = new Date();
      const availableCredits = user.rewardCredits
        .filter(credit => 
          !credit.usedAt && 
          (!credit.expiresAt || credit.expiresAt > now)
        )
        .reduce((sum, credit) => sum + credit.amount, 0);

      // Calculate used credits
      const usedCredits = user.rewardCredits
        .filter(credit => credit.usedAt)
        .reduce((sum, credit) => sum + credit.amount, 0);

      // Calculate expired credits
      const expiredCredits = user.rewardCredits
        .filter(credit => 
          !credit.usedAt && 
          credit.expiresAt && 
          credit.expiresAt <= now
        )
        .reduce((sum, credit) => sum + credit.amount, 0);

      // Group credits by type
      const creditsByType = user.rewardCredits.reduce((acc, credit) => {
        if (!acc[credit.type]) {
          acc[credit.type] = [];
        }
        acc[credit.type].push(credit);
        return acc;
      }, {});

      return {
        success: true,
        userId,
        balance: {
          available: Math.round(availableCredits * 100) / 100,
          used: Math.round(usedCredits * 100) / 100,
          expired: Math.round(expiredCredits * 100) / 100,
          total: Math.round((availableCredits + usedCredits + expiredCredits) * 100) / 100
        },
        subscription: {
          availableCredits: user.subscription?.availableCredits || 0,
          tier: user.subscription?.tier
        },
        credits: {
          all: user.rewardCredits,
          byType: creditsByType,
          available: user.rewardCredits.filter(credit => 
            !credit.usedAt && 
            (!credit.expiresAt || credit.expiresAt > now)
          ),
          used: user.rewardCredits.filter(credit => credit.usedAt),
          expired: user.rewardCredits.filter(credit => 
            !credit.usedAt && 
            credit.expiresAt && 
            credit.expiresAt <= now
          )
        }
      };

    } catch (error) {
      console.error('Error getting user credits:', error);
      throw error;
    }
  }

  /**
   * Reverse a referral reward (when referee cancels within 3 months)
   * @param {string} referrerId - ID of the referrer
   * @param {string} refereeId - ID of the referee who cancelled
   * @returns {Object} Reversal result
   */
  async reverseReferralReward(referrerId, refereeId) {
    try {
      if (!prisma) {
        throw new Error('Database not configured');
      }

      if (!referrerId || !refereeId) {
        throw new Error('Referrer ID and referee ID are required');
      }

      // Find the referral credit
      const referralCredit = await prisma.rewardCredit.findFirst({
        where: {
          userId: referrerId,
          type: this.REWARD_TYPES.REFERRAL,
          description: {
            contains: refereeId
          },
          usedAt: null // Only reverse unused credits
        }
      });

      if (!referralCredit) {
        throw new Error('Referral credit not found or already used');
      }

      // Check if reversal is within the allowed timeframe
      const earnedDate = referralCredit.earnedAt;
      const now = new Date();
      const monthsDiff = this.calculateMonthsDifference(earnedDate, now);

      if (monthsDiff > this.REFERRAL_REVERSAL_MONTHS) {
        throw new Error(`Referral reversal is only allowed within ${this.REFERRAL_REVERSAL_MONTHS} months of earning`);
      }

      // Create a reversal credit (negative amount)
      const reversalCredit = await prisma.rewardCredit.create({
        data: {
          userId: referrerId,
          amount: -referralCredit.amount,
          type: this.REWARD_TYPES.BONUS,
          description: `Referral reversal: Referee ${refereeId} cancelled within ${this.REFERRAL_REVERSAL_MONTHS} months`,
          earnedAt: new Date()
        }
      });

      // Update subscription available credits
      const user = await prisma.user.findUnique({
        where: { id: referrerId },
        include: { subscription: true }
      });

      if (user?.subscription) {
        await prisma.subscription.update({
          where: { id: user.subscription.id },
          data: {
            availableCredits: {
              decrement: referralCredit.amount
            }
          }
        });
      }

      return {
        success: true,
        originalCredit: referralCredit,
        reversalCredit,
        reversedAmount: referralCredit.amount,
        message: `Referral reward of $${referralCredit.amount.toFixed(2)} reversed due to referee cancellation`
      };

    } catch (error) {
      console.error('Error reversing referral reward:', error);
      throw error;
    }
  }

  /**
   * Calculate monthly subscription amount based on tier
   * @param {string} tier - Subscription tier
   * @returns {number} Monthly amount
   */
  calculateMonthlySubscriptionAmount(tier) {
    // These should match the plan configurations
    const tierPricing = {
      'STARTER': 29.99,
      'HOMECARE': 49.99,
      'PRIORITY': 79.99
    };

    return tierPricing[tier] || 29.99; // Default to STARTER if tier not found
  }

  /**
   * Calculate difference in months between two dates
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {number} Difference in months
   */
  calculateMonthsDifference(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const yearDiff = end.getFullYear() - start.getFullYear();
    const monthDiff = end.getMonth() - start.getMonth();
    
    return yearDiff * 12 + monthDiff;
  }

  /**
   * Apply credits automatically to billing
   * @param {string} userId - User ID
   * @param {number} billingAmount - Amount to be billed
   * @returns {Object} Credit application result
   */
  async applyCreditsAutomatically(userId, billingAmount) {
    try {
      if (!prisma) {
        throw new Error('Database not configured');
      }

      if (!userId || billingAmount === undefined || billingAmount < 0) {
        throw new Error('User ID and valid billing amount are required');
      }

      // Get user's available credits
      const userCredits = await this.getUserCredits(userId);
      if (!userCredits.success) {
        throw new Error('Failed to retrieve user credits');
      }

      const availableCredits = userCredits.balance.available;
      
      if (availableCredits <= 0) {
        return {
          success: true,
          creditsApplied: 0,
          remainingBill: billingAmount,
          remainingCredits: 0,
          message: 'No credits available to apply'
        };
      }

      // Calculate how much credit to apply (up to the billing amount)
      const creditsToApply = Math.min(availableCredits, billingAmount);
      const remainingBill = billingAmount - creditsToApply;
      const remainingCredits = availableCredits - creditsToApply;

      // Mark credits as used (FIFO - oldest first)
      const availableCreditRecords = userCredits.credits.available
        .sort((a, b) => new Date(a.earnedAt) - new Date(b.earnedAt));

      let remainingToApply = creditsToApply;
      const appliedCredits = [];

      for (const credit of availableCreditRecords) {
        if (remainingToApply <= 0) break;

        const amountToUse = Math.min(credit.amount, remainingToApply);
        
        // Mark credit as used
        await prisma.rewardCredit.update({
          where: { id: credit.id },
          data: { usedAt: new Date() }
        });

        appliedCredits.push({
          creditId: credit.id,
          amountUsed: amountToUse,
          type: credit.type,
          description: credit.description
        });

        remainingToApply -= amountToUse;
      }

      // Update subscription available credits
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { subscription: true }
      });

      if (user?.subscription) {
        await prisma.subscription.update({
          where: { id: user.subscription.id },
          data: {
            availableCredits: {
              decrement: creditsToApply
            }
          }
        });
      }

      return {
        success: true,
        creditsApplied: Math.round(creditsToApply * 100) / 100,
        remainingBill: Math.round(remainingBill * 100) / 100,
        remainingCredits: Math.round(remainingCredits * 100) / 100,
        appliedCredits,
        message: `Applied $${creditsToApply.toFixed(2)} in credits to billing`
      };

    } catch (error) {
      console.error('Error applying credits automatically:', error);
      throw error;
    }
  }

  /**
   * Redeem credits manually
   * @param {string} userId - User ID
   * @param {number} amount - Amount to redeem
   * @param {string} reason - Reason for manual redemption
   * @returns {Object} Redemption result
   */
  async redeemCreditsManually(userId, amount, reason = 'Manual redemption') {
    try {
      if (!prisma) {
        throw new Error('Database not configured');
      }

      if (!userId || !amount || amount <= 0) {
        throw new Error('User ID and valid amount are required');
      }

      // Get user's available credits
      const userCredits = await this.getUserCredits(userId);
      if (!userCredits.success) {
        throw new Error('Failed to retrieve user credits');
      }

      const availableCredits = userCredits.balance.available;
      
      if (availableCredits < amount) {
        throw new Error(`Insufficient credits. Available: $${availableCredits.toFixed(2)}, Requested: $${amount.toFixed(2)}`);
      }

      // Mark credits as used (FIFO - oldest first)
      const availableCreditRecords = userCredits.credits.available
        .sort((a, b) => new Date(a.earnedAt) - new Date(b.earnedAt));

      let remainingToRedeem = amount;
      const redeemedCredits = [];

      for (const credit of availableCreditRecords) {
        if (remainingToRedeem <= 0) break;

        const amountToUse = Math.min(credit.amount, remainingToRedeem);
        
        // Mark credit as used
        await prisma.rewardCredit.update({
          where: { id: credit.id },
          data: { usedAt: new Date() }
        });

        redeemedCredits.push({
          creditId: credit.id,
          amountUsed: amountToUse,
          type: credit.type,
          description: credit.description
        });

        remainingToRedeem -= amountToUse;
      }

      // Update subscription available credits
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { subscription: true }
      });

      if (user?.subscription) {
        await prisma.subscription.update({
          where: { id: user.subscription.id },
          data: {
            availableCredits: {
              decrement: amount
            }
          }
        });
      }

      // Create a record of the manual redemption
      await prisma.rewardCredit.create({
        data: {
          userId: userId,
          amount: -amount, // Negative amount to show it was redeemed
          type: this.REWARD_TYPES.BONUS,
          description: `Manual redemption: ${reason}`,
          earnedAt: new Date(),
          usedAt: new Date() // Immediately mark as used since it's a redemption record
        }
      });

      return {
        success: true,
        redeemedAmount: Math.round(amount * 100) / 100,
        remainingCredits: Math.round((availableCredits - amount) * 100) / 100,
        redeemedCredits,
        message: `Successfully redeemed $${amount.toFixed(2)} in credits`
      };

    } catch (error) {
      console.error('Error redeeming credits manually:', error);
      throw error;
    }
  }

  /**
   * Process expired credits
   * @param {string} userId - User ID (optional, if not provided processes all users)
   * @returns {Object} Expiration processing result
   */
  async processExpiredCredits(userId = null) {
    try {
      if (!prisma) {
        throw new Error('Database not configured');
      }

      const now = new Date();
      const whereClause = {
        usedAt: null, // Only unused credits
        expiresAt: {
          lte: now // Expired
        }
      };

      if (userId) {
        whereClause.userId = userId;
      }

      // Find expired credits
      const expiredCredits = await prisma.rewardCredit.findMany({
        where: whereClause,
        include: {
          user: {
            include: {
              subscription: true
            }
          }
        }
      });

      if (expiredCredits.length === 0) {
        return {
          success: true,
          expiredCount: 0,
          totalExpiredAmount: 0,
          message: 'No expired credits found'
        };
      }

      let totalExpiredAmount = 0;
      const expiredByUser = {};

      // Process each expired credit
      for (const credit of expiredCredits) {
        // Mark as expired by setting usedAt (even though it wasn't actually used)
        await prisma.rewardCredit.update({
          where: { id: credit.id },
          data: { 
            usedAt: now,
            description: `${credit.description} (EXPIRED)`
          }
        });

        // Update subscription available credits
        if (credit.user?.subscription) {
          await prisma.subscription.update({
            where: { id: credit.user.subscription.id },
            data: {
              availableCredits: {
                decrement: credit.amount
              }
            }
          });
        }

        totalExpiredAmount += credit.amount;

        // Track by user for reporting
        if (!expiredByUser[credit.userId]) {
          expiredByUser[credit.userId] = {
            userEmail: credit.user.email,
            credits: [],
            totalAmount: 0
          };
        }
        expiredByUser[credit.userId].credits.push(credit);
        expiredByUser[credit.userId].totalAmount += credit.amount;
      }

      return {
        success: true,
        expiredCount: expiredCredits.length,
        totalExpiredAmount: Math.round(totalExpiredAmount * 100) / 100,
        expiredByUser,
        message: `Processed ${expiredCredits.length} expired credits totaling $${totalExpiredAmount.toFixed(2)}`
      };

    } catch (error) {
      console.error('Error processing expired credits:', error);
      throw error;
    }
  }

  /**
   * Get credit transaction history for a user
   * @param {string} userId - User ID
   * @param {number} limit - Number of transactions to return (default 50)
   * @param {number} offset - Offset for pagination (default 0)
   * @returns {Object} Transaction history
   */
  async getCreditTransactionHistory(userId, limit = 50, offset = 0) {
    try {
      if (!prisma) {
        throw new Error('Database not configured');
      }

      if (!userId) {
        throw new Error('User ID is required');
      }

      const transactions = await prisma.rewardCredit.findMany({
        where: { userId },
        orderBy: { earnedAt: 'desc' },
        take: limit,
        skip: offset
      });

      const totalCount = await prisma.rewardCredit.count({
        where: { userId }
      });

      // Categorize transactions
      const categorized = {
        earned: transactions.filter(t => t.amount > 0 && !t.usedAt),
        used: transactions.filter(t => t.usedAt && t.amount > 0),
        redeemed: transactions.filter(t => t.amount < 0),
        expired: transactions.filter(t => t.usedAt && t.description.includes('EXPIRED'))
      };

      return {
        success: true,
        transactions,
        categorized,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount
        }
      };

    } catch (error) {
      console.error('Error getting credit transaction history:', error);
      throw error;
    }
  }

  /**
   * Calculate credit expiration dates and send warnings
   * @param {number} warningDays - Days before expiration to send warning (default 30)
   * @returns {Object} Warning processing result
   */
  async processExpirationWarnings(warningDays = 30) {
    try {
      if (!prisma) {
        throw new Error('Database not configured');
      }

      const warningDate = new Date();
      warningDate.setDate(warningDate.getDate() + warningDays);

      // Find credits expiring within warning period
      const expiringCredits = await prisma.rewardCredit.findMany({
        where: {
          usedAt: null, // Only unused credits
          expiresAt: {
            lte: warningDate,
            gt: new Date() // Not already expired
          }
        },
        include: {
          user: true
        }
      });

      // Group by user
      const expiringByUser = {};
      let totalExpiringAmount = 0;

      for (const credit of expiringCredits) {
        if (!expiringByUser[credit.userId]) {
          expiringByUser[credit.userId] = {
            user: credit.user,
            credits: [],
            totalAmount: 0
          };
        }
        expiringByUser[credit.userId].credits.push(credit);
        expiringByUser[credit.userId].totalAmount += credit.amount;
        totalExpiringAmount += credit.amount;
      }

      return {
        success: true,
        expiringCreditsCount: expiringCredits.length,
        affectedUsersCount: Object.keys(expiringByUser).length,
        totalExpiringAmount: Math.round(totalExpiringAmount * 100) / 100,
        expiringByUser,
        warningDays,
        message: `Found ${expiringCredits.length} credits expiring within ${warningDays} days for ${Object.keys(expiringByUser).length} users`
      };

    } catch (error) {
      console.error('Error processing expiration warnings:', error);
      throw error;
    }
  }

  /**
   * Get loyalty status for a user
   * @param {string} userId - User ID
   * @returns {Object} Loyalty status information
   */
  async getLoyaltyStatus(userId) {
    try {
      if (!prisma) {
        throw new Error('Database not configured');
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          subscription: true,
          rewardCredits: {
            where: { type: this.REWARD_TYPES.LOYALTY },
            orderBy: { earnedAt: 'desc' }
          }
        }
      });

      if (!user || !user.subscription) {
        throw new Error('User or subscription not found');
      }

      const subscriptionMonths = this.calculateMonthsDifference(
        user.subscription.createdAt, 
        new Date()
      );

      // Find next milestone
      const milestoneMonths = Object.keys(this.LOYALTY_MILESTONES).map(Number).sort((a, b) => a - b);
      const nextMilestone = milestoneMonths.find(months => months > subscriptionMonths);
      const currentMilestone = milestoneMonths.filter(months => months <= subscriptionMonths).pop();

      return {
        success: true,
        userId,
        subscriptionMonths,
        currentMilestone: currentMilestone ? {
          months: currentMilestone,
          ...this.LOYALTY_MILESTONES[currentMilestone]
        } : null,
        nextMilestone: nextMilestone ? {
          months: nextMilestone,
          monthsRemaining: nextMilestone - subscriptionMonths,
          ...this.LOYALTY_MILESTONES[nextMilestone]
        } : null,
        earnedMilestones: user.rewardCredits.map(credit => ({
          description: credit.description,
          earnedAt: credit.earnedAt,
          amount: credit.amount
        })),
        allMilestones: Object.entries(this.LOYALTY_MILESTONES).map(([months, milestone]) => ({
          months: parseInt(months),
          achieved: parseInt(months) <= subscriptionMonths,
          ...milestone
        }))
      };

    } catch (error) {
      console.error('Error getting loyalty status:', error);
      throw error;
    }
  }
}

export default new RewardsService();