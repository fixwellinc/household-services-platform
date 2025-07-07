#!/bin/bash

# 🚀 Railway Deployment Setup Script
# This script helps set up your Household Services Platform for Railway deployment

set -e

echo "🚀 Setting up Railway deployment..."

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

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js first."
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
    
    if ! command -v git &> /dev/null; then
        print_error "Git is not installed. Please install Git first."
        exit 1
    fi
    
    print_success "All dependencies are installed"
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    # Install backend dependencies
    cd backend
    npm install
    cd ..
    
    # Install frontend dependencies
    cd frontend
    npm install
    cd ..
    
    print_success "Dependencies installed successfully"
}

# Generate secure secrets
generate_secrets() {
    print_status "Generating secure secrets..."
    
    # Generate JWT secret
    JWT_SECRET=$(openssl rand -base64 32)
    echo "JWT_SECRET=$JWT_SECRET" >> .env.example
    
    # Generate NextAuth secret
    NEXTAUTH_SECRET=$(openssl rand -base64 32)
    echo "NEXTAUTH_SECRET=$NEXTAUTH_SECRET" >> .env.example
    
    print_success "Secrets generated and added to .env.example"
    print_warning "Please update these secrets in your Railway environment variables"
}

# Create Railway configuration
setup_railway() {
    print_status "Setting up Railway configuration..."
    
    # Check if Railway CLI is installed
    if ! command -v railway &> /dev/null; then
        print_warning "Railway CLI is not installed. Installing..."
        npm install -g @railway/cli
    fi
    
    print_success "Railway CLI is ready"
    print_status "Next steps:"
    echo "1. Run 'railway login' to authenticate"
    echo "2. Run 'railway init' in your project directory"
    echo "3. Configure your services in Railway dashboard"
}

# Setup Stripe configuration
setup_stripe() {
    print_status "Setting up Stripe configuration..."
    
    echo ""
    echo "📋 Stripe Setup Instructions:"
    echo "1. Go to https://dashboard.stripe.com"
    echo "2. Create your account if you haven't already"
    echo "3. Go to Developers → API Keys"
    echo "4. Copy your Publishable Key and Secret Key"
    echo "5. Go to Developers → Webhooks"
    echo "6. Add webhook endpoint: https://your-backend-domain.railway.app/api/payments/webhook"
    echo "7. Select these events:"
    echo "   - payment_intent.succeeded"
    echo "   - payment_intent.payment_failed"
    echo "   - customer.subscription.created"
    echo "   - customer.subscription.updated"
    echo "   - customer.subscription.deleted"
    echo "   - invoice.payment_succeeded"
    echo "   - invoice.payment_failed"
    echo "8. Copy the webhook signing secret"
    echo ""
    echo "Add these to your Railway environment variables:"
    echo "- STRIPE_SECRET_KEY"
    echo "- STRIPE_PUBLISHABLE_KEY"
    echo "- STRIPE_WEBHOOK_SECRET"
    echo "- NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
}

# Build the application
build_app() {
    print_status "Building the application..."
    
    # Build backend
    cd backend
    npm run build
    cd ..
    
    # Build frontend
    cd frontend
    npm run build
    cd ..
    
    print_success "Application built successfully"
}

# Run tests
run_tests() {
    print_status "Running tests..."
    
    # Backend tests (if they exist)
    cd backend
    if npm run test 2>/dev/null; then
        print_success "Backend tests passed"
    else
        print_warning "No backend tests found or tests failed"
    fi
    cd ..
    
    # Frontend tests
    cd frontend
    if npm run test 2>/dev/null; then
        print_success "Frontend tests passed"
    else
        print_warning "No frontend tests found or tests failed"
    fi
    cd ..
}

# Main execution
main() {
    echo "🏠 Household Services Platform - Railway Deployment Setup"
    echo "========================================================"
    echo ""
    
    check_dependencies
    install_dependencies
    generate_secrets
    setup_railway
    setup_stripe
    build_app
    run_tests
    
    echo ""
    echo "🎉 Setup complete!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Push your code to GitHub"
    echo "2. Connect your repository to Railway"
    echo "3. Set up environment variables in Railway dashboard"
    echo "4. Deploy your services"
    echo "5. Run database migrations"
    echo ""
    echo "📖 For detailed instructions, see DEPLOYMENT.md"
    echo ""
    echo "🔐 Security reminder:"
    echo "- Never commit .env files to your repository"
    echo "- Use Railway environment variables for all secrets"
    echo "- Test with Stripe test keys before going live"
}

# Run main function
main "$@" 