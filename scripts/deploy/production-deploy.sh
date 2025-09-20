#!/bin/bash

# 🚀 Enhanced Production Deployment Script
# This script provides comprehensive deployment management with safety checks

set -euo pipefail  # Exit on any error, undefined variables, or pipe failures

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
LOG_FILE="$PROJECT_ROOT/logs/deployment-$(date +%Y%m%d-%H%M%S).log"
BACKUP_DIR="$PROJECT_ROOT/backups"
ROLLBACK_DATA_FILE="$PROJECT_ROOT/.rollback-data.json"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Logging functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] SUCCESS:${NC} $1" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" | tee -a "$LOG_FILE"
}

log_info() {
    echo -e "${PURPLE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO:${NC} $1" | tee -a "$LOG_FILE"
}

# Error handling
cleanup() {
    local exit_code=$?
    if [[ $exit_code -ne 0 ]]; then
        log_error "Deployment failed with exit code $exit_code"
        log_info "Check logs at: $LOG_FILE"
        
        # Offer rollback if deployment was in progress
        if [[ -f "$ROLLBACK_DATA_FILE" ]]; then
            echo
            read -p "Would you like to rollback to the previous version? (y/N): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                rollback_deployment
            fi
        fi
    fi
}

trap cleanup EXIT

# Utility functions
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

