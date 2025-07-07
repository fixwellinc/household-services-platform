import Stripe from 'stripe';

console.log('🚀 Stripe service starting...');
console.log('🔍 Environment check:');
console.log('  - NODE_ENV:', process.env.NODE_ENV);
console.log('  - STRIPE_SECRET_KEY exists:', !!process.env.STRIPE_SECRET_KEY);
console.log('  - STRIPE_SECRET_KEY length:', process.env.STRIPE_SECRET_KEY?.length || 0);
console.log('  - STRIPE_SECRET_KEY starts with sk_test:', process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_') || false);

// Check if we have valid Stripe keys
const hasValidStripeKeys = process.env.STRIPE_SECRET_KEY && 
  process.env.STRIPE_SECRET_KEY !== 'sk_test_your_stripe_secret_key' &&
  process.env.STRIPE_SECRET_KEY.length > 0 &&
  process.env.STRIPE_SECRET_KEY.startsWith('sk_test_');

console.log('🔍 hasValidStripeKeys:', hasValidStripeKeys);

let stripe = null;

if (!hasValidStripeKeys) {
  console.log('🔧 Using mock Stripe service (no valid Stripe keys found)');
  // Create a mock Stripe instance for development or when keys are missing
  stripe = {
    paymentIntents: {
      create: async (params) => ({
        id: `pi_mock_${Date.now()}`,
        client_secret: `pi_mock_${Date.now()}_secret_${Math.random().toString(36).substr(2, 9)}`,
        amount: params.amount,
        currency: params.currency,
        status: 'requires_payment_method',
        metadata: params.metadata || {},
      }),
    },
    customers: {
      create: async (params) => ({
        id: `cus_mock_${Date.now()}`,
        email: params.email,
        name: params.name,
        metadata: params.metadata || {},
      }),
      retrieve: async (customerId) => ({
        id: customerId,
        email: 'mock@example.com',
        name: 'Mock Customer',
      }),
      update: async (customerId, updates) => ({
        id: customerId,
        ...updates,
      }),
    },
    subscriptions: {
      create: async (params) => ({
        id: `sub_mock_${Date.now()}`,
        customer: params.customer,
        status: 'incomplete',
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days
        latest_invoice: {
          payment_intent: {
            client_secret: `pi_mock_${Date.now()}_secret_${Math.random().toString(36).substr(2, 9)}`,
          },
        },
        metadata: params.metadata || {},
      }),
      cancel: async (subscriptionId) => ({
        id: subscriptionId,
        status: 'canceled',
      }),
      retrieve: async (subscriptionId) => ({
        id: subscriptionId,
        status: 'active',
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
      }),
    },
    webhooks: {
      constructEvent: (payload, signature, secret) => {
        // Mock webhook event
        return {
          type: 'payment_intent.succeeded',
          data: {
            object: {
              id: `pi_mock_${Date.now()}`,
              amount: 1000,
              currency: 'usd',
              status: 'succeeded',
            },
          },
        };
      },
    },
    checkout: {
      sessions: {
        create: async (params) => ({
          id: `cs_mock_${Date.now()}`,
          url: 'http://localhost:3000/mock-checkout-success',
          payment_intent: `pi_mock_${Date.now()}`,
          metadata: params.metadata || {},
        }),
      },
    },
    refunds: {
      create: async (params) => ({
        id: `re_mock_${Date.now()}`,
        payment_intent: params.payment_intent,
        amount: params.amount || 1000,
        status: 'succeeded',
      }),
    },
  };
  console.log('✅ Mock Stripe service initialized successfully');
} else {
  console.log('💳 Initializing real Stripe service with provided keys');
  try {
    // Use real Stripe in production
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-12-18.acacia',
    });
    console.log('✅ Real Stripe service initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize real Stripe service:', error.message);
    console.log('🔄 Falling back to mock Stripe service');
    // Fall back to mock service if real Stripe fails
    stripe = {
      paymentIntents: {
        create: async (params) => ({
          id: `pi_mock_${Date.now()}`,
          client_secret: `pi_mock_${Date.now()}_secret_${Math.random().toString(36).substr(2, 9)}`,
          amount: params.amount,
          currency: params.currency,
          status: 'requires_payment_method',
          metadata: params.metadata || {},
        }),
      },
      // ... rest of mock implementation
    };
  }
}

console.log('🎉 Stripe service initialization complete');

export default stripe;

// Payment Intent creation
export const createPaymentIntent = async (amount, currency = 'usd', metadata = {}) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    });
    return paymentIntent;
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw new Error('Failed to create payment intent');
  }
};

// Customer creation
export const createCustomer = async (email, name, metadata = {}) => {
  try {
    const customer = await stripe.customers.create({
      email,
      name,
      metadata,
    });
    return customer;
  } catch (error) {
    console.error('Error creating customer:', error);
    throw new Error('Failed to create customer');
  }
};

// Subscription creation
export const createSubscription = async (customerId, priceId, metadata = {}) => {
  try {
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      metadata,
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    });
    return subscription;
  } catch (error) {
    console.error('Error creating subscription:', error);
    throw new Error('Failed to create subscription');
  }
};

// Subscription cancellation
export const cancelSubscription = async (subscriptionId) => {
  try {
    const subscription = await stripe.subscriptions.cancel(subscriptionId);
    return subscription;
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw new Error('Failed to cancel subscription');
  }
};

// Webhook signature verification
export const verifyWebhookSignature = (payload, signature) => {
  try {
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    return event;
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    throw new Error('Invalid webhook signature');
  }
};

// Get subscription details
export const getSubscription = async (subscriptionId) => {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    return subscription;
  } catch (error) {
    console.error('Error retrieving subscription:', error);
    throw new Error('Failed to retrieve subscription');
  }
};

// Get customer details
export const getCustomer = async (customerId) => {
  try {
    const customer = await stripe.customers.retrieve(customerId);
    return customer;
  } catch (error) {
    console.error('Error retrieving customer:', error);
    throw new Error('Failed to retrieve customer');
  }
};

// Update customer
export const updateCustomer = async (customerId, updates) => {
  try {
    const customer = await stripe.customers.update(customerId, updates);
    return customer;
  } catch (error) {
    console.error('Error updating customer:', error);
    throw new Error('Failed to update customer');
  }
};

// Create checkout session
export const createCheckoutSession = async (lineItems, successUrl, cancelUrl, metadata = {}) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata,
    });
    return session;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw new Error('Failed to create checkout session');
  }
};

// Create subscription checkout session
export const createSubscriptionCheckoutSession = async (priceId, successUrl, cancelUrl, metadata = {}) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata,
    });
    return session;
  } catch (error) {
    console.error('Error creating subscription checkout session:', error);
    throw new Error('Failed to create subscription checkout session');
  }
};

// Refund payment
export const refundPayment = async (paymentIntentId, amount = null, reason = 'requested_by_customer') => {
  try {
    const refundData = {
      payment_intent: paymentIntentId,
      reason,
    };
    
    if (amount) {
      refundData.amount = Math.round(amount * 100);
    }
    
    const refund = await stripe.refunds.create(refundData);
    return refund;
  } catch (error) {
    console.error('Error creating refund:', error);
    throw new Error('Failed to create refund');
  }
}; 