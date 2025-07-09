# Vercel Deployment Guide

## Overview
This guide will help you deploy your Household Services Platform to Vercel. The deployment strategy is:
- **Frontend**: Deploy to Vercel (Next.js)
- **Backend**: Deploy to Railway/Render (Express.js API)
- **Database**: MongoDB Atlas

## Prerequisites
1. Vercel account (free tier available)
2. Railway/Render account for backend
3. MongoDB Atlas account
4. Stripe account (for payments)

## Step 1: Database Setup (MongoDB Atlas)

1. **Create MongoDB Atlas Cluster**:
   - Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
   - Create a free cluster
   - Get your connection string

2. **Update Database URL**:
   - Replace `mongodb://localhost:27017/household-services` with your Atlas connection string
   - Format: `mongodb+srv://username:password@cluster.mongodb.net/household-services?retryWrites=true&w=majority`

## Step 2: Backend Deployment (Railway)

1. **Deploy Backend to Railway**:
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli
   
   # Login to Railway
   railway login
   
   # Deploy backend
   cd backend
   railway init
   railway up
   ```

2. **Set Environment Variables in Railway**:
   - Go to your Railway project dashboard
   - Add all variables from `backend/env.example`
   - Update `DATABASE_URL` with your MongoDB Atlas connection string
   - Update `FRONTEND_URL` with your Vercel frontend URL (after deployment)

## Step 3: Frontend Deployment (Vercel)

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy Frontend**:
   ```bash
   cd frontend
   vercel
   ```

4. **Set Environment Variables in Vercel**:
   - Go to your Vercel project dashboard
   - Navigate to Settings > Environment Variables
   - Add the following variables:

   ```
   DATABASE_URL=your_mongodb_atlas_connection_string
   JWT_SECRET=your_super_secret_jwt_key
   NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app
   NEXTAUTH_SECRET=your_nextauth_secret
   NEXTAUTH_URL=https://your-vercel-app.vercel.app
   STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
   NEXT_PUBLIC_APP_NAME=Household Services
   NEXT_PUBLIC_APP_URL=https://your-vercel-app.vercel.app
   ```

## Step 4: Update Configuration

1. **Update CORS in Backend**:
   - Add your Vercel frontend URL to `CORS_ORIGINS` in Railway environment variables

2. **Update Next.js Config**:
   - The `next.config.js` is already configured for Vercel deployment

## Step 5: Domain Setup (Optional)

1. **Custom Domain**:
   - In Vercel dashboard, go to Settings > Domains
   - Add your custom domain
   - Update DNS records as instructed

## Step 6: Environment Variables Checklist

### Frontend (Vercel)
- [ ] `DATABASE_URL`
- [ ] `JWT_SECRET`
- [ ] `NEXT_PUBLIC_API_URL`
- [ ] `NEXTAUTH_SECRET`
- [ ] `NEXTAUTH_URL`
- [ ] `STRIPE_SECRET_KEY`
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- [ ] `NEXT_PUBLIC_APP_NAME`
- [ ] `NEXT_PUBLIC_APP_URL`

### Backend (Railway)
- [ ] `DATABASE_URL`
- [ ] `JWT_SECRET`
- [ ] `JWT_EXPIRES_IN`
- [ ] `PORT`
- [ ] `NODE_ENV`
- [ ] `FRONTEND_URL`
- [ ] `CORS_ORIGINS`
- [ ] `STRIPE_SECRET_KEY`
- [ ] `STRIPE_PUBLISHABLE_KEY`
- [ ] `STRIPE_WEBHOOK_SECRET`

## Troubleshooting

### Common Issues:

1. **Build Failures**:
   - Check that all environment variables are set
   - Ensure Prisma schema is up to date
   - Run `npx prisma generate` locally first

2. **Database Connection Issues**:
   - Verify MongoDB Atlas connection string
   - Check network access settings in Atlas
   - Ensure IP whitelist includes 0.0.0.0/0 for cloud deployment

3. **CORS Errors**:
   - Update `CORS_ORIGINS` in backend with your Vercel URL
   - Check that `FRONTEND_URL` is set correctly

4. **API 404 Errors**:
   - Verify `NEXT_PUBLIC_API_URL` points to your Railway backend
   - Check that backend is running and accessible

## Monitoring

1. **Vercel Analytics**:
   - Enable in Vercel dashboard
   - Monitor performance and errors

2. **Railway Logs**:
   - Check Railway dashboard for backend logs
   - Monitor API performance

## Security Checklist

- [ ] Use strong JWT secrets
- [ ] Enable HTTPS (automatic with Vercel/Railway)
- [ ] Set up proper CORS
- [ ] Use environment variables for all secrets
- [ ] Enable rate limiting
- [ ] Set up proper error handling

## Cost Optimization

- **Vercel**: Free tier includes 100GB bandwidth/month
- **Railway**: Free tier includes $5 credit/month
- **MongoDB Atlas**: Free tier includes 512MB storage

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Check Railway backend logs
3. Verify all environment variables are set
4. Test API endpoints locally first 