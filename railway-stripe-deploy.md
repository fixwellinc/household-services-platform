# 🚀 Railway Stripe Deployment Guide

## 📋 Pre-Deployment Checklist

### 1. **Get Test Keys First** ⚠️
- Go to [Stripe Dashboard](https://dashboard.stripe.com/)
- Toggle to **TEST MODE**
- Copy test keys (start with `sk_test_` and `pk_test_`)

### 2. **Test Locally with Test Keys**
```bash
# Backend
cd apps/backend
# Use test keys in .env
npm start

# Frontend (new terminal)
cd apps/frontend
# Use test keys in .env.local
npm run dev
```

### 3. **Verify Local Testing**
- Visit: `http://localhost:3000/test-stripe`
- All tests should pass ✅
- No real charges will be made

## 🚀 Railway Deployment Steps

### Step 1: Set Environment Variables in Railway

**Backend Service:**
```
STRIPE_SECRET_KEY=your_live_secret_key_here
STRIPE_PUBLISHABLE_KEY=your_live_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_BASIC_MONTHLY_PRICE_ID=price_your_basic_monthly_id
STRIPE_BASIC_YEARLY_PRICE_ID=price_your_basic_yearly_id
STRIPE_PLUS_MONTHLY_PRICE_ID=price_your_plus_monthly_id
STRIPE_PLUS_YEARLY_PRICE_ID=price_your_plus_yearly_id
STRIPE_PREMIER_MONTHLY_PRICE_ID=price_your_premier_monthly_id
STRIPE_PREMIER_YEARLY_PRICE_ID=price_your_premier_yearly_id
```

**Frontend Service:**
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_live_publishable_key_here
```

### Step 2: Deploy to Railway

```bash
# Deploy backend
cd apps/backend
railway up

# Deploy frontend
cd apps/frontend
railway up
```

### Step 3: Configure Webhooks in Stripe

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/) (LIVE MODE)
2. **Developers** → **Webhooks**
3. **Add endpoint**
4. **Endpoint URL:** `https://your-railway-domain.railway.app/api/webhooks/stripe`
5. **Events to send:**
   - `payment_intent.succeeded`
   - `invoice.payment_succeeded`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`

### Step 4: Test Production Deployment

1. Visit your Railway domain: `https://your-app.railway.app/test-stripe`
2. Click "Test Stripe Connectivity"
3. Verify all tests pass ✅

## 🔍 Post-Deployment Verification

### 1. **Health Check**
- Railway health check: `/api/health`
- Should show Stripe as "configured"

### 2. **Stripe Dashboard Verification**
- Check Stripe Dashboard for any test charges
- Verify webhook endpoints are receiving events
- Monitor for any errors

### 3. **Real Transaction Test** (Optional)
- Use a real card with a small amount ($1-5)
- Verify payment goes through
- Check Stripe Dashboard for transaction
- Verify webhook events are received

## 🚨 Safety Protocols

### **Before Going Live:**
1. ✅ Local testing with test keys passes
2. ✅ Railway deployment successful
3. ✅ Production Stripe test passes
4. ✅ Webhooks configured and tested
5. ✅ Products and prices created in live Stripe
6. ✅ Small amount test transaction successful

### **During Initial Launch:**
1. Monitor Stripe Dashboard closely
2. Start with small amounts only
3. Have Stripe support contact ready
4. Test with trusted users first

## 🔧 Troubleshooting

### **Common Railway Issues:**
- Environment variables not set correctly
- CORS configuration problems
- Port configuration mismatches
- Build failures due to missing dependencies

### **Common Stripe Issues:**
- Invalid API keys
- Webhook signature verification failures
- Missing products/prices
- CORS issues with Stripe.js

## 📞 Support Resources

- **Stripe Support:** [support.stripe.com](https://support.stripe.com)
- **Railway Support:** [railway.app/support](https://railway.app/support)
- **Stripe Documentation:** [stripe.com/docs](https://stripe.com/docs)

## 🎯 Next Steps After Deployment

1. **Monitor Stripe Dashboard** for 24-48 hours
2. **Test webhook endpoints** with real transactions
3. **Verify subscription flows** work correctly
4. **Set up Stripe Analytics** and monitoring
5. **Configure Stripe Radar** for fraud detection
6. **Set up Stripe Billing** for subscription management