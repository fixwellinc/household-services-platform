#!/bin/bash

# Exit on any error
set -e

echo "Starting Fixwell application..."

# Navigate to backend directory
cd /app/apps/backend

# Run database migrations
echo "Running database migrations..."
npx prisma migrate deploy

# Generate Prisma client (in case it wasn't generated during build)
echo "Generating Prisma client..."
npx prisma generate

# Navigate back to root
cd /app

# Start the unified server
echo "Starting unified server..."
node unified-server.js 