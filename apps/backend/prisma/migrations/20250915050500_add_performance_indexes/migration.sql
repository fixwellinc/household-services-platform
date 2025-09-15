-- Add indexes for frequently queried fields to improve dashboard performance

-- User table indexes
CREATE INDEX IF NOT EXISTS "User_createdAt_idx" ON "User"("createdAt");
CREATE INDEX IF NOT EXISTS "User_updatedAt_idx" ON "User"("updatedAt");
CREATE INDEX IF NOT EXISTS "User_isActive_idx" ON "User"("isActive");
CREATE INDEX IF NOT EXISTS "User_role_idx" ON "User"("role");

-- Booking table indexes
CREATE INDEX IF NOT EXISTS "Booking_status_idx" ON "Booking"("status");
CREATE INDEX IF NOT EXISTS "Booking_createdAt_idx" ON "Booking"("createdAt");
CREATE INDEX IF NOT EXISTS "Booking_updatedAt_idx" ON "Booking"("updatedAt");
CREATE INDEX IF NOT EXISTS "Booking_status_createdAt_idx" ON "Booking"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "Booking_status_updatedAt_idx" ON "Booking"("status", "updatedAt");

-- Subscription table indexes
CREATE INDEX IF NOT EXISTS "Subscription_status_idx" ON "Subscription"("status");
CREATE INDEX IF NOT EXISTS "Subscription_createdAt_idx" ON "Subscription"("createdAt");
CREATE INDEX IF NOT EXISTS "Subscription_updatedAt_idx" ON "Subscription"("updatedAt");
CREATE INDEX IF NOT EXISTS "Subscription_churnRiskScore_idx" ON "Subscription"("churnRiskScore");
CREATE INDEX IF NOT EXISTS "Subscription_status_createdAt_idx" ON "Subscription"("status", "createdAt");

-- Composite indexes for common dashboard queries
CREATE INDEX IF NOT EXISTS "User_isActive_updatedAt_idx" ON "User"("isActive", "updatedAt");
CREATE INDEX IF NOT EXISTS "Booking_status_totalAmount_idx" ON "Booking"("status", "totalAmount");
CREATE INDEX IF NOT EXISTS "Subscription_status_nextPaymentAmount_idx" ON "Subscription"("status", "nextPaymentAmount");