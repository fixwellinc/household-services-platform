# BCAA-Style Plans Implementation

This document outlines the complete implementation of BCAA-style subscription plans for the Fixwell Services Platform.

## Overview

The implementation includes a 3-tier subscription model (Basic, Plus, Premier) inspired by BCAA's membership structure, with comprehensive features, pricing, and management tools.

## Plan Structure

### Basic Plan - $19.99/month ($215.89/year)
- **Target**: Essential household services for everyday needs
- **Savings**: $500+ per year
- **Features**:
  - Access to basic household services
  - Standard booking system (7 days advance)
  - Email support
  - Basic service categories (cleaning, maintenance)
  - Standard response time (24 hours)
  - No booking fees
  - Service history tracking
  - Professional service team
  - Basic service guarantees
  - Lower Mainland service area

### Plus Plan - $49.99/month ($539.89/year) ⭐ MOST POPULAR
- **Target**: Enhanced features for busy families
- **Savings**: $1,000+ per year
- **Features**:
  - Everything in Basic
  - Priority booking system (3 days advance)
  - SMS notifications
  - Extended service categories (repair, organization)
  - Faster response time (12 hours)
  - Phone & email support
  - Advanced scheduling options
  - Service ratings & reviews
  - Service customization
  - Recurring service setup
  - Priority customer support
  - Service guarantees
  - Advanced filtering options
  - **10% discount on all services**
  - Free service consultation

### Premier Plan - $109.99/month ($1187.89/year)
- **Target**: Ultimate convenience for luxury households
- **Savings**: $1,500+ per year
- **Features**:
  - Everything in Plus
  - Concierge service
  - Same-day booking availability
  - Dedicated account manager
  - 24/7 priority support
  - Custom service packages
  - Premium service team
  - White-glove service
  - Service quality guarantees
  - Flexible scheduling
  - All service categories
  - Advanced analytics dashboard
  - Family member management
  - Integration with smart home
  - Exclusive events & offers
  - **20% discount on all services**
  - Free emergency call-out
  - Priority scheduling for all services

## Technical Implementation

### Backend Components

#### 1. Plans Configuration (`apps/backend/src/config/plans.js`)
- Centralized plan definitions
- Stripe price ID mappings
- Helper functions for plan operations
- Service discount calculations
- Booking advance time configurations

#### 2. Plans API (`apps/backend/src/routes/plans.js`)
- `GET /api/plans` - Fetch all plans
- `GET /api/plans/:planId` - Get specific plan
- `POST /api/plans/calculate-discount` - Calculate service discounts
- `GET /api/plans/user/current` - Get user's current plan
- `GET /api/plans/comparison/table` - Get plan comparison data
- `GET /api/plans/admin/stats` - Admin statistics

#### 3. Updated Booking System
- Automatic discount application based on user's plan
- Plan-based booking advance time restrictions
- Enhanced booking validation

#### 4. Stripe Integration
- Updated payment routes for subscription handling
- Webhook processing for subscription events
- Price ID configuration for all plans

### Frontend Components

#### 1. Plans Hook (`apps/frontend/hooks/use-plans.ts`)
- React Query integration for plan data
- TypeScript interfaces for type safety
- Helper functions for price formatting and calculations

#### 2. Plans Section (`apps/frontend/components/PlansSection.tsx`)
- BCAA-inspired design with conversion optimization
- Dynamic plan loading from API
- Billing period toggle (monthly/yearly)
- Feature comparison table
- Testimonials and social proof
- Trust badges and guarantees

#### 3. Admin Management (`apps/frontend/components/admin/PlanManagement.tsx`)
- Plan overview dashboard
- Subscription statistics
- Plan configuration interface
- Analytics placeholder

## Setup Instructions

### 1. Environment Configuration

Add the following to your `.env` file:

```bash
# Stripe Plan Price IDs
STRIPE_BASIC_MONTHLY_PRICE_ID="price_basic_monthly"
STRIPE_BASIC_YEARLY_PRICE_ID="price_basic_yearly"
STRIPE_PLUS_MONTHLY_PRICE_ID="price_plus_monthly"
STRIPE_PLUS_YEARLY_PRICE_ID="price_plus_yearly"
STRIPE_PREMIER_MONTHLY_PRICE_ID="price_premier_monthly"
STRIPE_PREMIER_YEARLY_PRICE_ID="price_premier_yearly"
```

