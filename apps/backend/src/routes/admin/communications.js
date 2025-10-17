import express from 'express';
import { authMiddleware, requireAdmin } from '../../middleware/auth.js';
import { auditService } from '../../services/auditService.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Rate limiting for communication operations
const communicationRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 communication requests per windowMs
  message: {
    error: 'Too many communication requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Apply authentication and admin role requirement to all routes
router.use(authMiddleware);
router.use(requireAdmin);

// Mock data for development - in production, this would come from database
const mockCampaigns = [
  {
    id: '1',
    name: 'Welcome Email Campaign',
    subject: 'Welcome to FixWell!',
    content: 'Thank you for joining FixWell. We\'re excited to help you with your home maintenance needs.',
    status: 'sent',
    recipients: [
      {
        id: '1',
        name: 'New Customers',
        criteria: [{ field: 'created_at', operator: 'greater_than', value: '2024-01-01' }],
        estimatedCount: 150
      }
    ],
    metrics: {
      sent: 150,
      delivered: 148,
      opened: 89,
      clicked: 23,
      bounced: 2,
      unsubscribed: 1
    },
    sentAt: new Date('2024-01-15'),
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: '2',
    name: 'Monthly Newsletter',
    subject: 'Your Monthly Home Maintenance Tips',
    content: 'Here are this month\'s essential home maintenance tips to keep your property in top condition.',
    status: 'scheduled',
    recipients: [
      {
        id: '2',
        name: 'Active Subscribers',
        criteria: [{ field: 'subscription_status', operator: 'equals', value: 'active' }],
        estimatedCount: 500
      }
    ],
    metrics: {
      sent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      bounced: 0,
      unsubscribed: 0
    },
    scheduledAt: new Date('2024-02-01'),
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20')
  }
];

const mockTemplates = [
  {
    id: '1',
    name: 'Welcome Email',
    type: 'email',
    template: 'Welcome {{customerName}}! Thank you for joining {{siteName}}.',
    variables: ['customerName', 'siteName'],
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: '2',
    name: 'Appointment Reminder SMS',
    type: 'sms',
    template: 'Hi {{customerName}}, your appointment is scheduled for {{appointmentDate}} at {{appointmentTime}}.',
    variables: ['customerName', 'appointmentDate', 'appointmentTime'],
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: '3',
    name: 'Service Complete Push',
    type: 'push',
    template: 'Your {{serviceName}} service has been completed! Rate your experience.',
    variables: ['serviceName'],
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  }
];

/**
 * GET /api/admin/communications/campaigns
 * Get all email campaigns
 */
router.get('/campaigns', async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;
    
    let campaigns = [...mockCampaigns];
    
    // Filter by status if provided
    if (status) {
      campaigns = campaigns.filter(campaign => campaign.status === status);
    }
    
    // Apply pagination
    const paginatedCampaigns = campaigns.slice(
      parseInt(offset), 
      parseInt(offset) + parseInt(limit)
    );
    
    res.json({
      success: true,
      campaigns: paginatedCampaigns,
      total: campaigns.length,
      hasMore: parseInt(offset) + parseInt(limit) < campaigns.length
    });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch campaigns'
    });
  }
});

/**
 * GET /api/admin/communications/campaigns/:campaignId
 * Get specific campaign
 */
router.get('/campaigns/:campaignId', async (req, res) => {
  try {
    const { campaignId } = req.params;
    const campaign = mockCampaigns.find(c => c.id === campaignId);
    
    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found'
      });
    }
    
    res.json({
      success: true,
      campaign
    });
  } catch (error) {
    console.error('Error fetching campaign:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch campaign'
    });
  }
});

/**
 * POST /api/admin/communications/campaigns
 * Create new email campaign
 */
router.post('/campaigns', communicationRateLimit, async (req, res) => {
  try {
    const { name, subject, content, recipients, scheduledAt } = req.body;
    
    if (!name || !subject || !content) {
      return res.status(400).json({
        success: false,
        error: 'Name, subject, and content are required'
      });
    }
    
    const newCampaign = {
      id: Date.now().toString(),
      name: name.trim(),
      subject: subject.trim(),
      content: content.trim(),
      status: scheduledAt ? 'scheduled' : 'draft',
      recipients: recipients || [],
      metrics: {
        sent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        bounced: 0,
        unsubscribed: 0
      },
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // In production, save to database
    mockCampaigns.push(newCampaign);
    
    // Log audit event
    await auditService.log({
      adminId: req.user.id,
      action: 'campaign_create',
      entityType: 'email_campaign',
      entityId: newCampaign.id,
      changes: {
        name: newCampaign.name,
        subject: newCampaign.subject,
        status: newCampaign.status
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
      campaign: newCampaign
    });
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create campaign'
    });
  }
});

