import express from 'express';
import { authMiddleware, requireAdmin } from '../../middleware/auth.js';
import { auditPresets } from '../../middleware/auditMiddleware.js';
import { auditService } from '../../services/auditService.js';

const router = express.Router();

// Apply admin role check
router.use(authMiddleware);
router.use(requireAdmin);

// Mock tenants data - in real implementation, this would come from database
let tenants = [
  {
    id: '1',
    name: 'Acme Corporation',
    domain: 'acme.com',
    subdomain: 'acme',
    status: 'active',
    plan: 'enterprise',
    users: 45,
    maxUsers: 100,
    storage: 250,
    maxStorage: 1000,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    settings: {
      branding: {
        logo: '/logos/acme.png',
        primaryColor: '#3B82F6',
        secondaryColor: '#1E40AF'
      },
      features: {
        analytics: true,
        apiAccess: true,
        customDomain: true,
        whiteLabel: true
      },
      limits: {
        apiCalls: 100000,
        storage: 1000,
        users: 100
      }
    },
    billing: {
      customerId: 'cus_acme123',
      subscriptionId: 'sub_acme123',
      status: 'active',
      nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      amount: 299,
      currency: 'USD'
    }
  },
  {
    id: '2',
    name: 'TechStart Inc',
    domain: 'techstart.io',
    subdomain: 'techstart',
    status: 'active',
    plan: 'professional',
    users: 12,
    maxUsers: 25,
    storage: 75,
    maxStorage: 250,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    settings: {
      branding: {
        logo: '/logos/techstart.png',
        primaryColor: '#10B981',
        secondaryColor: '#047857'
      },
      features: {
        analytics: true,
        apiAccess: true,
        customDomain: false,
        whiteLabel: false
      },
      limits: {
        apiCalls: 50000,
        storage: 250,
        users: 25
      }
    },
    billing: {
      customerId: 'cus_techstart456',
      subscriptionId: 'sub_techstart456',
      status: 'active',
      nextBillingDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      amount: 99,
      currency: 'USD'
    }
  },
  {
    id: '3',
    name: 'SmallBiz Solutions',
    domain: 'smallbiz.com',
    subdomain: 'smallbiz',
    status: 'suspended',
    plan: 'basic',
    users: 3,
    maxUsers: 10,
    storage: 15,
    maxStorage: 50,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    settings: {
      branding: {
        logo: '/logos/smallbiz.png',
        primaryColor: '#F59E0B',
        secondaryColor: '#D97706'
      },
      features: {
        analytics: false,
        apiAccess: false,
        customDomain: false,
        whiteLabel: false
      },
      limits: {
        apiCalls: 10000,
        storage: 50,
        users: 10
      }
    },
    billing: {
      customerId: 'cus_smallbiz789',
      subscriptionId: 'sub_smallbiz789',
      status: 'past_due',
      nextBillingDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      amount: 29,
      currency: 'USD'
    }
  }
];

/**
 * GET /api/admin/tenants
 * Get all tenants
 */
router.get('/', async (req, res) => {
  try {
    const { status, plan, search } = req.query;
    
    let filteredTenants = [...tenants];
    
    if (status && status !== 'all') {
      filteredTenants = filteredTenants.filter(t => t.status === status);
    }
    
    if (plan && plan !== 'all') {
      filteredTenants = filteredTenants.filter(t => t.plan === plan);
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      filteredTenants = filteredTenants.filter(t => 
        t.name.toLowerCase().includes(searchLower) ||
        t.domain.toLowerCase().includes(searchLower) ||
        t.subdomain.toLowerCase().includes(searchLower)
      );
    }
    
    res.json({
      success: true,
      tenants: filteredTenants
    });
  } catch (error) {
    console.error('Error fetching tenants:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tenants'
    });
  }
});

