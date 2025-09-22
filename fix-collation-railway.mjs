#!/usr/bin/env node

// Fix PostgreSQL collation using Railway environment
console.log('🔧 Fixing PostgreSQL collation version mismatch using Railway...');

const databaseUrl = 'postgresql://postgres:LIroMVRIdUvmShOQezLZKVoLGoLHwNYa@postgres.railway.internal:5432/railway';

// Create a simple SQL script that Railway can execute
const sqlCommands = `
-- Fix collation version mismatch
ALTER DATABASE railway REFRESH COLLATION VERSION;

-- Verify the fix
SELECT 'Collation fix completed successfully' as status;
`;

// Write the SQL to a file
import { writeFileSync } from 'fs';
writeFileSync('railway-collation-fix.sql', sqlCommands);

console.log('📝 Created railway-collation-fix.sql');
console.log('🚀 Attempting to execute via Railway...');

// Try to execute using Railway's environment
import { execSync } from 'child_process';

try {
  // Method 1: Try with Railway's built-in tools
  console.log('Method 1: Trying Railway shell...');
  const result1 = execSync(`railway shell -- 'echo "ALTER DATABASE railway REFRESH COLLATION VERSION;" | psql $DATABASE_URL'`, {
    encoding: 'utf8',
    stdio: 'pipe'
  });
  console.log('✅ Success with Railway shell:', result1);
  
} catch (error1) {
  console.log('⚠️  Railway shell method failed:', error1.message);
  
  try {
    // Method 2: Try with railway run
    console.log('Method 2: Trying Railway run...');
    const result2 = execSync(`railway run -- sh -c 'echo "ALTER DATABASE railway REFRESH COLLATION VERSION;" | psql $DATABASE_URL'`, {
      encoding: 'utf8',
      stdio: 'pipe'
    });
    console.log('✅ Success with Railway run:', result2);
    
  } catch (error2) {
    console.log('⚠️  Railway run method failed:', error2.message);
    
    try {
      // Method 3: Try direct psql if available in Railway environment
      console.log('Method 3: Trying direct database connection...');
      const result3 = execSync(`railway run -- psql "${databaseUrl}" -c "ALTER DATABASE railway REFRESH COLLATION VERSION;"`, {
        encoding: 'utf8',
        stdio: 'pipe'
      });
      console.log('✅ Success with direct connection:', result3);
      
    } catch (error3) {
      console.log('⚠️  Direct connection failed:', error3.message);
      
      // Final fallback: Manual instructions
      console.log('');
      console.log('🔧 All automated methods failed. Manual fix required:');
      console.log('');
      console.log('Option A - Railway Dashboard:');
      console.log('1. Go to https://railway.app/project/90e85fa9-d5ce-4d03-be38-0f3435f62ea4');
      console.log('2. Find your PostgreSQL database service');
      console.log('3. Open the Query tab or Console');
      console.log('4. Run: ALTER DATABASE railway REFRESH COLLATION VERSION;');
      console.log('');
      console.log('Option B - Install PostgreSQL client locally:');
      console.log('1. Download PostgreSQL from https://www.postgresql.org/download/windows/');
      console.log('2. Install only the client tools');
      console.log('3. Run: railway run -- psql $DATABASE_URL -c "ALTER DATABASE railway REFRESH COLLATION VERSION;"');
      console.log('');
      console.log('ℹ️  Remember: These are just warnings, your app works fine without this fix!');
    }
  }
}