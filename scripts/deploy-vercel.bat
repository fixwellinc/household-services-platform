@echo off
REM Vercel Deployment Script for Household Services Platform (Windows)
REM This script helps deploy the frontend to Vercel

echo 🚀 Starting Vercel deployment for Household Services Platform...

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Error: Please run this script from the project root directory
    pause
    exit /b 1
)

REM Check if frontend directory exists
if not exist "frontend" (
    echo ❌ Error: Frontend directory not found
    pause
    exit /b 1
)

echo [INFO] Checking prerequisites...

REM Check if Vercel CLI is installed
vercel --version >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Vercel CLI not found. Installing...
    npm install -g vercel
)

REM Check if user is logged in to Vercel
vercel whoami >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Not logged in to Vercel. Please login...
    vercel login
)

echo [INFO] Preparing frontend for deployment...

REM Navigate to frontend directory
cd frontend

REM Check if .env.local exists, if not create from example
if not exist ".env.local" (
    echo [WARNING] No .env.local found. Creating from example...
    if exist "env.example" (
        copy env.example .env.local
        echo [WARNING] Please update .env.local with your production values before deploying
    ) else (
        echo ❌ Error: env.example not found. Please create .env.local manually
        pause
        exit /b 1
    )
)

REM Install dependencies
echo [INFO] Installing frontend dependencies...
call npm install

REM Generate Prisma client
echo [INFO] Generating Prisma client...
call npx prisma generate

REM Build the project
echo [INFO] Building the project...
call npm run build

echo [INFO] Deploying to Vercel...

REM Deploy to Vercel
vercel --prod
if errorlevel 1 (
    echo ❌ Error: Deployment failed!
    echo [INFO] Check the error messages above and try again
    pause
    exit /b 1
) else (
    echo ✅ Deployment completed successfully!
    echo [INFO] Your app should be available at the URL shown above
    echo [INFO] Don't forget to:
    echo [INFO] 1. Set up environment variables in Vercel dashboard
    echo [INFO] 2. Deploy your backend to Railway/Render
    echo [INFO] 3. Update CORS settings in your backend
    echo [INFO] 4. Test all functionality
)

echo 🎉 Deployment script completed!
pause 