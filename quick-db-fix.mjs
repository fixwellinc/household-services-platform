import pkg from 'pg';
const { Pool } = pkg;

async function fixDatabase() {
  // Try to connect using environment variables
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  
  if (!connectionString) {
    console.log('❌ No database connection string found in environment variables');
    console.log('💡 Make sure DATABASE_URL or POSTGRES_URL is set');
    return;
  }

  const pool = new Pool({
    connectionString,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🔧 Connecting to database...');
    
    // Test connection
    const client = await pool.connect();
    console.log('✅ Connected to database');
    
    // Fix collation version
    console.log('🔧 Fixing collation version mismatch...');
    await client.query('ALTER DATABASE railway REFRESH COLLATION VERSION;');
    console.log('✅ Collation version refreshed');
    
    // Get database info
    const versionResult = await client.query('SELECT version();');
    console.log('📊 Database version:', versionResult.rows[0].version.split(' ')[0]);
    
    client.release();
    
  } catch (error) {
    console.error('❌ Database fix failed:', error.message);
    
    if (error.message.includes('permission denied')) {
      console.log('💡 You may need admin privileges to refresh collation version');
      console.log('💡 Contact Railway support or try running: railway run psql -c "ALTER DATABASE railway REFRESH COLLATION VERSION;"');
    }
  } finally {
    await pool.end();
  }
}

fixDatabase();