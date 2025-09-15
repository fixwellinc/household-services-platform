import prisma from '../config/database.js';
import { refundPayment } from './stripe.js';
import auditService from './auditService.js';

class BillingAdjustmentService {
  /**
   * Create a billing adjustment
   */
  async createAdjustment(subscriptionId, adjustmentData, adminId) {
    const { type, amount, reason, description, effectiveDate, requiresApproval, metadata = {} } = adjustmentData;

    // Validate subscription exists
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { user: true }
    });

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    // Validate adjustment data
    this.validateAdjustmentData(adjustmentData);

    // Determine if approval is required
    const needsApproval = requiresApproval || amount > 100 || type === 'refund';

    // Create adjustment record
    const adjustment = await prisma.billingAdjustment.create({
      data: {
        subscriptionId,
        type,
        amount,
        reason,
        description,
        effectiveDate: new Date(effectiveDate),
        status: needsApproval ? 'PENDING_APPROVAL' : 'APPROVED',
        requiresApproval: needsApproval,
        metadata: JSON.stringify(metadata),
        createdBy: adminId,
        approvedBy: needsApproval ? null : adminId,
        approvedAt: needsApproval ? null : new Date()
      }
    });

    // If no approval required, process immediately
    if (!needsApproval) {
      await this.processAdjustment(adjustment.id, adminId);
    }

    // Log audit trail
    await auditService.logAction({
      adminId,
      action: 'BILLING_ADJUSTMENT_CREATED',
      entityType: 'billing_adjustment',
      entityId: adjustment.id,
      changes: {
        subscriptionId,
        type,
        amount,
        reason,
        status: adjustment.status
      },
      metadata: {
        subscriptionTier: subscription.tier,
        customerEmail: subscription.user.email,
        requiresApproval: needsApproval
      },
      severity: amount > 500 ? 'high' : amount > 100 ? 'medium' : 'low'
    });

    return {
      success: true,
      adjustment,
      message: needsApproval 
        ? 'Billing adjustment created and submitted for approval'
        : 'Billing adjustment created and processed successfully'
    };
  }

  /**
   * Process an approved billing adjustment
   */
  async processAdjustment(adjustmentId, adminId) {
    const adjustment = await prisma.billingAdjustment.findUnique({
      where: { id: adjustmentId },
      include: { 
        subscription: { 
          include: { user: true } 
        } 
      }
    });

    if (!adjustment) {
      throw new Error('Billing adjustment not found');
    }

    if (adjustment.status !== 'APPROVED') {
      throw new Error('Adjustment must be approved before processing');
    }

    if (adjustment.processedAt) {
      throw new Error('Adjustment has already been processed');
    }

    try {
      await prisma.$transaction(async (tx) => {
        // Process based on adjustment type
        switch (adjustment.type) {
          case 'credit':
            await this.processCredit(tx, adjustment);
            break;
          case 'debit':
            await this.processDebit(tx, adjustment);
            break;
          case 'refund':
            await this.processRefund(tx, adjustment);
            break;
          case 'discount':
            await this.processDiscount(tx, adjustment);
            break;
          default:
            throw new Error(`Unknown adjustment type: ${adjustment.type}`);
        }

        // Update adjustment status
        await tx.billingAdjustment.update({
          where: { id: adjustmentId },
          data: {
            status: 'PROCESSED',
            processedAt: new Date(),
            processedBy: adminId
          }
        });
      });

      // Log audit trail
      await auditService.logAction({
        adminId,
        action: 'BILLING_ADJUSTMENT_PROCESSED',
        entityType: 'billing_adjustment',
        entityId: adjustmentId,
        changes: {
          status: 'PROCESSED',
          processedAt: new Date()
        },
        metadata: {
          adjustmentType: adjustment.type,
          amount: adjustment.amount,
          subscriptionId: adjustment.subscriptionId
        },
        severity: 'medium'
      });

      return {
        success: true,
        message: 'Billing adjustment processed successfully'
      };
    } catch (error) {
      // Log failed processing
      await prisma.billingAdjustment.update({
        where: { id: adjustmentId },
        data: {
          status: 'FAILED',
          errorMessage: error.message
        }
      });

      throw error;
    }
  }

  /**
   * Process credit adjustment
   */
  async processCredit(tx, adjustment) {
    // Add credit to subscription
    await tx.subscription.update({
      where: { id: adjustment.subscriptionId },
      data: {
        availableCredits: {
          increment: adjustment.amount
        }
      }
    });

    // Create credit transaction record
    await tx.creditTransaction.create({
      data: {
        subscriptionId: adjustment.subscriptionId,
        type: 'CREDIT',
        amount: adjustment.amount,
        description: adjustment.description,
        billingAdjustmentId: adjustment.id,
        createdAt: new Date()
      }
    });
  }

  /**
   * Process debit adjustment
   */
  async processDebit(tx, adjustment) {
    // Deduct from available credits first, then create charge
    const subscription = await tx.subscription.findUnique({
      where: { id: adjustment.subscriptionId }
    });

    if (subscription.availableCredits >= adjustment.amount) {
      // Deduct from credits
      await tx.subscription.update({
        where: { id: adjustment.subscriptionId },
        data: {
          availableCredits: {
            decrement: adjustment.amount
          }
        }
      });
    } else {
      // Create charge for remaining amount
      const chargeAmount = adjustment.amount - subscription.availableCredits;
      
      // Zero out credits if any
      if (subscription.availableCredits > 0) {
        await tx.subscription.update({
          where: { id: adjustment.subscriptionId },
          data: {
            availableCredits: 0
          }
        });
      }

      // Create pending charge record
      await tx.pendingCharge.create({
        data: {
          subscriptionId: adjustment.subscriptionId,
          amount: chargeAmount,
          description: adjustment.description,
          billingAdjustmentId: adjustment.id,
          status: 'PENDING'
        }
      });
    }

    // Create debit transaction record
    await tx.creditTransaction.create({
      data: {
        subscriptionId: adjustment.subscriptionId,
        type: 'DEBIT',
        amount: adjustment.amount,
        description: adjustment.description,
        billingAdjustmentId: adjustment.id,
        createdAt: new Date()
      }
    });
  }

  /**
   * Process refund adjustment
   */
  async processRefund(tx, adjustment) {
    const metadata = JSON.parse(adjustment.metadata || '{}');
    
    // If original transaction ID provided, process Stripe refund
    if (metadata.originalTransactionId) {
      try {
        const refund = await refundPayment(
          metadata.originalTransactionId,
          adjustment.amount * 100, // Convert to cents
          adjustment.reason
        );

        // Update metadata with refund information
        await tx.billingAdjustment.update({
          where: { id: adjustment.id },
          data: {
            metadata: JSON.stringify({
              ...metadata,
              stripeRefundId: refund.id,
              stripeRefundStatus: refund.status
            })
          }
        });
      } catch (stripeError) {
        console.error('Stripe refund failed:', stripeError);
        // Continue with credit refund as fallback
      }
    }

    // Add refund as credit to account
    await tx.subscription.update({
      where: { id: adjustment.subscriptionId },
      data: {
        availableCredits: {
          increment: adjustment.amount
        }
      }
    });

    // Create refund transaction record
    await tx.creditTransaction.create({
      data: {
        subscriptionId: adjustment.subscriptionId,
        type: 'REFUND',
        amount: adjustment.amount,
        description: adjustment.description,
        billingAdjustmentId: adjustment.id,
        createdAt: new Date()
      }
    });
  }

  /**
   * Process discount adjustment
   */
  async processDiscount(tx, adjustment) {
    const metadata = JSON.parse(adjustment.metadata || '{}');
    
    // Create discount record
    await tx.subscriptionDiscount.create({
      data: {
        subscriptionId: adjustment.subscriptionId,
        amount: adjustment.amount,
        type: 'FIXED_AMOUNT',
        description: adjustment.description,
        code: metadata.discountCode || null,
        expiresAt: metadata.expirationDate ? new Date(metadata.expirationDate) : null,
        billingAdjustmentId: adjustment.id,
        isActive: true
      }
    });
  }

  /**
   * Approve a billing adjustment
   */
  async approveAdjustment(adjustmentId, adminId, notes = '') {
    const adjustment = await prisma.billingAdjustment.findUnique({
      where: { id: adjustmentId },
      include: { subscription: { include: { user: true } } }
    });

    if (!adjustment) {
      throw new Error('Billing adjustment not found');
    }

    if (adjustment.status !== 'PENDING_APPROVAL') {
      throw new Error('Adjustment is not pending approval');
    }

    // Update adjustment status
    await prisma.billingAdjustment.update({
      where: { id: adjustmentId },
      data: {
        status: 'APPROVED',
        approvedBy: adminId,
        approvedAt: new Date(),
        approvalNotes: notes
      }
    });

    // Process the adjustment
    await this.processAdjustment(adjustmentId, adminId);

    // Log audit trail
    await auditService.logAction({
      adminId,
      action: 'BILLING_ADJUSTMENT_APPROVED',
      entityType: 'billing_adjustment',
      entityId: adjustmentId,
      changes: {
        status: 'APPROVED',
        approvedBy: adminId,
        approvedAt: new Date()
      },
      metadata: {
        adjustmentType: adjustment.type,
        amount: adjustment.amount,
        customerEmail: adjustment.subscription.user.email,
        approvalNotes: notes
      },
      severity: 'medium'
    });

    return {
      success: true,
      message: 'Billing adjustment approved and processed successfully'
    };
  }

  /**
   * Reject a billing adjustment
   */
  async rejectAdjustment(adjustmentId, adminId, reason) {
    const adjustment = await prisma.billingAdjustment.findUnique({
      where: { id: adjustmentId },
      include: { subscription: { include: { user: true } } }
    });

    if (!adjustment) {
      throw new Error('Billing adjustment not found');
    }

    if (adjustment.status !== 'PENDING_APPROVAL') {
      throw new Error('Adjustment is not pending approval');
    }

    // Update adjustment status
    await prisma.billingAdjustment.update({
      where: { id: adjustmentId },
      data: {
        status: 'REJECTED',
        rejectedBy: adminId,
        rejectedAt: new Date(),
        rejectionReason: reason
      }
    });

    // Log audit trail
    await auditService.logAction({
      adminId,
      action: 'BILLING_ADJUSTMENT_REJECTED',
      entityType: 'billing_adjustment',
      entityId: adjustmentId,
      changes: {
        status: 'REJECTED',
        rejectedBy: adminId,
        rejectedAt: new Date(),
        rejectionReason: reason
      },
      metadata: {
        adjustmentType: adjustment.type,
        amount: adjustment.amount,
        customerEmail: adjustment.subscription.user.email
      },
      severity: 'medium'
    });

    return {
      success: true,
      message: 'Billing adjustment rejected successfully'
    };
  }

  /**
   * Get billing adjustments with filters
   */
  async getAdjustments(filters = {}) {
    const {
      subscriptionId,
      status,
      type,
      startDate,
      endDate,
      requiresApproval,
      page = 1,
      limit = 50
    } = filters;

    const where = {};

    if (subscriptionId) where.subscriptionId = subscriptionId;
    if (status) where.status = status;
    if (type) where.type = type;
    if (requiresApproval !== undefined) where.requiresApproval = requiresApproval;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [adjustments, totalCount] = await Promise.all([
      prisma.billingAdjustment.findMany({
        where,
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
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.billingAdjustment.count({ where })
    ]);

    return {
      adjustments,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    };
  }

  /**
   * Get pending approvals
   */
  async getPendingApprovals() {
    const adjustments = await prisma.billingAdjustment.findMany({
      where: {
        status: 'PENDING_APPROVAL'
      },
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
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    return adjustments;
  }

  /**
   * Validate adjustment data
   */
  validateAdjustmentData(data) {
    const { type, amount, reason, description, effectiveDate } = data;

    if (!type || !['credit', 'debit', 'refund', 'discount'].includes(type)) {
      throw new Error('Invalid adjustment type');
    }

    if (!amount || amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    if (!reason || reason.trim().length === 0) {
      throw new Error('Reason is required');
    }

    if (!description || description.trim().length === 0) {
      throw new Error('Description is required');
    }

    if (!effectiveDate) {
      throw new Error('Effective date is required');
    }

    // Validate effective date is not in the past (except for refunds)
    const effective = new Date(effectiveDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (type !== 'refund' && effective < today) {
      throw new Error('Effective date cannot be in the past');
    }
  }
}

export default new BillingAdjustmentService();