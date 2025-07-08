# Vercel Deployment Guide

## Environment Variables Setup

To fix the deployment error, you need to set the following environment variables in your Vercel dashboard:

### Required Environment Variables

1. **NEXT_PUBLIC_API_URL**
   - Value: `https://household-services-platform-production.up.railway.app/api`
   - Description: The URL of your Railway backend API

2. **NEXT_PUBLIC_APP_NAME**
   - Value: `Household Services`
   - Description: The name of your application

3. **NEXT_PUBLIC_APP_URL**
   - Value: `https://household-services-zeta.vercel.app`
   - Description: The URL of your Vercel deployment

### How to Set Environment Variables in Vercel

1. Go to your Vercel dashboard
2. Select your project (`household-services-zeta`)
3. Go to **Settings** tab
4. Click on **Environment Variables**
5. Add each variable:
   - **Name**: `NEXT_PUBLIC_API_URL`
   - **Value**: `https://household-services-platform-production.up.railway.app/api`
   - **Environment**: Production, Preview, Development
6. Repeat for other variables
7. Click **Save**
8. Redeploy your application

### Testing the Deployment

After setting the environment variables:

1. Visit: `https://household-services-zeta.vercel.app/test-api`
2. This will show you if the API connection is working
3. Check the environment variables are set correctly

### Common Issues

1. **API Connection Failed**: Make sure your Railway backend is running
2. **Environment Variables Not Set**: Double-check the variable names and values
3. **Build Errors**: Check the build logs in Vercel dashboard

### Current Configuration

- **Framework**: Next.js 14
- **Build Command**: `cd frontend && npm install && npm run build`
- **Output Directory**: `frontend/.next`
- **Install Command**: `cd frontend && npm install`

### API Rewrites

The application uses Next.js rewrites to proxy API requests to your Railway backend:

```javascript
// next.config.js
async rewrites() {
  return [
    {
      source: '/api/:path*',
      destination: process.env.NODE_ENV === 'production' 
        ? 'https://household-services-platform-production.up.railway.app/api/:path*'
        : 'http://localhost:5000/api/:path*',
    },
  ];
}
```

This means API requests to `/api/*` will be automatically forwarded to your Railway backend. 