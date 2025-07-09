# 🚀 Quick Start: Deploy to Vercel

## Prerequisites
- [Vercel Account](https://vercel.com) (free)
- [MongoDB Atlas Account](https://mongodb.com/atlas) (free)
- [Railway Account](https://railway.app) (free tier)
- [Stripe Account](https://stripe.com) (for payments)

## Step 1: Setup (Windows PowerShell)
```powershell
# Run from project root
.\scripts\deploy-vercel.ps1 -Setup
```

## Step 2: Configure Environment Variables

### Frontend (.env.local)
```env
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/household-services
JWT_SECRET=your-super-secret-jwt-key
NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=https://your-vercel-app.vercel.app
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
NEXT_PUBLIC_APP_NAME=Household Services
NEXT_PUBLIC_APP_URL=https://your-vercel-app.vercel.app
```

### Backend (.env)
```env
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/household-services
JWT_SECRET=your-super-secret-jwt-key
FRONTEND_URL=https://your-vercel-app.vercel.app
CORS_ORIGINS=https://your-vercel-app.vercel.app
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
```

## Step 3: Deploy Frontend
```powershell
.\scripts\deploy-vercel.ps1 -Deploy
```

## Step 4: Deploy Backend to Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
cd backend
railway login
railway init
railway up
```

## Step 5: Set Environment Variables in Vercel Dashboard
1. Go to your Vercel project dashboard
2. Settings → Environment Variables
3. Add all variables from frontend/.env.local

## Step 6: Set Environment Variables in Railway Dashboard
1. Go to your Railway project dashboard
2. Variables tab
3. Add all variables from backend/.env

## Your App is Live! 🎉

- **Frontend**: https://your-app.vercel.app
- **Backend**: https://your-backend.railway.app

## Need Help?
- Check `VERCEL_DEPLOYMENT.md` for detailed instructions
- Check deployment logs in Vercel/Railway dashboards
- Test locally first with production environment variables 