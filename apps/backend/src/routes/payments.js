import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { 
  createPaymentIntent, 
  createCustomer, 
  createSubscription, 
  cancelSubscription,
  verifyWebhookSignature,
  createCheckoutSession,
  createSubscriptionCheckoutSession,
  refundPayment
} from '../services/stripe.js';
import subscriptionService from '../services/subscriptionService.js';
import prisma from '../config/database.js';

const router = express.Router();

// Create payment intent for booking
router.post('/create-payment-intent', authMiddleware, async (req, res) => {
  try {
    const { amount, bookingId, currency = 'usd' } = req.body;
    const userId = req.user.id;

    if (!amount || !bookingId) {
      return res.status(400).json({ error: 'Amount and booking ID are required' });
    }

    // Verify booking exists and belongs to user
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        customerId: userId,
      },
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const service = booking?.serviceId ? await prisma.service.findUnique({ where: { id: booking.serviceId } }) : null;

    const paymentIntent = await createPaymentIntent(amount, currency, {
      bookingId,
      userId,
      serviceId: service?.id,
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('Payment intent creation error:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

// Create subscription
router.post('/create-subscription', authMiddleware, async (req, res) => {
  try {
    const { priceId, tier } = req.body;
    const userId = req.user.id;

    if (!priceId || !tier) {
      return res.status(400).json({ error: 'Price ID and tier are required' });
    }

    // Get or create Stripe customer
    let user = await prisma.user.findUnique({ where: { id: userId } });
    let userSubscription = await prisma.subscription.findUnique({ where: { userId: user.id } });
    user = { ...user, subscription: userSubscription };

    let stripeCustomerId = user.subscription?.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await createCustomer(user.email, user.name, {
        userId: user.id,
      });
      stripeCustomerId = customer.id;
    }

    // Create subscription
    const subscription = await createSubscription(stripeCustomerId, priceId, {
      userId: user.id,
      tier,
    });

    // Update user subscription in database
    await prisma.subscription.upsert({
      where: { userId },
      update: {
        tier,
        stripeCustomerId,
        stripeSubscriptionId: subscription.id,
        status: subscription.status.toUpperCase(),
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      },
      create: {
        userId,
        tier,
        stripeCustomerId,
        stripeSubscriptionId: subscription.id,
        status: subscription.status.toUpperCase(),
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      },
    });

    res.json({
      subscriptionId: subscription.id,
      clientSecret: subscription.latest_invoice.payment_intent.client_secret,
    });
  } catch (error) {
    console.error('Subscription creation error:', error);
    res.status(500).json({ error: 'Failed to create subscription' });
  }
});

// Cancel subscription
router.post('/cancel-subscription', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription || !subscription.stripeSubscriptionId) {
      return res.status(404).json({ error: 'No active subscription found' });
    }

    // Cancel in Stripe
    await cancelSubscription(subscription.stripeSubscriptionId);

    // Update in database
    await prisma.subscription.update({
      where: { userId },
      data: {
        status: 'CANCELLED',
      },
    });

    res.json({ message: 'Subscription cancelled successfully' });
  } catch (error) {
    console.error('Subscription cancellation error:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

// Create checkout session for one-time payment
router.post('/create-checkout-session', authMiddleware, async (req, res) => {
  try {
    const { lineItems, successUrl, cancelUrl } = req.body;
    const userId = req.user.id;

    if (!lineItems || !successUrl || !cancelUrl) {
      return res.status(400).json({ error: 'Line items, success URL, and cancel URL are required' });
    }

    const session = await createCheckoutSession(
      lineItems,
      successUrl,
      cancelUrl,
      { userId }
    );

    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Checkout session creation error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Create subscription checkout session
router.post('/create-subscription-checkout', authMiddleware, async (req, res) => {
  try {
    const { priceId, successUrl, cancelUrl, tier } = req.body;
    const userId = req.user.id;

    if (!priceId || !successUrl || !cancelUrl || !tier) {
      return res.status(400).json({ error: 'Price ID, success URL, cancel URL, and tier are required' });
    }

    const session = await createSubscriptionCheckoutSession(
      priceId,
      successUrl,
      cancelUrl,
      { userId, tier }
    );

    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Subscription checkout session creation error:', error);
    res.status(500).json({ error: 'Failed to create subscription checkout session' });
  }
});

// Process refund
router.post('/refund', authMiddleware, async (req, res) => {
  try {
    const { paymentIntentId, amount, reason } = req.body;
    const userId = req.user.id;

    if (!paymentIntentId) {
      return res.status(400).json({ error: 'Payment intent ID is required' });
    }

    // Verify user has permission to refund this payment
    const booking = await prisma.booking.findFirst({
      where: {
        stripePaymentIntentId: paymentIntentId,
        customerId: userId,
      },
    });

    if (!booking) {
      return res.status(404).json({ error: 'Payment not found or unauthorized' });
    }

    const refund = await refundPayment(paymentIntentId, amount, reason);

    // Update booking status
    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: 'REFUNDED',
      },
    });

    res.json({ refundId: refund.id, status: refund.status });
  } catch (error) {
    console.error('Refund error:', error);
    res.status(500).json({ error: 'Failed to process refund' });
  }
});

// Stripe webhook handler
router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];

  try {
    const event = verifyWebhookSignature(req.rawBody || req.body, sig);

    // Use the subscription service to process webhook events
    await subscriptionService.processWebhookEvent(event);

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: 'Webhook signature verification failed' });
  }
});