/**
 * GET /api/admin/tenants/stats
 * Get tenant statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = {
      totalTenants: tenants.length,
      activeTenants: tenants.filter(t => t.status === 'active').length,
      inactiveTenants: tenants.filter(t => t.status === 'inactive').length,
      suspendedTenants: tenants.filter(t => t.status === 'suspended').length,
      totalRevenue: tenants.reduce((sum, t) => sum + t.billing.amount, 0),
      averageRevenue: tenants.reduce((sum, t) => sum + t.billing.amount, 0) / tenants.length,
      growthRate: 15.5 // Mock growth rate
    };
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error fetching tenant stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tenant stats'
    });
  }
});

/**
 * GET /api/admin/tenants/:id
 * Get specific tenant
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tenant = tenants.find(t => t.id === id);
    
    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: 'Tenant not found'
      });
    }
    
    res.json({
      success: true,
      tenant
    });
  } catch (error) {
    console.error('Error fetching tenant:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tenant'
    });
  }
});

/**
 * POST /api/admin/tenants
 * Create new tenant
 */
router.post('/', async (req, res) => {
  try {
    const { name, domain, subdomain, plan, maxUsers, maxStorage, status } = req.body;
    
    // Validate required fields
    if (!name || !domain || !subdomain) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, domain, subdomain'
      });
    }
    
    // Check if subdomain already exists
    const existingTenant = tenants.find(t => t.subdomain === subdomain);
    if (existingTenant) {
      return res.status(400).json({
        success: false,
        error: 'Subdomain already exists'
      });
    }
    
    const newTenant = {
      id: (tenants.length + 1).toString(),
      name,
      domain,
      subdomain,
      status: status || 'active',
      plan: plan || 'basic',
      users: 0,
      maxUsers: maxUsers || 10,
      storage: 0,
      maxStorage: maxStorage || 50,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      settings: {
        branding: {
          logo: '',
          primaryColor: '#3B82F6',
          secondaryColor: '#1E40AF'
        },
        features: {
          analytics: plan === 'professional' || plan === 'enterprise',
          apiAccess: plan === 'professional' || plan === 'enterprise',
          customDomain: plan === 'enterprise',
          whiteLabel: plan === 'enterprise'
        },
        limits: {
          apiCalls: plan === 'basic' ? 10000 : plan === 'professional' ? 50000 : 100000,
          storage: maxStorage || 50,
          users: maxUsers || 10
        }
      },
      billing: {
        customerId: `cus_${subdomain}_${Date.now()}`,
        subscriptionId: `sub_${subdomain}_${Date.now()}`,
        status: 'active',
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        amount: plan === 'basic' ? 29 : plan === 'professional' ? 99 : 299,
        currency: 'USD'
      }
    };
    
    tenants.push(newTenant);
    
    // Log audit event
    await auditService.log({
      adminId: req.user.id,
      action: 'tenant_create',
      entityType: 'tenant',
      entityId: newTenant.id,
      changes: {
        name,
        domain,
        subdomain,
        plan,
        maxUsers,
        maxStorage
      },
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date(),
        sessionId: req.sessionID
      },
      severity: 'high'
    });
    
    res.status(201).json({
      success: true,
      tenant: newTenant,
      message: 'Tenant created successfully'
    });
  } catch (error) {
    console.error('Error creating tenant:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create tenant'
    });
  }
});

