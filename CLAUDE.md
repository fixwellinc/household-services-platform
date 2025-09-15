# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Build and Development:**
- `npm run dev:unified` - Run both frontend and backend in unified development mode (recommended)
- `npm run dev` - Run frontend and backend concurrently
- `npm run dev:backend` - Run backend only
- `npm run dev:frontend` - Run frontend only

**Build:**
- `npm run build:unified` - Build both frontend and backend for production
- `npm run build` - Build all workspaces
- `npm run build:backend` - Build backend only (runs Prisma generate)
- `npm run build:frontend` - Build frontend only

**Testing:**
- Backend: `npm run test` (Vitest) or `npm run test:watch`
- Frontend: `npm run test` (Jest) or `npm run test:watch`
- Type checking: `npm run type-check` in respective workspace

**Linting:**
- `npm run lint` - Lint all workspaces
- Individual workspaces: `npm run lint --workspace=apps/backend`

**Database:**
- Backend: `npm run migrate:dev` - Run Prisma migrations in development
- Backend: `npm run seed` - Seed database with test data
- Backend: `npx prisma generate` - Generate Prisma client

**Deployment:**
- `npm run deploy:unified` - Deploy unified app to Railway
- `npm run start:unified` - Start unified production server

## Architecture Overview

**Monorepo Structure:**
- `apps/backend/` - Express.js API server with Prisma ORM
- `apps/frontend/` - Next.js 14 frontend with App Router
- `packages/` - Shared packages (types, utilities)
- `unified-server.js` - Unified server for single deployment

**Key Technologies:**
- **Backend:** Express.js, Prisma (PostgreSQL), Socket.IO, JWT auth, Stripe payments, Twilio SMS
- **Frontend:** Next.js 14, TypeScript, Tailwind CSS, Radix UI, TanStack Query, Socket.IO client
- **Database:** PostgreSQL with comprehensive schema for subscriptions, services, bookings
- **Deployment:** Railway (unified single deployment)

**Authentication & Authorization:**
- JWT-based authentication with role-based access (CUSTOMER, EMPLOYEE, ADMIN)
- Admin routes protected with `requireAdmin` middleware
- Authentication middleware in `apps/backend/src/middleware/auth.js`

**Database Schema Key Models:**
- `User` - Core user model with roles, subscription data, audit relations, suspension tracking
- `Subscription` - Flexible payment frequencies, pause functionality, family members
- `ServiceRequest` -> `Quote` -> `Job` -> `Invoice` workflow
- `AuditLog` - Comprehensive admin action tracking
- `Permission`, `Role`, `UserRole` - Granular permission system for fine-grained access control
- `ImpersonationSession` - Admin impersonation tracking for support scenarios
- Enhanced models for payment flexibility, rewards, churn prediction

**API Architecture:**
- RESTful API at `/api/*` routes
- WebSocket support for real-time features
- Comprehensive admin endpoints with safety guards
- Rate limiting and security middleware
- Database connection checks on all routes

**Key Services:**
- `auditService.js` - Admin action auditing
- `socketService.js` - Real-time WebSocket management
- `queueService.js` - Background job processing
- `searchService.js` - Search functionality
- `bulkOperationService.js` - Batch operations with safety
- `analyticsService.js` - Subscription analytics and churn prediction

**Frontend Architecture:**
- App Router with route groups: `(auth)`, `(dashboard)`, `admin`
- Context providers: Auth, Location, Socket, KeyboardNavigation
- Custom hooks for API calls, real-time data, admin functionality
- Admin interface with comprehensive management tools

**Security Features:**
- Helmet.js security headers with CSP for Stripe
- CORS configuration for Railway deployment
- Rate limiting with different limits for auth/admin routes
- Input sanitization and validation middleware
- Admin deletion protection and audit logging
- Bulk operation safety guards

**Real-time Features:**
- Socket.IO integration for live updates
- Admin dashboard real-time metrics
- Chat system with file upload support
- Notification system integration

**Payment Integration:**
- Stripe integration with webhooks
- Subscription management with flexible payment frequencies
- Invoice generation and payment processing
- BNPL integration support (Klarna, Affirm, Sezzle)

**Admin Safety:**
- Emergency admin creation endpoint at `/api/admin/emergency-create`
- Comprehensive safety checks for user deletion
- Bulk operation restrictions and monitoring
- System health monitoring at `/api/admin/system-safety`
- Audit logging for all admin actions
- Granular permission system with `/api/admin/permissions` routes
- Admin impersonation system with `/api/admin/impersonation` routes
- User suspension/activation tracking with detailed audit trail

**Performance & Monitoring:**
- Performance middleware with metrics tracking
- Memory monitoring and concurrency controls
- Caching service for optimized data access
- Background queue processing for heavy operations

## Important Notes

- The unified server setup allows single deployment while maintaining separate development
- Always run `npx prisma generate` after schema changes
- Admin routes have strict safety guards - review carefully before modifying
- WebSocket functionality requires the unified server or proper Socket.IO setup
- Railway deployment uses environment variables for database and API keys
- JetBrains Mono font is used throughout the application
- All admin operations are audited and logged for security

## Common Issues

**Redis Configuration:**
- The app uses Redis for caching and queue management via ioredis
- **Production:** Redis is configured via REDIS_URL environment variable in Railway
- **Development:** If Redis is not running locally, you'll see connection errors (can be ignored)
- Redis services: caching, rate limiting, queue processing, background jobs
- The queue service gracefully handles Redis unavailability with fallback mode
- To add Redis in Railway: Project Dashboard → New Service → Database → Redis

**Database Issues:**
- Run `npx prisma generate` after any schema changes
- Use `npx prisma migrate dev` for development database migrations
- Check DATABASE_URL environment variable is properly configured