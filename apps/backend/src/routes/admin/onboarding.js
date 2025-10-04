import express from 'express';
import { authMiddleware, requireAdmin } from '../../middleware/auth.js';
import { auditPresets } from '../../middleware/auditMiddleware.js';
import { auditService } from '../../services/auditService.js';

const router = express.Router();

// Apply admin role check
router.use(authMiddleware);
router.use(requireAdmin);

/**
 * GET /api/admin/onboarding/status
 * Get onboarding status for current admin
 */
router.get('/status', async (req, res) => {
  try {
    // TODO: Check onboarding status from database
    const onboardingStatus = {
      completed: false,
      currentStep: 0,
      completedSteps: [],
      skipped: false,
      lastUpdated: new Date().toISOString()
    };
    
    res.json({
      success: true,
      status: onboardingStatus
    });
  } catch (error) {
    console.error('Error fetching onboarding status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch onboarding status'
    });
  }
});

/**
 * POST /api/admin/onboarding/complete
 * Complete the onboarding process
 */
router.post('/complete', async (req, res) => {
  try {
    const onboardingData = req.body;
    
    // Validate required fields
    const requiredFields = ['firstName', 'lastName', 'email'];
    for (const field of requiredFields) {
      if (!onboardingData[field]) {
        return res.status(400).json({
          success: false,
          error: `Missing required field: ${field}`
        });
      }
    }
    
    // TODO: Save onboarding data to database
    console.log('Completing onboarding for admin:', req.user.id, onboardingData);
    
    // Log audit event
    await auditService.log({
      adminId: req.user.id,
      action: 'onboarding_complete',
      entityType: 'admin',
      entityId: req.user.id,
      changes: {
        onboardingData: {
          firstName: onboardingData.firstName,
          lastName: onboardingData.lastName,
          email: onboardingData.email,
          timezone: onboardingData.timezone,
          theme: onboardingData.theme,
          language: onboardingData.language,
          twoFactorEnabled: onboardingData.twoFactorEnabled,
          dashboardLayout: onboardingData.dashboardLayout,
          favoriteWidgets: onboardingData.favoriteWidgets,
          watchedTutorials: onboardingData.watchedTutorials
        }
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
      message: 'Onboarding completed successfully'
    });
  } catch (error) {
    console.error('Error completing onboarding:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete onboarding'
    });
  }
});

/**
 * POST /api/admin/onboarding/skip
 * Skip the onboarding process
 */
router.post('/skip', async (req, res) => {
  try {
    // TODO: Mark onboarding as skipped in database
    console.log('Skipping onboarding for admin:', req.user.id);
    
    // Log audit event
    await auditService.log({
      adminId: req.user.id,
      action: 'onboarding_skip',
      entityType: 'admin',
      entityId: req.user.id,
      changes: {
        skipped: true
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
      message: 'Onboarding skipped successfully'
    });
  } catch (error) {
    console.error('Error skipping onboarding:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to skip onboarding'
    });
  }
});

/**
 * PUT /api/admin/onboarding/step/:stepId
 * Update progress for a specific step
 */
router.put('/step/:stepId', async (req, res) => {
  try {
    const { stepId } = req.params;
    const { completed, data } = req.body;
    
    // TODO: Update step progress in database
    console.log(`Updating step ${stepId} for admin ${req.user.id}:`, { completed, data });
    
    // Log audit event
    await auditService.log({
      adminId: req.user.id,
      action: 'onboarding_step_update',
      entityType: 'admin',
      entityId: req.user.id,
      changes: {
        stepId,
        completed,
        stepData: data
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
      message: 'Step progress updated successfully'
    });
  } catch (error) {
    console.error('Error updating step progress:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update step progress'
    });
  }
});

/**
 * GET /api/admin/onboarding/tutorials
 * Get available tutorials
 */
router.get('/tutorials', async (req, res) => {
  try {
    const tutorials = [
      {
        id: 'dashboard',
        title: 'Dashboard Overview',
        description: 'Learn how to navigate and use the admin dashboard',
        duration: 180, // seconds
        category: 'basics',
        videoUrl: '/tutorials/dashboard.mp4',
        thumbnailUrl: '/tutorials/dashboard-thumb.jpg'
      },
      {
        id: 'users',
        title: 'User Management',
        description: 'How to manage customers, employees, and permissions',
        duration: 300,
        category: 'management',
        videoUrl: '/tutorials/users.mp4',
        thumbnailUrl: '/tutorials/users-thumb.jpg'
      },
      {
        id: 'analytics',
        title: 'Analytics & Reports',
        description: 'Understanding analytics and generating reports',
        duration: 240,
        category: 'analytics',
        videoUrl: '/tutorials/analytics.mp4',
        thumbnailUrl: '/tutorials/analytics-thumb.jpg'
      },
      {
        id: 'settings',
        title: 'System Settings',
        description: 'Configuring system settings and preferences',
        duration: 180,
        category: 'configuration',
        videoUrl: '/tutorials/settings.mp4',
        thumbnailUrl: '/tutorials/settings-thumb.jpg'
      }
    ];
    
    res.json({
      success: true,
      tutorials
    });
  } catch (error) {
    console.error('Error fetching tutorials:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tutorials'
    });
  }
});

/**
 * POST /api/admin/onboarding/tutorial/:tutorialId/watch
 * Mark a tutorial as watched
 */
router.post('/tutorial/:tutorialId/watch', async (req, res) => {
  try {
    const { tutorialId } = req.params;
    const { watchedAt } = req.body;
    
    // TODO: Mark tutorial as watched in database
    console.log(`Marking tutorial ${tutorialId} as watched for admin ${req.user.id}`);
    
    // Log audit event
    await auditService.log({
      adminId: req.user.id,
      action: 'tutorial_watch',
      entityType: 'tutorial',
      entityId: tutorialId,
      changes: {
        watchedAt: watchedAt || new Date().toISOString()
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
      message: 'Tutorial marked as watched'
    });
  } catch (error) {
    console.error('Error marking tutorial as watched:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark tutorial as watched'
    });
  }
});

/**
 * GET /api/admin/onboarding/checklist
 * Get onboarding checklist
 */
router.get('/checklist', async (req, res) => {
  try {
    const checklist = [
      {
        id: 'profile',
        title: 'Complete Profile',
        description: 'Add your personal information',
        completed: false,
        required: true
      },
      {
        id: 'security',
        title: 'Security Setup',
        description: 'Enable two-factor authentication',
        completed: false,
        required: true
      },
      {
        id: 'preferences',
        title: 'Set Preferences',
        description: 'Configure your admin panel preferences',
        completed: false,
        required: false
      },
      {
        id: 'dashboard',
        title: 'Customize Dashboard',
        description: 'Set up your dashboard widgets',
        completed: false,
        required: false
      },
      {
        id: 'tutorials',
        title: 'Watch Tutorials',
        description: 'Learn about key features',
        completed: false,
        required: false
      }
    ];
    
    res.json({
      success: true,
      checklist
    });
  } catch (error) {
    console.error('Error fetching onboarding checklist:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch onboarding checklist'
    });
  }
});

export default router;
