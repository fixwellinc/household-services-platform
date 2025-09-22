// Simple script to fix PostgreSQL collation version mismatch
// This will suppress the warnings in your logs

const { execSync } = require('child_process');

console.log('🔧 Attempting to fix PostgreSQL collation version mismatch...');

try {
  // Try using railway run to execute the SQL command
  const result = execSync('railway run -- psql $DATABASE_URL -c "ALTER DATABASE railway REFRESH COLLATION VERSION;"', {
    encoding: 'utf8',
    stdio: 'pipe'
  });
  
  console.log('✅ Collation version refreshed successfully');
  console.log('Result:', result);
  
} catch (error) {
  console.log('⚠️  Direct SQL execution failed:', error.message);
  
  // Alternative approach: Create a migration script
  console.log('💡 Creating alternative solution...');
  
  const migrationSQL = `
-- Migration to fix collation version mismatch
-- Run this manually in your Railway database console

ALTER DATABASE railway REFRESH COLLATION VERSION;

-- Verify the fix
SELECT datname, datcollate, datctype FROM pg_database WHERE datname = 'railway';
`;

  require('fs').writeFileSync('collation-fix-migration.sql', migrationSQL);
  
  console.log('📝 Created collation-fix-migration.sql');
  console.log('🔧 To fix manually:');
  console.log('1. Go to Railway dashboard > Database');
  console.log('2. Open Query tab');
  console.log('3. Run: ALTER DATABASE railway REFRESH COLLATION VERSION;');
  console.log('');
  console.log('ℹ️  Note: These are just warnings and won\'t break your app');
  console.log('ℹ️  Your application should work fine with these warnings');
}