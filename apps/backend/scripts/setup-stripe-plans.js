#!/usr/bin/env node

/**
 * Stripe Plans Setup Script
 * 
 * This script creates the necessary Stripe products and prices for the BCAA-style plans.
 * Run this script after setting up your Stripe account and getting your API keys.
 * 
 * Usage:
 * 1. Set your Stripe secret key in the environment
 * 2. Run: node scripts/setup-stripe-plans.js
 */

import Stripe from 'stripe';
import dotenv from 'dotenv';
import { PLANS } from '../src/config/plans.js';

// Load environment variables
dotenv.config({ path: '../.env' });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
});

const plans = [
  {
    name: 'Basic Plan',
    description: 'Essential household services for everyday needs',
    monthlyPrice: 999, // $9.99 in cents
    yearlyPrice: 9999, // $99.99 in cents
    metadata: {
      tier: 'BASIC',
      planId: 'basic'
    }
  },
  {
    name: 'Plus Plan',
    description: 'Enhanced features for busy families',
    monthlyPrice: 1999, // $19.99 in cents
    yearlyPrice: 19999, // $199.99 in cents
    metadata: {
      tier: 'PLUS',
      planId: 'plus'
    }
  },
  {
    name: 'Premier Plan',
    description: 'Ultimate convenience for luxury households',
    monthlyPrice: 2999, // $29.99 in cents
    yearlyPrice: 29999, // $299.99 in cents
    metadata: {
      tier: 'PREMIER',
      planId: 'premier'
    }
  }
];

async function createStripeProducts() {
  console.log('🚀 Setting up Stripe products and prices...\n');

  const createdProducts = [];

  for (const plan of plans) {
    try {
      console.log(`📦 Creating product: ${plan.name}`);
      
      // Create the product
      const product = await stripe.products.create({
        name: plan.name,
        description: plan.description,
        metadata: plan.metadata,
      });

      console.log(`✅ Product created: ${product.id}`);

      // Create monthly price
      const monthlyPrice = await stripe.prices.create({
        product: product.id,
        unit_amount: plan.monthlyPrice,
        currency: 'cad',
        recurring: {
          interval: 'month',
        },
        metadata: {
          ...plan.metadata,
          billingPeriod: 'monthly'
        },
      });

      console.log(`✅ Monthly price created: ${monthlyPrice.id}`);

      // Create yearly price
      const yearlyPrice = await stripe.prices.create({
        product: product.id,
        unit_amount: plan.yearlyPrice,
        currency: 'cad',
        recurring: {
          interval: 'year',
        },
        metadata: {
          ...plan.metadata,
          billingPeriod: 'yearly'
        },
      });

      console.log(`✅ Yearly price created: ${yearlyPrice.id}`);

      createdProducts.push({
        product,
        monthlyPrice,
        yearlyPrice,
        plan
      });

      console.log(`🎉 ${plan.name} setup complete!\n`);
    } catch (error) {
      console.error(`❌ Error creating ${plan.name}:`, error.message);
    }
  }

  return createdProducts;
}

async function generateEnvironmentVariables(products) {
  console.log('🔧 Generating environment variables...\n');

  const envVars = [];
  
  for (const { plan, monthlyPrice, yearlyPrice } of products) {
    const planId = plan.metadata.planId;
    const tier = plan.metadata.tier;
    
    envVars.push(`STRIPE_${tier}_MONTHLY_PRICE_ID="${monthlyPrice.id}"`);
    envVars.push(`STRIPE_${tier}_YEARLY_PRICE_ID="${yearlyPrice.id}"`);
    
    console.log(`${tier} Plan:`);
    console.log(`  Monthly: ${monthlyPrice.id}`);
    console.log(`  Yearly: ${yearlyPrice.id}`);
    console.log('');
  }

  console.log('📝 Add these to your .env file:');
  console.log('='.repeat(50));
  envVars.forEach(variable => console.log(variable));
  console.log('='.repeat(50));

  return envVars;
}

async function listExistingProducts() {
  console.log('🔍 Checking for existing products...\n');

  try {
    const products = await stripe.products.list({ limit: 100 });
    const prices = await stripe.prices.list({ limit: 100 });

    console.log(`Found ${products.data.length} existing products:`);
    products.data.forEach(product => {
      console.log(`  - ${product.name} (${product.id})`);
    });

    console.log(`\nFound ${prices.data.length} existing prices:`);
    prices.data.forEach(price => {
      if (price.recurring) {
        console.log(`  - ${price.id} (${price.recurring.interval}ly - ${price.unit_amount / 100} CAD)`);
      }
    });

    return { products: products.data, prices: prices.data };
  } catch (error) {
    console.error('❌ Error listing existing products:', error.message);
    return { products: [], prices: [] };
  }
}

async function main() {
  try {
    console.log('🎯 Stripe Plans Setup Script');
    console.log('============================\n');

    // Check if Stripe key is set
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'sk_test_your_stripe_secret_key') {
      console.error('❌ Please set your STRIPE_SECRET_KEY in the environment');
      console.error('   Add it to your .env file or set it as an environment variable');
      process.exit(1);
    }

    // List existing products first
    await listExistingProducts();

    console.log('\n' + '='.repeat(50) + '\n');

    // Create new products and prices
    const createdProducts = await createStripeProducts();

    if (createdProducts.length > 0) {
      console.log('🎉 Setup completed successfully!');
      console.log(`Created ${createdProducts.length} products with their respective prices.\n`);
      
      // Generate environment variables
      await generateEnvironmentVariables(createdProducts);
      
      console.log('\n📋 Next steps:');
      console.log('1. Copy the environment variables above to your .env file');
      console.log('2. Update your config/plans.js file with the new price IDs');
      console.log('3. Test the subscription flow in your application');
      console.log('4. Set up webhook endpoints for subscription events');
    } else {
      console.log('⚠️  No products were created. Check the errors above.');
    }

  } catch (error) {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { createStripeProducts, generateEnvironmentVariables }; 