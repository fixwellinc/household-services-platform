# 🚀 Unified Deployment Quick Start

This guide will help you deploy the Household Services Platform as a **single unified application** on Railway.

## ✅ What You'll Get

- **Single URL** for both frontend and backend
- **No CORS issues** - everything runs on the same domain
- **Simplified deployment** - one command to deploy everything
- **Cost effective** - only one hosting service needed

## 🛠️ Prerequisites

1. **Railway Account**: [railway.app](https://railway.app)
2. **MongoDB Database**: [mongodb.com](https://mongodb.com) or Railway MongoDB
3. **Stripe Account**: [stripe.com](https://stripe.com) (for payments)

## 🚀 Quick Deployment

### Step 1: Prepare Your Repository

```bash
# Clone the repository
git clone <your-repo-url>
cd Household

# Install dependencies
npm install
```

### Step 2: Set Up Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/household?retryWrites=true&w=majority"

# Authentication
JWT_SECRET="your-super-secret-jwt-key-here"

# Stripe (for payments)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."

# Application
NODE_ENV=production
PORT=3000
```

### Step 3: Deploy to Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Deploy (this will use the Dockerfile)
railway up
```

### Step 4: Configure Railway Environment

1. Go to your Railway dashboard
2. Select your project
3. Go to "Variables" tab
4. Add all the environment variables from Step 2

### Step 5: Set Up Database

```bash
# Connect to your Railway project
railway link

# Run database migrations
railway run npx prisma db push
```

## 🔧 Configuration Details

### Railway Configuration

The project uses `railway.json` for configuration:

```json
{
  "build": {
    "builder": "DOCKERFILE"
  },
  "deploy": {
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 300
  }
}
```

### Docker Configuration

The `Dockerfile` creates a multi-stage build:

1. **Build Stage**: Compiles Next.js frontend and prepares backend
2. **Production Stage**: Creates optimized production image
3. **Unified Server**: Runs both frontend and backend on port 3000

## 🌐 Access Your Application

After deployment, your application will be available at:

- **Frontend**: `https://your-app.railway.app`
- **API**: `https://your-app.railway.app/api/*`
- **Health Check**: `https://your-app.railway.app/api/health`

## 🔍 Verification

### Check Health Endpoint

```bash
curl https://your-app.railway.app/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "production",
  "database": "connected",
  "stripe": "configured"
}
```

### Test Frontend

Visit your Railway URL and verify:
- ✅ Homepage loads
- ✅ Navigation works
- ✅ Forms are functional
- ✅ API calls work (no CORS errors)

## 🛠️ Development Commands

```bash
# Run unified development server
npm run dev:unified

# Build for production
npm run build:unified

# Start production server locally
npm run start:unified

# Deploy to Railway
npm run deploy:unified
```

## 🔧 Troubleshooting

### Common Issues

**Build Fails**
```bash
# Check build logs
railway logs

# Verify Dockerfile syntax
docker build -t household .
```

**Database Connection Issues**
```bash
# Check DATABASE_URL format
# Should be: mongodb+srv://username:password@cluster.mongodb.net/database

# Test connection
railway run npx prisma db push
```

**API Not Working**
```bash
# Check if backend is running
curl https://your-app.railway.app/api/health

# Check logs for errors
railway logs
```

**Frontend Not Loading**
```bash
# Check if Next.js build succeeded
railway logs

# Verify environment variables
railway variables
```

### Getting Help

- **Railway Docs**: [docs.railway.app](https://docs.railway.app)
- **Railway Discord**: [discord.gg/railway](https://discord.gg/railway)
- **Project Issues**: GitHub Issues

## 🎉 Success!

Your unified Household Services Platform is now deployed with:

- ✅ Single Railway deployment
- ✅ No CORS configuration needed
- ✅ Unified logging and monitoring
- ✅ Automatic SSL certificates
- ✅ Scalable infrastructure
- ✅ Monospace typography (JetBrains Mono)

Monitor your application through the Railway dashboard and enjoy the simplified deployment! 🚀 