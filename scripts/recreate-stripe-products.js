import Stripe from 'stripe';

console.log('🔍 Starting script...');
console.log('🔍 STRIPE_SECRET_KEY exists:', !!process.env.STRIPE_SECRET_KEY);
console.log('🔍 STRIPE_SECRET_KEY starts with sk_test:', process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_'));

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
});

console.log('✅ Stripe initialized successfully');

const plans = {
  STARTER: {
    name: 'Starter Plan',
    description: 'Perfect for light upkeep & peace of mind',
    monthlyPrice: 2199, // $21.99 in cents
    yearlyPrice: 23749, // $237.49 in cents (10% discount)
  },
  HOMECARE: {
    name: 'HomeCare Plan',
    description: 'Monthly help for ongoing maintenance and upkeep',
    monthlyPrice: 5499, // $54.99 in cents
    yearlyPrice: 59389, // $593.89 in cents (10% discount)
  },
  PRIORITY: {
    name: 'Priority Plan',
    description: 'For homeowners who want their home proactively managed',
    monthlyPrice: 12099, // $120.99 in cents
    yearlyPrice: 130669, // $1306.69 in cents (10% discount)
  }
};

async function recreateStripeProducts() {
  console.log('🔄 Recreating Stripe products and prices...\n');

  const results = {};

  for (const [planKey, plan] of Object.entries(plans)) {
    console.log(`📦 Creating product for ${plan.name}...`);
    
    try {
      // Create the product
      const product = await stripe.products.create({
        name: plan.name,
        description: plan.description,
        metadata: {
          plan_tier: planKey,
          type: 'subscription'
        }
      });

      console.log(`✅ Product created: ${product.id}`);

      // Create monthly price
      const monthlyPrice = await stripe.prices.create({
        product: product.id,
        unit_amount: plan.monthlyPrice,
        currency: 'usd',
        recurring: {
          interval: 'month'
        },
        metadata: {
          plan_tier: planKey,
          billing_period: 'monthly'
        }
      });

      console.log(`✅ Monthly price created: ${monthlyPrice.id}`);

      // Create yearly price
      const yearlyPrice = await stripe.prices.create({
        product: product.id,
        unit_amount: plan.yearlyPrice,
        currency: 'usd',
        recurring: {
          interval: 'year'
        },
        metadata: {
          plan_tier: planKey,
          billing_period: 'yearly'
        }
      });

      console.log(`✅ Yearly price created: ${yearlyPrice.id}`);

      results[planKey] = {
        productId: product.id,
        monthlyPriceId: monthlyPrice.id,
        yearlyPriceId: yearlyPrice.id
      };

      console.log(`\n📋 ${plan.name} Summary:`);
      console.log(`   Product ID: ${product.id}`);
      console.log(`   Monthly Price ID: ${monthlyPrice.id}`);
      console.log(`   Yearly Price ID: ${yearlyPrice.id}`);
      console.log('');

    } catch (error) {
      console.error(`❌ Error creating ${plan.name}:`, error.message);
    }
  }

  console.log('🎉 Stripe products and prices recreation complete!\n');
  console.log('📝 Environment variables to update:');
  console.log('=====================================');
  
  for (const [planKey, result] of Object.entries(results)) {
    const envVarPrefix = planKey === 'STARTER' ? 'STRIPE_STARTER' : 
                        planKey === 'HOMECARE' ? 'STRIPE_HOMECARE' : 
                        'STRIPE_PRIORITY';
    
    console.log(`${envVarPrefix}_MONTHLY_PRICE_ID=${result.monthlyPriceId}`);
    console.log(`${envVarPrefix}_YEARLY_PRICE_ID=${result.yearlyPriceId}`);
  }

  console.log('\n💡 Copy these environment variables to your Railway dashboard or .env file');
  
  return results;
}

// Always run the script
console.log('🚀 Running Stripe product creation...');

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY environment variable is required');
  process.exit(1);
}

recreateStripeProducts()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

export { recreateStripeProducts }; 