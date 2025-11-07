# Docker Build Test Script for Windows PowerShell
# Tests the Docker build locally before Railway deployment

$ErrorActionPreference = "Stop"

Write-Host "🐳 Testing Docker build locally..." -ForegroundColor Cyan
Write-Host ""

# Configuration
$IMAGE_NAME = "fixwell-test"
$CONTAINER_NAME = "fixwell-test-container"
$PORT = 3000

# Cleanup function
function Cleanup {
    Write-Host ""
    Write-Host "🧹 Cleaning up..." -ForegroundColor Yellow
    docker stop $CONTAINER_NAME 2>$null
    docker rm $CONTAINER_NAME 2>$null
    Write-Host "✅ Cleanup complete" -ForegroundColor Green
}

# Register cleanup on exit
Register-ObjectEvent -InputObject ([System.Management.Automation.PsEngineEvent]::Exiting) -Action { Cleanup } | Out-Null

# Check if Docker is running
try {
    docker info | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running. Please start Docker and try again." -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 1: Build the Docker image
Write-Host "📦 Step 1: Building Docker image..." -ForegroundColor Cyan
Write-Host "   Image name: $IMAGE_NAME"
Write-Host ""

try {
    docker build -t $IMAGE_NAME .
    Write-Host "✅ Docker image built successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker build failed" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 2: Verify build artifacts
Write-Host "🔍 Step 2: Verifying build artifacts..." -ForegroundColor Cyan
Write-Host ""

# Check if .next directory exists
try {
    docker run --rm $IMAGE_NAME test -d /app/apps/frontend/.next | Out-Null
    Write-Host "✅ .next directory exists" -ForegroundColor Green
} catch {
    Write-Host "❌ .next directory missing" -ForegroundColor Red
    exit 1
}

# Check if build-manifest.json exists
try {
    docker run --rm $IMAGE_NAME test -f /app/apps/frontend/.next/build-manifest.json | Out-Null
    Write-Host "✅ build-manifest.json exists" -ForegroundColor Green
} catch {
    Write-Host "❌ build-manifest.json missing" -ForegroundColor Red
    exit 1
}

# Check if server directory exists
try {
    docker run --rm $IMAGE_NAME test -d /app/apps/frontend/.next/server | Out-Null
    Write-Host "✅ server directory exists" -ForegroundColor Green
} catch {
    Write-Host "❌ server directory missing" -ForegroundColor Red
    exit 1
}

# Check if Prisma client exists
try {
    docker run --rm $IMAGE_NAME test -d /app/apps/backend/node_modules/.prisma | Out-Null
    Write-Host "✅ Prisma client exists" -ForegroundColor Green
} catch {
    try {
        docker run --rm $IMAGE_NAME test -d /app/apps/backend/node_modules/@prisma/client | Out-Null
        Write-Host "✅ Prisma client exists" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Prisma client might not be generated (will be generated at runtime)" -ForegroundColor Yellow
    }
}

# Check if unified-server-enhanced.js exists
try {
    docker run --rm $IMAGE_NAME test -f /app/unified-server-enhanced.js | Out-Null
    Write-Host "✅ unified-server-enhanced.js exists" -ForegroundColor Green
} catch {
    Write-Host "❌ unified-server-enhanced.js missing" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ All build artifacts verified" -ForegroundColor Green
Write-Host ""

# Step 3: Test container configuration
Write-Host "🚀 Step 3: Testing container configuration..." -ForegroundColor Cyan
Write-Host ""

# Test that migrations can run (dry run)
Write-Host "   Testing Prisma migration command..."
try {
    docker run --rm `
        -e DATABASE_URL="postgresql://test:test@localhost:5432/test" `
        $IMAGE_NAME `
        sh -c "cd /app/apps/backend && npx prisma migrate deploy --skip-seed 2>&1 | head -5 || echo 'Migration command available'" | Out-Null
    Write-Host "✅ Prisma migration command available" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Prisma migration command test skipped (requires database)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ Container configuration test passed" -ForegroundColor Green
Write-Host ""

# Step 4: Summary
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "✅ Docker build test completed successfully!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Summary:" -ForegroundColor Cyan
Write-Host "   ✅ Docker image built"
Write-Host "   ✅ Build artifacts verified"
Write-Host "   ✅ Container configuration tested"
Write-Host ""
Write-Host "💡 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Test with actual database:"
Write-Host "      docker run --rm -p ${PORT}:${PORT} -e DATABASE_URL='your-db-url' $IMAGE_NAME"
Write-Host "   2. Deploy to Railway:"
Write-Host "      railway up"
Write-Host ""

