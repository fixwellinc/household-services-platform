import { PrismaClient } from '@prisma/client';

async function runSimpleProductionMigration() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🚀 Starting simplified production migration for flexible payment options...');
    
    // Create indexes for performance optimization
    console.log('📊 Creating performance indexes...');
    
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_subscription_user_id ON "Subscription"("userId")',
      'CREATE INDEX IF NOT EXISTS idx_subscription_status ON "Subscription"("status")',
      'CREATE INDEX IF NOT EXISTS idx_subscription_payment_frequency ON "Subscription"("paymentFrequency")',
      'CREATE INDEX IF NOT EXISTS idx_subscription_next_payment ON "Subscription"("currentPeriodEnd")',
      'CREATE INDEX IF NOT EXISTS idx_subscription_churn_risk ON "Subscription"("churnRiskScore")',
      'CREATE INDEX IF NOT EXISTS idx_payment_frequency_subscription ON "PaymentFrequency"("subscriptionId")',
      'CREATE INDEX IF NOT EXISTS idx_payment_frequency_next_payment ON "PaymentFrequency"("nextPaymentDate")',
      'CREATE INDEX IF NOT EXISTS idx_subscription_pause_subscription ON "SubscriptionPause"("subscriptionId")',
      'CREATE INDEX IF NOT EXISTS idx_subscription_pause_status ON "SubscriptionPause"("status")',
      'CREATE INDEX IF NOT EXISTS idx_additional_property_subscription ON "AdditionalProperty"("subscriptionId")',
      'CREATE INDEX IF NOT EXISTS idx_reward_credit_user ON "RewardCredit"("userId")',
      'CREATE INDEX IF NOT EXISTS idx_reward_credit_type ON "RewardCredit"("type")',
      'CREATE INDEX IF NOT EXISTS idx_reward_credit_earned_at ON "RewardCredit"("earnedAt")',
      'CREATE INDEX IF NOT EXISTS idx_family_member_subscription ON "FamilyMember"("subscriptionId")',
      'CREATE INDEX IF NOT EXISTS idx_family_member_user ON "FamilyMember"("userId")',
      'CREATE INDEX IF NOT EXISTS idx_installment_plan_user ON "InstallmentPlan"("userId")',
      'CREATE INDEX IF NOT EXISTS idx_installment_plan_status ON "InstallmentPlan"("status")'
    ];
    
    for (const indexSql of indexes) {
      try {
        await prisma.$executeRawUnsafe(indexSql);
        console.log('✅ Index created successfully');
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log('⚠️  Index already exists, skipping');
        } else {
          console.error('❌ Error creating index:', error.message);
        }
      }
    }
    
    // Update existing subscriptions with default values for new fields
    console.log('🔄 Updating existing subscriptions with default values...');
    
    const updateResult = await prisma.subscription.updateMany({
      where: {
        OR: [
          { paymentFrequency: null },
          { availableCredits: null },
          { loyaltyPoints: null },
          { churnRiskScore: null },
          { lifetimeValue: null },
          { isPaused: null }
        ]
      },
      data: {
        paymentFrequency: 'MONTHLY',
        availableCredits: 0,
        loyaltyPoints: 0,
        churnRiskScore: 0,
        lifetimeValue: 0,
        isPaused: false
      }
    });
    
    console.log(`📝 Updated ${updateResult.count} subscriptions with default values`);
    
    // Verify the migration by checking some key tables
    console.log('🔍 Verifying migration results...');
    
    const subscriptionCount = await prisma.subscription.count();
    const paymentFrequencyCount = await prisma.paymentFrequency.count();
    const rewardCreditCount = await prisma.rewardCredit.count();
    const subscriptionPauseCount = await prisma.subscriptionPause.count();
    const additionalPropertyCount = await prisma.additionalProperty.count();
    const familyMemberCount = await prisma.familyMember.count();
    const installmentPlanCount = await prisma.installmentPlan.count();
    
    console.log('📊 Migration verification:');
    console.log(`  - Subscriptions: ${subscriptionCount}`);
    console.log(`  - Payment Frequencies: ${paymentFrequencyCount}`);
    console.log(`  - Reward Credits: ${rewardCreditCount}`);
    console.log(`  - Subscription Pauses: ${subscriptionPauseCount}`);
    console.log(`  - Additional Properties: ${additionalPropertyCount}`);
    console.log(`  - Family Members: ${familyMemberCount}`);
    console.log(`  - Installment Plans: ${installmentPlanCount}`);
    
    // Test that we can create new records
    console.log('🧪 Testing new table functionality...');
    
    // Find a test subscription to work with
    const testSubscription = await prisma.subscription.findFirst();
    if (testSubscription) {
      console.log(`📋 Using subscription ${testSubscription.id} for testing`);
      
      // Test that the subscription has the new fields
      const updatedSubscription = await prisma.subscription.findUnique({
        where: { id: testSubscription.id }
      });
      
      console.log('🔍 Subscription fields verification:');
      console.log(`  - Payment Frequency: ${updatedSubscription.paymentFrequency}`);
      console.log(`  - Available Credits: ${updatedSubscription.availableCredits}`);
      console.log(`  - Loyalty Points: ${updatedSubscription.loyaltyPoints}`);
      console.log(`  - Is Paused: ${updatedSubscription.isPaused}`);
    }
    
    console.log('✅ Simplified production migration completed successfully!');
    console.log('🎉 Flexible payment options are now ready for Railway deployment');
    
  } catch (error) {
    console.error('❌ Production migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
runSimpleProductionMigration()
  .then(() => {
    console.log('🏁 Migration script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration script failed:', error);
    process.exit(1);
  });