# Fix PostgreSQL collation version mismatch
Write-Host "🔧 Fixing PostgreSQL collation version mismatch..." -ForegroundColor Yellow

# Check if psql is available
$psqlPath = Get-Command psql -ErrorAction SilentlyContinue
if ($psqlPath) {
    Write-Host "✅ psql found, executing fix..." -ForegroundColor Green
    psql $env:DATABASE_URL -c "ALTER DATABASE railway REFRESH COLLATION VERSION;"
    Write-Host "✅ Collation version refreshed successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ psql not available in this environment" -ForegroundColor Red
    Write-Host "💡 Please run this fix manually in Railway dashboard" -ForegroundColor Cyan
}