/**
 * PUT /api/admin/communications/campaigns/:campaignId
 * Update email campaign
 */
router.put('/campaigns/:campaignId', async (req, res) => {
  try {
    const { campaignId } = req.params;
    const updates = req.body;
    
    const campaignIndex = mockCampaigns.findIndex(c => c.id === campaignId);
    if (campaignIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found'
      });
    }
    
    // Update campaign
    mockCampaigns[campaignIndex] = {
      ...mockCampaigns[campaignIndex],
      ...updates,
      updatedAt: new Date()
    };
    
    // Log audit event
    await auditService.log({
      adminId: req.user.id,
      action: 'campaign_update',
      entityType: 'email_campaign',
      entityId: campaignId,
      changes: updates,
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
      campaign: mockCampaigns[campaignIndex]
    });
  } catch (error) {
    console.error('Error updating campaign:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update campaign'
    });
  }
});

/**
 * DELETE /api/admin/communications/campaigns/:campaignId
 * Delete email campaign
 */
router.delete('/campaigns/:campaignId', async (req, res) => {
  try {
    const { campaignId } = req.params;
    
    const campaignIndex = mockCampaigns.findIndex(c => c.id === campaignId);
    if (campaignIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found'
      });
    }
    
    const campaign = mockCampaigns[campaignIndex];
    
    // Don't allow deletion of sent campaigns
    if (campaign.status === 'sent') {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete sent campaigns'
      });
    }
    
    // Remove campaign
    mockCampaigns.splice(campaignIndex, 1);
    
    // Log audit event
    await auditService.log({
      adminId: req.user.id,
      action: 'campaign_delete',
      entityType: 'email_campaign',
      entityId: campaignId,
      changes: {
        deleted: true,
        campaignName: campaign.name
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
      message: 'Campaign deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete campaign'
    });
  }
});

/**
 * POST /api/admin/communications/campaigns/:campaignId/send
 * Send email campaign
 */
router.post('/campaigns/:campaignId/send', communicationRateLimit, async (req, res) => {
  try {
    const { campaignId } = req.params;
    
    const campaignIndex = mockCampaigns.findIndex(c => c.id === campaignId);
    if (campaignIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found'
      });
    }
    
    const campaign = mockCampaigns[campaignIndex];
    
    if (campaign.status === 'sent') {
      return res.status(400).json({
        success: false,
        error: 'Campaign has already been sent'
      });
    }
    
    // In production, this would trigger the actual email sending process
    // For now, just update the status and mock metrics
    mockCampaigns[campaignIndex] = {
      ...campaign,
      status: 'sent',
      sentAt: new Date(),
      metrics: {
        sent: 150,
        delivered: 148,
        opened: 0, // These would be updated as emails are opened
        clicked: 0,
        bounced: 2,
        unsubscribed: 0
      }
    };
    
    // Log audit event
    await auditService.log({
      adminId: req.user.id,
      action: 'campaign_send',
      entityType: 'email_campaign',
      entityId: campaignId,
      changes: {
        status: 'sent',
        sentAt: new Date()
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
      message: 'Campaign sent successfully',
      campaign: mockCampaigns[campaignIndex]
    });
  } catch (error) {
    console.error('Error sending campaign:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send campaign'
    });
  }
});

/**
 * GET /api/admin/communications/templates
 * Get all notification templates
 */
router.get('/templates', async (req, res) => {
  try {
    const { type, active } = req.query;
    
    let templates = [...mockTemplates];
    
    // Filter by type if provided
    if (type) {
      templates = templates.filter(template => template.type === type);
    }
    
    // Filter by active status if provided
    if (active !== undefined) {
      const isActive = active === 'true';
      templates = templates.filter(template => template.isActive === isActive);
    }
    
    res.json({
      success: true,
      templates
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch templates'
    });
  }
});

/**
 * POST /api/admin/communications/templates
 * Create new notification template
 */
