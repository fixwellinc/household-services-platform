import prisma from '../config/database.js';
import salesmanService from './salesmanService.js';

class ReferralService {
  /**
   * Validate a referral code
   * @param {string} referralCode - Referral code to validate
   * @returns {Promise<Object>} Validation result
   */
  async validateReferralCode(referralCode) {
    if (!salesmanService.isValidReferralCode(referralCode)) {
      return {
        valid: false,
        error: 'Invalid referral code format'
      };
    }

    const salesman = await salesmanService.getSalesmanByReferralCode(referralCode);

    if (!salesman) {
      return {
        valid: false,
        error: 'Referral code not found'
      };
    }

    if (salesman.status !== 'ACTIVE') {
      return {
        valid: false,
        error: 'Referral code is not active'
      };
    }

    return {
      valid: true,
      salesman: {
        id: salesman.id,
        displayName: salesman.displayName,
        personalMessage: salesman.personalMessage
      }
    };
  }

  /**
   * Track a referral visit (before registration)
   * @param {Object} visitData - Visit tracking data
   * @returns {Promise<Object>} Tracking result
   */
  async trackReferralVisit(visitData) {
    const {
      referralCode,
      ipAddress,
      userAgent,
      referralUrl,
      campaignSource
    } = visitData;

    const validation = await this.validateReferralCode(referralCode);
    if (!validation.valid) {
      return validation;
    }

    // Log the visit for analytics (you might want to create a separate table for this)
    const metadata = {
      ipAddress,
      userAgent,
      referralUrl,
      campaignSource,
      timestamp: new Date().toISOString()
    };

    return {
      success: true,
      salesman: validation.salesman,
      metadata
    };
  }

