import express from 'express';
import { authMiddleware, requireAdmin } from '../middleware/auth.js';
import { auditPresets } from '../middleware/auditMiddleware.js';
import { auditService } from '../services/auditService.js';
import queueService from '../services/queueService.js';
import socketService from '../services/socketService.js';
import searchService from '../services/searchService.js';
import searchIndexService from '../services/searchIndexService.js';
import billingAdjustmentRoutes from './admin/billingAdjustments.js';
import monitoringRoutes from './admin/monitoring.js';
import exportRoutes from './admin/exports.js';
import reportRoutes from './admin/reports.js';
import availabilityRoutes from './admin/availability.js';
import salesmenRoutes from './admin/salesmen.js';
import stripeAdminRoutes from './admin/stripe.js';

const router = express.Router();

// Apply admin role check (auth already applied globally)
router.use(requireAdmin);

// Mount billing adjustment routes
router.use('/', billingAdjustmentRoutes);

// Mount monitoring routes
router.use('/monitoring', monitoringRoutes);

// Mount export routes
router.use('/exports', exportRoutes);

// Mount report routes
router.use('/reports', reportRoutes);

// Mount availability routes
router.use('/availability', availabilityRoutes);

// Mount salesmen routes
router.use('/salesmen', salesmenRoutes);

// Mount Stripe diagnostics routes
router.use('/stripe', stripeAdminRoutes);

/**
 * GET /api/admin/dashboard/stats
 * Get dashboard statistics
 */
router.get('/dashboard/stats', async (req, res) => {
  try {
    // Mock dashboard stats - in real implementation, calculate from database
    const stats = {
      totalUsers: 1250,
      totalRevenue: 45600,
      totalBookings: 89,
      activeSessions: socketService.getConnectionStats().totalConnections,
      userGrowth: 8.2,
      revenueGrowth: 12.5,
      bookingGrowth: -2.1,
      sessionGrowth: 15.3,
      notifications: {
        unread: 5,
        total: 23
      },
      systemHealth: {
        database: 'healthy',
        api: 'operational',
        chat: 'connected',
        jobs: 'processing'
      }
    };

    res.json({ success: true, stats });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard statistics'
    });
  }
});

/**
 * GET /api/admin/dashboard/users
 * Get user metrics for dashboard widgets
 */
router.get('/dashboard/users', async (req, res) => {
  try {
    // Mock user data - in real implementation, fetch from database
    const userData = {
      count: 1250,
      previousCount: 1180,
      trend: 'up',
      growth: 5.93,
      newToday: 12,
      activeToday: 876,
      target: 1500
    };

    res.json(userData);
  } catch (error) {
    console.error('Error fetching user metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user metrics'
    });
  }
});

/**
 * GET /api/admin/dashboard/revenue
 * Get revenue metrics for dashboard widgets
 */
router.get('/dashboard/revenue', async (req, res) => {
  try {
    // Mock revenue data - in real implementation, calculate from database
    const revenueData = {
      total: 45600,
      previousTotal: 40800,
      trend: 'up',
      growth: 11.76,
      todayRevenue: 1280,
      monthlyRecurring: 38900,
      target: 50000
    };

    res.json(revenueData);
  } catch (error) {
    console.error('Error fetching revenue metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch revenue metrics'
    });
  }
});

/**
 * GET /api/admin/dashboard/bookings
 * Get booking metrics for dashboard widgets
 */
router.get('/dashboard/bookings', async (req, res) => {
  try {
    // Mock booking data - in real implementation, fetch from database
    const bookingData = {
      activeCount: 89,
      previousActiveCount: 76,
      trend: 'up',
      pendingCount: 23,
      completedToday: 15,
      cancelledToday: 3
    };

    res.json(bookingData);
  } catch (error) {
    console.error('Error fetching booking metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch booking metrics'
    });
  }
});

/**
 * GET /api/admin/dashboard/alerts
 * Get system alerts for dashboard widgets
 */
