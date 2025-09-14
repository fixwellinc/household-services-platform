-- Production Database Migration Script for Flexible Payment Options
-- This script contains all necessary database changes for production deployment
-- Run this script in production environment after backing up the database

-- Begin transaction
BEGIN;

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_subscription_user_id ON "Subscription"("userId");
CREATE INDEX IF NOT EXISTS idx_subscription_status ON "Subscription"("status");
CREATE INDEX IF NOT EXISTS idx_subscription_payment_frequency ON "Subscription"("paymentFrequency");
CREATE INDEX IF NOT EXISTS idx_subscription_next_payment ON "Subscription"("currentPeriodEnd");
CREATE INDEX IF NOT EXISTS idx_subscription_churn_risk ON "Subscription"("churnRiskScore");

CREATE INDEX IF NOT EXISTS idx_payment_frequency_subscription ON "PaymentFrequency"("subscriptionId");
CREATE INDEX IF NOT EXISTS idx_payment_frequency_next_payment ON "PaymentFrequency"("nextPaymentDate");

CREATE INDEX IF NOT EXISTS idx_subscription_pause_subscription ON "SubscriptionPause"("subscriptionId");
CREATE INDEX IF NOT EXISTS idx_subscription_pause_status ON "SubscriptionPause"("status");
CREATE INDEX IF NOT EXISTS idx_subscription_pause_dates ON "SubscriptionPause"("startDate", "endDate");

CREATE INDEX IF NOT EXISTS idx_additional_property_subscription ON "AdditionalProperty"("subscriptionId");

CREATE INDEX IF NOT EXISTS idx_reward_credit_user ON "RewardCredit"("userId");
CREATE INDEX IF NOT EXISTS idx_reward_credit_type ON "RewardCredit"("type");
CREATE INDEX IF NOT EXISTS idx_reward_credit_earned_at ON "RewardCredit"("earnedAt");
CREATE INDEX IF NOT EXISTS idx_reward_credit_expires_at ON "RewardCredit"("expiresAt");

CREATE INDEX IF NOT EXISTS idx_family_member_subscription ON "FamilyMember"("subscriptionId");
CREATE INDEX IF NOT EXISTS idx_family_member_user ON "FamilyMember"("userId");

CREATE INDEX IF NOT EXISTS idx_installment_plan_user ON "InstallmentPlan"("userId");
CREATE INDEX IF NOT EXISTS idx_installment_plan_status ON "InstallmentPlan"("status");

-- Add constraints for data integrity
ALTER TABLE "Subscription" 
ADD CONSTRAINT chk_payment_frequency 
CHECK ("paymentFrequency" IN ('WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY'));

ALTER TABLE "Subscription" 
ADD CONSTRAINT chk_churn_risk_score 
CHECK ("churnRiskScore" >= 0 AND "churnRiskScore" <= 1);

ALTER TABLE "Subscription" 
ADD CONSTRAINT chk_available_credits 
CHECK ("availableCredits" >= 0);

ALTER TABLE "PaymentFrequency" 
ADD CONSTRAINT chk_payment_amount 
CHECK ("amount" > 0);

ALTER TABLE "RewardCredit" 
ADD CONSTRAINT chk_reward_amount 
CHECK ("amount" > 0);

ALTER TABLE "AdditionalProperty" 
ADD CONSTRAINT chk_monthly_fee 
CHECK ("monthlyFee" >= 0);

-- Update existing subscriptions with default values for new fields
UPDATE "Subscription" 
SET 
  "paymentFrequency" = 'MONTHLY',
  "availableCredits" = 0,
  "loyaltyPoints" = 0,
  "churnRiskScore" = 0,
  "lifetimeValue" = 0,
  "isPaused" = false
WHERE "paymentFrequency" IS NULL 
   OR "availableCredits" IS NULL 
   OR "loyaltyPoints" IS NULL 
   OR "churnRiskScore" IS NULL 
   OR "lifetimeValue" IS NULL 
   OR "isPaused" IS NULL;

-- Create function to automatically update subscription lifetime value
CREATE OR REPLACE FUNCTION update_subscription_lifetime_value()
RETURNS TRIGGER AS $$
BEGIN
  -- Update lifetime value based on payment history
  UPDATE "Subscription" 
  SET "lifetimeValue" = (
    SELECT COALESCE(SUM(amount), 0) 
    FROM "PaymentFrequency" 
    WHERE "subscriptionId" = NEW."subscriptionId"
  )
  WHERE "id" = NEW."subscriptionId";
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic lifetime value updates
DROP TRIGGER IF EXISTS trigger_update_lifetime_value ON "PaymentFrequency";
CREATE TRIGGER trigger_update_lifetime_value
  AFTER INSERT OR UPDATE ON "PaymentFrequency"
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_lifetime_value();

-- Create function to handle subscription pause expiration
CREATE OR REPLACE FUNCTION handle_subscription_pause_expiration()
RETURNS TRIGGER AS $$
BEGIN
  -- Automatically update subscription status when pause expires
  IF NEW."endDate" <= NOW() AND NEW."status" = 'ACTIVE' THEN
    UPDATE "Subscription" 
    SET 
      "isPaused" = false,
      "pauseStartDate" = NULL,
      "pauseEndDate" = NULL,
      "status" = 'ACTIVE'
    WHERE "id" = NEW."subscriptionId";
    
    UPDATE "SubscriptionPause"
    SET "status" = 'COMPLETED'
    WHERE "id" = NEW."id";
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic pause expiration handling
DROP TRIGGER IF EXISTS trigger_handle_pause_expiration ON "SubscriptionPause";
CREATE TRIGGER trigger_handle_pause_expiration
  AFTER UPDATE ON "SubscriptionPause"
  FOR EACH ROW
  EXECUTE FUNCTION handle_subscription_pause_expiration();

-- Commit transaction
COMMIT;

-- Verify migration success
SELECT 
  'Migration completed successfully' as status,
  COUNT(*) as total_subscriptions,
  COUNT(CASE WHEN "paymentFrequency" IS NOT NULL THEN 1 END) as subscriptions_with_frequency,
  COUNT(CASE WHEN "availableCredits" IS NOT NULL THEN 1 END) as subscriptions_with_credits
FROM "Subscription";