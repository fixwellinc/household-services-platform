#!/usr/bin/env node

const { Pool } = require('pg');

async function fixPerformanceIssues() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🚀 Optimizing database performance...');

    // Add indexes for common queries
    const indexes = [
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_date ON appointments(date);',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_user_id ON appointments(user_id);',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_status ON appointments(status);',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users(email);',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_availability_date ON availability(date);'
    ];

    for (const indexQuery of indexes) {
      try {
        await pool.query(indexQuery);
        console.log('✅ Created index:', indexQuery.split(' ')[5]);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log('ℹ️  Index already exists:', indexQuery.split(' ')[5]);
        } else {
          console.log('⚠️  Failed to create index:', error.message);
        }
      }
    }

    // Update table statistics
    console.log('📊 Updating table statistics...');
    await pool.query('ANALYZE;');
    console.log('✅ Table statistics updated');

    // Check connection pool settings
    console.log('🔧 Checking connection pool...');
    const poolStats = await pool.query('SELECT * FROM pg_stat_activity WHERE state = \'active\';');
    console.log(`📈 Active connections: ${poolStats.rows.length}`);

    if (poolStats.rows.length > 20) {
      console.log('⚠️  High number of active connections detected');
      console.log('💡 Consider reducing connection pool size in your app');
    }

  } catch (error) {
    console.error('❌ Performance optimization failed:', error.message);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  fixPerformanceIssues();
}

module.exports = { fixPerformanceIssues };