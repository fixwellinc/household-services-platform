# Vercel Deployment Script for Household Services Platform (PowerShell)
# This script helps deploy the frontend to Vercel

param(
    [switch]$Setup,
    [switch]$Deploy
)

Write-Host "🚀 Household Services Platform - Vercel Deployment" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# Function to write colored output
function Write-Status {
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

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Error "Please run this script from the project root directory"
    exit 1
}

# Check if frontend directory exists
if (-not (Test-Path "frontend")) {
    Write-Error "Frontend directory not found"
    exit 1
}

if ($Setup) {
    Write-Status "Running setup mode..."
    
    # Install all dependencies
    Write-Status "Installing all dependencies..."
    npm install
    
    # Install frontend dependencies
    Set-Location frontend
    npm install
    npx prisma generate
    
    # Install backend dependencies
    Set-Location ../backend
    npm install
    npx prisma generate
    
    Set-Location ..
    
    # Create environment files
    Write-Status "Setting up environment files..."
    
    if (-not (Test-Path "frontend/.env.local")) {
        if (Test-Path "frontend/env.example") {
            Copy-Item "frontend/env.example" "frontend/.env.local"
            Write-Warning "Created frontend/.env.local from example"
            Write-Warning "Please update it with your production values"
        }
    }
    
    if (-not (Test-Path "backend/.env")) {
        if (Test-Path "backend/env.example") {
            Copy-Item "backend/env.example" "backend/.env"
            Write-Warning "Created backend/.env from example"
            Write-Warning "Please update it with your production values"
        }
    }
    
    # Test build
    Write-Status "Testing build process..."
    Set-Location frontend
    if (npm run build) {
        Write-Success "Frontend builds successfully"
    } else {
        Write-Error "Frontend build failed"
        exit 1
    }
    Set-Location ..
    
    Write-Success "Setup completed successfully!"
    Write-Status "Next steps:"
    Write-Status "1. Update environment variables in frontend/.env.local and backend/.env"
    Write-Status "2. Set up MongoDB Atlas database"
    Write-Status "3. Configure Stripe keys"
    Write-Status "4. Run this script with -Deploy flag to deploy frontend"
    Write-Status "5. Deploy backend to Railway/Render"
}

if ($Deploy) {
    Write-Status "Running deployment mode..."
    
    # Check if Vercel CLI is installed
    try {
        $null = Get-Command vercel -ErrorAction Stop
    } catch {
        Write-Warning "Vercel CLI not found. Installing..."
        npm install -g vercel
    }
    
    # Check if user is logged in to Vercel
    try {
        $null = vercel whoami 2>$null
    } catch {
        Write-Warning "Not logged in to Vercel. Please login..."
        vercel login
    }
    
    Write-Status "Preparing frontend for deployment..."
    
    # Navigate to frontend directory
    Set-Location frontend
    
    # Check if .env.local exists
    if (-not (Test-Path ".env.local")) {
        Write-Warning "No .env.local found. Creating from example..."
        if (Test-Path "env.example") {
            Copy-Item "env.example" ".env.local"
            Write-Warning "Please update .env.local with your production values before deploying"
        } else {
            Write-Error "env.example not found. Please create .env.local manually"
            exit 1
        }
    }
    
    # Install dependencies
    Write-Status "Installing frontend dependencies..."
    npm install
    
    # Generate Prisma client
    Write-Status "Generating Prisma client..."
    npx prisma generate
    
    # Build the project
    Write-Status "Building the project..."
    npm run build
    
    Write-Status "Deploying to Vercel..."
    
    # Deploy to Vercel
    if (vercel --prod) {
        Write-Success "Deployment completed successfully!"
        Write-Status "Your app should be available at the URL shown above"
        Write-Status "Don't forget to:"
        Write-Status "1. Set up environment variables in Vercel dashboard"
        Write-Status "2. Deploy your backend to Railway/Render"
        Write-Status "3. Update CORS settings in your backend"
        Write-Status "4. Test all functionality"
    } else {
        Write-Error "Deployment failed!"
        Write-Status "Check the error messages above and try again"
        exit 1
    }
    
    Set-Location ..
    Write-Success "🎉 Deployment script completed!"
}

if (-not $Setup -and -not $Deploy) {
    Write-Host "Usage:" -ForegroundColor Yellow
    Write-Host "  .\scripts\deploy-vercel.ps1 -Setup    # Run setup and prepare environment" -ForegroundColor White
    Write-Host "  .\scripts\deploy-vercel.ps1 -Deploy   # Deploy frontend to Vercel" -ForegroundColor White
    Write-Host ""
    Write-Host "Example:" -ForegroundColor Yellow
    Write-Host "  .\scripts\deploy-vercel.ps1 -Setup" -ForegroundColor White
    Write-Host "  .\scripts\deploy-vercel.ps1 -Deploy" -ForegroundColor White
} 