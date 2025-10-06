#!/usr/bin/env node

/**
 * Stripe Environment Setup Script
 * 
 * This script helps you set up your Stripe environment variables
 * for testing payments.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 Stripe Environment Setup');
console.log('==========================');
console.log('');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, 'env.example');

if (!fs.existsSync(envPath)) {
  console.log('📄 Creating .env file from env.example...');
  
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ .env file created');
  } else {
    console.log('❌ env.example file not found');
    process.exit(1);
  }
} else {
  console.log('📄 .env file already exists');
}

console.log('');
console.log('🔑 Please set your Stripe keys in the .env file:');
console.log('');
console.log('For TEST mode:');
console.log('  STRIPE_SECRET_KEY="sk_test_your_test_secret_key"');
console.log('  STRIPE_PUBLISHABLE_KEY="pk_test_your_test_publishable_key"');
console.log('');
console.log('For LIVE mode:');
console.log('  STRIPE_SECRET_KEY="sk_live_your_live_secret_key"');
console.log('  STRIPE_PUBLISHABLE_KEY="pk_live_your_live_publishable_key"');
console.log('');
console.log('💡 You can get these keys from your Stripe Dashboard:');
console.log('   https://dashboard.stripe.com/apikeys');
console.log('');
console.log('🧪 After setting your keys, run:');
console.log('   node test-stripe-payments.js');
console.log('');
console.log('📋 To see available test card numbers:');
console.log('   node test-stripe-payments.js --cards');
console.log('');

// Show current .env content
try {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');
  
  console.log('📋 Current .env file content:');
  console.log('============================');
  
  lines.forEach(line => {
    if (line.includes('STRIPE_')) {
      if (line.includes('SECRET_KEY') || line.includes('PUBLISHABLE_KEY')) {
        const [key, value] = line.split('=');
        if (value && !value.includes('your_') && !value.includes('sk_test_your_') && !value.includes('pk_test_your_')) {
          console.log(`${key}=${value.substring(0, 7)}...`);
        } else {
          console.log(`${key}=${value} (needs to be set)`);
        }
      } else {
        console.log(line);
      }
    }
  });
  
} catch (error) {
  console.log('❌ Error reading .env file:', error.message);
}
