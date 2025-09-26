import express from 'express';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import { validate, sanitize } from '../middleware/validation.js';
import { ValidationError } from '../middleware/error.js';
import salesmanService from '../services/salesmanService.js';
import referralService from '../services/referralService.js';
import prisma from '../config/database.js';
import { rateLimit } from 'express-rate-limit';

const router = express.Router();

// Rate limiting for salesman endpoints
const salesmanRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 requests per windowMs
  message: {
    error: 'Too many requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Apply rate limiting and authentication to all routes
router.use(salesmanRateLimit);
router.use(authMiddleware);

// Validation schemas
const salesmanValidationSchemas = {
  updateProfile: {
    displayName: (value) => {
      if (value && typeof value !== 'string') {
        throw new ValidationError('Display name must be a string');
      }
      if (value && (value.length < 2 || value.length > 100)) {
        throw new ValidationError('Display name must be between 2 and 100 characters');
      }
      return value?.trim();
    },
    personalMessage: (value) => {
      if (value && typeof value !== 'string') {
        throw new ValidationError('Personal message must be a string');
      }
      if (value && value.length > 500) {
        throw new ValidationError('Personal message must be less than 500 characters');
      }
      return value?.trim();
    },
    territoryPostalCodes: (value) => {
      if (value && !Array.isArray(value)) {
        throw new ValidationError('Territory postal codes must be an array');
      }
      if (value && value.some(code => typeof code !== 'string')) {
        throw new ValidationError('All postal codes must be strings');
      }
      return value || [];
    }
  },
  generateLinks: {
    campaign: (value) => {
      if (value && typeof value !== 'string') {
        throw new ValidationError('Campaign must be a string');
      }
      return value?.trim();
    },
    source: (value) => {
      if (value && typeof value !== 'string') {
        throw new ValidationError('Source must be a string');
      }
      return value?.trim();
    },
    medium: (value) => {
      if (value && typeof value !== 'string') {
        throw new ValidationError('Medium must be a string');
      }
      return value?.trim();
    }
  }
};

// Custom validation middleware
const validateSalesman = (schemaName) => {
  return (req, res, next) => {
    try {
      const schema = salesmanValidationSchemas[schemaName];
      if (!schema) {
        throw new ValidationError(`Validation schema '${schemaName}' not found`);
      }

      const validatedData = {};

      Object.keys(schema).forEach(field => {
        const value = req.body[field];
        if (value !== undefined) {
          validatedData[field] = schema[field](value);
        }
      });

      req.validatedData = validatedData;
      next();
    } catch (error) {
      next(error);
    }
  };
};

// Middleware to ensure user is a salesman
const requireSalesman = async (req, res, next) => {
  try {
    if (req.user.role !== 'SALESMAN') {
      return res.status(403).json({
        error: 'Access denied',
        message: 'This endpoint requires salesman role'
      });
    }

    // Get salesman profile
    const salesmanProfile = await salesmanService.getSalesmanByUserId(req.user.id);
    if (!salesmanProfile) {
      return res.status(404).json({
        error: 'Salesman profile not found',
        message: 'User has SALESMAN role but no profile exists'
      });
    }

    if (salesmanProfile.status !== 'ACTIVE') {
      return res.status(403).json({
        error: 'Account inactive',
        message: 'Your salesman account is not active'
      });
    }

    req.salesmanProfile = salesmanProfile;
    next();
  } catch (error) {
    next(error);
  }
};

// GET /api/salesman/dashboard - Get salesman dashboard
router.get('/dashboard', requireSalesman, async (req, res, next) => {
  try {
    const dashboard = await salesmanService.getSalesmanDashboard(req.salesmanProfile.id);

    res.json({
      success: true,
      data: dashboard
    });
  } catch (error) {
    console.error('Error getting salesman dashboard:', error);
    next(error);
  }
});

// GET /api/salesman/profile - Get salesman profile
router.get('/profile', requireSalesman, async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: {
        id: req.salesmanProfile.id,
        userId: req.salesmanProfile.userId,
        referralCode: req.salesmanProfile.referralCode,
        displayName: req.salesmanProfile.displayName,
        personalMessage: req.salesmanProfile.personalMessage,
        commissionTier: req.salesmanProfile.commissionTier,
        territoryPostalCodes: req.salesmanProfile.territoryPostalCodes,
        territoryRegions: req.salesmanProfile.territoryRegions,
        monthlyTarget: req.salesmanProfile.monthlyTarget,
        quarterlyTarget: req.salesmanProfile.quarterlyTarget,
        yearlyTarget: req.salesmanProfile.yearlyTarget,
        status: req.salesmanProfile.status,
        startDate: req.salesmanProfile.startDate,
        createdAt: req.salesmanProfile.createdAt
      }
    });
  } catch (error) {
    console.error('Error getting salesman profile:', error);
    next(error);
  }
});

// PUT /api/salesman/profile - Update salesman profile
router.put('/profile',
  requireSalesman,
  sanitize,
  validateSalesman('updateProfile'),
  async (req, res, next) => {
    try {
      const { displayName, personalMessage, territoryPostalCodes } = req.validatedData;

      if (Object.keys(req.validatedData).length === 0) {
        return res.status(400).json({
          error: 'No valid fields to update',
          message: 'Please provide at least one field to update'
        });
      }

      const updatedProfile = await salesmanService.updateSalesman(
        req.salesmanProfile.id,
        req.validatedData
      );

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: updatedProfile
      });
    } catch (error) {
      console.error('Error updating salesman profile:', error);
      next(error);
    }
  }
);

