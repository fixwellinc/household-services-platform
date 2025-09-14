import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runProductionMigration() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🚀 Starting production migration for flexible payment options...');
    
    // Read the production migration SQL file
    const sqlPath = path.join(__dirname, 'prisma', 'migrations', 'production_deployment.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Split SQL into individual statements (handle transactions properly)
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && stmt !== 'BEGIN' && stmt !== 'COMMIT');
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
          await prisma.$executeRawUnsafe(statement);
        } catch (error) {
          // Some statements might already exist (like indexes), so we'll log but continue
          if (error.message.includes('already exists') || error.message.includes('duplicate')) {
            console.log(`⚠️  Statement ${i + 1} already exists, skipping: ${error.message.split('\n')[0]}`);
          } else {
            console.error(`❌ Error in statement ${i + 1}:`, error.message);
            throw error;
          }
        }
      }
    }
    
    // Verify the migration by checking some key tables
    console.log('🔍 Verifying migration results...');
    
    const subscriptionCount = await prisma.subscription.count();
    const paymentFrequencyCount = await prisma.paymentFrequency.count();
    const rewardCreditCount = await prisma.rewardCredit.count();
    
    console.log('📊 Migration verification:');
    console.log(`  - Subscriptions: ${subscriptionCount}`);
    console.log(`  - Payment Frequencies: ${paymentFrequencyCount}`);
    console.log(`  - Reward Credits: ${rewardCreditCount}`);
    
    console.log('✅ Production migration completed successfully!');
    console.log('🎉 Flexible payment options are now ready for production use');
    
  } catch (error) {
    console.error('❌ Production migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
runProductionMigration()
  .then(() => {
    console.log('🏁 Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration script failed:', error);
    process.exit(1);
  });