#!/usr/bin/env node

/**
 * Railway Stripe Test Script
 * 
 * This script tests Stripe payments on Railway using the environment variables
 * that are already configured there.
 */

import Stripe from 'stripe';

console.log('🚀 Railway Stripe Payment Tester');
console.log('=================================');
console.log('');

// Test card numbers that work in both test and live mode
const TEST_CARDS = {
  visa: '4242424242424242',
  visaDebit: '4000056655665556',
  mastercard: '5555555555554444',
  amex: '378282246310005',
  discover: '6011111111111117',
  declined: '4000000000000002',
  insufficientFunds: '4000000000009995',
  expiredCard: '4000000000000069',
  incorrectCvc: '4000000000000127',
  requiresAuthentication: '4000002500003155',
  processingError: '4000000000000119',
};

const TEST_CUSTOMER = {
  email: 'test@jjglass.ca',
  name: 'Test Customer',
  phone: '+1234567890',
};

class RailwayStripeTester {
  constructor() {
    this.stripe = null;
    this.isLiveMode = false;
    this.testResults = [];
  }

  async initialize() {
    console.log('🔍 Checking Stripe configuration...');
    
    // Check if Stripe keys are configured
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('❌ STRIPE_SECRET_KEY environment variable is required');
    }
    
    if (!process.env.STRIPE_PUBLISHABLE_KEY) {
      throw new Error('❌ STRIPE_PUBLISHABLE_KEY environment variable is required');
    }

