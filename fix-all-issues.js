#!/usr/bin/env node

const { fixDatabaseIssues } = require('./fix-database-issues');
const { fixNextJSBuild } = require('./fix-nextjs-build');
const { fixPerformanceIssues } = require('./fix-performance-issues');

async function fixAllIssues() {
  console.log('🔧 Starting comprehensive fix for all detected issues...\n');

  try {
    // 1. Fix Next.js build issues first (no DB connection needed)
    console.log('1️⃣ Fixing Next.js build configuration...');
    await fixNextJSBuild();
    console.log('');

    // 2. Fix database collation issues
    console.log('2️⃣ Fixing database collation issues...');
    await fixDatabaseIssues();
    console.log('');

    // 3. Optimize performance
    console.log('3️⃣ Optimizing database performance...');
    await fixPerformanceIssues();
    console.log('');

    console.log('🎉 All fixes completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Restart your application');
    console.log('2. Monitor logs for improvements');
    console.log('3. Configure email service (SMTP settings)');
    console.log('4. Consider implementing connection pooling if not already done');

  } catch (error) {
    console.error('❌ Fix process failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  fixAllIssues();
}

module.exports = { fixAllIssues };