router.get('/dashboard/alerts', async (req, res) => {
  try {
    // Mock alert data - in real implementation, fetch from monitoring system
    const alertData = {
      alerts: [
        {
          id: 'alert-1',
          message: 'Database connection slow',
          severity: 'medium',
          timestamp: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
          acknowledged: false
        },
        {
          id: 'alert-2',
          message: 'High memory usage detected',
          severity: 'high',
          timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
          acknowledged: false
        },
        {
          id: 'alert-3',
          message: 'Queue processing delayed',
          severity: 'low',
          timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
          acknowledged: true
        }
      ]
    };

    res.json(alertData);
  } catch (error) {
    console.error('Error fetching system alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch system alerts'
    });
  }
});

/**
 * GET /api/admin/dashboard/subscriptions
 * Get subscription data for dashboard widgets
 */
router.get('/dashboard/subscriptions', async (req, res) => {
  try {
    const { metric = 'table' } = req.query;

    if (metric === 'chart') {
      // Return chart data for subscription trends
      const chartData = [
        { date: '2024-01-01', count: 450, plan: 'basic' },
        { date: '2024-01-02', count: 465, plan: 'basic' },
        { date: '2024-01-03', count: 478, plan: 'basic' },
        { date: '2024-01-04', count: 485, plan: 'basic' },
        { date: '2024-01-05', count: 490, plan: 'basic' }
      ];
      res.json({ chartData });
    } else {
      // Return table data for subscription list
      const subscriptions = [
        ['John Smith', 'Premium', 'Active', '2024-01-15', '$99.99'],
        ['Jane Doe', 'Basic', 'Active', '2024-01-14', '$29.99'],
        ['Bob Johnson', 'Pro', 'Paused', '2024-01-13', '$59.99'],
        ['Alice Brown', 'Premium', 'Active', '2024-01-12', '$99.99'],
        ['Charlie Wilson', 'Basic', 'Active', '2024-01-11', '$29.99']
      ];

      const subscriptionData = {
        headers: ['Customer', 'Plan', 'Status', 'Created', 'Revenue'],
        subscriptions,
        totalCount: 1250
      };

      res.json(subscriptionData);
    }
  } catch (error) {
    console.error('Error fetching subscription data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch subscription data'
    });
  }
});

/**
 * GET /api/admin/dashboard/layouts
 * Get saved dashboard layouts
 */
