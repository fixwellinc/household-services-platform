#!/bin/bash

# Production Deployment Script for Flexible Payment Options
# This script handles the complete deployment process for production

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR="/var/backups/fixwell"
LOG_DIR="/var/log/fixwell"
APP_DIR="/var/www/fixwell"
NODE_ENV="production"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root or with sudo
check_permissions() {
    if [[ $EUID -ne 0 ]]; then
        log_error "This script must be run as root or with sudo"
        exit 1
    fi
}

# Create necessary directories
create_directories() {
    log_info "Creating necessary directories..."
    
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$LOG_DIR"
    mkdir -p "$APP_DIR/uploads"
    
    # Set proper permissions
    chown -R www-data:www-data "$APP_DIR"
    chmod -R 755 "$APP_DIR"
    chmod -R 777 "$APP_DIR/uploads"
    
    log_success "Directories created successfully"
}

# Backup current system
backup_system() {
    log_info "Creating system backup..."
    
    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    BACKUP_FILE="$BACKUP_DIR/pre_deployment_backup_$TIMESTAMP.tar.gz"
    
    # Backup application files
    tar -czf "$BACKUP_FILE" -C "$APP_DIR" . 2>/dev/null || true
    
    # Backup database
    if [ ! -z "$DATABASE_URL" ]; then
        log_info "Backing up database..."
        node "$APP_DIR/scripts/rollback-procedures.js" backup "pre_deployment_$TIMESTAMP"
    fi
    
    log_success "System backup created: $BACKUP_FILE"
}

