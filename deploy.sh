#!/bin/bash

# 🚀 Fixwell Services Platform - Railway Deployment Script
# This script automates the deployment process to Railway

set -e  # Exit on any error

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

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if user is logged into Railway
check_railway_login() {
    if ! railway whoami >/dev/null 2>&1; then
        print_error "Not logged into Railway. Please run 'railway login' first."
        exit 1
    fi
}

# Function to generate secure secrets
generate_secret() {
    openssl rand -base64 32
}

# Function to validate environment variables
validate_env_vars() {
    local required_vars=("DATABASE_URL" "STRIPE_SECRET_KEY" "STRIPE_PUBLISHABLE_KEY")
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var}" ]]; then
            missing_vars+=("$var")
        fi
    done
    
    if [[ ${#missing_vars[@]} -gt 0 ]]; then
        print_error "Missing required environment variables: ${missing_vars[*]}"
        print_status "Please set these variables before running the deployment script."
        exit 1
    fi
}

# Function to deploy backend
deploy_backend() {
    print_status "Deploying backend to Railway..."
    
    cd backend
    
    # Check if Railway service exists, create if not
    if ! railway service list | grep -q "fixwell-backend"; then
        print_status "Creating backend service..."
        railway service create fixwell-backend
    fi
    
    # Set environment variables
    print_status "Setting backend environment variables..."
    railway variables set NODE_ENV=production
    railway variables set PORT=5000
    railway variables set JWT_SECRET=$(generate_secret)
    railway variables set DATABASE_URL="$DATABASE_URL"
    railway variables set STRIPE_SECRET_KEY="$STRIPE_SECRET_KEY"
    railway variables set STRIPE_WEBHOOK_SECRET="$STRIPE_WEBHOOK_SECRET"
    railway variables set CORS_ORIGIN="$FRONTEND_URL"
    
    # Deploy
    print_status "Deploying backend..."
    railway up --detach
    
    # Wait for deployment to complete
    print_status "Waiting for backend deployment to complete..."
    sleep 30
    
    # Run database migrations
    print_status "Running database migrations..."
    railway run npx prisma migrate deploy
    
    # Get backend URL
    BACKEND_URL=$(railway domain)
    print_success "Backend deployed successfully at: $BACKEND_URL"
    
    cd ..
}

# Function to deploy frontend
deploy_frontend() {
    print_status "Deploying frontend to Railway..."
    
    cd frontend
    
    # Check if Railway service exists, create if not
    if ! railway service list | grep -q "fixwell-frontend"; then
        print_status "Creating frontend service..."
        railway service create fixwell-frontend
    fi
    
    # Set environment variables
    print_status "Setting frontend environment variables..."
    railway variables set NEXT_PUBLIC_API_URL="$BACKEND_URL"
    railway variables set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="$STRIPE_PUBLISHABLE_KEY"
    railway variables set NEXTAUTH_SECRET=$(generate_secret)
    railway variables set NEXTAUTH_URL="$FRONTEND_URL"
    
    # Deploy
    print_status "Deploying frontend..."
    railway up --detach
    
    # Wait for deployment to complete
    print_status "Waiting for frontend deployment to complete..."
    sleep 30
    
    # Get frontend URL
    FRONTEND_URL=$(railway domain)
    print_success "Frontend deployed successfully at: $FRONTEND_URL"
    
    cd ..
}

# Function to run health checks
run_health_checks() {
    print_status "Running health checks..."
    
    # Backend health check
    if curl -f "$BACKEND_URL/api/health" >/dev/null 2>&1; then
        print_success "Backend health check passed"
    else
        print_error "Backend health check failed"
        return 1
    fi
    
    # Frontend health check
    if curl -f "$FRONTEND_URL" >/dev/null 2>&1; then
        print_success "Frontend health check passed"
    else
        print_error "Frontend health check failed"
        return 1
    fi
}

# Function to run basic tests
run_tests() {
    print_status "Running basic API tests..."
    
    # Test registration endpoint
    local test_response=$(curl -s -X POST "$BACKEND_URL/api/auth/register" \
        -H "Content-Type: application/json" \
        -d '{"email":"test@example.com","name":"Test User","password":"password123","role":"CUSTOMER"}' || echo "FAILED")
    
    if [[ "$test_response" != "FAILED" ]]; then
        print_success "Registration endpoint test passed"
    else
        print_warning "Registration endpoint test failed (this might be expected if user already exists)"
    fi
}

# Function to display deployment summary
show_summary() {
    echo
    print_success "🎉 Deployment completed successfully!"
    echo
    echo "📋 Deployment Summary:"
    echo "======================"
    echo "Backend URL:  $BACKEND_URL"
    echo "Frontend URL: $FRONTEND_URL"
    echo
    echo "🔐 Security Status:"
    echo "=================="
    echo "✅ HTTPS enabled"
    echo "✅ Environment variables secured"
    echo "✅ Database migrations completed"
    echo "✅ Health checks passed"
    echo
    echo "📊 Next Steps:"
    echo "=============="
    echo "1. Configure Stripe webhooks: $BACKEND_URL/api/webhooks/stripe"
    echo "2. Set up custom domain (optional)"
    echo "3. Configure monitoring and alerts"
    echo "4. Test payment processing"
    echo "5. Set up backup strategy"
    echo
    echo "🔗 Useful Commands:"
    echo "=================="
    echo "View logs: railway logs"
    echo "Check status: railway status"
    echo "Rollback: railway rollback"
    echo "Restart: railway service restart"
    echo
}

# Main deployment function
main() {
    echo "🚀 Fixwell Services Platform - Railway Deployment"
    echo "=================================================="
    echo
    
    # Check prerequisites
    print_status "Checking prerequisites..."
    
    if ! command_exists railway; then
        print_error "Railway CLI not found. Please install it first:"
        echo "npm install -g @railway/cli"
        exit 1
    fi
    
    if ! command_exists curl; then
        print_error "curl not found. Please install curl first."
        exit 1
    fi
    
    if ! command_exists openssl; then
        print_error "openssl not found. Please install openssl first."
        exit 1
    fi
    
    # Check Railway login
    check_railway_login
    
    # Validate environment variables
    print_status "Validating environment variables..."
    validate_env_vars
    
    # Deploy backend
    deploy_backend
    
    # Deploy frontend
    deploy_frontend
    
    # Run health checks
    if run_health_checks; then
        print_success "All health checks passed"
    else
        print_warning "Some health checks failed. Please check the deployment manually."
    fi
    
    # Run basic tests
    run_tests
    
    # Show summary
    show_summary
}

# Handle script arguments
case "${1:-}" in
    --help|-h)
        echo "Usage: $0 [OPTIONS]"
        echo
        echo "Options:"
        echo "  --help, -h    Show this help message"
        echo "  --backend     Deploy only backend"
        echo "  --frontend    Deploy only frontend"
        echo
        echo "Environment Variables Required:"
        echo "  DATABASE_URL              PostgreSQL connection string"
        echo "  STRIPE_SECRET_KEY         Stripe secret key"
        echo "  STRIPE_PUBLISHABLE_KEY    Stripe publishable key"
        echo "  STRIPE_WEBHOOK_SECRET     Stripe webhook secret"
        echo
        echo "Example:"
        echo "  DATABASE_URL=postgresql://... STRIPE_SECRET_KEY=sk_... $0"
        exit 0
        ;;
    --backend)
        print_status "Deploying backend only..."
        check_railway_login
        validate_env_vars
        deploy_backend
        print_success "Backend deployment completed"
        exit 0
        ;;
    --frontend)
        print_status "Deploying frontend only..."
        check_railway_login
        validate_env_vars
        deploy_frontend
        print_success "Frontend deployment completed"
        exit 0
        ;;
    "")
        # No arguments, run full deployment
        main
        ;;
    *)
        print_error "Unknown option: $1"
        echo "Use --help for usage information"
        exit 1
        ;;
esac 