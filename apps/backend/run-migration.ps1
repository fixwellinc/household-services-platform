# Run database migration for FixWell complete workflow
Write-Host "🔄 Running database migration..." -ForegroundColor Yellow

# Navigate to backend directory
Set-Location "apps/backend"

# Generate Prisma client
Write-Host "📦 Generating Prisma client..." -ForegroundColor Blue
npx prisma generate

# Push schema changes to database
Write-Host "🚀 Pushing schema changes to database..." -ForegroundColor Green
npx prisma db push

# Seed database if needed
Write-Host "🌱 Seeding database..." -ForegroundColor Cyan
node seed.js

Write-Host "✅ Database migration completed successfully!" -ForegroundColor Green
Write-Host "🔄 You can now run the application with: npm run dev:unified" -ForegroundColor Blue 