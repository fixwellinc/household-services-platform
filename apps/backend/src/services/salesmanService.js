import prisma from '../config/database.js';

class SalesmanService {
  /**
   * Generate a unique referral code
   * @param {Object} options - Code generation options
   * @returns {Promise<string>} Generated referral code
   */
  async generateReferralCode(options = {}) {
    const {
      length = 8,
      prefix = '',
      excludeAmbiguous = true
    } = options;

    const chars = excludeAmbiguous
      ? 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
      : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      let code = prefix;
      for (let i = 0; i < (length - prefix.length); i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      // Check if code already exists
      const existing = await prisma.salesmanProfile.findUnique({
        where: { referralCode: code }
      });

      if (!existing) {
        return code;
      }

      attempts++;
    }

    throw new Error('Failed to generate unique referral code after maximum attempts');
  }

  /**
   * Create a new salesman profile
   * @param {Object} salesmanData - Salesman profile data
   * @returns {Promise<Object>} Created salesman profile
   */
  async createSalesman(salesmanData) {
    const {
      userId,
      displayName,
      personalMessage,
      commissionRate = 5.0,
      commissionType = 'PERCENTAGE',
      commissionTier = 'BRONZE',
      territoryPostalCodes = [],
      territoryRegions = [],
      monthlyTarget = 0,
      quarterlyTarget = 0,
      yearlyTarget = 0,
      customReferralCode
    } = salesmanData;

    // Validate user exists and is not already a salesman
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { salesmanProfile: true }
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (user.salesmanProfile) {
      throw new Error('User already has a salesman profile');
    }

    // Generate or validate referral code
    let referralCode;
    if (customReferralCode) {
      const existing = await prisma.salesmanProfile.findUnique({
        where: { referralCode: customReferralCode }
      });
      if (existing) {
        throw new Error('Referral code already exists');
      }
      referralCode = customReferralCode.toUpperCase();
    } else {
      referralCode = await this.generateReferralCode();
    }

    // Update user role to SALESMAN
    await prisma.user.update({
      where: { id: userId },
      data: { role: 'SALESMAN' }
    });

    // Create salesman profile
    const salesmanProfile = await prisma.salesmanProfile.create({
      data: {
        userId,
        referralCode,
        displayName,
        personalMessage,
        commissionRate,
        commissionType,
        commissionTier,
        territoryPostalCodes,
        territoryRegions,
        monthlyTarget,
        quarterlyTarget,
        yearlyTarget
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            phone: true,
            createdAt: true
          }
        }
      }
    });

    return salesmanProfile;
  }

  /**
   * Get salesman profile by user ID
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} Salesman profile
   */
  async getSalesmanByUserId(userId) {
    return await prisma.salesmanProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            phone: true,
            createdAt: true
          }
        },
        _count: {
          select: {
            customerReferrals: true,
            commissionTransactions: true
          }
        }
      }
    });
  }

  /**
   * Get salesman profile by referral code
   * @param {string} referralCode - Referral code
   * @returns {Promise<Object|null>} Salesman profile
   */
  async getSalesmanByReferralCode(referralCode) {
    return await prisma.salesmanProfile.findUnique({
      where: { referralCode: referralCode.toUpperCase() },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
  }

  /**
   * Update salesman profile
   * @param {string} salesmanId - Salesman profile ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated salesman profile
   */
  async updateSalesman(salesmanId, updateData) {
    const {
      displayName,
      personalMessage,
      commissionRate,
      commissionType,
      commissionTier,
      territoryPostalCodes,
      territoryRegions,
      monthlyTarget,
      quarterlyTarget,
      yearlyTarget,
      status
    } = updateData;

    return await prisma.salesmanProfile.update({
      where: { id: salesmanId },
      data: {
        ...(displayName !== undefined && { displayName }),
        ...(personalMessage !== undefined && { personalMessage }),
        ...(commissionRate !== undefined && { commissionRate }),
        ...(commissionType !== undefined && { commissionType }),
        ...(commissionTier !== undefined && { commissionTier }),
        ...(territoryPostalCodes !== undefined && { territoryPostalCodes }),
        ...(territoryRegions !== undefined && { territoryRegions }),
        ...(monthlyTarget !== undefined && { monthlyTarget }),
        ...(quarterlyTarget !== undefined && { quarterlyTarget }),
        ...(yearlyTarget !== undefined && { yearlyTarget }),
        ...(status !== undefined && { status })
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            phone: true
          }
        }
      }
    });
  }

  /**
   * Sync missing salesman profiles for users with SALESMAN role
   * @returns {Promise<number>} Number of profiles created
   */
  async syncMissingSalesmanProfiles() {
    console.log('Starting sync of missing salesman profiles...');

    // Find users with SALESMAN role but no salesman profile
    const usersWithoutProfiles = await prisma.user.findMany({
      where: {
        role: 'SALESMAN',
        salesmanProfile: null
      }
    });

    console.log(`Found ${usersWithoutProfiles.length} users with SALESMAN role but no profile:`,
      usersWithoutProfiles.map(u => ({ id: u.id, email: u.email, name: u.name })));

    let createdCount = 0;

    for (const user of usersWithoutProfiles) {
      try {
        // Generate referral code
        const referralCode = await this.generateReferralCode();

        // Create salesman profile
        await prisma.salesmanProfile.create({
          data: {
            userId: user.id,
            referralCode,
            displayName: user.name || user.email.split('@')[0],
            commissionRate: 5.0,
            commissionType: 'PERCENTAGE',
            commissionTier: 'BRONZE',
            territoryPostalCodes: [],
            territoryRegions: [],
            monthlyTarget: 0,
            quarterlyTarget: 0,
            yearlyTarget: 0,
            status: 'ACTIVE'
          }
        });

        console.log(`Created salesman profile for user ${user.id} with referral code ${referralCode}`);
        createdCount++;
      } catch (error) {
        console.error(`Failed to create salesman profile for user ${user.id}:`, error);
      }
    }

    console.log(`Sync completed. Created ${createdCount} salesman profiles.`);
    return createdCount;
  }

  /**
   * Get all salesmen with filtering and pagination
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Paginated salesmen list
   */
  async getSalesmen(options = {}) {
    // First, sync any missing salesman profiles
    await this.syncMissingSalesmanProfiles();
    const {
      page = 1,
      limit = 20,
      status,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = options;

    const skip = (page - 1) * limit;
    const where = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { displayName: { contains: search, mode: 'insensitive' } },
        { referralCode: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const [salesmen, totalCount] = await Promise.all([
      prisma.salesmanProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              phone: true,
              createdAt: true
            }
          },
          _count: {
            select: {
              customerReferrals: true,
              commissionTransactions: true
            }
          }
        }
      }),
      prisma.salesmanProfile.count({ where })
    ]);

    return {
      salesmen,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    };
  }

  /**
   * Track a customer referral
   * @param {Object} referralData - Referral tracking data
   * @returns {Promise<Object>} Created referral record
   */
  async trackReferral(referralData) {
    const {
      customerId,
      referralCode,
      referralSource = 'DIRECT_LINK',
      metadata = {}
    } = referralData;

    // Find salesman by referral code
    const salesman = await this.getSalesmanByReferralCode(referralCode);
    if (!salesman) {
      throw new Error('Invalid referral code');
    }

    if (salesman.status !== 'ACTIVE') {
      throw new Error('Salesman account is not active');
    }

    // Check if customer already has a referral
    const existingReferral = await prisma.customerReferral.findUnique({
      where: { customerId }
    });

    if (existingReferral) {
      throw new Error('Customer already has a referral record');
    }

    // Create referral record
    const referral = await prisma.customerReferral.create({
      data: {
        customerId,
        salesmanId: salesman.id,
        referralCode: referralCode.toUpperCase(),
        referralSource,
        metadata
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        salesman: {
          select: {
            id: true,
            displayName: true,
            referralCode: true
          }
        }
      }
    });

    // Update user with referral information
    await prisma.user.update({
      where: { id: customerId },
      data: {
        referredByCode: referralCode.toUpperCase(),
        referralSource,
        referralDate: new Date()
      }
    });

    return referral;
  }

  /**
   * Convert a referral (when customer subscribes)
   * @param {string} customerId - Customer ID
   * @param {string} subscriptionId - Subscription ID
   * @returns {Promise<Object>} Updated referral record
   */
  async convertReferral(customerId, subscriptionId) {
    const referral = await prisma.customerReferral.findUnique({
      where: { customerId },
      include: { salesman: true }
    });

    if (!referral) {
      return null; // No referral to convert
    }

    if (referral.status === 'CONVERTED') {
      return referral; // Already converted
    }

    // Calculate commission
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId }
    });

    let commissionAmount = 0;
    if (subscription && referral.salesman) {
      if (referral.salesman.commissionType === 'PERCENTAGE') {
        // Assuming monthly subscription amount for percentage calculation
        const monthlyAmount = this.getSubscriptionMonthlyAmount(subscription.tier);
        commissionAmount = (monthlyAmount * referral.salesman.commissionRate) / 100;
      } else {
        commissionAmount = referral.salesman.commissionRate;
      }
    }

    // Update referral record
    const updatedReferral = await prisma.customerReferral.update({
      where: { customerId },
      data: {
        status: 'CONVERTED',
        conversionDate: new Date(),
        subscriptionId,
        commissionEarned: commissionAmount
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        salesman: {
          select: {
            id: true,
            displayName: true,
            referralCode: true
          }
        }
      }
    });

    // Create commission transaction
    if (commissionAmount > 0) {
      await prisma.commissionTransaction.create({
        data: {
          salesmanId: referral.salesmanId,
          customerId,
          referralId: referral.id,
          transactionType: 'SIGNUP',
          amount: commissionAmount,
          status: 'PENDING'
        }
      });
    }

    return updatedReferral;
  }

  /**
   * Get salesman dashboard data
   * @param {string} salesmanId - Salesman profile ID
   * @returns {Promise<Object>} Dashboard data
   */
  async getSalesmanDashboard(salesmanId) {
    const salesman = await prisma.salesmanProfile.findUnique({
      where: { id: salesmanId },
      include: {
        customerReferrals: {
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                createdAt: true,
                subscription: {
                  select: {
                    tier: true,
                    status: true,
                    currentPeriodEnd: true
                  }
                }
              }
            }
          }
        },
        commissionTransactions: {
          where: { status: 'PAID' }
        }
      }
    });

    if (!salesman) {
      throw new Error('Salesman not found');
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Calculate overview metrics
    const totalReferrals = salesman.customerReferrals.length;
    const activeCustomers = salesman.customerReferrals.filter(
      r => r.customer.subscription?.status === 'ACTIVE'
    ).length;
    const monthlyAcquisitions = salesman.customerReferrals.filter(
      r => new Date(r.referralDate) >= startOfMonth
    ).length;
    const totalCommission = salesman.commissionTransactions.reduce(
      (sum, t) => sum + t.amount, 0
    );

    // Determine performance rating
    const conversionRate = totalReferrals > 0 ? (activeCustomers / totalReferrals) * 100 : 0;
    let performanceRating = 'POOR';
    if (conversionRate >= 80) performanceRating = 'EXCELLENT';
    else if (conversionRate >= 60) performanceRating = 'GOOD';
    else if (conversionRate >= 40) performanceRating = 'AVERAGE';

    // Prepare customer summaries
    const customers = salesman.customerReferrals.map(referral => ({
      id: referral.customer.id,
      name: referral.customer.name,
      email: referral.customer.email,
      phone: referral.customer.phone,
      status: this.getCustomerStatus(referral.customer),
      subscriptionTier: referral.customer.subscription?.tier,
      joinDate: referral.referralDate,
      lastActivity: referral.customer.createdAt,
      totalValue: this.calculateCustomerValue(referral.customer),
      commissionEarned: referral.commissionEarned,
      nextPaymentDate: referral.customer.subscription?.currentPeriodEnd
    }));

    return {
      overview: {
        totalReferrals,
        activeCustomers,
        monthlyAcquisitions,
        totalCommission,
        performanceRating
      },
      customers,
      performance: {
        acquisitionMetrics: {
          totalReferrals,
          conversionRate,
          averageTimeToConversion: this.calculateAverageConversionTime(salesman.customerReferrals)
        },
        revenueMetrics: {
          totalCommissionEarned: totalCommission,
          monthlyRecurringRevenue: this.calculateMRR(customers),
          averageCustomerValue: this.calculateAverageCustomerValue(customers)
        },
        targetProgress: {
          monthly: {
            achieved: monthlyAcquisitions,
            target: salesman.monthlyTarget,
            percentage: salesman.monthlyTarget > 0 ?
              Math.min((monthlyAcquisitions / salesman.monthlyTarget) * 100, 100) : 0
          }
        }
      }
    };
  }

  /**
   * Helper method to get subscription monthly amount
   * @param {string} tier - Subscription tier
   * @returns {number} Monthly amount
   */
  getSubscriptionMonthlyAmount(tier) {
    const amounts = {
      'STARTER': 29.99,
      'HOMECARE': 49.99,
      'PRIORITY': 99.99
    };
    return amounts[tier] || 0;
  }

  /**
   * Helper method to determine customer status
   * @param {Object} customer - Customer object
   * @returns {string} Customer status
   */
  getCustomerStatus(customer) {
    if (!customer.subscription) return 'PROSPECT';

    switch (customer.subscription.status) {
      case 'ACTIVE': return 'ACTIVE';
      case 'PAST_DUE': return 'PAUSED';
      case 'CANCELLED': return 'CANCELLED';
      default: return 'PROSPECT';
    }
  }

  /**
   * Helper method to calculate customer lifetime value
   * @param {Object} customer - Customer object
   * @returns {number} Customer value
   */
  calculateCustomerValue(customer) {
    if (!customer.subscription) return 0;

    const monthlyAmount = this.getSubscriptionMonthlyAmount(customer.subscription.tier);
    // Estimate based on subscription duration or default to 12 months
    const months = 12; // This could be calculated based on actual subscription duration
    return monthlyAmount * months;
  }

  /**
   * Helper method to calculate average conversion time
   * @param {Array} referrals - Array of referral records
   * @returns {number} Average days to conversion
   */
  calculateAverageConversionTime(referrals) {
    const convertedReferrals = referrals.filter(r => r.conversionDate);
    if (convertedReferrals.length === 0) return 0;

    const totalDays = convertedReferrals.reduce((sum, r) => {
      const days = Math.floor(
        (new Date(r.conversionDate) - new Date(r.referralDate)) / (1000 * 60 * 60 * 24)
      );
      return sum + days;
    }, 0);

    return Math.round(totalDays / convertedReferrals.length);
  }

  /**
   * Helper method to calculate monthly recurring revenue
   * @param {Array} customers - Array of customer summaries
   * @returns {number} MRR amount
   */
  calculateMRR(customers) {
    return customers.reduce((sum, customer) => {
      if (customer.status === 'ACTIVE' && customer.subscriptionTier) {
        return sum + this.getSubscriptionMonthlyAmount(customer.subscriptionTier);
      }
      return sum;
    }, 0);
  }

  /**
   * Helper method to calculate average customer value
   * @param {Array} customers - Array of customer summaries
   * @returns {number} Average customer value
   */
  calculateAverageCustomerValue(customers) {
    if (customers.length === 0) return 0;

    const totalValue = customers.reduce((sum, customer) => sum + customer.totalValue, 0);
    return totalValue / customers.length;
  }

  /**
   * Validate referral code format
   * @param {string} code - Referral code to validate
   * @returns {boolean} Is valid
   */
  isValidReferralCode(code) {
    if (!code || typeof code !== 'string') return false;

    // 4-12 characters, alphanumeric, no special characters
    const regex = /^[A-Z0-9]{4,12}$/;
    return regex.test(code.toUpperCase());
  }

  /**
   * Delete salesman profile
   * @param {string} salesmanId - Salesman profile ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteSalesman(salesmanId) {
    const salesman = await prisma.salesmanProfile.findUnique({
      where: { id: salesmanId },
      include: {
        customerReferrals: true,
        commissionTransactions: true
      }
    });

    if (!salesman) {
      throw new Error('Salesman not found');
    }

    // Check if salesman has active referrals
    const activeReferrals = salesman.customerReferrals.filter(
      r => r.status === 'CONVERTED'
    );

    if (activeReferrals.length > 0) {
      throw new Error('Cannot delete salesman with active customer referrals');
    }

    // Delete salesman profile (cascade will handle related records)
    await prisma.salesmanProfile.delete({
      where: { id: salesmanId }
    });

    // Update user role back to CUSTOMER
    await prisma.user.update({
      where: { id: salesman.userId },
      data: { role: 'CUSTOMER' }
    });

    return { success: true, message: 'Salesman profile deleted successfully' };
  }
}

export default new SalesmanService();