router.get('/dashboard/layouts', async (req, res) => {
  try {
    const { userId } = req.query;

    // Mock layout data - in real implementation, fetch from database
    const layouts = [
      {
        id: 'default-admin',
        name: 'Admin Dashboard',
        widgets: [],
        gridSize: { columns: 12, rows: 8 },
        isDefault: true,
        userId: userId || 'admin',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    res.json({ success: true, layouts });
  } catch (error) {
    console.error('Error fetching dashboard layouts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard layouts'
    });
  }
});

/**
 * POST /api/admin/dashboard/layouts
 * Save a new dashboard layout
 */
router.post('/dashboard/layouts', async (req, res) => {
  try {
    const layout = req.body;

    // Mock save operation - in real implementation, save to database
    const savedLayout = {
      ...layout,
      id: layout.id || `layout-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    res.json({ success: true, layout: savedLayout });
  } catch (error) {
    console.error('Error saving dashboard layout:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save dashboard layout'
    });
  }
});

/**
 * PUT /api/admin/dashboard/layouts
 * Update an existing dashboard layout
 */
router.put('/dashboard/layouts', async (req, res) => {
  try {
    const layout = req.body;

    // Mock update operation - in real implementation, update in database
    const updatedLayout = {
      ...layout,
      updatedAt: new Date()
    };

    res.json({ success: true, layout: updatedLayout });
  } catch (error) {
    console.error('Error updating dashboard layout:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update dashboard layout'
    });
  }
});

/**
 * GET /api/admin/audit-logs
 * Get audit logs with filtering
 */
router.get('/audit-logs', async (req, res) => {
  try {
    const filters = {
      adminId: req.query.adminId,
      action: req.query.action,
      entityType: req.query.entityType,
      severity: req.query.severity,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 50
    };

    const result = await auditService.getAuditLogs(filters);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch audit logs' 
    });
  }
});

/**
 * GET /api/admin/audit-logs/export
 * Export audit logs
 */
router.get('/audit-logs/export', async (req, res) => {
  try {
    const filters = {
      adminId: req.query.adminId,
      action: req.query.action,
      entityType: req.query.entityType,
      severity: req.query.severity,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    const format = req.query.format || 'csv';
    const exportData = await auditService.exportAuditLogs(filters, format);

    const filename = `audit-logs-${new Date().toISOString().split('T')[0]}.${format}`;
    
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
    } else {
      res.setHeader('Content-Type', 'application/json');
    }
    
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(exportData);
  } catch (error) {
    console.error('Error exporting audit logs:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to export audit logs' 
    });
  }
});

/**
 * GET /api/admin/audit-logs/stats
 * Get audit log statistics
 */
router.get('/audit-logs/stats', async (req, res) => {
  try {
    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    const stats = await auditService.getAuditStats(filters);
    res.json({ success: true, stats });
  } catch (error) {
    console.error('Error fetching audit stats:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch audit statistics' 
    });
  }
});

/**
 * GET /api/admin/queue/stats
 * Get queue statistics
 */
router.get('/queue/stats', async (req, res) => {
  try {
    const stats = await queueService.getAllQueueStats();
    res.json({ success: true, stats });
  } catch (error) {
    console.error('Error fetching queue stats:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch queue statistics' 
    });
  }
});

/**
 * POST /api/admin/queue/:queueName/pause
 * Pause a queue
 */
router.post('/queue/:queueName/pause', auditPresets.settingsUpdate, async (req, res) => {
  try {
    const { queueName } = req.params;
    await queueService.pauseQueue(queueName);
    
    // Notify other admins
    socketService.notifyAdmins('admin:queue-paused', { queueName });
    
    res.json({ success: true, message: `Queue ${queueName} paused` });
  } catch (error) {
    console.error('Error pausing queue:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * POST /api/admin/queue/:queueName/resume
 * Resume a queue
 */
router.post('/queue/:queueName/resume', auditPresets.settingsUpdate, async (req, res) => {
  try {
    const { queueName } = req.params;
    await queueService.resumeQueue(queueName);
    
    // Notify other admins
    socketService.notifyAdmins('admin:queue-resumed', { queueName });
    
    res.json({ success: true, message: `Queue ${queueName} resumed` });
  } catch (error) {
    console.error('Error resuming queue:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * GET /api/admin/socket/stats
 * Get Socket.IO connection statistics
 */
router.get('/socket/stats', async (req, res) => {
  try {
    const stats = socketService.getConnectionStats();
    const chatRooms = socketService.getActiveChatRooms();
    
    res.json({ 
      success: true, 
      stats: {
        ...stats,
        chatRooms
      }
    });
  } catch (error) {
    console.error('Error fetching socket stats:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch socket statistics' 
    });
  }
});

/**
 * POST /api/admin/broadcast/system-alert
 * Broadcast a system alert to all admins
 */
router.post('/broadcast/system-alert', auditPresets.settingsUpdate, async (req, res) => {
  try {
    const { type, message, severity = 'medium' } = req.body;
    
    if (!type || !message) {
      return res.status(400).json({ 
        success: false, 
        error: 'Type and message are required' 
      });
    }

    const alert = {
      type,
      message,
      severity,
      timestamp: new Date().toISOString(),
      adminId: req.user.id
    };

    socketService.broadcastSystemAlert(alert);
    
    res.json({ success: true, message: 'System alert broadcasted' });
  } catch (error) {
    console.error('Error broadcasting system alert:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to broadcast system alert' 
    });
  }
});

/**
 * GET /api/admin/search/global
 * Global search across all entities
 */
router.get('/search/global', async (req, res) => {
  try {
    const { 
      q: query, 
      entities, 
      limit = 20,
      includeMetadata = false 
    } = req.query;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Query must be at least 2 characters long'
      });
    }

    const options = {
      entities: entities ? entities.split(',') : undefined,
      limit: parseInt(limit),
      includeMetadata: includeMetadata === 'true'
    };

    const results = await searchService.globalSearch(query, options);
    
    res.json({ success: true, ...results });
  } catch (error) {
    console.error('Error performing global search:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform search'
    });
  }
});

/**
 * GET /api/admin/search/:entity
 * Search within a specific entity
 */
router.get('/search/:entity', async (req, res) => {
  try {
    const { entity } = req.params;
    const {
      q: query,
      filters,
      sort,
      sortDir = 'desc',
      page = 1,
      limit = 50,
      includeMetadata = false
    } = req.query;

    // Parse filters if provided
    let parsedFilters = {};
    if (filters) {
      try {
        parsedFilters = JSON.parse(filters);
      } catch (error) {
        return res.status(400).json({
          success: false,
          error: 'Invalid filters format'
        });
      }
    }

    const options = {
      filters: parsedFilters,
      sorting: sort ? { field: sort, direction: sortDir } : undefined,
      pagination: { 
        page: parseInt(page), 
        limit: parseInt(limit) 
      },
      includeMetadata: includeMetadata === 'true'
    };

    const results = await searchService.searchEntity(entity, query || '', options);
    
    res.json({ success: true, ...results });
  } catch (error) {
    console.error(`Error searching ${req.params.entity}:`, error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to perform entity search'
    });
  }
});

/**
 * GET /api/admin/search/config/:entity
 * Get search configuration for an entity
 */
router.get('/search/config/:entity', async (req, res) => {
  try {
    const { entity } = req.params;
    const config = searchService.getSearchConfig(entity);
    
    if (!config) {
      return res.status(404).json({
        success: false,
        error: `Search configuration not found for entity: ${entity}`
      });
    }

    res.json({ success: true, config });
  } catch (error) {
    console.error(`Error getting search config for ${req.params.entity}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to get search configuration'
    });
  }
});