  /**
   * Process referral during user registration
   * @param {string} userId - New user ID
   * @param {string} referralCode - Referral code used
   * @param {Object} metadata - Additional tracking data
   * @returns {Promise<Object>} Referral processing result
   */
  async processRegistrationReferral(userId, referralCode, metadata = {}) {
    if (!referralCode) {
      return { success: true, message: 'No referral code provided' };
    }

    try {
      const referral = await salesmanService.trackReferral({
        customerId: userId,
        referralCode,
        referralSource: metadata.referralSource || 'DIRECT_LINK',
        metadata
      });

      return {
        success: true,
        referral,
        message: 'Referral tracked successfully'
      };
    } catch (error) {
      console.error('Error processing registration referral:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate referral links for a salesman
   * @param {string} salesmanId - Salesman profile ID
   * @param {Object} options - Link generation options
   * @returns {Promise<Object>} Generated links
   */
  async generateReferralLinks(salesmanId, options = {}) {
    const salesman = await prisma.salesmanProfile.findUnique({
      where: { id: salesmanId }
    });

    if (!salesman) {
      throw new Error('Salesman not found');
    }

    const {
      baseUrl = process.env.FRONTEND_URL || 'https://fixwell.com',
      campaign = '',
      source = '',
      medium = 'referral'
    } = options;

    const referralCode = salesman.referralCode;
    const utmParams = new URLSearchParams();

    if (campaign) utmParams.append('utm_campaign', campaign);
    if (source) utmParams.append('utm_source', source);
    if (medium) utmParams.append('utm_medium', medium);

    const baseParams = `ref=${referralCode}`;
    const fullParams = utmParams.toString() ?
      `${baseParams}&${utmParams.toString()}` : baseParams;

    const links = {
      registration: `${baseUrl}/register?${fullParams}`,
      homepage: `${baseUrl}?${fullParams}`,
      pricing: `${baseUrl}/pricing?${fullParams}`,
      services: `${baseUrl}/services?${fullParams}`,
      custom: `${baseUrl}/r/${referralCode}`,
      short: `${baseUrl}/r/${referralCode}`
    };

    return {
      referralCode,
      links,
      qrCode: await this.generateQRCodeData(links.short)
    };
  }

  /**
   * Generate QR code data for a referral link
   * @param {string} url - URL to encode
   * @returns {Promise<string>} QR code data URL
   */
  async generateQRCodeData(url) {
    // For now, return a placeholder. In production, you'd use a QR code library
    return `data:image/svg+xml;base64,${Buffer.from(`<svg width="100" height="100"><text x="10" y="50">QR: ${url}</text></svg>`).toString('base64')}`;
  }

  /**
   * Get referral statistics for a salesman
   * @param {string} salesmanId - Salesman profile ID
   * @param {Object} filters - Date and other filters
   * @returns {Promise<Object>} Referral statistics
   */
  async getReferralStats(salesmanId, filters = {}) {
    const {
      startDate,
      endDate,
      status
    } = filters;

    const where = {
      salesmanId
    };

    if (startDate || endDate) {
      where.referralDate = {};
      if (startDate) where.referralDate.gte = new Date(startDate);
      if (endDate) where.referralDate.lte = new Date(endDate);
    }

    if (status) {
      where.status = status;
    }

    const [
      totalReferrals,
      convertedReferrals,
      pendingReferrals,
      cancelledReferrals,
      referralsBySource,
      monthlyReferrals
    ] = await Promise.all([
      // Total referrals
      prisma.customerReferral.count({ where }),

      // Converted referrals
      prisma.customerReferral.count({
        where: { ...where, status: 'CONVERTED' }
      }),

      // Pending referrals
      prisma.customerReferral.count({
        where: { ...where, status: 'PENDING' }
      }),

      // Cancelled referrals
      prisma.customerReferral.count({
        where: { ...where, status: 'CANCELLED' }
      }),

      // Referrals by source
      prisma.customerReferral.groupBy({
        by: ['referralSource'],
        where,
        _count: true
      }),

      // Monthly referrals (last 12 months)
      this.getMonthlyReferralTrends(salesmanId)
    ]);

    const conversionRate = totalReferrals > 0 ?
      (convertedReferrals / totalReferrals) * 100 : 0;

    return {
      totals: {
        totalReferrals,
        convertedReferrals,
        pendingReferrals,
        cancelledReferrals,
        conversionRate: Math.round(conversionRate * 100) / 100
      },
      bySource: referralsBySource.map(item => ({
        source: item.referralSource,
        count: item._count,
        percentage: totalReferrals > 0 ?
          Math.round((item._count / totalReferrals) * 100 * 100) / 100 : 0
      })),
      monthlyTrends: monthlyReferrals
    };
  }

  /**
   * Get monthly referral trends
   * @param {string} salesmanId - Salesman profile ID
   * @returns {Promise<Array>} Monthly trends data
   */
  async getMonthlyReferralTrends(salesmanId) {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const referrals = await prisma.customerReferral.findMany({
      where: {
        salesmanId,
        referralDate: {
          gte: twelveMonthsAgo
        }
      },
      select: {
        referralDate: true,
        status: true,
        conversionDate: true
      }
    });

    // Group by month
    const monthlyData = {};
    for (let i = 0; i < 12; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[key] = {
        month: key,
        referrals: 0,
        conversions: 0
      };
    }

    referrals.forEach(referral => {
      const referralMonth = `${referral.referralDate.getFullYear()}-${String(referral.referralDate.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyData[referralMonth]) {
        monthlyData[referralMonth].referrals++;

        if (referral.status === 'CONVERTED' && referral.conversionDate) {
          monthlyData[referralMonth].conversions++;
        }
      }
    });

    return Object.values(monthlyData).reverse();
  }

  /**
   * Get top performing referral campaigns
   * @param {string} salesmanId - Salesman profile ID
   * @param {number} limit - Number of top campaigns to return
   * @returns {Promise<Array>} Top campaigns
   */
  async getTopCampaigns(salesmanId, limit = 10) {
    const referrals = await prisma.customerReferral.findMany({
      where: { salesmanId },
      select: {
        metadata: true,
        status: true
      }
    });

    const campaignStats = {};

    referrals.forEach(referral => {
      if (referral.metadata && referral.metadata.campaignSource) {
        const campaign = referral.metadata.campaignSource;
        if (!campaignStats[campaign]) {
          campaignStats[campaign] = {
            campaign,
            totalReferrals: 0,
            conversions: 0,
            conversionRate: 0
          };
        }

        campaignStats[campaign].totalReferrals++;
        if (referral.status === 'CONVERTED') {
          campaignStats[campaign].conversions++;
        }
      }
    });

    // Calculate conversion rates and sort
    const campaigns = Object.values(campaignStats)
      .map(campaign => ({
        ...campaign,
        conversionRate: campaign.totalReferrals > 0 ?
          Math.round((campaign.conversions / campaign.totalReferrals) * 100 * 100) / 100 : 0
      }))
      .sort((a, b) => b.conversions - a.conversions)
      .slice(0, limit);

    return campaigns;
  }

  /**
   * Handle subscription events for referral commission
   * @param {string} customerId - Customer ID
   * @param {string} subscriptionId - Subscription ID
   * @param {string} eventType - Event type (created, updated, cancelled)
   * @returns {Promise<Object>} Processing result
   */
  async handleSubscriptionEvent(customerId, subscriptionId, eventType) {
    try {
      switch (eventType) {
        case 'created':
          return await salesmanService.convertReferral(customerId, subscriptionId);

        case 'cancelled':
          return await this.handleSubscriptionCancellation(customerId);

        default:
          return { success: true, message: 'Event processed' };
      }
    } catch (error) {
      console.error('Error handling subscription event:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Handle subscription cancellation
   * @param {string} customerId - Customer ID
   * @returns {Promise<Object>} Processing result
   */
  async handleSubscriptionCancellation(customerId) {
    const referral = await prisma.customerReferral.findUnique({
      where: { customerId }
    });

    if (!referral || referral.status !== 'CONVERTED') {
      return { success: true, message: 'No active referral to update' };
    }

    // Update referral status
    await prisma.customerReferral.update({
      where: { customerId },
      data: { status: 'CANCELLED' }
    });

    // Cancel pending commission transactions
    await prisma.commissionTransaction.updateMany({
      where: {
        customerId,
        status: 'PENDING'
      },
      data: { status: 'CANCELLED' }
    });

    return { success: true, message: 'Referral cancelled due to subscription cancellation' };
  }

  /**
   * Get referral leaderboard
   * @param {Object} filters - Filters for leaderboard
   * @returns {Promise<Array>} Leaderboard data
   */
  async getReferralLeaderboard(filters = {}) {
    const {
      period = 'all_time', // all_time, this_month, this_quarter, this_year
      limit = 10
    } = filters;

    let dateFilter = {};
    const now = new Date();

    switch (period) {
      case 'this_month':
        dateFilter = {
          gte: new Date(now.getFullYear(), now.getMonth(), 1)
        };
        break;
      case 'this_quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        dateFilter = {
          gte: new Date(now.getFullYear(), quarter * 3, 1)
        };
        break;
      case 'this_year':
        dateFilter = {
          gte: new Date(now.getFullYear(), 0, 1)
        };
        break;
    }

    const salesmenStats = await prisma.salesmanProfile.findMany({
      where: { status: 'ACTIVE' },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        customerReferrals: {
          where: {
            ...(Object.keys(dateFilter).length > 0 && {
              referralDate: dateFilter
            })
          }
        },
        commissionTransactions: {
          where: {
            status: 'PAID',
            ...(Object.keys(dateFilter).length > 0 && {
              createdAt: dateFilter
            })
          }
        }
      }
    });

    const leaderboard = salesmenStats
      .map(salesman => {
        const totalReferrals = salesman.customerReferrals.length;
        const conversions = salesman.customerReferrals.filter(r => r.status === 'CONVERTED').length;
        const totalCommission = salesman.commissionTransactions.reduce((sum, t) => sum + t.amount, 0);
        const conversionRate = totalReferrals > 0 ? (conversions / totalReferrals) * 100 : 0;

        return {
          salesmanId: salesman.id,
          name: salesman.displayName,
          userEmail: salesman.user.email,
          referralCode: salesman.referralCode,
          totalReferrals,
          conversions,
          conversionRate: Math.round(conversionRate * 100) / 100,
          totalCommission: Math.round(totalCommission * 100) / 100
        };
      })
      .sort((a, b) => b.conversions - a.conversions)
      .slice(0, limit);

    return leaderboard;
  }
}

export default new ReferralService();