    // Initialize Stripe
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-12-18.acacia',
    });

    // Determine if we're in live mode
    this.isLiveMode = process.env.STRIPE_SECRET_KEY.startsWith('sk_live_');
    
    console.log(`📊 Stripe Mode: ${this.isLiveMode ? '🔴 LIVE' : '🟡 TEST'}`);
    console.log(`🔑 Secret Key: ${process.env.STRIPE_SECRET_KEY.substring(0, 7)}...`);
    console.log(`🔑 Publishable Key: ${process.env.STRIPE_PUBLISHABLE_KEY.substring(0, 7)}...`);
    console.log('');
  }

  async testPaymentIntent() {
    console.log('💳 Testing Payment Intent Creation...');
    
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: 2000, // $20.00
        currency: 'usd',
        metadata: {
          test: 'true',
          customer_email: TEST_CUSTOMER.email,
        },
      });

      console.log(`✅ Payment Intent created: ${paymentIntent.id}`);
      console.log(`   Status: ${paymentIntent.status}`);
      console.log(`   Amount: $${paymentIntent.amount / 100}`);
      console.log(`   Client Secret: ${paymentIntent.client_secret.substring(0, 20)}...`);
      
      this.testResults.push({
        test: 'Payment Intent Creation',
        status: 'PASS',
        details: paymentIntent.id,
      });

      return paymentIntent;
    } catch (error) {
      console.log(`❌ Payment Intent creation failed: ${error.message}`);
      this.testResults.push({
        test: 'Payment Intent Creation',
        status: 'FAIL',
        details: error.message,
      });
      throw error;
    }
  }

  async testCustomerCreation() {
    console.log('👤 Testing Customer Creation...');
    
    try {
      const customer = await this.stripe.customers.create({
        email: TEST_CUSTOMER.email,
        name: TEST_CUSTOMER.name,
        phone: TEST_CUSTOMER.phone,
        metadata: {
          test: 'true',
        },
      });

      console.log(`✅ Customer created: ${customer.id}`);
      console.log(`   Email: ${customer.email}`);
      console.log(`   Name: ${customer.name}`);
      
      this.testResults.push({
        test: 'Customer Creation',
        status: 'PASS',
        details: customer.id,
      });

      return customer;
    } catch (error) {
      console.log(`❌ Customer creation failed: ${error.message}`);
      this.testResults.push({
        test: 'Customer Creation',
        status: 'FAIL',
        details: error.message,
      });
      throw error;
    }
  }

  async testPaymentMethodCreation(customerId) {
    console.log('💳 Testing Payment Method Creation...');
    
    try {
      const paymentMethod = await this.stripe.paymentMethods.create({
        type: 'card',
        card: {
          number: TEST_CARDS.visa,
          exp_month: 12,
          exp_year: 2025,
          cvc: '123',
        },
      });

      // Attach to customer
      await this.stripe.paymentMethods.attach(paymentMethod.id, {
        customer: customerId,
      });

      console.log(`✅ Payment Method created and attached: ${paymentMethod.id}`);
      console.log(`   Card: **** **** **** ${paymentMethod.card.last4}`);
      console.log(`   Brand: ${paymentMethod.card.brand}`);
      
      this.testResults.push({
        test: 'Payment Method Creation',
        status: 'PASS',
        details: paymentMethod.id,
      });

      return paymentMethod;
    } catch (error) {
      console.log(`❌ Payment Method creation failed: ${error.message}`);
      this.testResults.push({
        test: 'Payment Method Creation',
        status: 'FAIL',
        details: error.message,
      });
      throw error;
    }
  }

  async testSuccessfulPayment(customerId, paymentMethodId) {
    console.log('💰 Testing Successful Payment...');
    
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: 2000, // $20.00
        currency: 'usd',
        customer: customerId,
        payment_method: paymentMethodId,
        confirmation_method: 'manual',
        confirm: true,
        metadata: {
          test: 'successful_payment',
        },
      });

      console.log(`✅ Payment successful: ${paymentIntent.id}`);
      console.log(`   Status: ${paymentIntent.status}`);
      console.log(`   Amount: $${paymentIntent.amount / 100}`);
      
      this.testResults.push({
        test: 'Successful Payment',
        status: 'PASS',
        details: paymentIntent.id,
      });

      return paymentIntent;
    } catch (error) {
      console.log(`❌ Payment failed: ${error.message}`);
      this.testResults.push({
        test: 'Successful Payment',
        status: 'FAIL',
        details: error.message,
      });
      throw error;
    }
  }

  async testDeclinedPayment(customerId) {
    console.log('❌ Testing Declined Payment...');
    
    try {
      const paymentMethod = await this.stripe.paymentMethods.create({
        type: 'card',
        card: {
          number: TEST_CARDS.declined,
          exp_month: 12,
          exp_year: 2025,
          cvc: '123',
        },
      });

      await this.stripe.paymentMethods.attach(paymentMethod.id, {
        customer: customerId,
      });

      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: 2000,
        currency: 'usd',
        customer: customerId,
        payment_method: paymentMethod.id,
        confirmation_method: 'manual',
        confirm: true,
        metadata: {
          test: 'declined_payment',
        },
      });

      // This should fail
      console.log(`❌ Payment should have been declined but wasn't: ${paymentIntent.id}`);
      this.testResults.push({
        test: 'Declined Payment',
        status: 'FAIL',
        details: 'Payment was not declined as expected',
      });

    } catch (error) {
      if (error.code === 'card_declined') {
        console.log(`✅ Payment correctly declined: ${error.message}`);
        this.testResults.push({
          test: 'Declined Payment',
          status: 'PASS',
          details: error.message,
        });
      } else {
        console.log(`❌ Unexpected error: ${error.message}`);
        this.testResults.push({
          test: 'Declined Payment',
          status: 'FAIL',
          details: error.message,
        });
      }
    }
  }

  async runAllTests() {
    console.log('🧪 Running Complete Stripe Test Suite...\n');
    
    let customer = null;
    let paymentMethod = null;

    try {
      // Test 1: Payment Intent Creation
      await this.testPaymentIntent();
      console.log('');

      // Test 2: Customer Creation
      customer = await this.testCustomerCreation();
      console.log('');

      // Test 3: Payment Method Creation
      paymentMethod = await this.testPaymentMethodCreation(customer.id);
      console.log('');

      // Test 4: Successful Payment
      await this.testSuccessfulPayment(customer.id, paymentMethod.id);
      console.log('');

      // Test 5: Declined Payment
      await this.testDeclinedPayment(customer.id);
      console.log('');

    } catch (error) {
      console.log(`❌ Test suite failed: ${error.message}`);
    }

    // Cleanup
    await this.cleanup(customer, paymentMethod);
    
    // Print results
    this.printResults();
  }

  async cleanup(customer, paymentMethod) {
    console.log('🧹 Cleaning up test data...');
    
    try {
      if (paymentMethod) {
        await this.stripe.paymentMethods.detach(paymentMethod.id);
        console.log(`✅ Payment method ${paymentMethod.id} detached`);
      }
      
      if (customer) {
        await this.stripe.customers.del(customer.id);
        console.log(`✅ Customer ${customer.id} deleted`);
      }
      
      console.log('✅ Cleanup completed');
    } catch (error) {
      console.log(`⚠️  Cleanup warning: ${error.message}`);
    }
    
    console.log('');
  }

  printResults() {
    console.log('📊 Test Results Summary:');
    console.log('========================');
    
    const passed = this.testResults.filter(r => r.status === 'PASS').length;
    const failed = this.testResults.filter(r => r.status === 'FAIL').length;
    
    this.testResults.forEach(result => {
      const icon = result.status === 'PASS' ? '✅' : '❌';
      console.log(`${icon} ${result.test}: ${result.status}`);
      if (result.details) {
        console.log(`   Details: ${result.details}`);
      }
    });
    
    console.log('');
    console.log(`📈 Total Tests: ${this.testResults.length}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📊 Success Rate: ${((passed / this.testResults.length) * 100).toFixed(1)}%`);
    
    if (failed === 0) {
      console.log('\n🎉 All tests passed! Your Stripe integration is working correctly.');
      console.log('💡 You can now use test card numbers in your live environment!');
    } else {
      console.log('\n⚠️  Some tests failed. Please check the error messages above.');
    }
  }

  printTestCards() {
    console.log('💳 Available Test Card Numbers:');
    console.log('================================');
    console.log('');
    
    Object.entries(TEST_CARDS).forEach(([name, number]) => {
      console.log(`${name.padEnd(20)}: ${number}`);
    });
    
    console.log('');
    console.log('📝 Usage Notes:');
    console.log('- These cards work in both test and live mode');
    console.log('- Use any future expiry date (e.g., 12/2025)');
    console.log('- Use any 3-digit CVC');
    console.log('- Declined cards will return appropriate error messages');
    console.log('');
  }
}

