# Production Deployment Script for Flexible Payment Options (Windows PowerShell)
# This script handles the complete deployment process for production on Windows

param(
    [switch]$SkipBackup,
    [switch]$SkipHealthCheck,
    [string]$Environment = "production"
)

# Configuration
$BackupDir = "C:\backups\fixwell"
$LogDir = "C:\logs\fixwell"
$AppDir = "C:\inetpub\wwwroot\fixwell"
$NodeEnv = $Environment

# Functions
function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Check if running as Administrator
function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# Create necessary directories
function New-Directories {
    Write-Info "Creating necessary directories..."
    
    if (!(Test-Path $BackupDir)) {
        New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
    }
    
    if (!(Test-Path $LogDir)) {
        New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
    }
    
    if (!(Test-Path "$AppDir\uploads")) {
        New-Item -ItemType Directory -Path "$AppDir\uploads" -Force | Out-Null
    }
    
    Write-Success "Directories created successfully"
}

# Backup current system
function Backup-System {
    if ($SkipBackup) {
        Write-Warning "Skipping backup as requested"
        return
    }
    
    Write-Info "Creating system backup..."
    
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $backupFile = "$BackupDir\pre_deployment_backup_$timestamp.zip"
    
    try {
        # Backup application files
        Compress-Archive -Path "$AppDir\*" -DestinationPath $backupFile -Force
        
        # Backup database using Node.js script
        if ($env:DATABASE_URL) {
            Write-Info "Backing up database..."
            Set-Location $AppDir
            node "scripts\rollback-procedures.js" backup "pre_deployment_$timestamp"
        }
        
        Write-Success "System backup created: $backupFile"
    }
    catch {
        Write-Error "Backup failed: $($_.Exception.Message)"
        throw
    }
}

# Validate environment variables
function Test-Environment {
    Write-Info "Validating environment variables..."
    
    $requiredVars = @(
        "DATABASE_URL",
        "JWT_SECRET",
        "STRIPE_SECRET_KEY",
        "STRIPE_PUBLISHABLE_KEY",
        "STRIPE_WEBHOOK_SECRET"
    )
    
    $missingVars = @()
    
    foreach ($var in $requiredVars) {
        if (!(Get-Item "env:$var" -ErrorAction SilentlyContinue)) {
            $missingVars += $var
        }
    }
    
    if ($missingVars.Count -gt 0) {
        Write-Error "Missing required environment variables:"
        foreach ($var in $missingVars) {
            Write-Host "  - $var" -ForegroundColor Red
        }
        throw "Environment validation failed"
    }
    
    # Validate Stripe keys format
    if ($env:STRIPE_SECRET_KEY -notmatch "^sk_(test_|live_)") {
        Write-Error "Invalid Stripe secret key format"
        throw "Invalid Stripe configuration"
    }
    
    if ($env:STRIPE_PUBLISHABLE_KEY -notmatch "^pk_(test_|live_)") {
        Write-Error "Invalid Stripe publishable key format"
        throw "Invalid Stripe configuration"
    }
    
    # Check if using production keys
    if ($env:STRIPE_SECRET_KEY -match "^sk_test_") {
        Write-Warning "Using Stripe test keys in production environment"
        $response = Read-Host "Continue anyway? (y/N)"
        if ($response -ne "y" -and $response -ne "Y") {
            throw "Deployment cancelled"
        }
    }
    
    Write-Success "Environment validation completed"
}

# Install dependencies
function Install-Dependencies {
    Write-Info "Installing production dependencies..."
    
    Set-Location $AppDir
    
    try {
        # Install Node.js dependencies
        npm ci --only=production
        
        # Install PM2 globally if not present
        $pm2Installed = Get-Command pm2 -ErrorAction SilentlyContinue
        if (!$pm2Installed) {
            npm install -g pm2
        }
        
        Write-Success "Dependencies installed successfully"
    }
    catch {
        Write-Error "Dependency installation failed: $($_.Exception.Message)"
        throw
    }
}

