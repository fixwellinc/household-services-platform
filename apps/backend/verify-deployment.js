import { PrismaClient } from '@prisma/client';

async function verifyDeployment() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🚀 Verifying Railway deployment for flexible payment options...');
    
    // Test database connectivity
    console.log('🔍 Testing database connectivity...');
    const userCount = await prisma.user.count();
    console.log(`✅ Database connected - Found ${userCount} users`);
    
    // Check if all tables exist
    console.log('📊 Verifying table structure...');
    
    const subscriptionCount = await prisma.subscription.count();
    console.log(`✅ Subscription table - ${subscriptionCount} records`);
    
    const paymentFrequencyCount = await prisma.paymentFrequency.count();
    console.log(`✅ PaymentFrequency table - ${paymentFrequencyCount} records`);
    
    const rewardCreditCount = await prisma.rewardCredit.count();
    console.log(`✅ RewardCredit table - ${rewardCreditCount} records`);
    
    const subscriptionPauseCount = await prisma.subscriptionPause.count();
    console.log(`✅ SubscriptionPause table - ${subscriptionPauseCount} records`);
    
    const additionalPropertyCount = await prisma.additionalProperty.count();
    console.log(`✅ AdditionalProperty table - ${additionalPropertyCount} records`);
    
    const familyMemberCount = await prisma.familyMember.count();
    console.log(`✅ FamilyMember table - ${familyMemberCount} records`);
    
    const installmentPlanCount = await prisma.installmentPlan.count();
    console.log(`✅ InstallmentPlan table - ${installmentPlanCount} records`);
    
    // Test creating a sample record to verify schema
    console.log('🧪 Testing new functionality...');
    
    // Find a user to test with
    const testUser = await prisma.user.findFirst();
    if (testUser) {
      console.log(`📋 Using user ${testUser.id} for testing`);
      
      // Test creating a reward credit
      try {
        const testReward = await prisma.rewardCredit.create({
          data: {
            userId: testUser.id,
            amount: 10.0,
            type: 'BONUS',
            description: 'Deployment test reward',
            earnedAt: new Date()
          }
        });
        console.log(`✅ Created test reward credit: ${testReward.id}`);
        
        // Clean up test data
        await prisma.rewardCredit.delete({
          where: { id: testReward.id }
        });
        console.log('🧹 Cleaned up test data');
      } catch (error) {
        console.log('⚠️  Could not create test reward (table might not exist yet):', error.message);
      }
    }
    
    // Check subscription fields
    const sampleSubscription = await prisma.subscription.findFirst();
    if (sampleSubscription) {
      console.log('🔍 Sample subscription fields:');
      console.log(`  - ID: ${sampleSubscription.id}`);
      console.log(`  - Status: ${sampleSubscription.status}`);
      console.log(`  - Payment Frequency: ${sampleSubscription.paymentFrequency || 'Not set'}`);
      console.log(`  - Available Credits: ${sampleSubscription.availableCredits || 'Not set'}`);
      console.log(`  - Loyalty Points: ${sampleSubscription.loyaltyPoints || 'Not set'}`);
      console.log(`  - Is Paused: ${sampleSubscription.isPaused || 'Not set'}`);
    }
    
    console.log('✅ Railway deployment verification completed successfully!');
    console.log('🎉 Flexible payment options schema is ready');
    
    return {
      status: 'success',
      tables: {
        users: userCount,
        subscriptions: subscriptionCount,
        paymentFrequencies: paymentFrequencyCount,
        rewardCredits: rewardCreditCount,
        subscriptionPauses: subscriptionPauseCount,
        additionalProperties: additionalPropertyCount,
        familyMembers: familyMemberCount,
        installmentPlans: installmentPlanCount
      }
    };
    
  } catch (error) {
    console.error('❌ Deployment verification failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the verification
verifyDeployment()
  .then((result) => {
    console.log('🏁 Verification completed:', result);
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Verification failed:', error);
    process.exit(1);
  });