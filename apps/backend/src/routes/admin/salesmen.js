import express from 'express';
import { requireAdmin } from '../../middleware/auth.js';
import { validate, sanitize } from '../../middleware/validation.js';
import { ValidationError } from '../../middleware/error.js';
import salesmanService from '../../services/salesmanService.js';
// import adminSalesmenService from '../../services/adminSalesmenService.js';
import referralService from '../../services/referralService.js';
import rateLimit from 'express-rate-limit';
import {
  adminConfigLimiter,
  auditAdminConfigChanges,
  logFailedAuth
} from '../../middleware/appointmentSecurity.js';
import prisma from '../../config/database.js';

const router = express.Router();

// Health check endpoint (NO AUTH) - for production diagnostics
router.get('/health', async (req, res) => {
  try {
    console.log('🏥 Health check endpoint accessed');

    // Basic server health
    const serverHealth = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      nodeVersion: process.version,
      platform: process.platform
    };

    // Test database connection
    let dbHealth = null;
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbHealth = { status: 'connected', message: 'Database connection successful' };
    } catch (dbError) {
      dbHealth = { status: 'error', message: dbError.message };
    }

    // Test basic salesmanService import
    let serviceHealth = null;
    try {
      // Touch a method to ensure module is loaded
      serviceHealth = { status: 'loaded', message: 'SalesmanService available' };
    } catch (serviceError) {
      serviceHealth = { status: 'error', message: serviceError.message };
    }

    res.json({
      success: true,
      server: serverHealth,
      database: dbHealth,
      salesmanService: serviceHealth,
      environment: process.env.NODE_ENV || 'unknown'
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

// Debug and fix endpoints (NO AUTH) - place before auth middleware
router.get('/debug', async (req, res, next) => {
  try {
    console.log('🔍 Debug endpoint triggered...');

    // Get all users with SALESMAN role
    const salesmanUsers = await prisma.user.findMany({
      where: { role: 'SALESMAN' },
      select: { id: true, email: true, name: true, role: true, salesmanProfile: true }
    });

    // Get all salesman profiles
    const salesmanProfiles = await prisma.salesmanProfile.findMany({
      include: { user: true }
    });

    console.log('📊 Debug data:', {
      salesmanUsers: salesmanUsers.length,
      salesmanProfiles: salesmanProfiles.length
    });

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      salesmanUsers,
      salesmanProfiles,
      counts: {
        salesmanUsers: salesmanUsers.length,
        salesmanProfiles: salesmanProfiles.length
      },
      analysis: {
        usersWithoutProfiles: salesmanUsers.filter(u => !u.salesmanProfile).length,
        profilesData: salesmanProfiles.map(p => ({
          id: p.id,
          displayName: p.displayName,
          status: p.status,
          userEmail: p.user?.email,
          userName: p.user?.name
        }))
      }
    });
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    next(error);
  }
});

router.get('/fix-now', async (req, res, next) => {
  try {
    console.log('🔧 Immediate fix endpoint triggered...');
    // Get all profiles that need fixing
    const allProfiles = await prisma.salesmanProfile.findMany({
      include: { user: true }
    });

    let updatedCount = 0;
    const results = [];

    for (const profile of allProfiles) {
      if (profile.user) {
        const oldDisplayName = profile.displayName;
        const newDisplayName = profile.user.name || profile.user.email.split('@')[0];

        if (oldDisplayName !== newDisplayName || !profile.status) {
          await prisma.salesmanProfile.update({
            where: { id: profile.id },
            data: {
              displayName: newDisplayName,
              status: profile.status || 'ACTIVE'
            }
          });

          results.push({
            profileId: profile.id,
            userEmail: profile.user.email,
            oldDisplayName,
            newDisplayName,
            statusFixed: !profile.status
          });

          updatedCount++;
          console.log(`✅ Fixed: ${profile.user.email} -> ${newDisplayName}`);
        }
      }
    }

    res.json({
      success: true,
      message: `Fixed ${updatedCount} salesman profiles`,
      updatedCount,
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in fix-now endpoint:', error);
    next(error);
  }
});

// Rate limiting for admin endpoints
const adminRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 admin requests per windowMs
  message: {
    error: 'Too many admin requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Apply admin authentication and rate limiting to protected routes
router.use(adminRateLimit);
router.use(requireAdmin);
router.use(logFailedAuth);

// Validation schemas for salesman management
const salesmanValidationSchemas = {
  createSalesman: {
    userId: (value) => {
      if (!value || typeof value !== 'string') {
        throw new ValidationError('User ID is required and must be a string');
      }
      return value.trim();
    },
    displayName: (value) => {
      if (!value || typeof value !== 'string') {
        throw new ValidationError('Display name is required');
      }
      if (value.length < 2 || value.length > 100) {
        throw new ValidationError('Display name must be between 2 and 100 characters');
      }
      return value.trim();
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
    commissionRate: (value) => {
      if (value === undefined) return 5.0; // Default
      const rate = parseFloat(value);
      if (isNaN(rate) || rate < 0 || rate > 100) {
        throw new ValidationError('Commission rate must be between 0 and 100');
      }
      return rate;
    },
    commissionType: (value) => {
      if (value && !['PERCENTAGE', 'FIXED'].includes(value)) {
        throw new ValidationError('Commission type must be PERCENTAGE or FIXED');
      }
      return value || 'PERCENTAGE';
    },
    commissionTier: (value) => {
      if (value && !['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'].includes(value)) {
        throw new ValidationError('Commission tier must be BRONZE, SILVER, GOLD, or PLATINUM');
      }
      return value || 'BRONZE';
    },
    monthlyTarget: (value) => {
      if (value === undefined) return 0;
      const target = parseInt(value);
      if (isNaN(target) || target < 0) {
        throw new ValidationError('Monthly target must be a non-negative number');
      }
      return target;
    },
    customReferralCode: (value) => {
      if (value && typeof value !== 'string') {
        throw new ValidationError('Custom referral code must be a string');
      }
      if (value && !salesmanService.isValidReferralCode(value)) {
        throw new ValidationError('Invalid referral code format (4-12 alphanumeric characters)');
      }
      return value?.toUpperCase();
    }
  },
  updateSalesman: {
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
    commissionRate: (value) => {
      if (value === undefined) return undefined;
      const rate = parseFloat(value);
      if (isNaN(rate) || rate < 0 || rate > 100) {
        throw new ValidationError('Commission rate must be between 0 and 100');
      }
      return rate;
    },
    commissionType: (value) => {
      if (value && !['PERCENTAGE', 'FIXED'].includes(value)) {
        throw new ValidationError('Commission type must be PERCENTAGE or FIXED');
      }
      return value;
    },
    commissionTier: (value) => {
      if (value && !['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'].includes(value)) {
        throw new ValidationError('Commission tier must be BRONZE, SILVER, GOLD, or PLATINUM');
      }
      return value;
    },
    status: (value) => {
      if (value && !['ACTIVE', 'INACTIVE', 'SUSPENDED'].includes(value)) {
        throw new ValidationError('Status must be ACTIVE, INACTIVE, or SUSPENDED');
      }
      return value;
    },
    monthlyTarget: (value) => {
      if (value === undefined) return undefined;
      const target = parseInt(value);
      if (isNaN(target) || target < 0) {
        throw new ValidationError('Monthly target must be a non-negative number');
      }
      return target;
    }
  }
};

// Custom validation middleware for salesmen
const validateSalesmanAdmin = (schemaName) => {
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


// GET /api/admin/salesmen/sync - Debug endpoint to manually sync profiles
router.get('/sync', async (req, res, next) => {
  try {
    console.log('🔄 Manual sync triggered by admin...');
    const created = await salesmanService.syncMissingSalesmanProfiles();

    // Also refresh the data to show immediate results
    const result = await salesmanService.getSalesmen({ limit: 100 });

    res.json({
      success: true,
      message: `Synced and fixed salesman profiles. Created: ${created}`,
      created,
      currentSalesmen: result.salesmen.length,
      data: result.salesmen
    });
  } catch (error) {
    console.error('Error syncing salesmen profiles:', error);
    next(error);
  }
});

// GET /api/admin/salesmen/force-refresh - Force refresh all profiles
router.get('/force-refresh', async (req, res, next) => {
  try {
    console.log('🔄 Force refresh triggered by admin...');

    // Get all existing profiles
    const allProfiles = await prisma.salesmanProfile.findMany({
      include: { user: true }
    });

    let updatedCount = 0;

    // Force update all profiles with user data
    for (const profile of allProfiles) {
      try {
        if (profile.user) {
          const newDisplayName = profile.user.name || profile.user.email.split('@')[0];

          await prisma.salesmanProfile.update({
            where: { id: profile.id },
            data: {
              displayName: newDisplayName,
              status: profile.status || 'ACTIVE'
            }
          });

          console.log(`✅ Force updated profile: ${profile.user.email} -> ${newDisplayName}`);
          updatedCount++;
        }
      } catch (error) {
        console.error(`❌ Failed to update profile ${profile.id}:`, error.message);
      }
    }

    // Get fresh data
    const result = await salesmanService.getSalesmen({ limit: 100 });

    res.json({
      success: true,
      message: `Force refreshed ${updatedCount} salesman profiles`,
      updated: updatedCount,
      currentSalesmen: result.salesmen.length,
      data: result.salesmen
    });
  } catch (error) {
    console.error('Error force refreshing salesmen profiles:', error);
    next(error);
  }
});

// GET /api/admin/salesmen - Get all salesmen (enhanced version with fallback)
router.get('/', async (req, res, next) => {
  try {
    console.log('📋 Main salesmen endpoint accessed with query:', req.query);

    // Test if we can even reach this point
    console.log('🔧 Testing basic functionality...');

    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      status: req.query.status,
      search: req.query.search,
      commissionTier: req.query.commissionTier,
      territory: req.query.territory,
      sortBy: req.query.sortBy || 'createdAt',
      sortOrder: req.query.sortOrder || 'desc'
    };

    console.log('📊 Parsed options:', options);

    // Test database connection first
    console.log('🔗 Testing database connection...');
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connection successful');

    // Service is already imported at module scope

    // Temporarily use only original service until enhanced service is fixed
    console.log('📋 Getting salesmen data...');
    const result = await salesmanService.getSalesmen({
      status: options.status,
      search: options.search,
      page: options.page,
      limit: options.limit,
      sortBy: options.sortBy,
      sortOrder: options.sortOrder
    });
    console.log('✅ Data retrieved successfully:', result.salesmen?.length || 0, 'salesmen');

    res.json({
      success: true,
      data: result.salesmen,
      pagination: result.pagination,
      temporary_fallback: true,
      debug: {
        timestamp: new Date().toISOString(),
        options_received: options,
        data_count: result.salesmen?.length || 0
      }
    });
  } catch (error) {
    console.error('❌ Error getting salesmen:', error);
    console.error('Error stack:', error.stack);

    // Return detailed error for debugging
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString(),
      debug_info: {
        route: 'GET /api/admin/salesmen',
        query: req.query,
        error_type: error.constructor.name
      }
    });
  }
});

// POST /api/admin/salesmen - Create new salesman
router.post('/',
  adminConfigLimiter,
  sanitize,
  validateSalesmanAdmin('createSalesman'),
  auditAdminConfigChanges('CREATE_SALESMAN', 'salesman'),
  async (req, res, next) => {
    try {
      const salesmanData = req.validatedData;

      const newSalesman = await salesmanService.createSalesman(salesmanData);

      res.status(201).json({
        success: true,
        message: 'Salesman created successfully',
        data: newSalesman
      });
    } catch (error) {
      console.error('Error creating salesman:', error);

      if (error.message.includes('User not found')) {
        return res.status(404).json({
          error: 'User not found',
          message: error.message
        });
      }

      if (error.message.includes('already has a salesman profile') ||
          error.message.includes('already exists')) {
        return res.status(409).json({
          error: 'Conflict',
          message: error.message
        });
      }

      next(error);
    }
  }
);

// GET /api/admin/salesmen/:id - Get specific salesman (enhanced with fallback)
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    // Temporarily use only original service until enhanced service is fixed
    const salesman = await salesmanService.getSalesmanByUserId(id);

    if (!salesman) {
      return res.status(404).json({
        error: 'Salesman not found',
        message: 'No salesman profile found for this ID'
      });
    }

    // Get additional details
    const [dashboard, referralStats] = await Promise.all([
      salesmanService.getSalesmanDashboard(salesman.id),
      referralService.getReferralStats(salesman.id)
    ]);

    res.json({
      success: true,
      data: {
        profile: salesman,
        dashboard,
        referralStats
      },
      temporary_fallback: true
    });
  } catch (error) {
    console.error('Error getting salesman:', error);
    next(error);
  }
});

