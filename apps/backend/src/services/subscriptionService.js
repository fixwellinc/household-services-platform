import prisma from '../config/database.js';
import { 
  createCustomer, 
  createSubscription, 
  cancelSubscription, 
  getSubscription,
  getCustomer,
  updateCustomer
} from './stripe.js';
import { getPlanByTier } from '../config/plans.js';


class SubscriptionService {
  // Create a new subscription with Stripe integration
  async createSubscription(userId, tier, billingPeriod = 'monthly') {
    try {
      // Get user
      const user = await prisma.user.findUnique({ 
        where: { id: userId },
        include: { subscription: true }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Check if user already has an active subscription
      if (user.subscription && user.subscription.status === 'ACTIVE') {
        throw new Error('User already has an active subscription');
      }

      // Validate tier
      const plan = getPlanByTier(tier);
      if (!plan) {
        throw new Error('Invalid tier');
      }

      // Get or create Stripe customer
      let stripeCustomerId = user.subscription?.stripeCustomerId;

      if (!stripeCustomerId) {
        const customer = await createCustomer(user.email, user.name, {
          userId: user.id,
        });
        stripeCustomerId = customer.id;
      }

      // Get Stripe price ID
      const priceId = plan.stripePriceIds[billingPeriod];
      if (!priceId) {
        throw new Error('Invalid billing period');
      }

      // Create subscription in Stripe
      const stripeSubscription = await createSubscription(stripeCustomerId, priceId, {
        userId: user.id,
        tier,
        billingPeriod,
      });

      // Create or update subscription in database
      const subscription = await prisma.subscription.upsert({
        where: { userId },
        update: {
          tier,
          status: stripeSubscription.status.toUpperCase(),
          stripeCustomerId,
          stripeSubscriptionId: stripeSubscription.id,
          currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
          currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        },
        create: {
          userId,
          tier,
          status: stripeSubscription.status.toUpperCase(),
          stripeCustomerId,
          stripeSubscriptionId: stripeSubscription.id,
          currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
          currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        },
      });

      return {
        subscription,
        clientSecret: stripeSubscription.latest_invoice?.payment_intent?.client_secret,
        requiresAction: stripeSubscription.status === 'incomplete',
      };
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  }

  // Cancel subscription
  async cancelSubscription(userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { subscription: true }
      });

      if (!user?.subscription) {
        throw new Error('No subscription found');
      }

      // Check if subscription can be cancelled
      if (!user.subscription.canCancel) {
        throw new Error(`Subscription cannot be cancelled: ${user.subscription.cancellationBlockedReason}`);
      }

      // Cancel in Stripe if subscription exists there
      if (user.subscription.stripeSubscriptionId) {
        await cancelSubscription(user.subscription.stripeSubscriptionId);
      }

      // Update subscription status in database
      await prisma.subscription.update({
        where: { id: user.subscription.id },
        data: {
          status: 'CANCELLED',
          updatedAt: new Date(),
        },
      });

      return { message: 'Subscription cancelled successfully' };
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      throw error;
    }
  }