# Run database migrations
function Invoke-Migrations {
    Write-Info "Running database migrations..."
    
    Set-Location $AppDir
    
    try {
        # Generate Prisma client
        npx prisma generate
        
        # Run migrations
        npx prisma migrate deploy
        
        # Run custom production migration
        if (Test-Path "prisma\migrations\production_deployment.sql") {
            Write-Info "Running production-specific migrations..."
            # Note: You'll need to install PostgreSQL client tools for psql command
            # Or use a Node.js script to execute the SQL
            node -e "
                const { PrismaClient } = require('@prisma/client');
                const fs = require('fs');
                const prisma = new PrismaClient();
                const sql = fs.readFileSync('prisma/migrations/production_deployment.sql', 'utf8');
                prisma.\$executeRawUnsafe(sql).then(() => {
                    console.log('Production migration completed');
                    process.exit(0);
                }).catch((error) => {
                    console.error('Migration failed:', error);
                    process.exit(1);
                });
            "
        }
        
        Write-Success "Database migrations completed"
    }
    catch {
        Write-Error "Database migration failed: $($_.Exception.Message)"
        throw
    }
}

# Configure IIS (Windows-specific)
function Set-IISConfiguration {
    Write-Info "Configuring IIS..."
    
    try {
        # Import WebAdministration module
        Import-Module WebAdministration -ErrorAction SilentlyContinue
        
        # Create application pool
        $poolName = "FixwellAppPool"
        if (!(Get-IISAppPool -Name $poolName -ErrorAction SilentlyContinue)) {
            New-WebAppPool -Name $poolName
            Set-ItemProperty -Path "IIS:\AppPools\$poolName" -Name processModel.identityType -Value ApplicationPoolIdentity
            Set-ItemProperty -Path "IIS:\AppPools\$poolName" -Name recycling.periodicRestart.time -Value "00:00:00"
        }
        
        # Create website
        $siteName = "Fixwell"
        if (!(Get-Website -Name $siteName -ErrorAction SilentlyContinue)) {
            New-Website -Name $siteName -Port 80 -PhysicalPath $AppDir -ApplicationPool $poolName
        }
        
        Write-Success "IIS configuration completed"
    }
    catch {
        Write-Warning "IIS configuration failed (may not be available): $($_.Exception.Message)"
    }
}

# Start services using PM2
function Start-Services {
    Write-Info "Starting application services..."
    
    Set-Location $AppDir
    
    try {
        # Create PM2 ecosystem file
        $ecosystemConfig = @"
module.exports = {
  apps: [
    {
      name: 'fixwell-backend',
      script: 'apps/backend/src/app.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: '$NodeEnv',
        PORT: 5000
      },
      error_file: '$LogDir/backend-error.log',
      out_file: '$LogDir/backend-out.log',
      log_file: '$LogDir/backend-combined.log',
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
        NODE_ENV: '$NodeEnv',
        PORT: 3000
      },
      error_file: '$LogDir/frontend-error.log',
      out_file: '$LogDir/frontend-out.log',
      log_file: '$LogDir/frontend-combined.log',
      time: true
    }
  ]
};
"@
        
        $ecosystemConfig | Out-File -FilePath "ecosystem.config.js" -Encoding UTF8
        
        # Start applications with PM2
        pm2 start ecosystem.config.js
        pm2 save
        
        Write-Success "Application services started"
    }
    catch {
        Write-Error "Service startup failed: $($_.Exception.Message)"
        throw
    }
}