// Webhook handlers
async function handlePaymentSuccess(paymentIntent) {
  try {
    const { bookingId } = paymentIntent.metadata;
    
    if (bookingId) {
      await prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: 'CONFIRMED',
          stripePaymentIntentId: paymentIntent.id,
        },
      });
    }
  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

async function handlePaymentFailure(paymentIntent) {
  try {
    const { bookingId } = paymentIntent.metadata;
    
    if (bookingId) {
      await prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: 'CANCELLED',
        },
      });
    }
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}

async function handleSubscriptionCreated(subscription) {
  try {
    const { userId, tier } = subscription.metadata;
    
    if (userId) {
      await prisma.subscription.upsert({
        where: { userId },
        update: {
          tier,
          stripeCustomerId: subscription.customer,
          stripeSubscriptionId: subscription.id,
          status: subscription.status.toUpperCase(),
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        },
        create: {
          userId,
          tier,
          stripeCustomerId: subscription.customer,
          stripeSubscriptionId: subscription.id,
          status: subscription.status.toUpperCase(),
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        },
      });
    }
  } catch (error) {
    console.error('Error handling subscription created:', error);
  }
}

async function handleSubscriptionUpdated(subscription) {
  try {
    const { userId } = subscription.metadata;
    
    if (userId) {
      await prisma.subscription.update({
        where: { userId },
        data: {
          status: subscription.status.toUpperCase(),
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        },
      });
    }
  } catch (error) {
    console.error('Error handling subscription updated:', error);
  }
}

async function handleSubscriptionDeleted(subscription) {
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
  }
}

async function handleInvoicePaymentSucceeded(invoice) {
  try {
    if (invoice.subscription) {
      const subscription = await prisma.subscription.findFirst({
        where: { stripeSubscriptionId: invoice.subscription },
      });
      
      if (subscription) {
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            status: 'ACTIVE',
          },
        });
      }
    }
  } catch (error) {
    console.error('Error handling invoice payment succeeded:', error);
  }
}

async function handleInvoicePaymentFailed(invoice) {
  try {
    if (invoice.subscription) {
      const subscription = await prisma.subscription.findFirst({
        where: { stripeSubscriptionId: invoice.subscription },
      });
      
      if (subscription) {
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            status: 'PAST_DUE',
          },
        });
      }
    }
  } catch (error) {
    console.error('Error handling invoice payment failed:', error);
  }
}

export default router; 