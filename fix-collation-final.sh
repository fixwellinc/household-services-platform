#!/bin/bash
# Fix PostgreSQL collation version mismatch
echo "🔧 Fixing PostgreSQL collation version mismatch..."

# Check if psql is available
if command -v psql &> /dev/null; then
    echo "✅ psql found, executing fix..."
    psql $DATABASE_URL -c "ALTER DATABASE railway REFRESH COLLATION VERSION;"
    echo "✅ Collation version refreshed successfully!"
else
    echo "❌ psql not available in this environment"
    echo "💡 Please run this fix manually in Railway dashboard"
fi