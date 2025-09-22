-- Migration to fix collation version mismatch
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
