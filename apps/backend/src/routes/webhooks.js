import express from 'express';
import { verifyWebhookSignature } from '../services/stripe.js';
import subscriptionService from '../services/subscriptionService.js';
import prisma from '../config/database.js';

const router = express.Router();

// Stripe webhook handler - no auth required (Stripe sends the webhook)
router.post('/stripe', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('❌ STRIPE_WEBHOOK_SECRET not configured');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  try {
    console.log('🔔 Processing Stripe webhook:', req.headers['stripe-signature'] ? 'Signature present' : 'No signature');
    
    // Verify webhook signature
    const event = verifyWebhookSignature(req.rawBody || req.body, sig, webhookSecret);
    
    console.log('✅ Webhook verified, processing event:', event.type);

    // Process the webhook event
    await subscriptionService.processWebhookEvent(event);

    // Log successful processing
    console.log('✅ Webhook processed successfully:', event.type);

    res.json({ received: true, processed: true });
  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    
    if (error.message.includes('signature')) {
      return res.status(400).json({ error: 'Webhook signature verification failed' });
    }
    
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Health check for webhook endpoint
router.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ? 'configured' : 'missing'
  });
});

export default router;
