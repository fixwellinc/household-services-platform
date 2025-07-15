// BCAA-Style Plans Configuration
// This file contains the plan structure and Stripe price IDs

export const PLANS = {
  BASIC: {
    id: 'basic',
    name: 'Basic',
    description: 'Essential household services for everyday needs',
    monthlyPrice: 9.99,
    yearlyPrice: 99.99, // 17% discount
    originalPrice: 15.99,
    stripePriceIds: {
      monthly: process.env.STRIPE_BASIC_MONTHLY_PRICE_ID || 'price_basic_monthly',
      yearly: process.env.STRIPE_BASIC_YEARLY_PRICE_ID || 'price_basic_yearly'
    },
    features: [
      'Access to basic household services',
      'Standard booking system (7 days advance)',
      'Email support',
      'Basic service categories (cleaning, maintenance)',
      'Standard response time (24 hours)',
      'No booking fees',
      'Service history tracking',
      'Professional service team',
      'Basic service guarantees',
      'Lower Mainland service area'
    ],
    savings: '$500+ per year',
    color: 'blue',
    icon: 'star'
  },
  
  PLUS: {
    id: 'plus',
    name: 'Plus',
    description: 'Enhanced features for busy families',
    monthlyPrice: 19.99,
    yearlyPrice: 199.99, // 17% discount
    originalPrice: 29.99,
    stripePriceIds: {
      monthly: process.env.STRIPE_PLUS_MONTHLY_PRICE_ID || 'price_plus_monthly',
      yearly: process.env.STRIPE_PLUS_YEARLY_PRICE_ID || 'price_plus_yearly'
    },
    features: [
      'Everything in Basic',
      'Priority booking system (3 days advance)',
      'SMS notifications',
      'Extended service categories (repair, organization)',
      'Faster response time (12 hours)',
      'Phone & email support',
      'Advanced scheduling options',
      'Service ratings & reviews',
      'Service customization',
      'Recurring service setup',
      'Priority customer support',
      'Service guarantees',
      'Advanced filtering options',
      '10% discount on all services',
      'Free service consultation'
    ],
    savings: '$1,000+ per year',
    color: 'purple',
    icon: 'crown',
    popular: true
  },
  
  PREMIER: {
    id: 'premier',
    name: 'Premier',
    description: 'Ultimate convenience for luxury households',
    monthlyPrice: 29.99,
    yearlyPrice: 299.99, // 17% discount
    originalPrice: 49.99,
    stripePriceIds: {
      monthly: process.env.STRIPE_PREMIER_MONTHLY_PRICE_ID || 'price_premier_monthly',
      yearly: process.env.STRIPE_PREMIER_YEARLY_PRICE_ID || 'price_premier_yearly'
    },
    features: [
      'Everything in Plus',
      'Concierge service',
      'Same-day booking availability',
      'Dedicated account manager',
      '24/7 priority support',
      'Custom service packages',
      'Premium service team',
      'White-glove service',
      'Service quality guarantees',
      'Flexible scheduling',
      'All service categories',
      'Advanced analytics dashboard',
      'Family member management',
      'Integration with smart home',
      'Exclusive events & offers',
      '20% discount on all services',
      'Free emergency call-out',
      'Priority scheduling for all services'
    ],
    savings: '$1,500+ per year',
    color: 'amber',
    icon: 'sparkles'
  }
};

// Plan comparison table data
export const PLAN_COMPARISON = {
  features: [
    {
      name: 'Response Time',
      basic: '24 hours',
      plus: '12 hours',
      premier: 'Same day'
    },
    {
      name: 'Customer Support',
      basic: 'Email only',
      plus: 'Phone & Email',
      premier: '24/7 Priority'
    },
    {
      name: 'Service Categories',
      basic: 'Basic',
      plus: 'Extended',
      premier: 'All + Custom'
    },
    {
      name: 'Service Discount',
      basic: 'None',
      plus: '10% off',
      premier: '20% off'
    },
    {
      name: 'Account Manager',
      basic: false,
      plus: false,
      premier: true
    },
    {
      name: 'Concierge Service',
      basic: false,
      plus: false,
      premier: true
    },
    {
      name: 'Emergency Call-out',
      basic: 'Standard rate',
      plus: 'Standard rate',
      premier: 'Free'
    },
    {
      name: 'Money-back Guarantee',
      basic: true,
      plus: true,
      premier: true
    }
  ]
};

// Service discounts by plan
export const SERVICE_DISCOUNTS = {
  BASIC: 0,
  PLUS: 0.10, // 10%
  PREMIER: 0.20 // 20%
};

// Booking advance times by plan
export const BOOKING_ADVANCE_TIMES = {
  BASIC: 7, // days
  PLUS: 3, // days
  PREMIER: 0 // same day
};

// Response times by plan (in hours)
export const RESPONSE_TIMES = {
  BASIC: 24,
  PLUS: 12,
  PREMIER: 2
};

// Helper functions
export const getPlanById = (planId) => {
  return Object.values(PLANS).find(plan => plan.id === planId);
};

export const getPlanByTier = (tier) => {
  return PLANS[tier.toUpperCase()];
};

export const getAllPlans = () => {
  return Object.values(PLANS);
};

export const getStripePriceId = (planId, billingPeriod = 'monthly') => {
  const plan = getPlanById(planId);
  return plan?.stripePriceIds[billingPeriod];
};

export const calculateServiceDiscount = (planTier, servicePrice) => {
  const discountRate = SERVICE_DISCOUNTS[planTier.toUpperCase()] || 0;
  return servicePrice * discountRate;
};

export const getBookingAdvanceTime = (planTier) => {
  return BOOKING_ADVANCE_TIMES[planTier.toUpperCase()] || 7;
};

export const getResponseTime = (planTier) => {
  return RESPONSE_TIMES[planTier.toUpperCase()] || 24;
}; 