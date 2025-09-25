import prisma from '../config/database.js';
import { auditService } from './auditService.js';
import salesmanService from './salesmanService.js';

class AdminSalesmenService {
  /**
   * Get all salesmen with advanced filtering and pagination
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Paginated salesmen list with stats
   */
  async getAllSalesmen(options = {}) {
    const {
      page = 1,
      limit = 20,
      status,
      search,
      commissionTier,
      territory,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = options;

    const skip = (page - 1) * limit;
    const where = {};

    // Status filter
    if (status && status !== 'ALL') {
      where.status = status;
    }

    // Commission tier filter
    if (commissionTier && commissionTier !== 'ALL') {
      where.commissionTier = commissionTier;
    }

    // Territory filter
    if (territory) {
      where.OR = [
        { territoryPostalCodes: { has: territory } },
        { territoryRegions: { has: territory } }
      ];
    }

    // Search filter
    if (search) {
      where.OR = [
        { displayName: { contains: search, mode: 'insensitive' } },
        { referralCode: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const [salesmen, totalCount, stats] = await Promise.all([
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
              createdAt: true,
              isActive: true
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
      prisma.salesmanProfile.count({ where }),
      this.getSalesmenStats()
    ]);

    // Enhance salesmen data with performance metrics
    const enhancedSalesmen = await Promise.all(
      salesmen.map(async (salesman) => {
        const performance = await this.calculateSalesmanMetrics(salesman.id);

        return {
          id: salesman.id,
          userId: salesman.userId,
          displayName: salesman.displayName,
          referralCode: salesman.referralCode,
          personalMessage: salesman.personalMessage,
          commissionRate: salesman.commissionRate,
          commissionType: salesman.commissionType,
          commissionTier: salesman.commissionTier,
          status: salesman.status,
          territoryPostalCodes: salesman.territoryPostalCodes,
          territoryRegions: salesman.territoryRegions,
          monthlyTarget: salesman.monthlyTarget,
          quarterlyTarget: salesman.quarterlyTarget,
          yearlyTarget: salesman.yearlyTarget,
          startDate: salesman.startDate,
          endDate: salesman.endDate,
          terminationReason: salesman.terminationReason,
          suspensionReason: salesman.suspensionReason,
          adminNotes: salesman.adminNotes,
          lastActivityAt: salesman.lastActivityAt,
          createdAt: salesman.createdAt,
          updatedAt: salesman.updatedAt,
          user: salesman.user,
          performance,
          counts: salesman._count
        };
      })
    );

    return {
      salesmen: enhancedSalesmen,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      },
      stats
    };
  }

  /**
   * Get individual salesman details with comprehensive data
   * @param {string} salesmanId - Salesman profile ID
   * @returns {Promise<Object>} Complete salesman details
   */
  async getSalesmanById(salesmanId) {
    const salesman = await prisma.salesmanProfile.findUnique({
      where: { id: salesmanId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            phone: true,
            createdAt: true,
            isActive: true
          }
        },
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
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        _count: {
          select: {
            customerReferrals: true,
            commissionTransactions: true
          }
        }
      }
    });

    if (!salesman) return null;

    // Get performance metrics
    const performance = await this.calculateSalesmanMetrics(salesmanId);
    const dashboard = await salesmanService.getSalesmanDashboard(salesmanId);

    return {
      ...salesman,
      performance,
      dashboard
    };
  }

  /**
   * Update salesman profile with audit logging
   * @param {string} salesmanId - Salesman profile ID
   * @param {Object} updateData - Update data
   * @param {string} adminId - Admin user ID
   * @returns {Promise<Object>} Updated salesman profile
   */
  async updateSalesman(salesmanId, updateData, adminId) {
    const existingSalesman = await prisma.salesmanProfile.findUnique({
      where: { id: salesmanId },
      include: { user: true }
    });

    if (!existingSalesman) {
      throw new Error('Salesman not found');
    }

    // Log the changes
    const changes = {};
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== existingSalesman[key]) {
        changes[key] = {
          from: existingSalesman[key],
          to: updateData[key]
        };
      }
    });

    const updatedSalesman = await prisma.salesmanProfile.update({
      where: { id: salesmanId },
      data: {
        ...updateData,
        lastActivityAt: new Date(),
        updatedAt: new Date()
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

    // Audit log
    await auditService.logAction(adminId, 'update_salesman_profile', 'salesmanProfile', salesmanId, {
      changes,
      salesmanEmail: existingSalesman.user.email,
      updatedFields: Object.keys(updateData)
    });

    return updatedSalesman;
  }

  /**
   * Update salesman employment status with proper workflow
   * @param {string} salesmanId - Salesman profile ID
   * @param {string} status - New status
   * @param {string} reason - Reason for status change
   * @param {Date} effectiveDate - Effective date
   * @param {string} adminId - Admin user ID
   * @returns {Promise<Object>} Updated salesman profile
   */
  async updateSalesmanStatus(salesmanId, status, reason, effectiveDate, adminId) {
    const existingSalesman = await prisma.salesmanProfile.findUnique({
      where: { id: salesmanId },
      include: { user: true }
    });

    if (!existingSalesman) {
      throw new Error('Salesman not found');
    }

    const updateData = {
      status,
      lastActivityAt: new Date(),
      updatedAt: new Date()
    };

    // Handle specific status changes
    if (status === 'TERMINATED') {
      updateData.endDate = effectiveDate;
      updateData.terminationReason = reason;

      // Deactivate user account
      await prisma.user.update({
        where: { id: existingSalesman.userId },
        data: {
          isActive: false,
          role: 'CUSTOMER' // Revert role
        }
      });
    } else if (status === 'SUSPENDED') {
      updateData.suspensionReason = reason;
    } else if (status === 'ACTIVE') {
      // Clear suspension/termination reasons when reactivating
      updateData.suspensionReason = null;
      updateData.terminationReason = null;
      updateData.endDate = null;

      // Reactivate user account
      await prisma.user.update({
        where: { id: existingSalesman.userId },
        data: {
          isActive: true,
          role: 'SALESMAN'
        }
      });
    }

    const updatedSalesman = await prisma.salesmanProfile.update({
      where: { id: salesmanId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            phone: true,
            isActive: true
          }
        }
      }
    });

    // Audit log
    await auditService.logAction(adminId, 'update_salesman_status', 'salesmanProfile', salesmanId, {
      statusChange: {
        from: existingSalesman.status,
        to: status
      },
      reason,
      effectiveDate,
      salesmanEmail: existingSalesman.user.email
    });

    return updatedSalesman;
  }

  /**
   * Get salesman performance metrics
   * @param {string} salesmanId - Salesman profile ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Performance data
   */
  async getSalesmanPerformance(salesmanId, options = {}) {
    const { startDate, endDate, period = 'month' } = options;

    // Get date range based on period
    const dateRange = this.getDateRange(period, startDate, endDate);

    const [referrals, commissions, targets] = await Promise.all([
      prisma.customerReferral.findMany({
        where: {
          salesmanId,
          referralDate: {
            gte: dateRange.start,
            lte: dateRange.end
          }
        },
        include: {
          customer: {
            include: {
              subscription: true
            }
          }
        }
      }),
      prisma.commissionTransaction.findMany({
        where: {
          salesmanId,
          createdAt: {
            gte: dateRange.start,
            lte: dateRange.end
          }
        }
      }),
      prisma.salesmanProfile.findUnique({
        where: { id: salesmanId },
        select: {
          monthlyTarget: true,
          quarterlyTarget: true,
          yearlyTarget: true
        }
      })
    ]);

    const activeReferrals = referrals.filter(r => r.customer.subscription?.status === 'ACTIVE');
    const convertedReferrals = referrals.filter(r => r.status === 'CONVERTED');
    const totalCommission = commissions.reduce((sum, c) => sum + c.amount, 0);
    const paidCommission = commissions.filter(c => c.status === 'PAID').reduce((sum, c) => sum + c.amount, 0);

    return {
      period: {
        start: dateRange.start,
        end: dateRange.end,
        period
      },
      metrics: {
        totalReferrals: referrals.length,
        activeCustomers: activeReferrals.length,
        conversions: convertedReferrals.length,
        conversionRate: referrals.length > 0 ? (convertedReferrals.length / referrals.length) * 100 : 0,
        totalCommissionEarned: totalCommission,
        paidCommission,
        pendingCommission: totalCommission - paidCommission
      },
      targets: {
        monthly: targets.monthlyTarget,
        quarterly: targets.quarterlyTarget,
        yearly: targets.yearlyTarget,
        monthlyProgress: targets.monthlyTarget > 0 ? (referrals.length / targets.monthlyTarget) * 100 : 0
      },
      referralBreakdown: {
        byStatus: this.groupByStatus(referrals),
        byMonth: this.groupByMonth(referrals)
      }
    };
  }

  /**
   * Get customers referred by a salesman
   * @param {string} salesmanId - Salesman profile ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Customer data
   */
  async getSalesmanCustomers(salesmanId, options = {}) {
    const {
      page = 1,
      limit = 20,
      status,
      search,
      sortBy = 'referralDate',
      sortOrder = 'desc'
    } = options;

    const skip = (page - 1) * limit;
    const where = { salesmanId };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.customer = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ]
      };
    }

    const [customers, totalCount] = await Promise.all([
      prisma.customerReferral.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
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
      }),
      prisma.customerReferral.count({ where })
    ]);

    return {
      customers: customers.map(referral => ({
        ...referral,
        customerStatus: this.getCustomerStatus(referral.customer),
        subscriptionTier: referral.customer.subscription?.tier,
        monthlyValue: this.calculateMonthlyValue(referral.customer.subscription?.tier),
        lifetimeValue: this.calculateLifetimeValue(referral.customer)
      })),
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    };
  }

  /**
   * Bulk update multiple salesmen
   * @param {Array} salesmanIds - Array of salesman IDs
   * @param {Object} updates - Updates to apply
   * @param {string} adminId - Admin user ID
   * @returns {Promise<Object>} Bulk operation result
   */
  async bulkUpdateSalesmen(salesmanIds, updates, adminId) {
    const results = {
      successCount: 0,
      failureCount: 0,
      failures: []
    };

    for (const salesmanId of salesmanIds) {
      try {
        await this.updateSalesman(salesmanId, updates, adminId);
        results.successCount++;
      } catch (error) {
        results.failureCount++;
        results.failures.push({
          salesmanId,
          error: error.message
        });
      }
    }

    // Audit log for bulk operation
    await auditService.logAction(adminId, 'bulk_update_salesmen', 'salesmanProfile', 'bulk', {
      salesmanCount: salesmanIds.length,
      updates,
      results
    });

    return results;
  }

  /**
   * Export salesmen data
   * @param {Object} filters - Export filters
   * @param {Array} fields - Fields to export
   * @param {string} format - Export format
   * @returns {Promise<Object>} Export data
   */
  async exportSalesmenData(filters = {}, fields = [], format = 'csv') {
    const { salesmen } = await this.getAllSalesmen({ ...filters, limit: 1000 });

    // Select fields to export
    const exportFields = fields.length > 0 ? fields : [
      'displayName', 'referralCode', 'user.email', 'status', 'commissionTier',
      'performance.totalReferrals', 'performance.activeCustomers', 'performance.conversionRate',
      'monthlyTarget', 'startDate', 'territoryPostalCodes'
    ];

    const exportData = salesmen.map(salesman => {
      const row = {};
      exportFields.forEach(field => {
        const value = this.getNestedValue(salesman, field);
        row[field] = value;
      });
      return row;
    });

    switch (format) {
      case 'csv':
        return {
          data: this.convertToCSV(exportData),
          contentType: 'text/csv'
        };
      case 'xlsx':
        return {
          data: this.convertToXLSX(exportData),
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        };
      case 'json':
        return {
          data: JSON.stringify(exportData, null, 2),
          contentType: 'application/json'
        };
      default:
        throw new Error('Unsupported export format');
    }
  }

  /**
   * Get overall salesmen analytics
   * @param {string} period - Time period
   * @returns {Promise<Object>} Analytics data
   */
  async getSalesmenAnalytics(period = 'month') {
    const dateRange = this.getDateRange(period);

    const [totalStats, topPerformers, tierDistribution] = await Promise.all([
      this.getSalesmenStats(),
      this.getTopPerformers(10, dateRange),
      this.getCommissionTierDistribution()
    ]);

    return {
      overview: totalStats,
      topPerformers,
      tierDistribution,
      trends: await this.getSalesmenTrends(period)
    };
  }

  /**
   * Terminate salesman with proper cleanup
   * @param {string} salesmanId - Salesman profile ID
   * @param {string} reason - Termination reason
   * @param {string} adminId - Admin user ID
   * @returns {Promise<Object>} Termination result
   */
  async terminateSalesman(salesmanId, reason, adminId) {
    const salesman = await prisma.salesmanProfile.findUnique({
      where: { id: salesmanId },
      include: {
        user: true,
        customerReferrals: true
      }
    });

    if (!salesman) {
      throw new Error('Salesman not found');
    }

    // Check for active referrals
    const activeReferrals = salesman.customerReferrals.filter(r => r.status === 'CONVERTED');
    if (activeReferrals.length > 0) {
      throw new Error('Cannot terminate salesman with active customer referrals. Transfer customers first.');
    }

    // Update salesman status to terminated
    const terminatedSalesman = await prisma.salesmanProfile.update({
      where: { id: salesmanId },
      data: {
        status: 'TERMINATED',
        endDate: new Date(),
        terminationReason: reason,
        lastActivityAt: new Date()
      }
    });

    // Deactivate user account
    await prisma.user.update({
      where: { id: salesman.userId },
      data: {
        isActive: false,
        role: 'CUSTOMER'
      }
    });

    // Audit log
    await auditService.logAction(adminId, 'terminate_salesman', 'salesmanProfile', salesmanId, {
      reason,
      salesmanEmail: salesman.user.email,
      activeReferralsCount: activeReferrals.length
    });

    return {
      salesman: terminatedSalesman,
      message: 'Salesman terminated successfully'
    };
  }

  // Helper methods

  async calculateSalesmanMetrics(salesmanId) {
    const [referrals, commissions] = await Promise.all([
      prisma.customerReferral.count({ where: { salesmanId } }),
      prisma.commissionTransaction.aggregate({
        where: { salesmanId },
        _sum: { amount: true },
        _count: true
      })
    ]);

    const activeCustomers = await prisma.customerReferral.count({
      where: {
        salesmanId,
        customer: {
          subscription: {
            status: 'ACTIVE'
          }
        }
      }
    });

    const conversionRate = referrals > 0 ? (activeCustomers / referrals) * 100 : 0;

    return {
      totalReferrals: referrals,
      activeCustomers,
      conversionRate: Math.round(conversionRate * 100) / 100,
      totalCommission: commissions._sum.amount || 0,
      totalTransactions: commissions._count || 0
    };
  }

  async getSalesmenStats() {
    const stats = await prisma.salesmanProfile.groupBy({
      by: ['status'],
      _count: true
    });

    const result = {
      totalActive: 0,
      totalInactive: 0,
      totalSuspended: 0,
      totalTerminated: 0
    };

    stats.forEach(stat => {
      switch (stat.status) {
        case 'ACTIVE':
          result.totalActive = stat._count;
          break;
        case 'INACTIVE':
          result.totalInactive = stat._count;
          break;
        case 'SUSPENDED':
          result.totalSuspended = stat._count;
          break;
        case 'TERMINATED':
          result.totalTerminated = stat._count;
          break;
      }
    });

    return result;
  }

  getDateRange(period, startDate, endDate) {
    const now = new Date();
    let start, end;

    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
    } else {
      switch (period) {
        case 'week':
          start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          start = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'quarter':
          const quarter = Math.floor(now.getMonth() / 3);
          start = new Date(now.getFullYear(), quarter * 3, 1);
          break;
        case 'year':
          start = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          start = new Date(0); // All time
      }
      end = now;
    }

    return { start, end };
  }

  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  convertToCSV(data) {
    if (!data.length) return '';

    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];

    data.forEach(row => {
      const values = headers.map(header => {
        const value = row[header];
        return typeof value === 'string' ? `"${value}"` : value;
      });
      csvRows.push(values.join(','));
    });

    return csvRows.join('\n');
  }

  convertToXLSX(data) {
    // This would require xlsx library - placeholder for now
    return this.convertToCSV(data);
  }

  getCustomerStatus(customer) {
    if (!customer.subscription) return 'PROSPECT';
    return customer.subscription.status;
  }

  calculateMonthlyValue(tier) {
    const values = {
      'STARTER': 29.99,
      'HOMECARE': 49.99,
      'PRIORITY': 99.99
    };
    return values[tier] || 0;
  }

  calculateLifetimeValue(customer) {
    const monthlyValue = this.calculateMonthlyValue(customer.subscription?.tier);
    return monthlyValue * 12; // Assume 12-month average
  }

  groupByStatus(referrals) {
    return referrals.reduce((acc, referral) => {
      acc[referral.status] = (acc[referral.status] || 0) + 1;
      return acc;
    }, {});
  }

  groupByMonth(referrals) {
    return referrals.reduce((acc, referral) => {
      const month = new Date(referral.referralDate).toISOString().slice(0, 7);
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {});
  }

  async getTopPerformers(limit = 10, dateRange) {
    // Implementation for top performers
    return [];
  }

  async getCommissionTierDistribution() {
    return prisma.salesmanProfile.groupBy({
      by: ['commissionTier'],
      _count: true
    });
  }

  async getSalesmenTrends(period) {
    // Implementation for trends analysis
    return {
      referralTrends: [],
      conversionTrends: [],
      commissionTrends: []
    };
  }
}

export default new AdminSalesmenService();