# Validate environment variables
validate_environment() {
    log_info "Validating environment variables..."
    
    REQUIRED_VARS=(
        "DATABASE_URL"
        "JWT_SECRET"
        "STRIPE_SECRET_KEY"
        "STRIPE_PUBLISHABLE_KEY"
        "STRIPE_WEBHOOK_SECRET"
    )
    
    MISSING_VARS=()
    
    for var in "${REQUIRED_VARS[@]}"; do
        if [ -z "${!var}" ]; then
            MISSING_VARS+=("$var")
        fi
    done
    
    if [ ${#MISSING_VARS[@]} -ne 0 ]; then
        log_error "Missing required environment variables:"
        for var in "${MISSING_VARS[@]}"; do
            echo "  - $var"
        done
        exit 1
    fi
    
    # Validate Stripe keys format
    if [[ ! "$STRIPE_SECRET_KEY" =~ ^sk_(test_|live_) ]]; then
        log_error "Invalid Stripe secret key format"
        exit 1
    fi
    
    if [[ ! "$STRIPE_PUBLISHABLE_KEY" =~ ^pk_(test_|live_) ]]; then
        log_error "Invalid Stripe publishable key format"
        exit 1
    fi
    
    # Check if using production keys
    if [[ "$STRIPE_SECRET_KEY" =~ ^sk_test_ ]]; then
        log_warning "Using Stripe test keys in production environment"
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    log_success "Environment validation completed"
}

# Install dependencies
install_dependencies() {
    log_info "Installing production dependencies..."
    
    cd "$APP_DIR"
    
    # Install Node.js dependencies
    npm ci --only=production
    
    # Install PM2 globally if not present
    if ! command -v pm2 &> /dev/null; then
        npm install -g pm2
    fi
    
    log_success "Dependencies installed successfully"
}

# Run database migrations
run_migrations() {
    log_info "Running database migrations..."
    
    cd "$APP_DIR"
    
    # Generate Prisma client
    npx prisma generate
    
    # Run migrations
    npx prisma migrate deploy
    
    # Run custom production migration
    if [ -f "prisma/migrations/production_deployment.sql" ]; then
        log_info "Running production-specific migrations..."
        psql "$DATABASE_URL" -f "prisma/migrations/production_deployment.sql"
    fi
    
    log_success "Database migrations completed"
}

# Configure monitoring
setup_monitoring() {
    log_info "Setting up monitoring and logging..."
    
    # Create log rotation configuration
    cat > /etc/logrotate.d/fixwell << EOF
$LOG_DIR/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        systemctl reload nginx > /dev/null 2>&1 || true
        pm2 reload all > /dev/null 2>&1 || true
    endscript
}
EOF
    
    # Setup health check endpoint
    cat > /etc/nginx/sites-available/fixwell-health << EOF
server {
    listen 8080;
    server_name localhost;
    
    location /health {
        proxy_pass http://localhost:5000/health;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }
}
EOF
    
    ln -sf /etc/nginx/sites-available/fixwell-health /etc/nginx/sites-enabled/
    
    log_success "Monitoring setup completed"
}

# Configure SSL/TLS
setup_ssl() {
    log_info "Configuring SSL/TLS..."
    
    if [ ! -z "$SSL_CERT_PATH" ] && [ ! -z "$SSL_KEY_PATH" ]; then
        # Validate SSL certificates
        if openssl x509 -in "$SSL_CERT_PATH" -text -noout > /dev/null 2>&1; then
            log_success "SSL certificate is valid"
        else
            log_error "Invalid SSL certificate"
            exit 1
        fi
        
        # Update Nginx configuration for SSL
        cat > /etc/nginx/sites-available/fixwell-ssl << EOF
server {
    listen 443 ssl http2;
    server_name \$server_name;
    
    ssl_certificate $SSL_CERT_PATH;
    ssl_certificate_key $SSL_KEY_PATH;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    location /api {
        proxy_pass http://localhost:5000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}

server {
    listen 80;
    server_name \$server_name;
    return 301 https://\$server_name\$request_uri;
}
EOF
        
        ln -sf /etc/nginx/sites-available/fixwell-ssl /etc/nginx/sites-enabled/
        nginx -t && systemctl reload nginx
        
        log_success "SSL/TLS configuration completed"
    else
        log_warning "SSL certificate paths not provided, skipping SSL setup"
    fi
}

# Start services
start_services() {
    log_info "Starting application services..."
    
    cd "$APP_DIR"
    
    # Create PM2 ecosystem file
    cat > ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'fixwell-backend',
      script: 'apps/backend/src/app.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      error_file: '$LOG_DIR/backend-error.log',
      out_file: '$LOG_DIR/backend-out.log',
      log_file: '$LOG_DIR/backend-combined.log',
      time: true,
      max_memory_restart: '1G',
      node_args: '--max-old-space-size=1024'
    },
    {
      name: 'fixwell-frontend',
      script: 'npm',
      args: 'start',
      cwd: 'apps/frontend',
      instances: 1,
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '$LOG_DIR/frontend-error.log',
      out_file: '$LOG_DIR/frontend-out.log',
      log_file: '$LOG_DIR/frontend-combined.log',
      time: true
    }
  ]
};
EOF
    
    # Start applications with PM2
    pm2 start ecosystem.config.js
    pm2 save
    pm2 startup
    
    log_success "Application services started"
}

# Run health checks
run_health_checks() {
    log_info "Running health checks..."
    
    # Wait for services to start
    sleep 10
    
    # Check backend health
    if curl -f http://localhost:5000/health > /dev/null 2>&1; then
        log_success "Backend health check passed"
    else
        log_error "Backend health check failed"
        return 1
    fi
    
    # Check frontend
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        log_success "Frontend health check passed"
    else
        log_error "Frontend health check failed"
        return 1
    fi
    
    # Check database connectivity
    if node -e "
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        prisma.user.count().then(() => {
            console.log('Database connection successful');
            process.exit(0);
        }).catch((error) => {
            console.error('Database connection failed:', error);
            process.exit(1);
        });
    "; then
        log_success "Database health check passed"
    else
        log_error "Database health check failed"
        return 1
    fi
    
    log_success "All health checks passed"
}

# Setup cron jobs
setup_cron_jobs() {
    log_info "Setting up cron jobs..."
    
    # Create cron job for processing subscription pauses
    cat > /etc/cron.d/fixwell << EOF
# Process subscription pause expirations every hour
0 * * * * www-data cd $APP_DIR && node -e "require('./apps/backend/src/services/subscriptionPauseService').processGracePeriodExpirations()" >> $LOG_DIR/cron.log 2>&1

# Generate analytics reports daily at 2 AM
0 2 * * * www-data cd $APP_DIR && node -e "require('./apps/backend/src/services/analyticsService').generateDailyReport()" >> $LOG_DIR/cron.log 2>&1

# Backup database daily at 3 AM
0 3 * * * root cd $APP_DIR && node scripts/rollback-procedures.js backup daily_auto_backup >> $LOG_DIR/backup.log 2>&1

# Clean up old logs weekly
0 0 * * 0 root find $LOG_DIR -name "*.log" -mtime +30 -delete
EOF
    
    log_success "Cron jobs configured"
}

# Main deployment function
main() {
    log_info "Starting production deployment for Flexible Payment Options..."
    
    check_permissions
    create_directories
    backup_system
    validate_environment
    install_dependencies
    run_migrations
    setup_monitoring
    setup_ssl
    start_services
    setup_cron_jobs
    
    if run_health_checks; then
        log_success "Production deployment completed successfully!"
        log_info "Application is running at:"
        log_info "  Frontend: http://localhost:3000"
        log_info "  Backend API: http://localhost:5000"
        log_info "  Health Check: http://localhost:8080/health"
        log_info ""
        log_info "Monitoring:"
        log_info "  Logs: $LOG_DIR"
        log_info "  Backups: $BACKUP_DIR"
        log_info "  PM2 Status: pm2 status"
        log_info ""
        log_info "To rollback if needed:"
        log_info "  cd $APP_DIR && node scripts/rollback-procedures.js complete-rollback"
    else
        log_error "Deployment completed but health checks failed"
        log_error "Check logs in $LOG_DIR for details"
        exit 1
    fi
}

# Run main function
main "$@"