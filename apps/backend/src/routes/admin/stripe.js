import express from 'express';
import stripe from '../../services/stripe.js';

const router = express.Router();

// GET /api/admin/stripe/diagnostics
// Returns non-sensitive diagnostics about Stripe configuration in test mode
router.get('/diagnostics', async (req, res) => {
  try {
    const secretKey = process.env.STRIPE_SECRET_KEY || '';
    const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY || '';

    const mode = secretKey.startsWith('sk_live_') ? 'live' : (secretKey.startsWith('sk_test_') ? 'test' : 'mock');
    const publishableConfigured = publishableKey.startsWith('pk_');
    const webhookConfigured = !!process.env.STRIPE_WEBHOOK_SECRET;

    let products = [];
    let prices = [];
    let notes = [];

    if (!stripe || mode === 'mock') {
      notes.push('Stripe is running in mock mode (no valid STRIPE_SECRET_KEY).');
    } else {
      try {
        const prodList = await stripe.products.list({ limit: 5 });
        products = prodList.data.map(p => ({ id: p.id, name: p.name, active: p.active }));
      } catch (e) {
        notes.push(`Failed to list products: ${e.message}`);
      }
      try {
        const priceList = await stripe.prices.list({ limit: 10 });
        prices = priceList.data.map(pr => ({ id: pr.id, product: pr.product, unit_amount: pr.unit_amount, currency: pr.currency, recurring: pr.recurring }));
      } catch (e) {
        notes.push(`Failed to list prices: ${e.message}`);
      }
    }

    res.json({
      success: true,
      mode,
      publishableConfigured,
      webhookConfigured,
      products,
      prices,
      notes
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
