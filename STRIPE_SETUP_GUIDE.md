# Stripe Setup Guide

## Current Issue
The subscription system is failing because the Stripe price IDs don't exist in your Stripe dashboard. Here's how to fix this:

## Quick Setup Steps

### 1. Create Products in Stripe Dashboard

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Navigate to **Products** → **Add Product**

#### Create Starter Plan Product:
- **Name**: "Starter Plan"
- **Description**: "Perfect for light upkeep & peace of mind"
- **Price**: $21.99/month
- **Billing**: Recurring (monthly)
- **Note down the Price ID** (starts with `price_`)

#### Create HomeCare Plan Product:
- **Name**: "HomeCare Plan" 
- **Description**: "Monthly help for ongoing maintenance and upkeep"
- **Price**: $54.99/month
- **Billing**: Recurring (monthly)
- **Note down the Price ID**

#### Create Priority Plan Product:
- **Name**: "Priority Plan"
- **Description**: "For homeowners who want their home proactively managed"
- **Price**: $120.99/month
- **Billing**: Recurring (monthly)
- **Note down the Price ID**

### 2. Add Environment Variables

Add these to your Railway environment variables:

```bash
STRIPE_STARTER_MONTHLY_PRICE_ID=price_xxxxxxxxxxxxx
STRIPE_HOMECARE_MONTHLY_PRICE_ID=price_xxxxxxxxxxxxx
STRIPE_PRIORITY_MONTHLY_PRICE_ID=price_xxxxxxxxxxxxx
```

Replace `price_xxxxxxxxxxxxx` with the actual price IDs from your Stripe dashboard.

### 3. Configure Webhooks (Optional but Recommended)

1. In Stripe Dashboard, go to **Developers** → **Webhooks**
2. Add endpoint: `https://fixwell.ca/api/payments/webhook`
3. Select these events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy the webhook signing secret and add as `STRIPE_WEBHOOK_SECRET`

## Current Workaround

Until you set up the real Stripe products, the system will use mock responses for testing. This allows you to:

- Test the subscription flow
- Verify the UI works correctly
- Test subscription management features

The mock system will redirect directly to the success page instead of going through Stripe's checkout.

## Testing

1. Try subscribing to a plan
2. You should be redirected to the success page
3. Check the subscription management page
4. Test cancellation features

## Next Steps

1. Create the products in Stripe as described above
2. Add the environment variables
3. Deploy the changes
4. Test with real Stripe checkout

## Environment Variables to Add

```bash
# Stripe Price IDs (replace with actual IDs from your Stripe dashboard)
STRIPE_STARTER_MONTHLY_PRICE_ID=price_xxxxxxxxxxxxx
STRIPE_STARTER_YEARLY_PRICE_ID=price_xxxxxxxxxxxxx
STRIPE_HOMECARE_MONTHLY_PRICE_ID=price_xxxxxxxxxxxxx
STRIPE_HOMECARE_YEARLY_PRICE_ID=price_xxxxxxxxxxxxx
STRIPE_PRIORITY_MONTHLY_PRICE_ID=price_xxxxxxxxxxxxx
STRIPE_PRIORITY_YEARLY_PRICE_ID=price_xxxxxxxxxxxxx

# Webhook Secret (optional)
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

## Support

If you need help setting up Stripe:
1. Check the [Stripe Documentation](https://stripe.com/docs)
2. Use Stripe's test mode for development
3. Contact Stripe support if needed 