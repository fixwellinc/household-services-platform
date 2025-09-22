-- Fix PostgreSQL collation version mismatch
ALTER DATABASE railway REFRESH COLLATION VERSION;

-- Check database version and status
SELECT version();

-- Show current collation info
SELECT datname, datcollate, datctype FROM pg_database WHERE datname = 'railway';