import prisma from '../config/database.js';
import { getCustomer, getSubscription } from './stripe.js';
import { logger } from '../utils/logger.js';

/**
 * BillingService - Handles billing operations and Stripe integration
 */
class BillingService {
  /**
   * Get billing overview for a customer
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Billing overview data
   */
  async getBillingOverview(userId) {
    try {
      const subscription = await prisma.subscription.findUnique({
        where: { userId }
      });

      if (!subscription) {
        throw new Error('No subscription found');
      }

      // Get upcoming charges
      const upcomingCharges = {
        nextBillingDate: subscription.currentPeriodEnd,
        nextPaymentAmount: subscription.nextPaymentAmount || 0,
        currency: 'USD'
      };

      // Get outstanding invoices
      const outstandingInvoices = await prisma.invoice.findMany({
        where: {
          customerId: userId,
          status: {
            in: ['PENDING', 'OVERDUE']
          }
        },
        orderBy: {
          dueDate: 'asc'
        }
      });

      const totalOutstanding = outstandingInvoices.reduce(
        (sum, inv) => sum + inv.totalAmount,
        0
      );

      // Get recent transactions
      const recentTransactions = await prisma.invoice.findMany({
        where: {
          customerId: userId,
          status: 'PAID'
        },
        orderBy: {
          paidAt: 'desc'
        },
        take: 10
      });

      return {
        subscription: {
          tier: subscription.tier,
          status: subscription.status,
          paymentFrequency: subscription.paymentFrequency
        },
        upcomingCharges,
        outstandingBalance: totalOutstanding,
        outstandingInvoices,
        recentTransactions
      };
    } catch (error) {
      logger.error('Error getting billing overview', {
        error: error.message,
        stack: error.stack,
        userId
      });
      throw error;
    }
  }

  /**
   * Get invoice by ID
   * @param {string} invoiceId - Invoice ID
   * @param {string} userId - User ID (for authorization)
   * @returns {Promise<Object>} Invoice data
   */
  async getInvoice(invoiceId, userId) {
    try {
      const invoice = await prisma.invoice.findFirst({
        where: {
          id: invoiceId,
          customerId: userId
        },
        include: {
          job: {
            include: {
              serviceRequest: {
                include: {
                  service: {
                    select: {
                      id: true,
                      name: true,
                      description: true,
                      category: true
                    }
                  }
                }
              },
              technician: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  phone: true
                }
              }
            }
          }
        }
      });

      if (!invoice) {
        throw new Error('Invoice not found');
      }

      return invoice;
    } catch (error) {
      logger.error('Error getting invoice', {
        error: error.message,
        stack: error.stack,
        invoiceId,
        userId
      });
      throw error;
    }
  }

  /**
   * Get billing history for a customer
   * @param {string} userId - User ID
   * @param {Object} options - Query options (limit, offset)
   * @returns {Promise<Object>} Billing history data
   */
  async getBillingHistory(userId, options = {}) {
    try {
      const { limit = 50, offset = 0 } = options;

      const [invoices, total] = await Promise.all([
        prisma.invoice.findMany({
          where: {
            customerId: userId
          },
          include: {
            job: {
              select: {
                id: true,
                serviceRequest: {
                  select: {
                    service: {
                      select: {
                        name: true
                      }
                    }
                  }
                }
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: parseInt(limit),
          skip: parseInt(offset)
        }),
        prisma.invoice.count({
          where: {
            customerId: userId
          }
        })
      ]);

      // Get billing adjustments
      const subscription = await prisma.subscription.findUnique({
        where: { userId }
      });

      let billingAdjustments = [];
      if (subscription) {
        billingAdjustments = await prisma.billingAdjustment.findMany({
          where: {
            subscriptionId: subscription.id
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 20
        });
      }

      return {
        invoices,
        billingAdjustments,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: parseInt(offset) + invoices.length < total
        }
      };
    } catch (error) {
      logger.error('Error getting billing history', {
        error: error.message,
        stack: error.stack,
        userId
      });
      throw error;
    }
  }

  /**
   * Generate invoice PDF URL (placeholder - would integrate with PDF generation service)
   * @param {string} invoiceId - Invoice ID
   * @param {string} userId - User ID (for authorization)
   * @returns {Promise<string>} PDF URL
   */
  async generateInvoicePDF(invoiceId, userId) {
    try {
      const invoice = await this.getInvoice(invoiceId, userId);

      // In a real implementation, this would:
      // 1. Generate PDF using a library like pdfkit or puppeteer
      // 2. Upload to S3 or similar storage
      // 3. Update invoice.pdfUrl
      // 4. Return the URL

      // For now, return a placeholder
      if (invoice.pdfUrl) {
        return invoice.pdfUrl;
      }

      // Would generate PDF here
      const pdfUrl = `/invoices/${invoiceId}.pdf`;
      
      // Update invoice with PDF URL
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: { pdfUrl }
      });

      return pdfUrl;
    } catch (error) {
      logger.error('Error generating invoice PDF', {
        error: error.message,
        stack: error.stack,
        invoiceId,
        userId
      });
      throw error;
    }
  }
}

export default new BillingService();

