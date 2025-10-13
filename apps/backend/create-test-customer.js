#!/usr/bin/env node

/**
 * Create Test Customer with Subscription
 * Creates a test customer account with an active subscription for testing the customer dashboard
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createTestCustomer() {
  try {
    console.log('🔧 Creating test customer with subscription...');
    
    const password = 'test1234';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create or update test customer
    const customer = await prisma.user.upsert({
      where: { email: 'testcustomer@jjglass.ca' },
      update: {
        password: hashedPassword,
        name: 'Test Customer',
        role: 'CUSTOMER',
      },
      create: {
        email: 'testcustomer@jjglass.ca',
        password: hashedPassword,
        name: 'Test Customer',
        role: 'CUSTOMER',
      },
    });
    
    console.log('✅ Test customer created/updated:', customer.email);
    
    // Create or update subscription for the customer
    const subscription = await prisma.subscription.upsert({
      where: { userId: customer.id },
      update: {
        tier: 'HOMECARE',
        status: 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        paymentFrequency: 'MONTHLY',
        nextPaymentAmount: 49.99,
        canCancel: true,
      },
      create: {
        userId: customer.id,
        tier: 'HOMECARE',
        status: 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        paymentFrequency: 'MONTHLY',
        nextPaymentAmount: 49.99,
        canCancel: true,
      },
    });
    
    console.log('✅ Subscription created/updated:', subscription.tier, subscription.status);
    
    // Update user with subscription reference
    await prisma.user.update({
      where: { id: customer.id },
      data: { subscriptionId: subscription.id },
    });
    
    console.log('✅ User updated with subscription reference');
    
    console.log('\n🎉 Test customer setup complete!');
    console.log('📧 Email: testcustomer@jjglass.ca');
    console.log('🔑 Password: test1234');
    console.log('📋 Subscription: HOMECARE (Active)');
    console.log('💰 Next Payment: $49.99 (Monthly)');
    console.log('📅 Period End:', subscription.currentPeriodEnd.toLocaleDateString());
    
  } catch (error) {
    console.error('❌ Error creating test customer:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createTestCustomer();