// GET /api/salesman/customers - Get referred customers
router.get('/customers', requireSalesman, async (req, res, next) => {
  try {
    const {
      status,
      search,
      page = 1,
      limit = 20,
      sortBy = 'joinDate',
      sortOrder = 'desc'
    } = req.query;

    // This is included in the dashboard data, but we can create a separate endpoint for more detailed filtering
    const dashboard = await salesmanService.getSalesmanDashboard(req.salesmanProfile.id);
    let customers = dashboard.customers;

    // Apply filters
    if (status) {
      customers = customers.filter(customer => customer.status === status);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      customers = customers.filter(customer =>
        customer.name.toLowerCase().includes(searchLower) ||
        customer.email.toLowerCase().includes(searchLower) ||
        (customer.phone && customer.phone.includes(search))
      );
    }

    // Apply sorting
    customers.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === 'joinDate' || sortBy === 'lastActivity' || sortBy === 'nextPaymentDate') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (sortOrder === 'desc') {
        return bValue > aValue ? 1 : -1;
      } else {
        return aValue > bValue ? 1 : -1;
      }
    });

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedCustomers = customers.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedCustomers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: customers.length,
        totalPages: Math.ceil(customers.length / limit)
      }
    });
  } catch (error) {
    console.error('Error getting salesman customers:', error);
    next(error);
  }
});

// GET /api/salesman/performance - Get performance metrics
router.get('/performance', requireSalesman, async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const [dashboard, referralStats] = await Promise.all([
      salesmanService.getSalesmanDashboard(req.salesmanProfile.id),
      referralService.getReferralStats(req.salesmanProfile.id, {
        startDate,
        endDate
      })
    ]);

    res.json({
      success: true,
      data: {
        ...dashboard.performance,
        referralStats
      }
    });
  } catch (error) {
    console.error('Error getting salesman performance:', error);
    next(error);
  }
});

// GET /api/salesman/referral-links - Get referral links
router.get('/referral-links', requireSalesman, async (req, res, next) => {
  try {
    const { campaign, source, medium } = req.query;

    const links = await referralService.generateReferralLinks(req.salesmanProfile.id, {
      campaign,
      source,
      medium
    });

    res.json({
      success: true,
      data: links
    });
  } catch (error) {
    console.error('Error generating referral links:', error);
    next(error);
  }
});

// POST /api/salesman/referral-links/generate - Generate custom referral links
router.post('/referral-links/generate',
  requireSalesman,
  sanitize,
  validateSalesman('generateLinks'),
  async (req, res, next) => {
    try {
      const { campaign, source, medium } = req.validatedData;

      const links = await referralService.generateReferralLinks(req.salesmanProfile.id, {
        campaign,
        source,
        medium
      });

      res.json({
        success: true,
        message: 'Referral links generated successfully',
        data: links
      });
    } catch (error) {
      console.error('Error generating custom referral links:', error);
      next(error);
    }
  }
);

// GET /api/salesman/commission - Get commission history
router.get('/commission', requireSalesman, async (req, res, next) => {
  try {
    const {
      status,
      transactionType,
      page = 1,
      limit = 20,
      startDate,
      endDate
    } = req.query;

    const where = {
      salesmanId: req.salesmanProfile.id
    };

    if (status) where.status = status;
    if (transactionType) where.transactionType = transactionType;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const [transactions, totalCount, summary] = await Promise.all([
      prisma.commissionTransaction.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          referral: {
            select: {
              id: true,
              referralDate: true,
              referralSource: true
            }
          }
        }
      }),
      prisma.commissionTransaction.count({ where }),
      prisma.commissionTransaction.aggregate({
        where: { salesmanId: req.salesmanProfile.id },
        _sum: { amount: true },
        _count: true
      })
    ]);

    const totalEarnings = summary._sum.amount || 0;
    const totalTransactions = summary._count || 0;

    res.json({
      success: true,
      data: {
        transactions,
        summary: {
          totalEarnings,
          totalTransactions,
          averageTransaction: totalTransactions > 0 ? totalEarnings / totalTransactions : 0
        },
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error getting commission history:', error);
    next(error);
  }
});

// GET /api/salesman/stats - Get detailed statistics
router.get('/stats', requireSalesman, async (req, res, next) => {
  try {
    const { period = 'all_time' } = req.query;

    const [referralStats, topCampaigns] = await Promise.all([
      referralService.getReferralStats(req.salesmanProfile.id, { period }),
      referralService.getTopCampaigns(req.salesmanProfile.id, 5)
    ]);

    res.json({
      success: true,
      data: {
        referralStats,
        topCampaigns,
        profile: {
          referralCode: req.salesmanProfile.referralCode,
          commissionTier: req.salesmanProfile.commissionTier,
          targets: {
            monthly: req.salesmanProfile.monthlyTarget,
            quarterly: req.salesmanProfile.quarterlyTarget,
            yearly: req.salesmanProfile.yearlyTarget
          }
        }
      }
    });
  } catch (error) {
    console.error('Error getting salesman stats:', error);
    next(error);
  }
});

export default router;