import express from 'express';
import { authMiddleware, requireAdmin } from '../../middleware/auth.js';
import { auditPresets } from '../../middleware/auditMiddleware.js';
import { auditService } from '../../services/auditService.js';
import { prisma } from '../../config/database.js';

const router = express.Router();

// Apply admin role check
router.use(authMiddleware);
router.use(requireAdmin);

/**
 * GET /api/admin/email-templates
 * Get all email templates
 */
router.get('/', async (req, res) => {
  try {
    const { type, category, active } = req.query;
    
    // Build where clause for filtering
    const where = {};
    
    if (active !== undefined) {
      // For now, we'll consider all templates as active since we don't have an isActive field
      // You can add this field to the EmailTemplate model if needed
    }
    
    const templates = await prisma.emailTemplate.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Transform the data to match frontend expectations
    const transformedTemplates = templates.map(template => ({
      id: template.id,
      name: template.name,
      subject: template.subject,
      content: template.isHtmlMode ? template.html : template.body,
      type: extractTemplateType(template.name),
      category: 'transactional',
      isActive: true,
      variables: extractVariables(template.isHtmlMode ? template.html : template.body),
      createdAt: template.createdAt.toISOString(),
      updatedAt: template.updatedAt.toISOString(),
      lastUsed: template.updatedAt.toISOString(), // Using updatedAt as proxy for lastUsed
      usageCount: 0 // We don't track usage count yet
    }));
    
    res.json({
      success: true,
      templates: transformedTemplates
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
    const template = await prisma.emailTemplate.findUnique({
      where: { id }
    });
    
    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }
    
    const transformedTemplate = {
      id: template.id,
      name: template.name,
      subject: template.subject,
      content: template.isHtmlMode ? template.html : template.body,
      type: extractTemplateType(template.name),
      category: 'transactional',
      isActive: true,
      variables: extractVariables(template.isHtmlMode ? template.html : template.body),
      createdAt: template.createdAt.toISOString(),
      updatedAt: template.updatedAt.toISOString(),
      lastUsed: template.updatedAt.toISOString(),
      usageCount: 0
    };
    
    res.json({
      success: true,
      template: transformedTemplate
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
    const existingTemplate = await prisma.emailTemplate.findUnique({
      where: { name }
    });
    if (existingTemplate) {
      return res.status(400).json({
        success: false,
        error: 'Template name already exists'
      });
    }
    
    // Determine if content is HTML or plain text
    const isHtmlMode = content.includes('<') && content.includes('>');
    
    const newTemplate = await prisma.emailTemplate.create({
      data: {
        name,
        subject,
        body: isHtmlMode ? null : content,
        html: isHtmlMode ? content : null,
        isHtmlMode,
        createdBy: req.user.id
      }
    });
    
    // Log audit event
    await auditService.log({
      adminId: req.user.id,
      action: 'email_template_create',
      entityType: 'email_template',
      entityId: newTemplate.id,
      changes: {
        name,
        type: type || 'custom',
        category: category || 'transactional'
      },
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date(),
        sessionId: req.sessionID
      },
      severity: 'medium'
    });
    
    const transformedTemplate = {
      id: newTemplate.id,
      name: newTemplate.name,
      subject: newTemplate.subject,
      content: newTemplate.isHtmlMode ? newTemplate.html : newTemplate.body,
      type: extractTemplateType(newTemplate.name),
      category: 'transactional',
      isActive: true,
      variables: extractVariables(newTemplate.isHtmlMode ? newTemplate.html : newTemplate.body),
      createdAt: newTemplate.createdAt.toISOString(),
      updatedAt: newTemplate.updatedAt.toISOString(),
      lastUsed: newTemplate.updatedAt.toISOString(),
      usageCount: 0
    };
    
    res.status(201).json({
      success: true,
      template: transformedTemplate,
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
    
    const existingTemplate = await prisma.emailTemplate.findUnique({
      where: { id }
    });
    
    if (!existingTemplate) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }
    
    // Check if new name conflicts with existing templates (excluding current one)
    if (name && name !== existingTemplate.name) {
      const nameConflict = await prisma.emailTemplate.findUnique({
        where: { name }
      });
      if (nameConflict) {
        return res.status(400).json({
          success: false,
          error: 'Template name already exists'
        });
      }
    }
    
    // Determine if content is HTML or plain text
    const isHtmlMode = content && content.includes('<') && content.includes('>');
    
    const updateData = {};
    if (name) updateData.name = name;
    if (subject) updateData.subject = subject;
    if (content) {
      updateData.body = isHtmlMode ? null : content;
      updateData.html = isHtmlMode ? content : null;
      updateData.isHtmlMode = isHtmlMode;
    }
    
    const updatedTemplate = await prisma.emailTemplate.update({
      where: { id },
      data: updateData
    });
    
    // Log audit event
    await auditService.log({
      adminId: req.user.id,
      action: 'email_template_update',
      entityType: 'email_template',
      entityId: id,
      changes: {
        name: { from: existingTemplate.name, to: updatedTemplate.name },
        subject: { from: existingTemplate.subject, to: updatedTemplate.subject }
      },
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date(),
        sessionId: req.sessionID
      },
      severity: 'medium'
    });
    
    const transformedTemplate = {
      id: updatedTemplate.id,
      name: updatedTemplate.name,
      subject: updatedTemplate.subject,
      content: updatedTemplate.isHtmlMode ? updatedTemplate.html : updatedTemplate.body,
      type: extractTemplateType(updatedTemplate.name),
      category: 'transactional',
      isActive: true,
      variables: extractVariables(updatedTemplate.isHtmlMode ? updatedTemplate.html : updatedTemplate.body),
      createdAt: updatedTemplate.createdAt.toISOString(),
      updatedAt: updatedTemplate.updatedAt.toISOString(),
      lastUsed: updatedTemplate.updatedAt.toISOString(),
      usageCount: 0
    };
    
    res.json({
      success: true,
      template: transformedTemplate,
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
    
    const existingTemplate = await prisma.emailTemplate.findUnique({
      where: { id }
    });
    
    if (!existingTemplate) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }
    
    await prisma.emailTemplate.delete({
      where: { id }
    });
    
    // Log audit event
    await auditService.log({
      adminId: req.user.id,
      action: 'email_template_delete',
      entityType: 'email_template',
      entityId: id,
      changes: {
        deletedTemplate: existingTemplate.name
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
    
    const template = await prisma.emailTemplate.findUnique({
      where: { id }
    });
    
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
      content: template.isHtmlMode ? template.html : template.body,
      templateId: id
    });
    
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
 * GET /api/admin/email-templates/campaigns
 * Get all email campaigns (placeholder for future implementation)
 */
router.get('/campaigns', async (req, res) => {
  try {
    // For now, return empty campaigns array
    // In the future, this would query a campaigns table
    res.json({
      success: true,
      campaigns: []
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
  if (!content) return [];
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

/**
 * Helper function to extract template type from name
 */
function extractTemplateType(name) {
  const nameLower = name.toLowerCase();
  if (nameLower.includes('welcome')) return 'welcome';
  if (nameLower.includes('booking') || nameLower.includes('appointment')) return 'booking_confirmation';
  if (nameLower.includes('payment') || nameLower.includes('receipt')) return 'payment_receipt';
  if (nameLower.includes('reminder')) return 'reminder';
  if (nameLower.includes('completion') || nameLower.includes('completed')) return 'service_completion';
  return 'custom';
}

export default router;