// Main execution
async function main() {
  const tester = new RailwayStripeTester();
  
  try {
    await tester.initialize();
    
    // Check command line arguments
    const args = process.argv.slice(2);
    
    if (args.includes('--cards')) {
      tester.printTestCards();
      return;
    }
    
    if (args.includes('--help')) {
      console.log('Railway Stripe Payment Tester');
      console.log('=============================');
      console.log('');
      console.log('Usage:');
      console.log('  node railway-stripe-test.js          # Run all tests');
      console.log('  node railway-stripe-test.js --cards  # Show test card numbers');
      console.log('  node railway-stripe-test.js --help   # Show this help');
      console.log('');
      console.log('Environment Variables (set on Railway):');
      console.log('  STRIPE_SECRET_KEY       - Required');
      console.log('  STRIPE_PUBLISHABLE_KEY  - Required');
      console.log('');
      return;
    }
    
    await tester.runAllTests();
    
  } catch (error) {
    console.error('❌ Test suite initialization failed:', error.message);
    console.log('');
    console.log('💡 Make sure your Stripe keys are set in Railway environment variables');
    console.log('💡 You can also run: node railway-stripe-test.js --cards');
    console.log('   to see available test card numbers.');
    process.exit(1);
  }
}

// Run the tests
main().catch(console.error);