// PUT /api/admin/salesmen/:id - Update salesman
router.put('/:id',
  adminConfigLimiter,
  sanitize,
  validateSalesmanAdmin('updateSalesman'),
  auditAdminConfigChanges('UPDATE_SALESMAN', 'salesman'),
  async (req, res, next) => {
    try {
      const { id } = req.params;

      if (Object.keys(req.validatedData).length === 0) {
        return res.status(400).json({
          error: 'No valid fields to update',
          message: 'Please provide at least one field to update'
        });
      }

      const updatedSalesman = await salesmanService.updateSalesman(id, req.validatedData);

      res.json({
        success: true,
        message: 'Salesman updated successfully',
        data: updatedSalesman
      });
    } catch (error) {
      console.error('Error updating salesman:', error);

      if (error.message.includes('not found')) {
        return res.status(404).json({
          error: 'Salesman not found',
          message: error.message
        });
      }

      next(error);
    }
  }
);

// DELETE /api/admin/salesmen/:id - Delete salesman
router.delete('/:id',
  adminConfigLimiter,
  auditAdminConfigChanges('DELETE_SALESMAN', 'salesman'),
  async (req, res, next) => {
    try {
      const { id } = req.params;

      const result = await salesmanService.deleteSalesman(id);

      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      console.error('Error deleting salesman:', error);

      if (error.message.includes('not found')) {
        return res.status(404).json({
          error: 'Salesman not found',
          message: error.message
        });
      }

      if (error.message.includes('active customer referrals')) {
        return res.status(409).json({
          error: 'Cannot delete',
          message: error.message
        });
      }

      next(error);
    }
  }
);

