#!/usr/bin/env node

import pkg from 'pg';
const { Pool } = pkg;

async function fixDatabaseIssues() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🔧 Fixing PostgreSQL collation version mismatch...');
    
    // Fix collation version mismatch
    await pool.query('ALTER DATABASE railway REFRESH COLLATION VERSION;');
    console.log('✅ Collation version refreshed successfully');

    // Check database health
    const result = await pool.query('SELECT version();');
    console.log('📊 Database version:', result.rows[0].version);

    // Analyze slow queries
    console.log('🔍 Checking for slow queries...');
    const slowQueries = await pool.query(`
      SELECT query, mean_exec_time, calls 
      FROM pg_stat_statements 
      WHERE mean_exec_time > 1000 
      ORDER BY mean_exec_time DESC 
      LIMIT 10;
    `).catch(() => {
      console.log('ℹ️  pg_stat_statements extension not available');
      return { rows: [] };
    });

    if (slowQueries.rows.length > 0) {
      console.log('⚠️  Found slow queries:');
      slowQueries.rows.forEach(row => {
        console.log(`- ${row.query.substring(0, 100)}... (${row.mean_exec_time}ms avg, ${row.calls} calls)`);
      });
    }

  } catch (error) {
    console.error('❌ Database fix failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if this file is executed directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  fixDatabaseIssues();
}

export { fixDatabaseIssues };