  // Get current subscription details
  async getCurrentSubscription(userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { 
          subscription: true,
          subscriptionUsage: true
        }
      });

      if (!user?.subscription) {
        return { subscription: null };
      }

      // Get plan details
      const plan = getPlanByTier(user.subscription.tier);

      // Get Stripe subscription details if available
      let stripeSubscription = null;
      if (user.subscription.stripeSubscriptionId) {
        try {
          stripeSubscription = await getSubscription(user.subscription.stripeSubscriptionId);
        } catch (error) {
          console.error('Error fetching Stripe subscription:', error);
        }
      }

      return {
        subscription: {
          ...user.subscription,
          plan,
          stripeSubscription,
          usage: user.subscriptionUsage,
        },
      };
    } catch (error) {
      console.error('Error fetching subscription:', error);
      throw error;
    }
  }

  // Update subscription (change plan)
  async updateSubscription(userId, tier, billingPeriod = 'monthly') {
    try {
      const plan = getPlanByTier(tier);
      if (!plan) {
        throw new Error('Invalid tier');
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { subscription: true }
      });

      if (!user?.subscription) {
        throw new Error('No subscription found');
      }

      // Get new price ID
      const newPriceId = plan.stripePriceIds[billingPeriod];
      if (!newPriceId) {
        throw new Error('Invalid billing period');
      }

      // Update subscription in database
      await prisma.subscription.update({
        where: { id: user.subscription.id },
        data: {
          tier,
          updatedAt: new Date(),
        },
      });

      return { message: 'Subscription updated successfully' };
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw error;
    }
  }

  // Process webhook events
  async processWebhookEvent(event) {
    try {
      switch (event.type) {
        case 'customer.subscription.created':
          await this.handleSubscriptionCreated(event.data.object);
          break;
        
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object);
          break;
        
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object);
          break;
        
        case 'invoice.payment_succeeded':
          await this.handleInvoicePaymentSucceeded(event.data.object);
          break;
        
        case 'invoice.payment_failed':
          await this.handleInvoicePaymentFailed(event.data.object);
          break;
        
        default:
          console.log(`Unhandled webhook event type: ${event.type}`);
      }
    } catch (error) {
      console.error('Error processing webhook event:', error);
      throw error;
    }
  }

  // Handle subscription created webhook
  async handleSubscriptionCreated(subscription) {
    try {
      console.log('🔔 Processing subscription created webhook:', subscription.id);
      console.log('📋 Subscription metadata:', subscription.metadata);
      
      // Try to get userId from metadata first
      let { userId, tier } = subscription.metadata;
      
      // If no userId in metadata, try to find user by Stripe customer ID
      if (!userId && subscription.customer) {
        console.log('🔍 Looking up user by Stripe customer ID:', subscription.customer);
        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { subscription: { stripeCustomerId: subscription.customer } },
              { email: { not: null } } // We'll need to get customer email from Stripe
            ]
          }
        });
        
        if (user) {
          userId = user.id;
          console.log('✅ Found user by customer ID:', userId);
        }
      }
      
      // If still no userId, try to get customer email from Stripe and find user
      if (!userId && subscription.customer) {
        try {
          const { getCustomer } = await import('./stripe.js');
          const customer = await getCustomer(subscription.customer);
          if (customer.email) {
            const user = await prisma.user.findUnique({
              where: { email: customer.email }
            });
            if (user) {
              userId = user.id;
              tier = tier || 'STARTER'; // Default tier if not specified
              console.log('✅ Found user by email:', userId);
            }
          }
        } catch (stripeError) {
          console.error('Error fetching customer from Stripe:', stripeError);
        }
      }
      
      if (userId) {
        console.log('✅ Creating/updating subscription for user:', userId);
        await prisma.subscription.upsert({
          where: { userId },
          update: {
            tier: tier || 'STARTER',
            status: subscription.status.toUpperCase(),
            stripeCustomerId: subscription.customer,
            stripeSubscriptionId: subscription.id,
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          },
          create: {
            userId,
            tier: tier || 'STARTER',
            status: subscription.status.toUpperCase(),
            stripeCustomerId: subscription.customer,
            stripeSubscriptionId: subscription.id,
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          },
        });
        
        // Update user's subscriptionId reference
        await prisma.user.update({
          where: { id: userId },
          data: { subscriptionId: subscription.id }
        });
        
        console.log('✅ Subscription created/updated successfully for user:', userId);
      } else {
        console.error('❌ Could not determine userId for subscription:', subscription.id);
      }
    } catch (error) {
      console.error('Error handling subscription created:', error);
      throw error;
    }
  }

  // Handle subscription updated webhook
  async handleSubscriptionUpdated(subscription) {
    try {
      console.log('🔔 Processing subscription updated webhook:', subscription.id);
      
      // Try to find subscription by Stripe subscription ID
      const existingSubscription = await prisma.subscription.findUnique({
        where: { stripeSubscriptionId: subscription.id }
      });
      
      if (existingSubscription) {
        console.log('✅ Updating existing subscription for user:', existingSubscription.userId);
        await prisma.subscription.update({
          where: { id: existingSubscription.id },
          data: {
            status: subscription.status.toUpperCase(),
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          },
        });
      } else {
        console.log('⚠️ Subscription not found in database, processing as new');
        await this.handleSubscriptionCreated(subscription);
      }
    } catch (error) {
      console.error('Error handling subscription updated:', error);
      throw error;
    }
  }

  // Handle subscription deleted webhook
  async handleSubscriptionDeleted(subscription) {
    try {
      const { userId } = subscription.metadata;
      
      if (userId) {
        await prisma.subscription.update({
          where: { userId },
          data: {
            status: 'CANCELLED',
          },
        });
      }
    } catch (error) {
      console.error('Error handling subscription deleted:', error);
      throw error;
    }
  }

  // Handle invoice payment succeeded webhook
  async handleInvoicePaymentSucceeded(invoice) {
    try {
      if (invoice.subscription) {
        const subscription = await prisma.subscription.findFirst({
          where: { stripeSubscriptionId: invoice.subscription },
        });
        
        if (subscription) {
          // Update subscription to active
          await prisma.subscription.update({
            where: { id: subscription.id },
            data: {
              status: 'ACTIVE',
            },
          });

          // If subscription was paused due to payment failure, recover it
          if (subscription.isPaused) {
            const { default: subscriptionPauseService } = await import('./subscriptionPauseService.js');
            await subscriptionPauseService.handlePaymentRecovered(subscription.id);
            console.log(`Recovered subscription ${subscription.id} from payment failure`);
          }
        }
      }
    } catch (error) {
      console.error('Error handling invoice payment succeeded:', error);
      throw error;
    }
  }

  // Handle invoice payment failed webhook
  async handleInvoicePaymentFailed(invoice) {
    try {
      if (invoice.subscription) {
        const subscription = await prisma.subscription.findFirst({
          where: { stripeSubscriptionId: invoice.subscription },
        });
        
        if (subscription) {
          // Import pause service dynamically to avoid circular dependencies
          const { default: subscriptionPauseService } = await import('./subscriptionPauseService.js');
          
          // Pause subscription due to payment failure with 7-day grace period
          await subscriptionPauseService.pauseSubscriptionForPaymentFailure(
            subscription.id,
            'PAYMENT_FAILED',
            7 // 7-day grace period
          );
          
          console.log(`Paused subscription ${subscription.id} due to payment failure`);
        }
      }
    } catch (error) {
      console.error('Error handling invoice payment failed:', error);
      throw error;
    }
  }

  // Track when a customer uses a subscription perk
  async trackPerkUsage(userId, perkType, details = {}) {
    try {
      // Get or create subscription usage record
      let usage = await prisma.subscriptionUsage.findUnique({
        where: { userId }
      });

      if (!usage) {
        // Create new usage record
        const user = await prisma.user.findUnique({
          where: { id: userId },
          include: { subscription: true }
        });

        if (!user || !user.subscription) {
          throw new Error('User has no active subscription');
        }

        usage = await prisma.subscriptionUsage.create({
          data: {
            userId,
            subscriptionId: user.subscription.id,
            tier: user.subscription.tier,
            maxPriorityBookings: this.getMaxPerksByTier(user.subscription.tier, 'priorityBookings'),
            maxDiscountAmount: this.getMaxPerksByTier(user.subscription.tier, 'discountAmount'),
            maxFreeServices: this.getMaxPerksByTier(user.subscription.tier, 'freeServices'),
            maxEmergencyServices: this.getMaxPerksByTier(user.subscription.tier, 'emergencyServices')
          }
        });
      }

      // Update perk usage based on type
      const updateData = {};
      const now = new Date();

      switch (perkType) {
        case 'priorityBooking':
          updateData.priorityBookingUsed = true;
          updateData.priorityBookingUsedAt = now;
          updateData.priorityBookingCount = usage.priorityBookingCount + 1;
          break;
        case 'discount':
          updateData.discountUsed = true;
          updateData.discountUsedAt = now;
          updateData.discountAmount = usage.discountAmount + (details.amount || 0);
          break;
        case 'freeService':
          updateData.freeServiceUsed = true;
          updateData.freeServiceUsedAt = now;
          updateData.freeServiceType = details.serviceType || 'general';
          break;
        case 'emergencyService':
          updateData.emergencyServiceUsed = true;
          updateData.emergencyServiceUsedAt = now;
          break;
        default:
          throw new Error('Invalid perk type');
      }

      // Update usage record
      await prisma.subscriptionUsage.update({
        where: { userId },
        data: updateData
      });

      // Check if any perks have been used and block cancellation
      await this.checkAndBlockCancellation(userId);

      return { success: true, usage: { ...usage, ...updateData } };
    } catch (error) {
      console.error('Error tracking perk usage:', error);
      throw error;
    }
  }

  // Check if any perks have been used and block cancellation
  async checkAndBlockCancellation(userId) {
    try {
      const usage = await prisma.subscriptionUsage.findUnique({
        where: { userId }
      });

      if (!usage) return;

      const hasUsedPerks = usage.priorityBookingUsed || 
                          usage.discountUsed || 
                          usage.freeServiceUsed || 
                          usage.emergencyServiceUsed;

      if (hasUsedPerks) {
        // Get user's subscription
        const user = await prisma.user.findUnique({
          where: { id: userId },
          include: { subscription: true }
        });

        if (user?.subscription) {
          await prisma.subscription.update({
            where: { id: user.subscription.id },
            data: {
              canCancel: false,
              cancellationBlockedAt: new Date(),
              cancellationBlockedReason: 'Perks have been used'
            }
          });
        }
      }
    } catch (error) {
      console.error('Error checking and blocking cancellation:', error);
    }
  }

  // Get maximum perks allowed by tier
  getMaxPerksByTier(tier, perkType) {
    const limits = {
      STARTER: {
        priorityBookings: 0,
        discountAmount: 0,
        freeServices: 0,
        emergencyServices: 0
      },
      HOMECARE: {
        priorityBookings: 2,
        discountAmount: 50,
        freeServices: 1,
        emergencyServices: 0
      },
      PRIORITY: {
        priorityBookings: 5,
        discountAmount: 100,
        freeServices: 2,
        emergencyServices: 1
      }
    };

    return limits[tier]?.[perkType] || 0;
  }

  // Check if user can use a specific perk
  async canUsePerk(userId, perkType) {
    try {
      const usage = await prisma.subscriptionUsage.findUnique({
        where: { userId }
      });

      if (!usage) return { canUse: false, reason: 'No subscription usage record found' };

      switch (perkType) {
        case 'priorityBooking':
          return {
            canUse: usage.priorityBookingCount < usage.maxPriorityBookings,
            reason: usage.priorityBookingCount >= usage.maxPriorityBookings ? 'Priority booking limit reached' : null
          };
        case 'discount':
          return {
            canUse: usage.discountAmount < usage.maxDiscountAmount,
            reason: usage.discountAmount >= usage.maxDiscountAmount ? 'Discount limit reached' : null
          };
        case 'freeService':
          return {
            canUse: !usage.freeServiceUsed,
            reason: usage.freeServiceUsed ? 'Free service already used' : null
          };
        case 'emergencyService':
          return {
            canUse: !usage.emergencyServiceUsed,
            reason: usage.emergencyServiceUsed ? 'Emergency service already used' : null
          };
        default:
          return { canUse: false, reason: 'Invalid perk type' };
      }
    } catch (error) {
      console.error('Error checking perk usage:', error);
      return { canUse: false, reason: 'Error checking perk availability' };
    }
  }

  // Get subscription usage summary
  async getUsageSummary(userId) {
    try {
      const usage = await prisma.subscriptionUsage.findUnique({
        where: { userId },
        include: {
          user: {
            include: { subscription: true }
          }
        }
      });

      if (!usage) return null;

      return {
        ...usage,
        perksUsed: {
          priorityBooking: usage.priorityBookingUsed,
          discount: usage.discountUsed,
          freeService: usage.freeServiceUsed,
          emergencyService: usage.emergencyServiceUsed
        },
        limits: {
          priorityBookings: usage.maxPriorityBookings,
          discountAmount: usage.maxDiscountAmount,
          freeServices: usage.maxFreeServices,
          emergencyServices: usage.maxEmergencyServices
        }
      };
    } catch (error) {
      console.error('Error getting usage summary:', error);
      throw error;
    }
  }

  // Block subscription cancellation manually
  async blockCancellation(subscriptionId, reason = 'Perks have been used') {
    try {
      const subscription = await prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          canCancel: false,
          cancellationBlockedAt: new Date(),
          cancellationBlockedReason: reason
        }
      });

      return subscription;
    } catch (error) {
      console.error('Error blocking cancellation:', error);
      throw error;
    }
  }

  // Allow subscription cancellation
  async allowCancellation(subscriptionId) {
    try {
      const subscription = await prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          canCancel: true,
          cancellationBlockedAt: null,
          cancellationBlockedReason: null
        }
      });

      return subscription;
    } catch (error) {
      console.error('Error allowing cancellation:', error);
      throw error;
    }
  }
}

export default new SubscriptionService(); 