check_prerequisites() {
    log "Checking prerequisites..."
    
    local missing_commands=()
    local required_commands=("railway" "docker" "node" "npm" "curl" "jq" "pg_dump")
    
    for cmd in "${required_commands[@]}"; do
        if ! command_exists "$cmd"; then
            missing_commands+=("$cmd")
        fi
    done
    
    if [[ ${#missing_commands[@]} -gt 0 ]]; then
        log_error "Missing required commands: ${missing_commands[*]}"
        log_info "Please install the missing commands and try again"
        exit 1
    fi
    
    # Check Railway authentication
    if ! railway whoami >/dev/null 2>&1; then
        log_error "Not authenticated with Railway. Please run 'railway login' first"
        exit 1
    fi
    
    # Check Docker daemon
    if ! docker info >/dev/null 2>&1; then
        log_error "Docker daemon is not running. Please start Docker and try again"
        exit 1
    fi
    
    log_success "All prerequisites satisfied"
}

validate_environment() {
    log "Validating environment configuration..."
    
    local required_vars=(
        "DATABASE_URL"
        "STRIPE_SECRET_KEY" 
        "STRIPE_PUBLISHABLE_KEY"
        "JWT_SECRET"
        "NEXTAUTH_SECRET"
    )
    
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            missing_vars+=("$var")
        fi
    done
    
    if [[ ${#missing_vars[@]} -gt 0 ]]; then
        log_error "Missing required environment variables: ${missing_vars[*]}"
        log_info "Please set these variables in your Railway project or .env file"
        exit 1
    fi
    
    # Validate database connection
    log "Testing database connection..."
    if ! railway run --service backend "npx prisma db pull" >/dev/null 2>&1; then
        log_error "Cannot connect to database. Please check DATABASE_URL"
        exit 1
    fi
    
    log_success "Environment validation passed"
}

run_tests() {
    log "Running comprehensive test suite..."
    
    cd "$PROJECT_ROOT"
    
    # Create test database if needed
    export DATABASE_URL="${TEST_DATABASE_URL:-$DATABASE_URL}"
    
    # Run different test suites
    local test_commands=(
        "npm run lint"
        "npm run type-check"
        "npm run test:unit"
        "npm run test:integration"
        "npm run test:security"
        "npm run test:accessibility"
    )
    
    for cmd in "${test_commands[@]}"; do
        log "Running: $cmd"
        if ! $cmd; then
            log_error "Test failed: $cmd"
            return 1
        fi
    done
    
    log_success "All tests passed"
}

create_backup() {
    log "Creating pre-deployment backup..."
    
    mkdir -p "$BACKUP_DIR"
    
    local backup_timestamp=$(date +%Y%m%d-%H%M%S)
    local backup_file="$BACKUP_DIR/backup-$backup_timestamp.sql"
    
    # Create database backup
    log "Creating database backup..."
    if ! railway run --service backend "pg_dump \$DATABASE_URL" > "$backup_file"; then
        log_error "Failed to create database backup"
        return 1
    fi
    
    # Compress backup
    gzip "$backup_file"
    backup_file="$backup_file.gz"
    
    # Store current deployment info for rollback
    local current_deployment=$(railway deployments list --json | jq -r '.[0]')
    echo "$current_deployment" > "$ROLLBACK_DATA_FILE"
    
    log_success "Backup created: $backup_file"
    echo "$backup_file"
}

build_and_push_image() {
    log "Building and pushing Docker image..."
    
    cd "$PROJECT_ROOT"
    
    local version="${VERSION:-$(git rev-parse --short HEAD)}"
    local image_tag="ghcr.io/$(git config --get remote.origin.url | sed 's/.*github.com[:/]\([^.]*\).*/\1/' | tr '[:upper:]' '[:lower:]'):$version"
    
    # Build image
    log "Building Docker image: $image_tag"
    if ! docker build -t "$image_tag" .; then
        log_error "Failed to build Docker image"
        return 1
    fi
    
    # Push image
    log "Pushing Docker image to registry..."
    if ! docker push "$image_tag"; then
        log_error "Failed to push Docker image"
        return 1
    fi
    
    log_success "Docker image built and pushed: $image_tag"
    echo "$image_tag"
}

run_migrations() {
    log "Running database migrations..."
    
    cd "$PROJECT_ROOT/apps/backend"
    
    # Generate Prisma client
    log "Generating Prisma client..."
    if ! npx prisma generate; then
        log_error "Failed to generate Prisma client"
        return 1
    fi
    
    # Run migrations
    log "Deploying database migrations..."
    if ! railway run --service backend "npx prisma migrate deploy"; then
        log_error "Failed to run database migrations"
        return 1
    fi
    
    # Verify migrations
    log "Verifying migration status..."
    if ! railway run --service backend "npx prisma migrate status"; then
        log_warning "Could not verify migration status"
    fi
    
    log_success "Database migrations completed"
}

deploy_application() {
    log "Deploying application to Railway..."
    
    local image_tag="$1"
    
    # Set deployment environment variables
    log "Setting environment variables..."
    railway variables set NODE_ENV=production
    railway variables set VERSION="${VERSION:-$(git rev-parse --short HEAD)}"
    railway variables set DOCKER_IMAGE="$image_tag"
    railway variables set DEPLOYMENT_TIME="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
    
    # Deploy
    log "Triggering deployment..."
    if ! railway up --detach; then
        log_error "Failed to trigger deployment"
        return 1
    fi
    
    # Wait for deployment to complete
    log "Waiting for deployment to complete..."
    local max_wait=300  # 5 minutes
    local wait_time=0
    
    while [[ $wait_time -lt $max_wait ]]; do
        if railway status | grep -q "RUNNING"; then
            break
        fi
        sleep 10
        wait_time=$((wait_time + 10))
        log "Waiting... ($wait_time/${max_wait}s)"
    done
    
    if [[ $wait_time -ge $max_wait ]]; then
        log_error "Deployment timed out"
        return 1
    fi
    
    log_success "Application deployed successfully"
}

run_health_checks() {
    log "Running post-deployment health checks..."
    
    local app_url=$(railway domain)
    local max_attempts=30
    local attempt=0
    
    # Wait for application to be ready
    while [[ $attempt -lt $max_attempts ]]; do
        if curl -f "$app_url/health" >/dev/null 2>&1; then
            break
        fi
        attempt=$((attempt + 1))
        log "Health check attempt $attempt/$max_attempts..."
        sleep 10
    done
    
    if [[ $attempt -ge $max_attempts ]]; then
        log_error "Health checks failed - application not responding"
        return 1
    fi
    
    # Test critical endpoints
    local endpoints=(
        "/health"
        "/api/health"
        "/api/auth/status"
    )
    
    for endpoint in "${endpoints[@]}"; do
        log "Testing endpoint: $endpoint"
        if ! curl -f "$app_url$endpoint" >/dev/null 2>&1; then
            log_error "Health check failed for endpoint: $endpoint"
            return 1
        fi
    done
    
    # Test database connectivity
    log "Testing database connectivity..."
    if ! railway run --service backend "npx prisma db pull" >/dev/null 2>&1; then
        log_error "Database connectivity check failed"
        return 1
    fi
    
    log_success "All health checks passed"
    log_success "Application is running at: $app_url"
}

rollback_deployment() {
    log "Initiating deployment rollback..."
    
    if [[ ! -f "$ROLLBACK_DATA_FILE" ]]; then
        log_error "No rollback data found"
        return 1
    fi
    
    local previous_deployment=$(cat "$ROLLBACK_DATA_FILE" | jq -r '.id')
    
    if [[ "$previous_deployment" == "null" || -z "$previous_deployment" ]]; then
        log_error "No previous deployment found for rollback"
        return 1
    fi
    
    log "Rolling back to deployment: $previous_deployment"
    if ! railway rollback "$previous_deployment"; then
        log_error "Failed to rollback deployment"
        return 1
    fi
    
    # Wait for rollback to complete
    sleep 30
    
    # Verify rollback
    local app_url=$(railway domain)
    if curl -f "$app_url/health" >/dev/null 2>&1; then
        log_success "Rollback completed successfully"
    else
        log_error "Rollback verification failed"
        return 1
    fi
    
    # Clean up rollback data
    rm -f "$ROLLBACK_DATA_FILE"
}

show_deployment_summary() {
    local app_url=$(railway domain)
    local version="${VERSION:-$(git rev-parse --short HEAD)}"
    
    echo
    log_success "🎉 Deployment completed successfully!"
    echo
    echo "📋 Deployment Summary:"
    echo "======================"
    echo "Version:      $version"
    echo "URL:          $app_url"
    echo "Deployed at:  $(date)"
    echo "Log file:     $LOG_FILE"
    echo
    echo "🔗 Useful Commands:"
    echo "=================="
    echo "View logs:    railway logs"
    echo "Check status: railway status"
    echo "Rollback:     $0 --rollback"
    echo
}

# Main deployment function
main() {
    echo "🚀 Enhanced Production Deployment"
    echo "================================="
    echo
    
    # Create log directory
    mkdir -p "$(dirname "$LOG_FILE")"
    
    log "Starting deployment process..."
    log "Log file: $LOG_FILE"
    
    # Pre-deployment checks
    check_prerequisites
    validate_environment
    
    # Run tests unless skipped
    if [[ "${SKIP_TESTS:-false}" != "true" ]]; then
        run_tests
    else
        log_warning "Skipping tests (SKIP_TESTS=true)"
    fi
    
    # Create backup
    local backup_file
    backup_file=$(create_backup)
    
    # Build and push Docker image
    local image_tag
    image_tag=$(build_and_push_image)
    
    # Run database migrations
    run_migrations
    
    # Deploy application
    deploy_application "$image_tag"
    
    # Run health checks
    run_health_checks
    
    # Clean up rollback data on successful deployment
    rm -f "$ROLLBACK_DATA_FILE"
    
    # Show summary
    show_deployment_summary
}

# Handle script arguments
case "${1:-}" in
    --help|-h)
        echo "Usage: $0 [OPTIONS]"
        echo
        echo "Options:"
        echo "  --help, -h        Show this help message"
        echo "  --rollback        Rollback to previous deployment"
        echo "  --skip-tests      Skip test execution (emergency deployment)"
        echo "  --version VERSION Set deployment version"
        echo
        echo "Environment Variables:"
        echo "  SKIP_TESTS=true   Skip test execution"
        echo "  VERSION=v1.0.0    Set deployment version"
        echo
        exit 0
        ;;
    --rollback)
        rollback_deployment
        exit 0
        ;;
    --skip-tests)
        export SKIP_TESTS=true
        main
        ;;
    --version)
        export VERSION="$2"
        main
        ;;
    "")
        main
        ;;
    *)
        log_error "Unknown option: $1"
        echo "Use --help for usage information"
        exit 1
        ;;
esac