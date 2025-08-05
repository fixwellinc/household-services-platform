# Stripe Subscription Integration Guide

This guide covers the comprehensive Stripe integration for subscription payments in the Fixwell household services platform.

## Overview

The Stripe integration provides a complete subscription management system with:
- Subscription creation and management
- Automatic billing cycles
- Webhook processing for real-time updates
- Usage tracking and perk management
- Cancellation controls

## Architecture

### Backend Components

1. **Stripe Service** (`apps/backend/src/services/stripe.js`)
   - Handles all Stripe API interactions
   - Provides mock service for development
   - Manages customers, subscriptions, and payments

2. **Subscription Service** (`apps/backend/src/services/subscriptionService.js`)
   - Business logic for subscription management
   - Perk usage tracking
   - Webhook event processing

3. **Subscription Routes** (`apps/backend/src/routes/subscriptions.js`)
   - REST API endpoints for subscription operations
   - Integration with Stripe and database

4. **Payment Routes** (`apps/backend/src/routes/payments.js`)
   - Payment processing and webhook handling
   - Checkout session creation

### Frontend Components

1. **Subscription Management** (`apps/frontend/components/customer/SubscriptionManagement.tsx`)
   - User interface for subscription management
   - Real-time subscription status display
   - Usage tracking visualization

2. **Subscribe Plan Form** (`apps/frontend/components/customer/SubscribePlanForm.tsx`)
   - Plan selection and subscription creation
   - Stripe Checkout integration

## Setup Instructions

### 1. Environment Variables

Add these environment variables to your backend:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Stripe Price IDs for each plan
STRIPE_STARTER_MONTHLY_PRICE_ID=price_starter_monthly
STRIPE_STARTER_YEARLY_PRICE_ID=price_starter_yearly
STRIPE_HOMECARE_MONTHLY_PRICE_ID=price_homecare_monthly
STRIPE_HOMECARE_YEARLY_PRICE_ID=price_homecare_yearly
STRIPE_PRIORITY_MONTHLY_PRICE_ID=price_priority_monthly
STRIPE_PRIORITY_YEARLY_PRICE_ID=price_priority_yearly
```

### 2. Stripe Dashboard Setup

1. **Create Products and Prices**
   - Create products for each plan (Starter, HomeCare, Priority)
   - Create monthly and yearly prices for each product
   - Note down the price IDs for environment variables

2. **Configure Webhooks**
   - Add webhook endpoint: `https://your-domain.com/api/payments/webhook`
   - Select these events:
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`

3. **Get Webhook Secret**
   - Copy the webhook signing secret to your environment variables

### 3. Database Setup

The subscription system uses these database models:

```sql
-- Subscription table
CREATE TABLE "Subscription" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "tier" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "stripeCustomerId" TEXT,
  "stripeSubscriptionId" TEXT,
  "currentPeriodStart" TIMESTAMP,
  "currentPeriodEnd" TIMESTAMP,
  "canCancel" BOOLEAN NOT NULL DEFAULT true,
  "cancellationBlockedAt" TIMESTAMP,
  "cancellationBlockedReason" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL,
  PRIMARY KEY ("id")
);

