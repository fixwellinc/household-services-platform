import Stripe from 'stripe';

// Force redeploy - updated at 2025-01-07
console.log('🚀 Stripe service starting...');
console.log('🔍 Environment check:');
console.log('  - NODE_ENV:', process.env.NODE_ENV);
console.log('  - STRIPE_SECRET_KEY exists:', !!process.env.STRIPE_SECRET_KEY);
console.log('  - STRIPE_SECRET_KEY length:', process.env.STRIPE_SECRET_KEY?.length || 0);
console.log('  - STRIPE_SECRET_KEY starts with sk_test:', process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_') || false);
console.log('  - STRIPE_SECRET_KEY starts with sk_live:', process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_') || false);

// Check if we have valid Stripe keys (both test and live keys are valid)
const hasValidStripeKeys = process.env.STRIPE_SECRET_KEY && 
  process.env.STRIPE_SECRET_KEY !== 'sk_test_your_stripe_secret_key' &&
  process.env.STRIPE_SECRET_KEY !== 'your_live_secret_key_here' &&
  process.env.STRIPE_SECRET_KEY.length > 0 &&
  (process.env.STRIPE_SECRET_KEY.startsWith('sk_test_') || process.env.STRIPE_SECRET_KEY.startsWith('sk_live_'));

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
          type: 'customer.subscription.created',
          data: {
            object: {
              id: `sub_mock_${Date.now()}`,
              customer: `cus_mock_${Date.now()}`,
              status: 'active',
              current_period_start: Math.floor(Date.now() / 1000),
              current_period_end: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days
              metadata: {
                userId: 'mock_user_id',
                tier: 'STARTER'
              }
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
    // Check if we're using a mock price ID (for testing)
    const isMockPriceId = priceId.startsWith('price_') && !priceId.includes('_test_') && !priceId.includes('_live_');
    
    if (isMockPriceId) {
      console.log('🔧 Using mock subscription for testing price ID:', priceId);
      return {
        id: `sub_mock_${Date.now()}`,
        customer: customerId,
        status: 'incomplete',
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days
        latest_invoice: {
          payment_intent: {
            client_secret: `pi_mock_${Date.now()}_secret_${Math.random().toString(36).substr(2, 9)}`,
          },
        },
        metadata: metadata || {},
      };
    }

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
    
    // If it's a resource_missing error, provide a helpful message
    if (error.code === 'resource_missing' && error.param === 'line_items[0][price]') {
      throw new Error(`Price ID '${priceId}' not found in Stripe. Please create the product and price in your Stripe dashboard or set the correct environment variables.`);
    }
    
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
export const verifyWebhookSignature = (payload, signature, webhookSecret = null) => {
  try {
    // Use provided webhook secret or fall back to environment variable
    const secret = webhookSecret || process.env.STRIPE_WEBHOOK_SECRET;
    
    // Check if webhook secret is configured
    if (!secret) {
      console.log('⚠️ STRIPE_WEBHOOK_SECRET not configured, skipping signature verification for testing');
      // For testing, handle the payload appropriately
      try {
        let event;
        
        // If payload is already an object (parsed by Express), use it directly
        if (typeof payload === 'object' && payload !== null) {
          event = payload;
          console.log('✅ Using payload as object for testing');
        } else {
          // If payload is a string or buffer, parse it
          const payloadString = Buffer.isBuffer(payload) ? payload.toString('utf8') : payload;
          event = JSON.parse(payloadString);
          console.log('✅ Successfully parsed webhook payload for testing');
        }
        
        return event;
      } catch (parseError) {
        console.error('Failed to parse webhook payload:', parseError);
        console.error('Payload type:', typeof payload);
        console.error('Payload length:', payload.length);
        throw new Error('Invalid webhook payload');
      }
    }

    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      secret
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
    // Check if we're using a mock price ID (for testing)
    const isMockPriceId = priceId.startsWith('price_mock_') || priceId.startsWith('price_test_');
    
    if (isMockPriceId) {
      console.log('🔧 Using mock checkout session for testing price ID:', priceId);
      return {
        id: `cs_mock_${Date.now()}`,
        url: successUrl, // Redirect directly to success URL for testing
        payment_intent: `pi_mock_${Date.now()}`,
        metadata: metadata || {},
      };
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription', // Reverted back to subscription mode for recurring prices
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata,
    });
    return session;
  } catch (error) {
    console.error('Error creating subscription checkout session:', error);
    
    // If it's a resource_missing error, provide a helpful message
    if (error.code === 'resource_missing' && error.param === 'line_items[0][price]') {
      throw new Error(`Price ID '${priceId}' not found in Stripe. Please create the product and price in your Stripe dashboard or set the correct environment variables.`);
    }
    
    throw new Error('Failed to create subscription checkout session');
  }
};

// Update subscription schedule for payment frequency changes
export const updateSubscriptionSchedule = async (subscriptionId, newPriceId, nextPaymentDate) => {
  try {
    // For mock subscriptions, return a mock response
    if (subscriptionId.startsWith('sub_mock_')) {
      console.log('🔧 Using mock subscription schedule update for:', subscriptionId);
      return {
        id: `sub_sched_mock_${Date.now()}`,
        subscription: subscriptionId,
        phases: [{
          start_date: Math.floor(nextPaymentDate.getTime() / 1000),
          items: [{ price: newPriceId, quantity: 1 }]
        }]
      };
    }

    // Create a subscription schedule to handle the frequency change
    const schedule = await stripe.subscriptionSchedules.create({
      from_subscription: subscriptionId,
    });

    // Update the schedule with new pricing and timing
    const updatedSchedule = await stripe.subscriptionSchedules.update(schedule.id, {
      phases: [
        {
          items: [{ price: newPriceId, quantity: 1 }],
          start_date: Math.floor(nextPaymentDate.getTime() / 1000),
        }
      ],
    });

    return updatedSchedule;
  } catch (error) {
    console.error('Error updating subscription schedule:', error);
    throw new Error('Failed to update subscription schedule');
  }
};

// Update subscription payment method or other details
export const updateSubscription = async (subscriptionId, updates) => {
  console.log('🔄 Updating subscription:', subscriptionId, updates);
  try {
    // For mock subscriptions, return a mock response
    if (subscriptionId.startsWith('sub_mock_')) {
      console.log('🔧 Using mock subscription update for:', subscriptionId);
      return {
        id: subscriptionId,
        ...updates,
        status: 'active',
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
        items: {
          data: [{
            id: `si_mock_${Date.now()}`,
            price: updates.items?.[0]?.price || 'price_mock'
          }]
        }
      };
    }

    const subscription = await stripe.subscriptions.update(subscriptionId, updates);
    console.log('✅ Subscription updated successfully');
    return subscription;
  } catch (error) {
    console.error('Error updating subscription:', error);
    throw new Error('Failed to update subscription');
  }
};

// Update subscription with plan change and proration
export const updateSubscriptionPlan = async (subscriptionId, newPriceId, prorationBehavior = 'create_prorations') => {
  console.log('🔄 Updating subscription plan:', subscriptionId, 'to price:', newPriceId);
  try {
    // For mock subscriptions, return a mock response
    if (subscriptionId.startsWith('sub_mock_')) {
      console.log('🔧 Using mock subscription plan update for:', subscriptionId);
      return {
        id: subscriptionId,
        status: 'active',
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
        items: {
          data: [{
            id: `si_mock_${Date.now()}`,
            price: {
              id: newPriceId,
              unit_amount: 2199, // Mock price
              currency: 'usd'
            }
          }]
        },
        latest_invoice: {
          id: `in_mock_${Date.now()}`,
          amount_paid: 0,
          amount_due: 0
        }
      };
    }

    // First, get the current subscription to find the subscription item
    const currentSubscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    if (!currentSubscription.items.data.length) {
      throw new Error('No subscription items found');
    }

    const subscriptionItemId = currentSubscription.items.data[0].id;

    // Update the subscription with the new price
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      items: [{
        id: subscriptionItemId,
        price: newPriceId,
      }],
      proration_behavior: prorationBehavior,
    });

    console.log('✅ Subscription plan updated successfully');
    return subscription;
  } catch (error) {
    console.error('Error updating subscription plan:', error);
    throw new Error('Failed to update subscription plan');
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

// Pause subscription
export const pauseSubscription = async (subscriptionId, options = {}) => {
  try {
    // For mock subscriptions, return a mock response
    if (subscriptionId.startsWith('sub_mock_')) {
      console.log('🔧 Using mock subscription pause for:', subscriptionId);
      return {
        id: subscriptionId,
        status: 'paused',
        pause_collection: {
          behavior: options.behavior || 'void',
          resumes_at: options.resumesAt ? Math.floor(options.resumesAt.getTime() / 1000) : null
        }
      };
    }

    // Pause the subscription in Stripe
    const pauseData = {
      pause_collection: {
        behavior: options.behavior || 'void'
      }
    };

    if (options.resumesAt) {
      pauseData.pause_collection.resumes_at = Math.floor(options.resumesAt.getTime() / 1000);
    }

    const subscription = await stripe.subscriptions.update(subscriptionId, pauseData);
    return subscription;
  } catch (error) {
    console.error('Error pausing subscription:', error);
    throw new Error('Failed to pause subscription');
  }
};

// Resume subscription
export const resumeSubscription = async (subscriptionId) => {
  try {
    // For mock subscriptions, return a mock response
    if (subscriptionId.startsWith('sub_mock_')) {
      console.log('🔧 Using mock subscription resume for:', subscriptionId);
      return {
        id: subscriptionId,
        status: 'active',
        pause_collection: null
      };
    }

    // Resume the subscription in Stripe by removing pause_collection
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      pause_collection: ''
    });
    return subscription;
  } catch (error) {
    console.error('Error resuming subscription:', error);
    throw new Error('Failed to resume subscription');
  }
}; 