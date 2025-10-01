// Fixwell Subscription Services by Tier Configuration
// This file contains the plan structure and Stripe price IDs
// Updated with 10% yearly discount - July 2025

export const PLANS = {
  BASIC: {
    id: 'basic',
    name: 'Basic Plan',
    description: 'Perfect for light upkeep & peace of mind',
    monthlyPrice: 21.99,
    yearlyPrice: 237.49, // 10% discount ($21.99 x 12 months x 0.9)
    originalPrice: 49.00,
    stripePriceIds: {
      monthly: process.env.STRIPE_BASIC_MONTHLY_PRICE_ID || 'price_1S0WSNJZZWUMDx2PI1LEa5rs',
      yearly: process.env.STRIPE_BASIC_YEARLY_PRICE_ID || 'price_1S0WSTJZZWUMDx2P2k749Zyc'
    },
    features: [
      '1 visit per month (up to 0.5 hour)',
      'Minor repairs (squeaky doors, loose handles)',
      'Lightbulb replacements',
      'Smoke detector battery checks',
      'Faucet tightening & leak checks',
      'Cabinet hinge adjustment',
      'Basic caulking (kitchen/bathroom)',
      'Door alignment & lubrication',
      'Home safety check (visual)',
      'Priority scheduling',
      'Free annual home inspection',
      'Access to discounted upgrade services'
    ],
    savings: 'Peace of mind maintenance',
    color: 'blue',
    icon: 'star',
    visitFrequency: 'Monthly',
    timePerVisit: '0.5 hours',
    visitsPerMonth: 1
  },
  
  PREMIUM: {
    id: 'premium',
    name: 'Premium Plan',
    description: 'Monthly help for ongoing maintenance and upkeep',
    monthlyPrice: 54.99,
    yearlyPrice: 593.89, // 10% discount ($54.99 x 12 months x 0.9)
    originalPrice: 79.00,
    stripePriceIds: {
      monthly: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID || 'price_1S0WRtJZZWUMDx2PsO8c62ar',
      yearly: process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID || 'price_1S0WRyJZZWUMDx2PJP4ZWw6Q'
    },
    features: [
      '1 visit per month (up to 1 hour)',
      'Everything from Starter Plan',
      'Gutter inspection/clearing (ground floor)',
      'Seasonal maintenance (weatherstripping, window sealing)',
      'Small drywall repairs or touch-ups',
      'Power outlet/switch inspection',
      'Hanging shelves, photos, curtains',
      'Appliance checks (wobbling, leaks, noise)',
      'Toilet tank/flush adjustments',
      'Exterior door & lock tune-ups',
      '10% off hourly add-ons or larger projects',
      'Seasonal home maintenance reminders',
      'Emergency visits at standard rate (priority booking)'
    ],
    savings: 'Professional monthly maintenance',
    color: 'purple',
    icon: 'crown',
    popular: true,
    visitFrequency: 'Monthly',
    timePerVisit: '1 hour',
    visitsPerMonth: 1
  }
};

// Optional Add-Ons (Available to All Tiers)
export const ADD_ONS = {
  STANDARD_CHARGE: {
    name: 'Standard Charge (no subscription)',
    price: 200.00,
    description: 'One-time service visit without subscription'
  },
  EXTRA_HOURS: {
    name: 'Extra Hours',
    price: 50.00,
    unit: 'per hour',
    description: 'Additional time beyond plan allowance'
  },
  WEEKEND_EVENING: {
    name: 'Weekend or Evening Service',
    price: 30.00,
    description: 'Flat fee for off-hours scheduling'
  },
  APPLIANCE_INSTALLATION: {
    name: 'Appliance Installation',
    price: 75.00,
    description: 'Starting price for appliance installation',
    priceRange: 'from $75'
  },
  RENOVATION_CONSULT: {
    name: 'Renovation Consultation',
    price: 99.00,
    description: 'Credited if project proceeds',
    note: 'Credited if project proceeds'
  },
  DEEP_MAINTENANCE: {
    name: 'Deep Maintenance Visit',
    price: 129.00,
    duration: '3 hours',
    description: 'Comprehensive 3-hour maintenance session'
  }
};

// Plan comparison table data
export const PLAN_COMPARISON = {
  features: [
    {
      name: 'Visit Frequency',
      basic: 'Monthly',
      premium: 'Monthly'
    },
    {
      name: 'Time Per Visit',
      basic: '0.5 hours',
      premium: '1 hour'
    },
    {
      name: 'Emergency Callouts',
      basic: 'Standard rate',
      premium: 'Standard rate (priority booking)'
    },
    {
      name: 'Service Scope',
      basic: 'Basic maintenance',
      premium: 'Extended maintenance'
    },
    {
      name: 'Project Discounts',
      basic: 'Upgrade discounts',
      premium: '10% off add-ons'
    },
    {
      name: 'Free Consumables',
      basic: false,
      premium: false
    },
    {
      name: 'Annual Inspection',
      basic: true,
      premium: true
    },
    {
      name: 'Smart Home Setup',
      basic: false,
      premium: false
    }
  ]
};

// Service discounts by plan
export const SERVICE_DISCOUNTS = {
  BASIC: 0,
  PREMIUM: 0.10 // 10%
};

// Visit frequencies by plan (visits per month)
export const VISIT_FREQUENCIES = {
  BASIC: 1, // monthly
  PREMIUM: 1 // monthly
};

// Time allowances by plan (hours per visit)
export const TIME_ALLOWANCES = {
  BASIC: 0.5,
  PREMIUM: 1
};

// Emergency response by plan
export const EMERGENCY_RESPONSE = {
  BASIC: 'standard_rate',
  PREMIUM: 'priority_booking'
};

// Helper functions
export const getPlanById = (planId) => {
  return Object.values(PLANS).find(plan => plan.id === planId);
};

export const getPlanByTier = (tier) => {
  if (!tier) return undefined;
  const upper = tier.toUpperCase();
  // Backward compatibility mapping
  if (upper === 'STARTER') return PLANS.BASIC;
  if (upper === 'HOMECARE') return PLANS.PREMIUM;
  // Priority plan removed
  if (upper === 'PRIORITY') return undefined;
  return PLANS[upper];
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

export const getVisitFrequency = (planTier) => {
  return VISIT_FREQUENCIES[planTier.toUpperCase()] || 0.33;
};

export const getTimeAllowance = (planTier) => {
  return TIME_ALLOWANCES[planTier.toUpperCase()] || 0.5;
};

export const getEmergencyResponse = (planTier) => {
  return EMERGENCY_RESPONSE[planTier.toUpperCase()] || 'standard_rate';
}; 