-- Subscription usage tracking
CREATE TABLE "SubscriptionUsage" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "subscriptionId" TEXT NOT NULL,
  "tier" TEXT NOT NULL,
  "priorityBookingUsed" BOOLEAN NOT NULL DEFAULT false,
  "priorityBookingUsedAt" TIMESTAMP,
  "priorityBookingCount" INTEGER NOT NULL DEFAULT 0,
  "discountUsed" BOOLEAN NOT NULL DEFAULT false,
  "discountUsedAt" TIMESTAMP,
  "discountAmount" REAL NOT NULL DEFAULT 0,
  "freeServiceUsed" BOOLEAN NOT NULL DEFAULT false,
  "freeServiceUsedAt" TIMESTAMP,
  "freeServiceType" TEXT,
  "emergencyServiceUsed" BOOLEAN NOT NULL DEFAULT false,
  "emergencyServiceUsedAt" TIMESTAMP,
  "maxPriorityBookings" INTEGER NOT NULL DEFAULT 0,
  "maxDiscountAmount" REAL NOT NULL DEFAULT 0,
  "maxFreeServices" INTEGER NOT NULL DEFAULT 0,
  "maxEmergencyServices" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL,
  PRIMARY KEY ("id")
);
```

## API Endpoints

### Subscription Management

#### GET `/api/subscriptions/current`
Get current subscription details for authenticated user.

**Response:**
```json
{
  "subscription": {
    "id": "sub_123",
    "tier": "HOMECARE",
    "status": "ACTIVE",
    "stripeCustomerId": "cus_123",
    "stripeSubscriptionId": "sub_456",
    "currentPeriodStart": "2025-01-01T00:00:00Z",
    "currentPeriodEnd": "2025-02-01T00:00:00Z",
    "canCancel": true,
    "plan": {
      "name": "HomeCare Plan",
      "monthlyPrice": 54.99,
      "yearlyPrice": 593.89
    },
    "usage": {
      "priorityBookingCount": 1,
      "maxPriorityBookings": 2,
      "discountAmount": 25.00,
      "maxDiscountAmount": 50.00
    }
  }
}
```

#### POST `/api/subscriptions/create`
Create a new subscription.

**Request:**
```json
{
  "tier": "HOMECARE",
  "billingPeriod": "monthly"
}
```

**Response:**
```json
{
  "subscription": {
    "id": "sub_123",
    "tier": "HOMECARE",
    "status": "INCOMPLETE"
  },
  "clientSecret": "pi_123_secret_456",
  "requiresAction": true
}
```

#### POST `/api/subscriptions/cancel`
Cancel current subscription.

**Response:**
```json
{
  "message": "Subscription cancelled successfully"
}
```

#### POST `/api/subscriptions/checkout-session`
Create Stripe Checkout session for subscription.

**Request:**
```json
{
  "tier": "HOMECARE",
  "billingPeriod": "monthly",
  "successUrl": "https://example.com/success",
  "cancelUrl": "https://example.com/cancel"
}
```

**Response:**
```json
{
  "sessionId": "cs_123",
  "url": "https://checkout.stripe.com/pay/cs_123"
}
```

### Usage Tracking

#### POST `/api/subscriptions/track-perk`
Track perk usage.

**Request:**
```json
{
  "perkType": "priorityBooking",
  "details": {
    "serviceType": "cleaning"
  }
}
```

#### GET `/api/subscriptions/usage`
Get usage summary.

#### GET `/api/subscriptions/can-use-perk/:perkType`
Check if user can use a specific perk.

## Webhook Processing

The system automatically processes these Stripe webhook events:

### `customer.subscription.created`
- Creates or updates subscription in database
- Sets billing period dates
- Initializes usage tracking

### `customer.subscription.updated`
- Updates subscription status
- Syncs billing period changes

### `customer.subscription.deleted`
- Marks subscription as cancelled
- Preserves usage data

### `invoice.payment_succeeded`
- Activates subscription
- Updates payment status

### `invoice.payment_failed`
- Marks subscription as past due
- Triggers payment failure handling

## Usage Tracking System

### Perk Types

1. **Priority Booking**
   - Allows faster booking scheduling
   - Limited per billing period

2. **Discount**
   - Percentage or fixed amount discounts
   - Cumulative tracking

3. **Free Service**
   - One-time free service per period
   - Service type tracking

4. **Emergency Service**
   - Same-day emergency callouts
   - Limited availability

### Cancellation Controls

- Subscriptions are blocked from cancellation if perks have been used
- Automatic blocking when perks are consumed
- Manual override available for admins

## Frontend Integration

### Subscription Management Component

```tsx
import SubscriptionManagement from '@/components/customer/SubscriptionManagement';

// In your page or component
<SubscriptionManagement />
```

### Features

- Real-time subscription status
- Usage tracking visualization
- Cancellation with confirmation
- Plan change options
- Billing period display

## Testing

### Development Mode

The system includes a mock Stripe service for development:

- No real Stripe API calls
- Simulated responses
- Full functionality testing
- Webhook simulation

### Production Testing

1. **Test Cards**
   - Use Stripe test card numbers
   - Test different payment scenarios

2. **Webhook Testing**
   - Use Stripe CLI for local testing
   - Verify webhook processing

## Security Considerations

1. **Webhook Verification**
   - All webhooks are signature verified
   - Prevents replay attacks

2. **Authentication**
   - All endpoints require authentication
   - User-specific data isolation

3. **Error Handling**
   - Comprehensive error logging
   - Graceful failure handling

## Monitoring and Maintenance

### Key Metrics

- Subscription conversion rates
- Payment success rates
- Webhook processing times
- Usage pattern analysis

### Common Issues

1. **Webhook Failures**
   - Check webhook endpoint availability
   - Verify signature verification
   - Monitor webhook processing logs

2. **Payment Failures**
   - Monitor payment intent status
   - Handle retry logic
   - Update subscription status

3. **Usage Tracking**
   - Verify perk limits
   - Check cancellation blocking
   - Monitor usage data integrity

## Troubleshooting

### Common Problems

1. **Subscription Not Creating**
   - Check Stripe API keys
   - Verify price IDs
   - Check customer creation

2. **Webhooks Not Processing**
   - Verify webhook endpoint
   - Check signature verification
   - Monitor webhook logs

3. **Usage Not Tracking**
   - Check database connections
   - Verify perk type validation
   - Monitor usage creation

### Debug Mode

Enable debug logging:

```javascript
// In stripe.js
console.log('🔍 Stripe service debug mode enabled');
```

## Support

For issues with the Stripe integration:

1. Check the application logs
2. Verify Stripe dashboard configuration
3. Test with Stripe test mode
4. Review webhook processing

## Future Enhancements

- Subscription upgrades/downgrades
- Prorated billing
- Multiple payment methods
- Subscription analytics
- Advanced usage tracking 