/**
 * GET /api/admin/search/configs
 * Get all available search configurations
 */
router.get('/search/configs', async (req, res) => {
  try {
    const configs = searchService.getAllSearchConfigs();
    res.json({ success: true, configs });
  } catch (error) {
    console.error('Error getting search configs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get search configurations'
    });
  }
});

/**
 * GET /api/admin/search/suggestions/:entity
 * Get search suggestions for an entity
 */
router.get('/search/suggestions/:entity', async (req, res) => {
  try {
    const { entity } = req.params;
    const { q: query } = req.query;

    if (!query || query.length < 2) {
      return res.json({ success: true, suggestions: [] });
    }

    const config = searchService.getSearchConfig(entity);
    if (!config) {
      return res.status(404).json({
        success: false,
        error: `Entity not found: ${entity}`
      });
    }

    const suggestions = await searchService.generateSuggestions(config, query);
    res.json({ success: true, suggestions });
  } catch (error) {
    console.error(`Error getting suggestions for ${req.params.entity}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to get search suggestions'
    });
  }
});

/**
 * GET /api/admin/search/stats
 * Get search performance statistics
 */
router.get('/search/stats', async (req, res) => {
  try {
    const stats = searchIndexService.getSearchStats();
    res.json({ success: true, stats });
  } catch (error) {
    console.error('Error getting search stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get search statistics'
    });
  }
});

/**
 * DELETE /api/admin/search/stats
 * Clear search statistics
 */
router.delete('/search/stats', auditPresets.settingsUpdate, async (req, res) => {
  try {
    searchIndexService.clearSearchStats();
    res.json({ success: true, message: 'Search statistics cleared' });
  } catch (error) {
    console.error('Error clearing search stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear search statistics'
    });
  }
});

/**
 * POST /api/admin/test/audit-log
 * Test audit logging (for development)
 */
router.post('/test/audit-log', async (req, res) => {
  try {
    const { action, entityType, entityId, changes } = req.body;
    
    const auditLog = await auditService.logAction({
      adminId: req.user.id,
      action: action || 'TEST_ACTION',
      entityType: entityType || 'test',
      entityId: entityId || 'test-123',
      changes: changes || { test: 'data' },
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        testMode: true
      },
      severity: 'low'
    });

    res.json({ success: true, auditLog });
  } catch (error) {
    console.error('Error creating test audit log:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create test audit log' 
    });
  }
});

export default router;