// POST /api/admin/salesmen/:id/activate - Activate salesman
router.post('/:id/activate',
  adminConfigLimiter,
  auditAdminConfigChanges('ACTIVATE_SALESMAN', 'salesman'),
  async (req, res, next) => {
    try {
      const { id } = req.params;

      const updatedSalesman = await salesmanService.updateSalesman(id, {
        status: 'ACTIVE'
      });

      res.json({
        success: true,
        message: 'Salesman activated successfully',
        data: updatedSalesman
      });
    } catch (error) {
      console.error('Error activating salesman:', error);

      if (error.message.includes('not found')) {
        return res.status(404).json({
          error: 'Salesman not found',
          message: error.message
        });
      }

      next(error);
    }
  }
);

// POST /api/admin/salesmen/:id/suspend - Suspend salesman
router.post('/:id/suspend',
  adminConfigLimiter,
  auditAdminConfigChanges('SUSPEND_SALESMAN', 'salesman'),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const updatedSalesman = await salesmanService.updateSalesman(id, {
        status: 'SUSPENDED'
      });

      res.json({
        success: true,
        message: 'Salesman suspended successfully',
        data: updatedSalesman
      });
    } catch (error) {
      console.error('Error suspending salesman:', error);

      if (error.message.includes('not found')) {
        return res.status(404).json({
          error: 'Salesman not found',
          message: error.message
        });
      }

      next(error);
    }
  }
);

