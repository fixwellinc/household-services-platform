import express from 'express';
import { authMiddleware, requireAdmin } from '../../middleware/auth.js';
import { auditPresets } from '../../middleware/auditMiddleware.js';
import { auditService } from '../../services/auditService.js';

const router = express.Router();

// Apply admin role check
router.use(authMiddleware);
router.use(requireAdmin);

// Mock email templates data - in real implementation, this would come from database
let emailTemplates = [
  {
    id: '1',
    name: 'Welcome Email',
    subject: 'Welcome to FixWell!',
    content: '<h1>Welcome to FixWell!</h1><p>Thank you for joining us. We\'re excited to help you with your home maintenance needs.</p>',
    type: 'welcome',
    category: 'transactional',
    isActive: true,
    variables: ['{{userName}}', '{{userEmail}}'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastUsed: new Date().toISOString(),
    usageCount: 45
  },
  {
    id: '2',
    name: 'Booking Confirmation',
    subject: 'Your appointment has been confirmed',
    content: '<h2>Appointment Confirmed</h2><p>Your appointment for {{serviceType}} has been confirmed for {{appointmentDate}} at {{appointmentTime}}.</p>',
    type: 'booking_confirmation',
    category: 'transactional',
    isActive: true,
    variables: ['{{serviceType}}', '{{appointmentDate}}', '{{appointmentTime}}', '{{technicianName}}'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastUsed: new Date().toISOString(),
    usageCount: 123
  },
  {
    id: '3',
    name: 'Payment Receipt',
    subject: 'Payment Receipt - {{invoiceNumber}}',
    content: '<h2>Payment Receipt</h2><p>Thank you for your payment of ${{amount}} for invoice {{invoiceNumber}}.</p>',
    type: 'payment_receipt',
    category: 'transactional',
    isActive: true,
    variables: ['{{invoiceNumber}}', '{{amount}}', '{{paymentMethod}}', '{{paymentDate}}'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastUsed: new Date().toISOString(),
    usageCount: 67
  }
];

let emailCampaigns = [
  {
    id: '1',
    name: 'Monthly Newsletter',
    templateId: '1',
    subject: 'FixWell Monthly Newsletter',
    recipients: 1250,
    sent: 1250,
    opened: 890,
    clicked: 234,
    status: 'sent',
    scheduledAt: new Date().toISOString(),
    createdAt: new Date().toISOString()
  }
];

/**
 * GET /api/admin/email-templates
 * Get all email templates
 */
router.get('/', async (req, res) => {
  try {
    const { type, category, active } = req.query;
    
    let filteredTemplates = [...emailTemplates];
    
    if (type && type !== 'all') {
      filteredTemplates = filteredTemplates.filter(t => t.type === type);
    }
    
    if (category && category !== 'all') {
      filteredTemplates = filteredTemplates.filter(t => t.category === category);
    }
    
    if (active !== undefined) {
      const isActive = active === 'true';
      filteredTemplates = filteredTemplates.filter(t => t.isActive === isActive);
    }
    
    res.json({
      success: true,
      templates: filteredTemplates
    });
  } catch (error) {
    console.error('Error fetching email templates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch email templates'
    });
  }
});

/**
 * GET /api/admin/email-templates/:id
 * Get specific email template
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const template = emailTemplates.find(t => t.id === id);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }
    
    res.json({
      success: true,
      template
    });
  } catch (error) {
    console.error('Error fetching email template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch email template'
    });
  }
});

/**
 * POST /api/admin/email-templates
 * Create new email template
 */
router.post('/', async (req, res) => {
  try {
    const { name, subject, content, type, category, isActive } = req.body;
    
    // Validate required fields
    if (!name || !subject || !content) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, subject, content'
      });
    }
    
    // Check if template name already exists
    const existingTemplate = emailTemplates.find(t => t.name === name);
    if (existingTemplate) {
      return res.status(400).json({
        success: false,
        error: 'Template name already exists'
      });
    }
    
    const newTemplate = {
      id: (emailTemplates.length + 1).toString(),
      name,
      subject,
      content,
      type: type || 'custom',
      category: category || 'transactional',
      isActive: isActive !== undefined ? isActive : true,
      variables: extractVariables(content),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0
    };
    
    emailTemplates.push(newTemplate);
    
    // Log audit event
    await auditService.log({
      adminId: req.user.id,
      action: 'email_template_create',
      entityType: 'email_template',
      entityId: newTemplate.id,
      changes: {
        name,
        type,
        category
      },
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date(),
        sessionId: req.sessionID
      },
      severity: 'medium'
    });
    
    res.status(201).json({
      success: true,
      template: newTemplate,
      message: 'Template created successfully'
    });
  } catch (error) {
    console.error('Error creating email template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create email template'
    });
  }
});

