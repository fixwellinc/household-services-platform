import express from 'express';
import Stripe from 'stripe';

const router = express.Router();

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
});

// Test endpoint to verify Stripe is working
router.get('/test-stripe', async (req, res) => {
  try {
    console.log('🧪 Testing Stripe connection...');
    
    // Test basic Stripe connection
    const account = await stripe.accounts.retrieve();
    
    const isLiveMode = process.env.STRIPE_SECRET_KEY.startsWith('sk_live_');
    
    res.json({
      success: true,
      message: 'Stripe connection successful!',
      mode: isLiveMode ? 'LIVE' : 'TEST',
      account: {
        id: account.id,
        country: account.country,
        type: account.type,
      },
      testCards: {
        visa: '4242424242424242',
        mastercard: '5555555555554444',
        amex: '378282246310005',
        declined: '4000000000000002',
        insufficientFunds: '4000000000009995',
        expiredCard: '4000000000000069',
        requiresAuthentication: '4000002500003155',
      },
      instructions: {
        note: 'Test cards work in both test and live mode',
        expiry: 'Use any future date (e.g., 12/2025)',
        cvc: 'Use any 3-digit CVC',
        testing: 'These cards never charge real money'
      }
    });
    
  } catch (error) {
    console.error('❌ Stripe test failed:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Stripe connection failed. Check your API keys.'
    });
  }
});

// Test payment intent creation
router.post('/test-payment-intent', async (req, res) => {
  try {
    const { amount = 2000, currency = 'usd' } = req.body;
    
    console.log('💳 Testing payment intent creation...');
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      metadata: {
        test: 'true',
        source: 'railway_test',
      },
    });
    
    res.json({
      success: true,
      paymentIntent: {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        clientSecret: paymentIntent.client_secret,
      },
      message: 'Payment intent created successfully!'
    });
    
  } catch (error) {
    console.error('❌ Payment intent creation failed:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to create payment intent'
    });
  }
});

// Test customer creation
router.post('/test-customer', async (req, res) => {
  try {
    const { email = 'test@jjglass.ca', name = 'Test Customer' } = req.body;
    
    console.log('👤 Testing customer creation...');
    
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        test: 'true',
        source: 'railway_test',
      },
    });
    
    res.json({
      success: true,
      customer: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
      },
      message: 'Customer created successfully!'
    });
    
  } catch (error) {
    console.error('❌ Customer creation failed:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to create customer'
    });
  }
});

// Test payment method creation
router.post('/test-payment-method', async (req, res) => {
  try {
    const { customerId, cardNumber = '4242424242424242' } = req.body;
    
    if (!customerId) {
      return res.status(400).json({
        success: false,
        error: 'Customer ID is required'
      });
    }
    
    console.log('💳 Testing payment method creation...');
    
    const paymentMethod = await stripe.paymentMethods.create({
      type: 'card',
      card: {
        number: cardNumber,
        exp_month: 12,
        exp_year: 2025,
        cvc: '123',
      },
    });
    
    // Attach to customer
    await stripe.paymentMethods.attach(paymentMethod.id, {
      customer: customerId,
    });
    
    res.json({
      success: true,
      paymentMethod: {
        id: paymentMethod.id,
        type: paymentMethod.type,
        card: {
          brand: paymentMethod.card.brand,
          last4: paymentMethod.card.last4,
          exp_month: paymentMethod.card.exp_month,
          exp_year: paymentMethod.card.exp_year,
        },
      },
      message: 'Payment method created and attached successfully!'
    });
    
  } catch (error) {
    console.error('❌ Payment method creation failed:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to create payment method'
    });
  }
});

// Test successful payment
router.post('/test-payment', async (req, res) => {
  try {
    const { customerId, paymentMethodId, amount = 2000 } = req.body;
    
    if (!customerId || !paymentMethodId) {
      return res.status(400).json({
        success: false,
        error: 'Customer ID and Payment Method ID are required'
      });
    }
    
    console.log('💰 Testing successful payment...');
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      customer: customerId,
      payment_method: paymentMethodId,
      confirmation_method: 'manual',
      confirm: true,
      metadata: {
        test: 'successful_payment',
        source: 'railway_test',
      },
    });
    
    res.json({
      success: true,
      paymentIntent: {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
      },
      message: 'Payment processed successfully!'
    });
    
  } catch (error) {
    console.error('❌ Payment failed:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Payment failed'
    });
  }
});

// Test declined payment
router.post('/test-declined-payment', async (req, res) => {
  try {
    const { customerId, amount = 2000 } = req.body;
    
    if (!customerId) {
      return res.status(400).json({
        success: false,
        error: 'Customer ID is required'
      });
    }
    
    console.log('❌ Testing declined payment...');
    
    const paymentMethod = await stripe.paymentMethods.create({
      type: 'card',
      card: {
        number: '4000000000000002', // Declined card
        exp_month: 12,
        exp_year: 2025,
        cvc: '123',
      },
    });
    
    await stripe.paymentMethods.attach(paymentMethod.id, {
      customer: customerId,
    });
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      customer: customerId,
      payment_method: paymentMethod.id,
      confirmation_method: 'manual',
      confirm: true,
      metadata: {
        test: 'declined_payment',
        source: 'railway_test',
      },
    });
    
    // This should not reach here
    res.json({
      success: false,
      message: 'Payment should have been declined but was not',
      paymentIntent: {
        id: paymentIntent.id,
        status: paymentIntent.status,
      }
    });
    
  } catch (error) {
    if (error.code === 'card_declined') {
      res.json({
        success: true,
        message: 'Payment correctly declined as expected',
        error: error.message,
        code: error.code,
      });
    } else {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Unexpected error during declined payment test'
      });
    }
  }
});

export default router;
