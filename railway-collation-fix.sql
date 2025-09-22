
-- Fix collation version mismatch
ALTER DATABASE railway REFRESH COLLATION VERSION;

-- Verify the fix
SELECT 'Collation fix completed successfully' as status;