/**
 * PUT /api/admin/email-templates/:id
 * Update email template
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, subject, content, type, category, isActive } = req.body;
    
    const templateIndex = emailTemplates.findIndex(t => t.id === id);
    if (templateIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }
    
    const oldTemplate = { ...emailTemplates[templateIndex] };
    
    // Update template
    emailTemplates[templateIndex] = {
      ...emailTemplates[templateIndex],
      name: name || emailTemplates[templateIndex].name,
      subject: subject || emailTemplates[templateIndex].subject,
      content: content || emailTemplates[templateIndex].content,
      type: type || emailTemplates[templateIndex].type,
      category: category || emailTemplates[templateIndex].category,
      isActive: isActive !== undefined ? isActive : emailTemplates[templateIndex].isActive,
      variables: content ? extractVariables(content) : emailTemplates[templateIndex].variables,
      updatedAt: new Date().toISOString()
    };
    
    // Log audit event
    await auditService.log({
      adminId: req.user.id,
      action: 'email_template_update',
      entityType: 'email_template',
      entityId: id,
      changes: {
        name: { from: oldTemplate.name, to: emailTemplates[templateIndex].name },
        subject: { from: oldTemplate.subject, to: emailTemplates[templateIndex].subject },
        type: { from: oldTemplate.type, to: emailTemplates[templateIndex].type },
        category: { from: oldTemplate.category, to: emailTemplates[templateIndex].category },
        isActive: { from: oldTemplate.isActive, to: emailTemplates[templateIndex].isActive }
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
      template: emailTemplates[templateIndex],
      message: 'Template updated successfully'
    });
  } catch (error) {
    console.error('Error updating email template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update email template'
    });
  }
});

/**
 * DELETE /api/admin/email-templates/:id
 * Delete email template
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const templateIndex = emailTemplates.findIndex(t => t.id === id);
    if (templateIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }
    
    const deletedTemplate = emailTemplates[templateIndex];
    emailTemplates.splice(templateIndex, 1);
    
    // Log audit event
    await auditService.log({
      adminId: req.user.id,
      action: 'email_template_delete',
      entityType: 'email_template',
      entityId: id,
      changes: {
        deletedTemplate: deletedTemplate.name
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
    console.error('Error deleting email template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete email template'
    });
  }
});

/**
 * POST /api/admin/email-templates/:id/test
 * Send test email
 */
router.post('/:id/test', async (req, res) => {
  try {
    const { id } = req.params;
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email address is required'
      });
    }
    
    const template = emailTemplates.find(t => t.id === id);
    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }
    
    // TODO: Implement actual email sending
    console.log('Sending test email:', {
      to: email,
      subject: template.subject,
      content: template.content,
      templateId: id
    });
    
    // Update usage count
    const templateIndex = emailTemplates.findIndex(t => t.id === id);
    if (templateIndex !== -1) {
      emailTemplates[templateIndex].usageCount += 1;
      emailTemplates[templateIndex].lastUsed = new Date().toISOString();
    }
    
    // Log audit event
    await auditService.log({
      adminId: req.user.id,
      action: 'email_template_test',
      entityType: 'email_template',
      entityId: id,
      changes: {
        testEmail: email
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
      message: 'Test email sent successfully'
    });
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send test email'
    });
  }
});

/**
 * GET /api/admin/email-campaigns
 * Get all email campaigns
 */
router.get('/campaigns', async (req, res) => {
  try {
    res.json({
      success: true,
      campaigns: emailCampaigns
    });
  } catch (error) {
    console.error('Error fetching email campaigns:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch email campaigns'
    });
  }
});

/**
 * Helper function to extract variables from email content
 */
function extractVariables(content) {
  const variableRegex = /\{\{([^}]+)\}\}/g;
  const variables = [];
  let match;
  
  while ((match = variableRegex.exec(content)) !== null) {
    if (!variables.includes(match[1])) {
      variables.push(match[1]);
    }
  }
  
  return variables;
}

export default router;