/**
 * PUT /api/admin/tenants/:id
 * Update tenant
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, domain, subdomain, plan, maxUsers, maxStorage, status } = req.body;
    
    const tenantIndex = tenants.findIndex(t => t.id === id);
    if (tenantIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Tenant not found'
      });
    }
    
    const oldTenant = { ...tenants[tenantIndex] };
    
    // Update tenant
    tenants[tenantIndex] = {
      ...tenants[tenantIndex],
      name: name || tenants[tenantIndex].name,
      domain: domain || tenants[tenantIndex].domain,
      subdomain: subdomain || tenants[tenantIndex].subdomain,
      plan: plan || tenants[tenantIndex].plan,
      maxUsers: maxUsers || tenants[tenantIndex].maxUsers,
      maxStorage: maxStorage || tenants[tenantIndex].maxStorage,
      status: status || tenants[tenantIndex].status,
      updatedAt: new Date().toISOString()
    };
    
    // Log audit event
    await auditService.log({
      adminId: req.user.id,
      action: 'tenant_update',
      entityType: 'tenant',
      entityId: id,
      changes: {
        name: { from: oldTenant.name, to: tenants[tenantIndex].name },
        domain: { from: oldTenant.domain, to: tenants[tenantIndex].domain },
        subdomain: { from: oldTenant.subdomain, to: tenants[tenantIndex].subdomain },
        plan: { from: oldTenant.plan, to: tenants[tenantIndex].plan },
        maxUsers: { from: oldTenant.maxUsers, to: tenants[tenantIndex].maxUsers },
        maxStorage: { from: oldTenant.maxStorage, to: tenants[tenantIndex].maxStorage },
        status: { from: oldTenant.status, to: tenants[tenantIndex].status }
      },
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date(),
        sessionId: req.sessionID
      },
      severity: 'medium'
    });
    
    res.json({
      success: true,
      tenant: tenants[tenantIndex],
      message: 'Tenant updated successfully'
    });
  } catch (error) {
    console.error('Error updating tenant:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update tenant'
    });
  }
});

/**
 * DELETE /api/admin/tenants/:id
 * Delete tenant
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const tenantIndex = tenants.findIndex(t => t.id === id);
    if (tenantIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Tenant not found'
      });
    }
    
    const deletedTenant = tenants[tenantIndex];
    tenants.splice(tenantIndex, 1);
    
    // Log audit event
    await auditService.log({
      adminId: req.user.id,
      action: 'tenant_delete',
      entityType: 'tenant',
      entityId: id,
      changes: {
        deletedTenant: deletedTenant.name
      },
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date(),
        sessionId: req.sessionID
      },
      severity: 'critical'
    });
    
    res.json({
      success: true,
      message: 'Tenant deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting tenant:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete tenant'
    });
  }
});

/**
 * POST /api/admin/tenants/:id/suspend
 * Suspend tenant
 */
router.post('/:id/suspend', async (req, res) => {
  try {
    const { id } = req.params;
    
    const tenantIndex = tenants.findIndex(t => t.id === id);
    if (tenantIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Tenant not found'
      });
    }
    
    tenants[tenantIndex].status = 'suspended';
    tenants[tenantIndex].updatedAt = new Date().toISOString();
    
    // Log audit event
    await auditService.log({
      adminId: req.user.id,
      action: 'tenant_suspend',
      entityType: 'tenant',
      entityId: id,
      changes: {
        status: { from: 'active', to: 'suspended' }
      },
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date(),
        sessionId: req.sessionID
      },
      severity: 'high'
    });
    
    res.json({
      success: true,
      message: 'Tenant suspended successfully'
    });
  } catch (error) {
    console.error('Error suspending tenant:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to suspend tenant'
    });
  }
});

/**
 * POST /api/admin/tenants/:id/activate
 * Activate tenant
 */
router.post('/:id/activate', async (req, res) => {
  try {
    const { id } = req.params;
    
    const tenantIndex = tenants.findIndex(t => t.id === id);
    if (tenantIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Tenant not found'
      });
    }
    
    tenants[tenantIndex].status = 'active';
    tenants[tenantIndex].updatedAt = new Date().toISOString();
    
    // Log audit event
    await auditService.log({
      adminId: req.user.id,
      action: 'tenant_activate',
      entityType: 'tenant',
      entityId: id,
      changes: {
        status: { from: 'suspended', to: 'active' }
      },
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date(),
        sessionId: req.sessionID
      },
      severity: 'medium'
    });
    
    res.json({
      success: true,
      message: 'Tenant activated successfully'
    });
  } catch (error) {
    console.error('Error activating tenant:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to activate tenant'
    });
  }
});

export default router;
