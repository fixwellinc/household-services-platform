import express from 'express';
import { authMiddleware, requireAdmin } from '../../middleware/auth.js';
import { auditPresets } from '../../middleware/auditMiddleware.js';
import billingAdjustmentService from '../../services/billingAdjustmentService.js';
import { validate } from '../../middleware/validation.js';
import prisma from '../../config/database.js';

const router = express.Router();

// Apply admin authentication to all routes
router.use(authMiddleware);
router.use(requireAdmin);

/**
 * POST /api/admin/subscriptions/:subscriptionId/billing-adjustment
 * Create a billing adjustment
 */
router.post('/subscriptions/:subscriptionId/billing-adjustment', 
  auditPresets.billingUpdate,
  async (req, res) => {
    try {
      const { subscriptionId } = req.params;
      const adjustmentData = req.body;
      const adminId = req.user.id;

      const result = await billingAdjustmentService.createAdjustment(
        subscriptionId,
        adjustmentData,
        adminId
      );

      res.json(result);
    } catch (error) {
      console.error('Error creating billing adjustment:', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
);

/**
 * GET /api/admin/billing-adjustments
 * Get billing adjustments with filters
 */
router.get('/billing-adjustments', async (req, res) => {
  try {
    const filters = {
      subscriptionId: req.query.subscriptionId,
      status: req.query.status,
      type: req.query.type,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      requiresApproval: req.query.requiresApproval === 'true',
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 50
    };

    const result = await billingAdjustmentService.getAdjustments(filters);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error fetching billing adjustments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch billing adjustments'
    });
  }
});

/**
 * GET /api/admin/billing-adjustments/pending-approvals
 * Get pending approval adjustments
 */
router.get('/billing-adjustments/pending-approvals', async (req, res) => {
  try {
    const adjustments = await billingAdjustmentService.getPendingApprovals();

    res.json({
      success: true,
      adjustments,
      count: adjustments.length
    });
  } catch (error) {
    console.error('Error fetching pending approvals:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pending approvals'
    });
  }
});

/**
 * POST /api/admin/billing-adjustments/:adjustmentId/approve
 * Approve a billing adjustment
 */
router.post('/billing-adjustments/:adjustmentId/approve',
  auditPresets.billingUpdate,
  async (req, res) => {
    try {
      const { adjustmentId } = req.params;
      const { notes = '' } = req.body;
      const adminId = req.user.id;

      const result = await billingAdjustmentService.approveAdjustment(
        adjustmentId,
        adminId,
        notes
      );

      res.json(result);
    } catch (error) {
      console.error('Error approving billing adjustment:', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
);

/**
 * POST /api/admin/billing-adjustments/:adjustmentId/reject
 * Reject a billing adjustment
 */
router.post('/billing-adjustments/:adjustmentId/reject',
  auditPresets.billingUpdate,
  async (req, res) => {
    try {
      const { adjustmentId } = req.params;
      const { reason } = req.body;
      const adminId = req.user.id;

      if (!reason || reason.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Rejection reason is required'
        });
      }

      const result = await billingAdjustmentService.rejectAdjustment(
        adjustmentId,
        adminId,
        reason
      );

      res.json(result);
    } catch (error) {
      console.error('Error rejecting billing adjustment:', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
);

/**
 * POST /api/admin/billing-adjustments/:adjustmentId/process
 * Manually process an approved adjustment
 */
router.post('/billing-adjustments/:adjustmentId/process',
  auditPresets.billingUpdate,
  async (req, res) => {
    try {
      const { adjustmentId } = req.params;
      const adminId = req.user.id;

      const result = await billingAdjustmentService.processAdjustment(
        adjustmentId,
        adminId
      );

      res.json(result);
    } catch (error) {
      console.error('Error processing billing adjustment:', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
);

/**
 * GET /api/admin/billing-adjustments/:adjustmentId
 * Get specific billing adjustment details
 */
router.get('/billing-adjustments/:adjustmentId', async (req, res) => {
  try {
    const { adjustmentId } = req.params;

    const adjustment = await prisma.billingAdjustment.findUnique({
      where: { id: adjustmentId },
      include: {
        subscription: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true
              }
            }
          }
        },
        createdByUser: {
          select: {
            id: true,
            email: true,
            name: true
          }
        },
        approvedByUser: {
          select: {
            id: true,
            email: true,
            name: true
          }
        },
        rejectedByUser: {
          select: {
            id: true,
            email: true,
            name: true
          }
        },
        processedByUser: {
          select: {
            id: true,
            email: true,
            name: true
          }
        },
        creditTransactions: true,
        subscriptionDiscounts: true,
        pendingCharges: true
      }
    });

    if (!adjustment) {
      return res.status(404).json({
        success: false,
        error: 'Billing adjustment not found'
      });
    }

    res.json({
      success: true,
      adjustment
    });
  } catch (error) {
    console.error('Error fetching billing adjustment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch billing adjustment'
    });
  }
});

/**
 * GET /api/admin/billing-adjustments/stats
 * Get billing adjustment statistics
 */
router.get('/billing-adjustments/stats', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const where = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [
      totalAdjustments,
      pendingApprovals,
      approvedAdjustments,
      rejectedAdjustments,
      processedAdjustments,
      totalCreditAmount,
      totalDebitAmount,
      totalRefundAmount
    ] = await Promise.all([
      prisma.billingAdjustment.count({ where }),
      prisma.billingAdjustment.count({ 
        where: { ...where, status: 'PENDING_APPROVAL' } 
      }),
      prisma.billingAdjustment.count({ 
        where: { ...where, status: 'APPROVED' } 
      }),
      prisma.billingAdjustment.count({ 
        where: { ...where, status: 'REJECTED' } 
      }),
      prisma.billingAdjustment.count({ 
        where: { ...where, status: 'PROCESSED' } 
      }),
      prisma.billingAdjustment.aggregate({
        where: { ...where, type: 'credit', status: 'PROCESSED' },
        _sum: { amount: true }
      }),
      prisma.billingAdjustment.aggregate({
        where: { ...where, type: 'debit', status: 'PROCESSED' },
        _sum: { amount: true }
      }),
      prisma.billingAdjustment.aggregate({
        where: { ...where, type: 'refund', status: 'PROCESSED' },
        _sum: { amount: true }
      })
    ]);

    const stats = {
      totalAdjustments,
      pendingApprovals,
      approvedAdjustments,
      rejectedAdjustments,
      processedAdjustments,
      totalCreditAmount: totalCreditAmount._sum.amount || 0,
      totalDebitAmount: totalDebitAmount._sum.amount || 0,
      totalRefundAmount: totalRefundAmount._sum.amount || 0,
      approvalRate: totalAdjustments > 0 
        ? ((approvedAdjustments + processedAdjustments) / totalAdjustments) * 100 
        : 0
    };

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error fetching billing adjustment stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch billing adjustment statistics'
    });
  }
});

export default router;