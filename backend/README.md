# Backend (Node.js/Express)

See the root `README.md` and `household_prp.md` for project overview and setup instructions.

This folder will contain the Express API, Prisma schema, and related code.

# Household Services Backend

Express.js backend for the Household Services Subscription Platform with SQLite and Prisma.

## ✅ Current Status

- ✅ Backend server running on port 5000
- ✅ SQLite database with Prisma ORM
- ✅ Authentication routes working
- ✅ Services and bookings endpoints available
- ✅ JWT-based authentication
- ✅ Password hashing with bcrypt

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file with the following variables:
```env
# Database Configuration (SQLite)
DATABASE_URL="file:./dev.db"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="7d"

# Server Configuration
PORT=5000
NODE_ENV="development"

# CORS Configuration
FRONTEND_URL="http://localhost:3000"

# Stripe Configuration (for future use)
STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key"
STRIPE_WEBHOOK_SECRET="whsec_your_stripe_webhook_secret"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL="info"
```

3. Generate Prisma client:
```bash
npx prisma generate
```

4. Create database and tables:
```bash
npx prisma db push
```

5. Run the development server:
```bash
npm run dev
```

## Database

This project uses SQLite with Prisma ORM for development. The schema is defined in `prisma/schema.prisma`.

To reset the database:
```bash
npx prisma db push --force-reset
```

## API Endpoints

### Health Check
- `GET /api/health` - Server health status

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user (requires auth)
- `POST /api/auth/logout` - Logout (requires auth)

### Services
- `GET /api/services` - List all services
- `POST /api/services` - Create new service (requires auth)
- `GET /api/services/:id` - Get service by ID
- `PUT /api/services/:id` - Update service (requires auth)
- `DELETE /api/services/:id` - Delete service (requires auth)

### Bookings
- `GET /api/bookings` - List user bookings (requires auth)
- `POST /api/bookings` - Create new booking (requires auth)
- `GET /api/bookings/:id` - Get booking by ID (requires auth)
- `PUT /api/bookings/:id` - Update booking (requires auth)
- `DELETE /api/bookings/:id` - Cancel booking (requires auth)

## Testing the API

### Register a new user:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test User","password":"password123","role":"CUSTOMER"}'
```

### Login:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Get services:
```bash
curl http://localhost:5000/api/services
```

## MongoDB Migration (Future)

When you're ready to switch to MongoDB:

1. Install MongoDB locally or use MongoDB Atlas
2. Update `prisma/schema.prisma` to use MongoDB provider
3. Update connection string in `.env`
4. Run `npx prisma generate` and `npx prisma db push`

The schema is already designed to work with both SQLite and MongoDB. 