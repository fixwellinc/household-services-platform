# 🏠 Household Services Platform

A modern, full-stack household services subscription platform built with **Next.js 14**, **Express.js**, and **Prisma**. Features secure authentication, real-time booking management, and a beautiful responsive UI.

## ✨ Features

- **🔐 Secure Authentication** - JWT-based auth with role-based access control
- **📱 Modern UI/UX** - Beautiful, responsive design with Tailwind CSS
- **🔄 Real-time Updates** - Live booking status and notifications
- **📊 Admin Dashboard** - Comprehensive management tools
- **🚀 Railway Deployment** - Production-ready deployment setup
- **🔒 Data Security** - Encrypted user data and secure API handling
- **📝 Service Management** - Create, edit, and manage household services
- **📅 Booking System** - Schedule and manage service appointments

## 🚀 Quick Deploy to Railway

### Prerequisites
- [Railway Account](https://railway.app)
- [Stripe Account](https://stripe.com)
- [GitHub Repository](https://github.com)

### 1. Clone & Setup
```bash
git clone <your-repo-url>
cd Household
npm install
```

### 2. Railway Deployment
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Deploy to Railway
railway up
```

### 3. Environment Variables
Set these in your Railway dashboard:

**Backend Variables:**
```bash
DATABASE_URL="postgresql://..."
JWT_SECRET="your-super-secret-jwt-key"
FRONTEND_URL="https://your-frontend-domain.railway.app"
PORT=5000
NODE_ENV=production
```

**Frontend Variables:**
```bash
NEXT_PUBLIC_API_URL="https://your-backend-domain.railway.app/api"
NEXTAUTH_SECRET="your-nextauth-secret"
```

## 🛠️ Local Development

### Backend Setup
```bash
cd backend
npm install
cp env.example .env
# Edit .env with your configuration
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
cp env.example .env.local
# Edit .env.local with your configuration
npm run dev
```

### Database Setup
```bash
cd backend
npx prisma migrate dev
npx prisma generate
```

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│   (Next.js)     │◄──►│   (Express)     │◄──►│  (PostgreSQL)   │
│                 │    │                 │    │                 │
│ • React 18      │    │ • Node.js       │    │ • Prisma ORM    │
│ • TypeScript    │    │ • JWT Auth      │    │ • Migrations    │
│ • Tailwind CSS  │    │ • Stripe API    │    │ • Real-time     │
│ • NextAuth      │    │ • Webhooks      │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Railway       │    │     Stripe      │    │   Monitoring    │
│   Deployment    │    │   Payments      │    │   & Analytics   │
│                 │    │                 │    │                 │
│ • Auto-deploy   │    │ • Subscriptions │    │ • Railway Logs  │
│ • SSL Cert      │    │ • One-time      │    │ • Stripe Dash   │
│ • Custom Domain │    │ • Webhooks      │    │ • Error Tracking│
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔐 Security Features

- **🔒 JWT Authentication** - Secure token-based authentication
- **🛡️ CORS Protection** - Configured for production domains
- **⚡ Rate Limiting** - Prevents abuse and DDoS attacks
- **🔐 Password Hashing** - bcrypt with configurable rounds
- **💳 Stripe Security** - PCI-compliant payment processing
- **🔍 Input Validation** - Zod schema validation
- **🚫 SQL Injection Protection** - Prisma ORM with parameterized queries

## 💳 Stripe Integration

### Payment Features
- **Subscription Management** - Monthly/yearly billing cycles
- **One-time Payments** - For individual service bookings
- **Webhook Processing** - Real-time payment status updates
- **Refund Handling** - Automated and manual refunds
- **Customer Management** - Stripe customer profiles

### Security
- **Webhook Signature Verification** - Ensures webhook authenticity
- **PCI Compliance** - Stripe handles all card data
- **Encrypted Communication** - HTTPS for all API calls
- **Token-based Payments** - No card data stored locally

## 📊 Database Schema

```sql
-- Users and Authentication
users (id, email, name, role, password_hash, created_at)
subscriptions (id, user_id, tier, status, stripe_customer_id)

-- Services and Bookings
services (id, name, description, category, base_price)
bookings (id, customer_id, service_id, scheduled_date, status, amount)

-- Payments and Communication
payments (id, booking_id, stripe_payment_intent_id, amount, status)
messages (id, booking_id, sender_id, content, created_at)
```

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] All environment variables configured
- [ ] Stripe webhooks set up
- [ ] Database migrations ready
- [ ] SSL certificates configured
- [ ] Custom domain configured

### Post-Deployment
- [ ] Health checks passing
- [ ] Payment processing tested
- [ ] Webhook delivery verified
- [ ] Error monitoring active
- [ ] Performance metrics tracked

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

### E2E Tests
```bash
npm run test:e2e
```

## 📈 Monitoring & Analytics

### Railway Monitoring
- Real-time logs and metrics
- Automatic scaling based on traffic
- Health check endpoints
- Performance monitoring

### Stripe Analytics
- Payment success rates
- Revenue tracking
- Customer analytics
- Dispute monitoring

### Application Monitoring
- Error tracking and alerting
- User behavior analytics
- Performance metrics
- Security monitoring

## 🔧 Configuration

### Environment Variables
See `backend/env.example` and `frontend/env.example` for all required variables.

### Stripe Configuration
1. Create products and prices in Stripe Dashboard
2. Set up webhook endpoints
3. Configure payment methods
4. Test with test keys before going live

### Railway Configuration
1. Connect GitHub repository
2. Set environment variables
3. Configure build commands
4. Set up custom domains

## 🆘 Troubleshooting

### Common Issues

**Build Failures**
- Check Railway build logs
- Verify all dependencies in package.json
- Ensure build commands are correct

**Database Connection**
- Verify DATABASE_URL is set correctly
- Check if migrations have been run
- Ensure database is accessible

**Stripe Webhooks**
- Verify webhook URL is correct
- Check webhook signature verification
- Monitor webhook delivery in Stripe dashboard

**CORS Errors**
- Verify FRONTEND_URL is set correctly
- Check CORS configuration in backend
- Ensure credentials are enabled

### Getting Help
- **Documentation**: [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Railway Support**: [docs.railway.app](https://docs.railway.app)
- **Stripe Support**: [support.stripe.com](https://support.stripe.com)
- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 🎉 Success!

Your Household Services Platform is now deployed with:
- ✅ Secure payment processing via Stripe
- ✅ PostgreSQL database for data persistence
- ✅ Automatic deployments from GitHub
- ✅ SSL certificates and custom domains
- ✅ Monitoring and logging
- ✅ Scalable infrastructure

Monitor your application and Stripe dashboard regularly to ensure everything is running smoothly! 