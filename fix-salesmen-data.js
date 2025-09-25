// Direct database fix for salesmen data
// Run this with: node fix-salesmen-data.js

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixSalesmenData() {
  try {
    console.log('🔧 Starting direct database fix for salesmen data...');

    // Get all users with SALESMAN role
    const salesmanUsers = await prisma.user.findMany({
      where: { role: 'SALESMAN' },
      include: { salesmanProfile: true }
    });

    console.log(`Found ${salesmanUsers.length} users with SALESMAN role:`);
    salesmanUsers.forEach(user => {
      console.log(`  - ${user.email} (${user.name || 'No name'}) - Profile exists: ${!!user.salesmanProfile}`);
    });

    // Get all existing salesman profiles
    const allProfiles = await prisma.salesmanProfile.findMany({
      include: { user: true }
    });

    console.log(`Found ${allProfiles.length} salesman profiles:`);
    allProfiles.forEach(profile => {
      console.log(`  - Profile ID: ${profile.id}, Display: ${profile.displayName}, User: ${profile.user?.email}`);
    });

    // Fix each profile
    let fixedCount = 0;
    for (const profile of allProfiles) {
      if (profile.user) {
        const user = profile.user;
        const newDisplayName = user.name || user.email.split('@')[0];

        console.log(`🔧 Fixing profile for ${user.email}:`);
        console.log(`  - Old display name: ${profile.displayName}`);
        console.log(`  - New display name: ${newDisplayName}`);
        console.log(`  - Status: ${profile.status || 'WILL SET TO ACTIVE'}`);

        await prisma.salesmanProfile.update({
          where: { id: profile.id },
          data: {
            displayName: newDisplayName,
            status: profile.status || 'ACTIVE',
            personalMessage: profile.personalMessage || `Welcome ${newDisplayName}! Start referring customers today.`,
            monthlyTarget: profile.monthlyTarget || 10,
            quarterlyTarget: profile.quarterlyTarget || 30,
            yearlyTarget: profile.yearlyTarget || 100
          }
        });

        console.log(`✅ Updated profile for ${user.email} -> ${newDisplayName}`);
        fixedCount++;
      }
    }

    // Create missing profiles for users without them
    let createdCount = 0;
    for (const user of salesmanUsers) {
      if (!user.salesmanProfile) {
        console.log(`🆕 Creating missing profile for ${user.email}`);

        // Generate a simple referral code
        const referralCode = `REF${user.id.slice(-4).toUpperCase()}${Math.random().toString(36).substring(2, 4).toUpperCase()}`;
        const displayName = user.name || user.email.split('@')[0];

        await prisma.salesmanProfile.create({
          data: {
            userId: user.id,
            referralCode,
            displayName,
            personalMessage: `Welcome ${displayName}! Start referring customers today.`,
            commissionRate: 5.0,
            commissionType: 'PERCENTAGE',
            commissionTier: 'BRONZE',
            status: 'ACTIVE',
            territoryPostalCodes: [],
            territoryRegions: [],
            monthlyTarget: 10,
            quarterlyTarget: 30,
            yearlyTarget: 100
          }
        });

        console.log(`✅ Created profile for ${user.email} with referral code ${referralCode}`);
        createdCount++;
      }
    }

    console.log(`\n🎉 Fix completed!`);
    console.log(`  - Fixed ${fixedCount} existing profiles`);
    console.log(`  - Created ${createdCount} missing profiles`);

    // Show final results
    const finalProfiles = await prisma.salesmanProfile.findMany({
      include: { user: true }
    });

    console.log(`\n📊 Final salesman profiles:`);
    finalProfiles.forEach(profile => {
      console.log(`  - ${profile.displayName} (${profile.user.email}) - Status: ${profile.status} - Code: ${profile.referralCode}`);
    });

  } catch (error) {
    console.error('❌ Error fixing salesmen data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixSalesmenData();