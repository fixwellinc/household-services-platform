// Script to update Railway environment variables with correct Stripe price IDs
// Run this with: node update-railway-vars.js

import { execSync } from 'child_process';

const variables = {
  'STRIPE_STARTER_MONTHLY_PRICE_ID': 'price_1RsbQzJZZWUMDx2PpqdZA4dL',
  'STRIPE_HOMECARE_MONTHLY_PRICE_ID': 'price_1RsbR3JZZWUMDx2Plp2jY5oc', 
  'STRIPE_PRIORITY_MONTHLY_PRICE_ID': 'price_1RsbRAJZZWUMDx2PspPQjVtL'
};

console.log('🚀 Updating Railway environment variables with correct Stripe price IDs...\n');

Object.entries(variables).forEach(([key, value]) => {
  console.log(`📝 Setting ${key} = ${value}`);
  
  try {
    // Try to use Railway CLI if available
    execSync(`railway variables set ${key} ${value}`, { stdio: 'inherit' });
    console.log(`✅ Successfully set ${key}`);
  } catch (error) {
    console.log(`❌ Failed to set ${key} via CLI`);
    console.log(`   Please update manually in Railway dashboard:`);
    console.log(`   ${key} = ${value}`);
  }
  console.log('');
});

console.log('📋 Manual Update Instructions:');
console.log('1. Go to https://railway.app');
console.log('2. Navigate to your project');
console.log('3. Go to Variables tab');
console.log('4. Update these variables:');
console.log('');

Object.entries(variables).forEach(([key, value]) => {
  console.log(`   ${key} = ${value}`);
});

console.log('\n✅ After updating, redeploy with: railway up'); 