// GET /api/admin/salesmen/:id/customers - Get salesman's customers
router.get('/:id/customers', async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      status,
      search,
      page = 1,
      limit = 20
    } = req.query;

    const dashboard = await salesmanService.getSalesmanDashboard(id);
    let customers = dashboard.customers;

    // Apply filters
    if (status) {
      customers = customers.filter(customer => customer.status === status);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      customers = customers.filter(customer =>
        customer.name.toLowerCase().includes(searchLower) ||
        customer.email.toLowerCase().includes(searchLower)
      );
    }

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

// GET /api/admin/salesmen/:id/performance - Get salesman performance
router.get('/:id/performance', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    const [dashboard, referralStats, topCampaigns] = await Promise.all([
      salesmanService.getSalesmanDashboard(id),
      referralService.getReferralStats(id, { startDate, endDate }),
      referralService.getTopCampaigns(id, 10)
    ]);

    res.json({
      success: true,
      data: {
        performance: dashboard.performance,
        referralStats,
        topCampaigns
      }
    });
  } catch (error) {
    console.error('Error getting salesman performance:', error);
    next(error);
  }
});

// GET /api/admin/salesmen/analytics - Get overall salesmen analytics
router.get('/analytics/overview', async (req, res, next) => {
  try {
    const { period = 'all_time' } = req.query;

    const [leaderboard, totalSalesmen] = await Promise.all([
      referralService.getReferralLeaderboard({ period, limit: 20 }),
      salesmanService.getSalesmen({ limit: 1000 }) // Get count
    ]);

    const activeSalesmen = totalSalesmen.salesmen.filter(s => s.status === 'ACTIVE').length;
    const totalReferrals = leaderboard.reduce((sum, s) => sum + s.totalReferrals, 0);
    const totalConversions = leaderboard.reduce((sum, s) => sum + s.conversions, 0);
    const totalCommission = leaderboard.reduce((sum, s) => sum + s.totalCommission, 0);

    res.json({
      success: true,
      data: {
        overview: {
          totalSalesmen: totalSalesmen.pagination.totalCount,
          activeSalesmen,
          totalReferrals,
          totalConversions,
          totalCommission,
          averageConversionRate: totalReferrals > 0 ? (totalConversions / totalReferrals) * 100 : 0
        },
        leaderboard,
        period
      }
    });
  } catch (error) {
    console.error('Error getting salesmen analytics:', error);
    next(error);
  }
});

export default router;