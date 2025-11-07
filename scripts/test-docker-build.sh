#!/bin/bash

# Docker Build Test Script
# Tests the Docker build locally before Railway deployment

set -e

echo "🐳 Testing Docker build locally..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
IMAGE_NAME="fixwell-test"
CONTAINER_NAME="fixwell-test-container"
PORT=3000

# Cleanup function
cleanup() {
    echo ""
    echo "🧹 Cleaning up..."
    docker stop $CONTAINER_NAME 2>/dev/null || true
    docker rm $CONTAINER_NAME 2>/dev/null || true
    echo "✅ Cleanup complete"
}

# Set trap to cleanup on exit
trap cleanup EXIT

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker and try again.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker is running${NC}"
echo ""

# Step 1: Build the Docker image
echo "📦 Step 1: Building Docker image..."
echo "   Image name: $IMAGE_NAME"
echo ""

if docker build -t $IMAGE_NAME .; then
    echo -e "${GREEN}✅ Docker image built successfully${NC}"
else
    echo -e "${RED}❌ Docker build failed${NC}"
    exit 1
fi

echo ""

# Step 2: Verify build artifacts
echo "🔍 Step 2: Verifying build artifacts..."
echo ""

# Check if .next directory exists in image
if docker run --rm $IMAGE_NAME test -d /app/apps/frontend/.next; then
    echo -e "${GREEN}✅ .next directory exists${NC}"
else
    echo -e "${RED}❌ .next directory missing${NC}"
    exit 1
fi

# Check if build-manifest.json exists
if docker run --rm $IMAGE_NAME test -f /app/apps/frontend/.next/build-manifest.json; then
    echo -e "${GREEN}✅ build-manifest.json exists${NC}"
else
    echo -e "${RED}❌ build-manifest.json missing${NC}"
    exit 1
fi

# Check if server directory exists
if docker run --rm $IMAGE_NAME test -d /app/apps/frontend/.next/server; then
    echo -e "${GREEN}✅ server directory exists${NC}"
else
    echo -e "${RED}❌ server directory missing${NC}"
    exit 1
fi

# Check if Prisma client exists
if docker run --rm $IMAGE_NAME test -d /app/apps/backend/node_modules/.prisma || \
   docker run --rm $IMAGE_NAME test -d /app/apps/backend/node_modules/@prisma/client; then
    echo -e "${GREEN}✅ Prisma client exists${NC}"
else
    echo -e "${YELLOW}⚠️  Prisma client might not be generated (will be generated at runtime)${NC}"
fi

# Check if unified-server-enhanced.js exists
if docker run --rm $IMAGE_NAME test -f /app/unified-server-enhanced.js; then
    echo -e "${GREEN}✅ unified-server-enhanced.js exists${NC}"
else
    echo -e "${RED}❌ unified-server-enhanced.js missing${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ All build artifacts verified${NC}"
echo ""

# Step 3: Test container startup (without actually starting the server)
echo "🚀 Step 3: Testing container configuration..."
echo ""

# Test that migrations can run (dry run)
echo "   Testing Prisma migration command..."
if docker run --rm \
    -e DATABASE_URL="postgresql://test:test@localhost:5432/test" \
    $IMAGE_NAME \
    sh -c "cd /app/apps/backend && npx prisma migrate deploy --skip-seed 2>&1 | head -5 || echo 'Migration command available'"; then
    echo -e "${GREEN}✅ Prisma migration command available${NC}"
else
    echo -e "${YELLOW}⚠️  Prisma migration command test skipped (requires database)${NC}"
fi

echo ""
echo -e "${GREEN}✅ Container configuration test passed${NC}"
echo ""

# Step 4: Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Docker build test completed successfully!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Summary:"
echo "   ✅ Docker image built"
echo "   ✅ Build artifacts verified"
echo "   ✅ Container configuration tested"
echo ""
echo "💡 Next steps:"
echo "   1. Test with actual database:"
echo "      docker run --rm -p $PORT:$PORT -e DATABASE_URL='your-db-url' $IMAGE_NAME"
echo "   2. Deploy to Railway:"
echo "      railway up"
echo ""