router.post('/templates', async (req, res) => {
  try {
    const { name, type, template, variables, isActive = true } = req.body;
    
    if (!name || !type || !template) {
      return res.status(400).json({
        success: false,
        error: 'Name, type, and template are required'
      });
    }
    
    if (!['email', 'sms', 'push'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Type must be email, sms, or push'
      });
    }
    
    const newTemplate = {
      id: Date.now().toString(),
      name: name.trim(),
      type,
      template: template.trim(),
      variables: variables || [],
      isActive,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // In production, save to database
    mockTemplates.push(newTemplate);
    
    // Log audit event
    await auditService.log({
      adminId: req.user.id,
      action: 'template_create',
      entityType: 'notification_template',
      entityId: newTemplate.id,
      changes: {
        name: newTemplate.name,
        type: newTemplate.type
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
      template: newTemplate
    });
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create template'
    });
  }
});

/**
 * PUT /api/admin/communications/templates/:templateId
 * Update notification template
 */
router.put('/templates/:templateId', async (req, res) => {
  try {
    const { templateId } = req.params;
    const updates = req.body;
    
    const templateIndex = mockTemplates.findIndex(t => t.id === templateId);
    if (templateIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }
    
    // Update template
    mockTemplates[templateIndex] = {
      ...mockTemplates[templateIndex],
      ...updates,
      updatedAt: new Date()
    };
    
    // Log audit event
    await auditService.log({
      adminId: req.user.id,
      action: 'template_update',
      entityType: 'notification_template',
      entityId: templateId,
      changes: updates,
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
      template: mockTemplates[templateIndex]
    });
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update template'
    });
  }
});

/**
 * DELETE /api/admin/communications/templates/:templateId
 * Delete notification template
 */
router.delete('/templates/:templateId', async (req, res) => {
  try {
    const { templateId } = req.params;
    
    const templateIndex = mockTemplates.findIndex(t => t.id === templateId);
    if (templateIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }
    
    const template = mockTemplates[templateIndex];
    
    // Remove template
    mockTemplates.splice(templateIndex, 1);
    
    // Log audit event
    await auditService.log({
      adminId: req.user.id,
      action: 'template_delete',
      entityType: 'notification_template',
      entityId: templateId,
      changes: {
        deleted: true,
        templateName: template.name
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
      message: 'Template deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete template'
    });
  }
});

/**
 * POST /api/admin/communications/templates/:templateId/test
 * Test notification template
 */
router.post('/templates/:templateId/test', async (req, res) => {
  try {
    const { templateId } = req.params;
    const { testData } = req.body;
    
    const template = mockTemplates.find(t => t.id === templateId);
    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }
    
    // In production, this would send a test notification
    // For now, just return the rendered template
    let renderedTemplate = template.template;
    
    if (testData) {
      Object.keys(testData).forEach(key => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        renderedTemplate = renderedTemplate.replace(regex, testData[key]);
      });
    }
    
    // Log audit event
    await auditService.log({
      adminId: req.user.id,
      action: 'template_test',
      entityType: 'notification_template',
      entityId: templateId,
      changes: {
        tested: true
      },
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date(),
        sessionId: req.sessionID
      },
      severity: 'low'
    });
    
    res.json({
      success: true,
      message: 'Template test completed',
      result: {
        originalTemplate: template.template,
        renderedTemplate,
        testData
      }
    });
  } catch (error) {
    console.error('Error testing template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test template'
    });
  }
});

/**
 * GET /api/admin/communications/stats
 * Get communication statistics
 */
router.get('/stats', async (req, res) => {
  try {
    // In production, calculate these from database
    const stats = {
      totalCampaigns: mockCampaigns.length,
      activeCampaigns: mockCampaigns.filter(c => c.status === 'scheduled').length,
      totalSent: mockCampaigns.reduce((sum, c) => sum + c.metrics.sent, 0),
      averageOpenRate: 59.3, // Mock percentage
      averageClickRate: 15.4, // Mock percentage
      templates: {
        email: mockTemplates.filter(t => t.type === 'email').length,
        sms: mockTemplates.filter(t => t.type === 'sms').length,
        push: mockTemplates.filter(t => t.type === 'push').length
      }
    };
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error fetching communication stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch communication statistics'
    });
  }
});

export default router;