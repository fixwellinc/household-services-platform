#!/bin/bash

# Deployment Setup Script for Household Services Platform
# This script helps prepare your project for deployment

set -e

echo "🔧 Setting up deployment environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

print_status "Installing all dependencies..."

# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
npx prisma generate

# Install backend dependencies
cd ../backend
npm install
npx prisma generate

cd ..

print_status "Setting up environment files..."

# Create frontend .env.local if it doesn't exist
if [ ! -f "frontend/.env.local" ]; then
    if [ -f "frontend/env.example" ]; then
        cp frontend/env.example frontend/.env.local
        print_warning "Created frontend/.env.local from example"
        print_warning "Please update it with your production values"
    fi
fi

# Create backend .env if it doesn't exist
if [ ! -f "backend/.env" ]; then
    if [ -f "backend/env.example" ]; then
        cp backend/env.example backend/.env
        print_warning "Created backend/.env from example"
        print_warning "Please update it with your production values"
    fi
fi

print_status "Checking build process..."

# Test frontend build
cd frontend
if npm run build; then
    print_success "Frontend builds successfully"
else
    print_error "Frontend build failed"
    exit 1
fi

cd ..

print_status "Checking for common issues..."

# Check for common deployment issues
if [ -f "frontend/.env.local" ]; then
    if grep -q "localhost" frontend/.env.local; then
        print_warning "Found localhost URLs in frontend/.env.local"
        print_warning "Remember to update these for production"
    fi
fi

if [ -f "backend/.env" ]; then
    if grep -q "localhost" backend/.env; then
        print_warning "Found localhost URLs in backend/.env"
        print_warning "Remember to update these for production"
    fi
fi

print_success "Setup completed successfully!"
print_status "Next steps:"
print_status "1. Update environment variables in frontend/.env.local and backend/.env"
print_status "2. Set up MongoDB Atlas database"
print_status "3. Configure Stripe keys"
print_status "4. Run deploy-vercel.sh to deploy frontend"
print_status "5. Deploy backend to Railway/Render" 