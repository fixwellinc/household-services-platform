// Fixwell Subscription Services by Tier Configuration
// This file contains the plan structure and Stripe price IDs
// Updated with 10% yearly discount - July 2025

export const PLANS = {
  STARTER: {
    id: 'starter',
    name: 'Starter Plan',
    description: 'Perfect for light upkeep & peace of mind',
    monthlyPrice: 21.99,
    yearlyPrice: 237.49, // 10% discount ($21.99 x 12 months x 0.9)
    originalPrice: 49.00,
    stripePriceIds: {
      monthly: process.env.STRIPE_STARTER_MONTHLY_PRICE_ID || 'price_1S0WSNJZZWUMDx2PI1LEa5rs',
      yearly: process.env.STRIPE_STARTER_YEARLY_PRICE_ID || 'price_1S0WSTJZZWUMDx2P2k749Zyc'
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
  
  HOMECARE: {
    id: 'homecare',
    name: 'HomeCare Plan',
    description: 'Monthly help for ongoing maintenance and upkeep',
    monthlyPrice: 54.99,
    yearlyPrice: 593.89, // 10% discount ($54.99 x 12 months x 0.9)
    originalPrice: 79.00,
    stripePriceIds: {
      monthly: process.env.STRIPE_HOMECARE_MONTHLY_PRICE_ID || 'price_1S0WRtJZZWUMDx2PsO8c62ar',
      yearly: process.env.STRIPE_HOMECARE_YEARLY_PRICE_ID || 'price_1S0WRyJZZWUMDx2PJP4ZWw6Q'
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
  },
  
  PRIORITY: {
    id: 'priority',
    name: 'Priority Plan',
    description: 'For homeowners who want their home proactively managed',
    monthlyPrice: 120.99,
    yearlyPrice: 1306.69, // 10% discount ($120.99 x 12 months x 0.9)
    originalPrice: 199.00,
    stripePriceIds: {
      monthly: process.env.STRIPE_PRIORITY_MONTHLY_PRICE_ID || 'price_1S0WS4JZZWUMDx2PrxSwIetN',
      yearly: process.env.STRIPE_PRIORITY_YEARLY_PRICE_ID || 'price_1S0WSBJZZWUMDx2PQkcSZNba'
    },
    features: [
      '2 visits per month (up to 2 hours total)',
      'All services from Starter + HomeCare Plans',
      'Same-week emergency callout (1 per quarter)',
      'Full-home "fix-it list" checkup every visit',
      'Smart home device setup (doorbells, cameras, thermostats)',
      'TV mounting, shelf and curtain installations',
      'Basic furniture assembly',
      'Window screen replacement/repair',
      'Interior door planing or sticking fixes',
      'Paint touch-ups (up to 1 wall/surface per visit)',
      'Light fixture replacement/upgrade',
      'Tile regrouting (small areas)',
      '10% off larger renovations or handyman jobs',
      'Free consumables: caulk, screws, anchors, silicone',
      'Early access to Fixwell promos and partner perks'
    ],
    savings: 'Complete home management',
    color: 'amber',
    icon: 'sparkles',
    visitFrequency: 'Bi-weekly',
    timePerVisit: '2 hours total',
    visitsPerMonth: 2
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
      starter: 'Monthly',
      homecare: 'Monthly',
      priority: 'Bi-weekly'
    },
    {
      name: 'Time Per Visit',
      starter: '0.5 hours',
      homecare: '1 hour',
      priority: '2 hours total'
    },
    {
      name: 'Emergency Callouts',
      starter: 'Standard rate',
      homecare: 'Standard rate (priority booking)',
      priority: 'Same-week (1 per quarter)'
    },
    {
      name: 'Service Scope',
      starter: 'Basic maintenance',
      homecare: 'Extended maintenance',
      priority: 'Full home management'
    },
    {
      name: 'Project Discounts',
      starter: 'Upgrade discounts',
      homecare: '10% off add-ons',
      priority: '10% off renovations'
    },
    {
      name: 'Free Consumables',
      starter: false,
      homecare: false,
      priority: true
    },
    {
      name: 'Annual Inspection',
      starter: true,
      homecare: true,
      priority: true
    },
    {
      name: 'Smart Home Setup',
      starter: false,
      homecare: false,
      priority: true
    }
  ]
};

// Service discounts by plan
export const SERVICE_DISCOUNTS = {
  STARTER: 0,
  HOMECARE: 0.10, // 10%
  PRIORITY: 0.10 // 10%
};

// Visit frequencies by plan (visits per month)
export const VISIT_FREQUENCIES = {
  STARTER: 1, // monthly
  HOMECARE: 1, // monthly
  PRIORITY: 2 // bi-weekly
};

// Time allowances by plan (hours per visit)
export const TIME_ALLOWANCES = {
  STARTER: 0.5,
  HOMECARE: 1,
  PRIORITY: 2
};

// Emergency response by plan
export const EMERGENCY_RESPONSE = {
  STARTER: 'standard_rate',
  HOMECARE: 'priority_booking',
  PRIORITY: 'same_week_quarterly'
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

export const getVisitFrequency = (planTier) => {
  return VISIT_FREQUENCIES[planTier.toUpperCase()] || 0.33;
};

export const getTimeAllowance = (planTier) => {
  return TIME_ALLOWANCES[planTier.toUpperCase()] || 0.5;
};

export const getEmergencyResponse = (planTier) => {
  return EMERGENCY_RESPONSE[planTier.toUpperCase()] || 'standard_rate';
}; 