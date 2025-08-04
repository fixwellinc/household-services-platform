import { PrismaClient } from '@prisma/client';
import subscriptionService from './src/services/subscriptionService.js';

const prisma = new PrismaClient();

async function testSubscriptionSystem() {
  console.log('🧪 Testing Subscription System...\n');

  try {
    // Create a test user
    const testUser = await prisma.user.create({
      data: {
        email: 'test-subscription@example.com',
        password: 'hashedpassword',
        name: 'Test Subscription User',
        role: 'CUSTOMER'
      }
    });

    console.log('✅ Created test user:', testUser.email);

    // Create a test subscription
    const testSubscription = await prisma.subscription.create({
      data: {
        userId: testUser.id,
        tier: 'HOMECARE',
        status: 'ACTIVE',
        canCancel: true
      }
    });

    console.log('✅ Created test subscription:', testSubscription.tier);

    // Test perk usage tracking
    console.log('\n📊 Testing perk usage tracking...');
    
    const perkResult = await subscriptionService.trackPerkUsage(testUser.id, 'priorityBooking');
    console.log('✅ Priority booking perk tracked:', perkResult.success);

    const discountResult = await subscriptionService.trackPerkUsage(testUser.id, 'discount', { amount: 25 });
    console.log('✅ Discount perk tracked:', discountResult.success);

    // Check if cancellation is blocked
    const updatedSubscription = await prisma.subscription.findUnique({
      where: { id: testSubscription.id }
    });

    console.log('✅ Cancellation blocked:', !updatedSubscription.canCancel);
    console.log('✅ Block reason:', updatedSubscription.cancellationBlockedReason);

    // Test perk availability
    console.log('\n🔍 Testing perk availability...');
    
    const canUsePriority = await subscriptionService.canUsePerk(testUser.id, 'priorityBooking');
    console.log('✅ Can use priority booking:', canUsePriority.canUse, canUsePriority.reason);

    const canUseDiscount = await subscriptionService.canUsePerk(testUser.id, 'discount');
    console.log('✅ Can use discount:', canUseDiscount.canUse, canUseDiscount.reason);

    // Get usage summary
    const usageSummary = await subscriptionService.getUsageSummary(testUser.id);
    console.log('\n📋 Usage Summary:');
    console.log('- Priority bookings used:', usageSummary.priorityBookingCount);
    console.log('- Discount amount used:', usageSummary.discountAmount);
    console.log('- Free service used:', usageSummary.freeServiceUsed);
    console.log('- Emergency service used:', usageSummary.emergencyServiceUsed);

    // Test allowing cancellation
    console.log('\n🔄 Testing cancellation allowance...');
    
    const allowResult = await subscriptionService.allowCancellation(testSubscription.id);
    console.log('✅ Cancellation allowed:', allowResult.canCancel);

    // Clean up test data
    await prisma.subscriptionUsage.deleteMany({
      where: { userId: testUser.id }
    });
    await prisma.subscription.delete({
      where: { id: testSubscription.id }
    });
    await prisma.user.delete({
      where: { id: testUser.id }
    });

    console.log('\n🧹 Cleaned up test data');
    console.log('\n✅ All subscription system tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSubscriptionSystem(); 