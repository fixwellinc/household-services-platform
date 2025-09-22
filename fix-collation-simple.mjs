// Simple script to fix PostgreSQL collation version mismatch
import { execSync } from 'child_process';
import { writeFileSync } from 'fs';

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
  
  const migrationSQL = `-- Migration to fix collation version mismatch
-- Run this manually in your Railway database console

ALTER DATABASE railway REFRESH COLLATION VERSION;

-- Verify the fix
SELECT datname, datcollate, datctype FROM pg_database WHERE datname = 'railway';

-- Optional: Check for any objects that might need rebuilding
SELECT schemaname, tablename, attname, atttypid::regtype
FROM pg_attribute 
JOIN pg_class ON pg_attribute.attrelid = pg_class.oid 
JOIN pg_namespace ON pg_class.relnamespace = pg_namespace.oid 
WHERE atttypid IN (SELECT oid FROM pg_type WHERE typcollation != 0)
AND schemaname NOT IN ('information_schema', 'pg_catalog');
`;

  writeFileSync('collation-fix-migration.sql', migrationSQL);
  
  console.log('📝 Created collation-fix-migration.sql');
  console.log('');
  console.log('🔧 Manual fix options:');
  console.log('1. Railway Dashboard Method:');
  console.log('   - Go to Railway dashboard > Your Project > Database');
  console.log('   - Open Query/Console tab');
  console.log('   - Run: ALTER DATABASE railway REFRESH COLLATION VERSION;');
  console.log('');
  console.log('2. Railway CLI Method (if psql is installed):');
  console.log('   - Install PostgreSQL client tools');
  console.log('   - Run: railway run -- psql $DATABASE_URL -f collation-fix-migration.sql');
  console.log('');
  console.log('ℹ️  Important: These are just warnings, not errors');
  console.log('ℹ️  Your application works fine with these warnings');
  console.log('ℹ️  Fix is optional for cleaner logs');
}