#!/bin/bash

# Vercel Deployment Script for Household Services Platform
# This script helps deploy the frontend to Vercel

set -e

echo "🚀 Starting Vercel deployment for Household Services Platform..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Check if frontend directory exists
if [ ! -d "frontend" ]; then
    print_error "Frontend directory not found"
    exit 1
fi

print_status "Checking prerequisites..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    print_warning "Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Check if user is logged in to Vercel
if ! vercel whoami &> /dev/null; then
    print_warning "Not logged in to Vercel. Please login..."
    vercel login
fi

print_status "Preparing frontend for deployment..."

# Navigate to frontend directory
cd frontend

# Check if .env.local exists, if not create from example
if [ ! -f ".env.local" ]; then
    print_warning "No .env.local found. Creating from example..."
    if [ -f "env.example" ]; then
        cp env.example .env.local
        print_warning "Please update .env.local with your production values before deploying"
    else
        print_error "env.example not found. Please create .env.local manually"
        exit 1
    fi
fi

# Install dependencies
print_status "Installing frontend dependencies..."
npm install

# Generate Prisma client
print_status "Generating Prisma client..."
npx prisma generate

# Build the project
print_status "Building the project..."
npm run build

print_status "Deploying to Vercel..."

# Deploy to Vercel
if vercel --prod; then
    print_success "Deployment completed successfully!"
    print_status "Your app should be available at the URL shown above"
    print_status "Don't forget to:"
    print_status "1. Set up environment variables in Vercel dashboard"
    print_status "2. Deploy your backend to Railway/Render"
    print_status "3. Update CORS settings in your backend"
    print_status "4. Test all functionality"
else
    print_error "Deployment failed!"
    print_status "Check the error messages above and try again"
    exit 1
fi

print_success "🎉 Deployment script completed!" 