# Run health checks
function Test-HealthChecks {
    if ($SkipHealthCheck) {
        Write-Warning "Skipping health checks as requested"
        return $true
    }
    
    Write-Info "Running health checks..."
    
    # Wait for services to start
    Start-Sleep -Seconds 10
    
    try {
        # Check backend health
        $backendResponse = Invoke-WebRequest -Uri "http://localhost:5000/health" -UseBasicParsing -TimeoutSec 30
        if ($backendResponse.StatusCode -eq 200) {
            Write-Success "Backend health check passed"
        } else {
            Write-Error "Backend health check failed with status: $($backendResponse.StatusCode)"
            return $false
        }
        
        # Check frontend
        $frontendResponse = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 30
        if ($frontendResponse.StatusCode -eq 200) {
            Write-Success "Frontend health check passed"
        } else {
            Write-Error "Frontend health check failed with status: $($frontendResponse.StatusCode)"
            return $false
        }
        
        # Check database connectivity
        $dbCheck = node -e "
            const { PrismaClient } = require('@prisma/client');
            const prisma = new PrismaClient();
            prisma.user.count().then(() => {
                console.log('Database connection successful');
                process.exit(0);
            }).catch((error) => {
                console.error('Database connection failed:', error);
                process.exit(1);
            });
        "
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Database health check passed"
        } else {
            Write-Error "Database health check failed"
            return $false
        }
        
        Write-Success "All health checks passed"
        return $true
    }
    catch {
        Write-Error "Health check failed: $($_.Exception.Message)"
        return $false
    }
}

# Setup Windows Task Scheduler jobs
function Set-ScheduledTasks {
    Write-Info "Setting up scheduled tasks..."
    
    try {
        # Create task for processing subscription pauses
        $action1 = New-ScheduledTaskAction -Execute "node" -Argument "-e `"require('./apps/backend/src/services/subscriptionPauseService').processGracePeriodExpirations()`"" -WorkingDirectory $AppDir
        $trigger1 = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Hours 1) -RepetitionDuration (New-TimeSpan -Days 365)
        $settings1 = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
        Register-ScheduledTask -TaskName "Fixwell-ProcessSubscriptionPauses" -Action $action1 -Trigger $trigger1 -Settings $settings1 -Force
        
        # Create task for daily analytics
        $action2 = New-ScheduledTaskAction -Execute "node" -Argument "-e `"require('./apps/backend/src/services/analyticsService').generateDailyReport()`"" -WorkingDirectory $AppDir
        $trigger2 = New-ScheduledTaskTrigger -Daily -At "02:00"
        Register-ScheduledTask -TaskName "Fixwell-DailyAnalytics" -Action $action2 -Trigger $trigger2 -Settings $settings1 -Force
        
        # Create task for daily backup
        $action3 = New-ScheduledTaskAction -Execute "node" -Argument "scripts/rollback-procedures.js backup daily_auto_backup" -WorkingDirectory $AppDir
        $trigger3 = New-ScheduledTaskTrigger -Daily -At "03:00"
        Register-ScheduledTask -TaskName "Fixwell-DailyBackup" -Action $action3 -Trigger $trigger3 -Settings $settings1 -Force
        
        Write-Success "Scheduled tasks configured"
    }
    catch {
        Write-Warning "Scheduled task setup failed: $($_.Exception.Message)"
    }
}

# Main deployment function
function Start-Deployment {
    Write-Info "Starting production deployment for Flexible Payment Options..."
    
    try {
        if (!(Test-Administrator)) {
            Write-Error "This script must be run as Administrator"
            throw "Insufficient permissions"
        }
        
        New-Directories
        Backup-System
        Test-Environment
        Install-Dependencies
        Invoke-Migrations
        Set-IISConfiguration
        Start-Services
        Set-ScheduledTasks
        
        if (Test-HealthChecks) {
            Write-Success "Production deployment completed successfully!"
            Write-Info "Application is running at:"
            Write-Info "  Frontend: http://localhost:3000"
            Write-Info "  Backend API: http://localhost:5000"
            Write-Info "  Health Check: http://localhost:5000/health"
            Write-Info ""
            Write-Info "Monitoring:"
            Write-Info "  Logs: $LogDir"
            Write-Info "  Backups: $BackupDir"
            Write-Info "  PM2 Status: pm2 status"
            Write-Info ""
            Write-Info "To rollback if needed:"
            Write-Info "  Set-Location $AppDir; node scripts/rollback-procedures.js complete-rollback"
        } else {
            Write-Error "Deployment completed but health checks failed"
            Write-Error "Check logs in $LogDir for details"
            throw "Health checks failed"
        }
    }
    catch {
        Write-Error "Deployment failed: $($_.Exception.Message)"
        Write-Error "Check logs for details and consider running rollback procedures"
        throw
    }
}

# Run main function
Start-Deployment