### 2. Stripe Setup

Run the Stripe setup script to create products and prices:

```bash
cd apps/backend
node scripts/setup-stripe-plans.js
```

This will:
- Create Stripe products for each plan
- Generate monthly and yearly prices
- Output the price IDs to copy to your `.env` file

### 3. Database Migration

The subscription table should already exist. If not, run:

```bash
cd apps/backend
npx prisma migrate dev
```

### 4. Frontend Setup

Install dependencies and start the development server:

```bash
cd apps/frontend
npm install
npm run dev
```

## Conversion Optimization Features

### 1. Pricing Psychology
- **Original vs. Discounted Prices**: Shows "was $X, now $Y" pricing
- **Yearly Savings**: 17% discount for annual plans
- **Money-back Guarantee**: 30-day guarantee prominently displayed

### 2. Social Proof
- Customer testimonials with savings amounts
- Trust badges and certifications
- Service area coverage indicators

### 3. Urgency & Scarcity
- Limited-time offers
- Popular plan highlighting
- Service availability indicators

### 4. Clear Value Communication
- Feature comparison table
- Savings calculations
- Service guarantees
- Response time commitments

## API Endpoints

### Public Endpoints
- `GET /api/plans` - Get all plans (with user plan if authenticated)
- `GET /api/plans/:planId` - Get specific plan details
- `GET /api/plans/comparison/table` - Get plan comparison data

### Authenticated Endpoints
- `POST /api/plans/calculate-discount` - Calculate service discount
- `GET /api/plans/user/current` - Get user's current plan

### Admin Endpoints
- `GET /api/plans/admin/stats` - Get subscription statistics

## Usage Examples

### Frontend - Fetching Plans
```typescript
import { usePlans, useUserPlan } from '@/hooks/use-plans';

function PlansPage() {
  const { data: plansData, isLoading } = usePlans();
  const { data: userPlanData } = useUserPlan();
  
  const plans = plansData?.plans || [];
  const userPlan = userPlanData?.subscription;
  
  // Use plans data...
}
```

### Backend - Calculating Discounts
```javascript
import { calculateServiceDiscount } from '../config/plans.js';

const discount = calculateServiceDiscount(userSubscription.tier, servicePrice);
const finalPrice = servicePrice - discount;
```

## Testing

### Manual Testing Checklist
- [ ] Plans page loads correctly
- [ ] Plan switching (monthly/yearly) works
- [ ] User plan detection works when logged in
- [ ] Service discounts apply correctly
- [ ] Admin dashboard shows plan statistics
- [ ] Stripe integration works for subscriptions

### Automated Testing
```bash
# Backend tests
cd apps/backend
npm test

# Frontend tests
cd apps/frontend
npm test
```

## Monitoring & Analytics

### Key Metrics to Track
- Plan conversion rates
- Monthly vs. yearly plan adoption
- Churn rates by plan
- Revenue per plan
- Service usage by plan tier

### Admin Dashboard Features
- Real-time subscription statistics
- Plan distribution visualization
- Revenue tracking
- User engagement metrics

## Future Enhancements

### Phase 2 Features
- A/B testing for plan variations
- Advanced analytics dashboard
- Automated email campaigns
- Referral program integration
- Custom plan builder
- Enterprise plan options

### Phase 3 Features
- AI-powered plan recommendations
- Dynamic pricing based on usage
- Integration with smart home devices
- Advanced customer segmentation
- Predictive churn analysis

## Support & Maintenance

### Common Issues
1. **Stripe Price ID Mismatch**: Ensure all price IDs are correctly set in environment variables
2. **Plan Loading Errors**: Check API endpoint availability and authentication
3. **Discount Calculation Issues**: Verify plan tier mapping in database

### Maintenance Tasks
- Monthly: Review plan performance metrics
- Quarterly: Update plan features and pricing
- Annually: Comprehensive plan strategy review

## Security Considerations

- All plan data is validated server-side
- User authentication required for plan-specific features
- Stripe webhook signature verification
- Rate limiting on plan API endpoints
- Admin access restricted to authorized users

## Performance Optimization

- Plan data cached for 5-10 minutes
- Lazy loading of plan features
- Optimized database queries
- CDN for static plan assets
- Efficient React Query caching

---

For questions or support, contact the development team or refer to the main project documentation. 