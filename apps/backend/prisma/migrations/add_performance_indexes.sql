-- Performance optimization indexes for flexible payment options

-- User table indexes
CREATE INDEX IF NOT EXISTS idx_user_email ON "User"(email);
CREATE INDEX IF NOT EXISTS idx_user_role ON "User"(role);
CREATE INDEX IF NOT EXISTS idx_user_active ON "User"("isActive");
CREATE INDEX IF NOT EXISTS idx_user_created_at ON "User"("createdAt");

-- Subscription table indexes
CREATE INDEX IF NOT EXISTS idx_subscription_user_id ON "Subscription"("userId");
CREATE INDEX IF NOT EXISTS idx_subscription_status ON "Subscription"(status);
CREATE INDEX IF NOT EXISTS idx_subscription_tier ON "Subscription"(tier);
CREATE INDEX IF NOT EXISTS idx_subscription_payment_frequency ON "Subscription"("paymentFrequency");
CREATE INDEX IF NOT EXISTS idx_subscription_stripe_customer_id ON "Subscription"("stripeCustomerId");
CREATE INDEX IF NOT EXISTS idx_subscription_stripe_subscription_id ON "Subscription"("stripeSubscriptionId");
CREATE INDEX IF NOT EXISTS idx_subscription_paused ON "Subscription"("isPaused");
CREATE INDEX IF NOT EXISTS idx_subscription_created_at ON "Subscription"("createdAt");
CREATE INDEX IF NOT EXISTS idx_subscription_period_end ON "Subscription"("currentPeriodEnd");

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_subscription_user_status ON "Subscription"("userId", status);
CREATE INDEX IF NOT EXISTS idx_subscription_tier_frequency ON "Subscription"(tier, "paymentFrequency");
CREATE INDEX IF NOT EXISTS idx_subscription_status_created ON "Subscription"(status, "createdAt");

-- PaymentFrequency table indexes
CREATE INDEX IF NOT EXISTS idx_payment_frequency_subscription_id ON "PaymentFrequency"("subscriptionId");
CREATE INDEX IF NOT EXISTS idx_payment_frequency_frequency ON "PaymentFrequency"(frequency);
CREATE INDEX IF NOT EXISTS idx_payment_frequency_next_payment ON "PaymentFrequency"("nextPaymentDate");
CREATE INDEX IF NOT EXISTS idx_payment_frequency_created_at ON "PaymentFrequency"("createdAt");

-- SubscriptionPause table indexes
CREATE INDEX IF NOT EXISTS idx_subscription_pause_subscription_id ON "SubscriptionPause"("subscriptionId");
CREATE INDEX IF NOT EXISTS idx_subscription_pause_status ON "SubscriptionPause"(status);
CREATE INDEX IF NOT EXISTS idx_subscription_pause_start_date ON "SubscriptionPause"("startDate");
CREATE INDEX IF NOT EXISTS idx_subscription_pause_end_date ON "SubscriptionPause"("endDate");
CREATE INDEX IF NOT EXISTS idx_subscription_pause_reason ON "SubscriptionPause"(reason);

-- AdditionalProperty table indexes
CREATE INDEX IF NOT EXISTS idx_additional_property_subscription_id ON "AdditionalProperty"("subscriptionId");
CREATE INDEX IF NOT EXISTS idx_additional_property_verified ON "AdditionalProperty"("ownershipVerified");
CREATE INDEX IF NOT EXISTS idx_additional_property_added_at ON "AdditionalProperty"("addedAt");

-- RewardCredit table indexes
CREATE INDEX IF NOT EXISTS idx_reward_credit_user_id ON "RewardCredit"("userId");
CREATE INDEX IF NOT EXISTS idx_reward_credit_type ON "RewardCredit"(type);
CREATE INDEX IF NOT EXISTS idx_reward_credit_earned_at ON "RewardCredit"("earnedAt");
CREATE INDEX IF NOT EXISTS idx_reward_credit_used_at ON "RewardCredit"("usedAt");
CREATE INDEX IF NOT EXISTS idx_reward_credit_expires_at ON "RewardCredit"("expiresAt");

-- Composite indexes for reward credits
CREATE INDEX IF NOT EXISTS idx_reward_credit_user_type ON "RewardCredit"("userId", type);
CREATE INDEX IF NOT EXISTS idx_reward_credit_user_unused ON "RewardCredit"("userId") WHERE "usedAt" IS NULL;
CREATE INDEX IF NOT EXISTS idx_reward_credit_expiring ON "RewardCredit"("expiresAt") WHERE "usedAt" IS NULL AND "expiresAt" IS NOT NULL;

-- FamilyMember table indexes (if exists)
CREATE INDEX IF NOT EXISTS idx_family_member_subscription_id ON "FamilyMember"("subscriptionId");
CREATE INDEX IF NOT EXISTS idx_family_member_user_id ON "FamilyMember"("userId");
CREATE INDEX IF NOT EXISTS idx_family_member_added_at ON "FamilyMember"("addedAt");

-- Analytics optimization indexes
CREATE INDEX IF NOT EXISTS idx_subscription_analytics_tier_created ON "Subscription"(tier, "createdAt", status);
CREATE INDEX IF NOT EXISTS idx_subscription_analytics_frequency_created ON "Subscription"("paymentFrequency", "createdAt", status);
CREATE INDEX IF NOT EXISTS idx_subscription_churn_risk ON "Subscription"("churnRiskScore") WHERE "churnRiskScore" > 0.5;

-- Notification optimization indexes
CREATE INDEX IF NOT EXISTS idx_user_notifications ON "User"(notifications) USING GIN;

-- Performance monitoring views
CREATE OR REPLACE VIEW subscription_metrics AS
SELECT 
    tier,
    "paymentFrequency",
    status,
    COUNT(*) as count,
    AVG("lifetimeValue") as avg_lifetime_value,
    AVG("churnRiskScore") as avg_churn_risk,
    COUNT(*) FILTER (WHERE "isPaused" = true) as paused_count,
    COUNT(*) FILTER (WHERE "createdAt" >= NOW() - INTERVAL '30 days') as new_subscriptions_30d
FROM "Subscription"
GROUP BY tier, "paymentFrequency", status;

CREATE OR REPLACE VIEW payment_frequency_analytics AS
SELECT 
    frequency,
    COUNT(*) as subscription_count,
    AVG(amount) as avg_amount,
    COUNT(*) FILTER (WHERE "nextPaymentDate" <= NOW() + INTERVAL '7 days') as due_soon_count
FROM "PaymentFrequency" pf
JOIN "Subscription" s ON pf."subscriptionId" = s.id
WHERE s.status = 'ACTIVE'
GROUP BY frequency;

CREATE OR REPLACE VIEW reward_credit_analytics AS
SELECT 
    type,
    COUNT(*) as total_credits,
    SUM(amount) as total_amount,
    COUNT(*) FILTER (WHERE "usedAt" IS NULL) as unused_credits,
    SUM(amount) FILTER (WHERE "usedAt" IS NULL) as unused_amount,
    COUNT(*) FILTER (WHERE "expiresAt" <= NOW() + INTERVAL '30 days' AND "usedAt" IS NULL) as expiring_soon
FROM "RewardCredit"
GROUP BY type;

-- Partial indexes for better performance on filtered queries
CREATE INDEX IF NOT EXISTS idx_subscription_active_users ON "Subscription"("userId") WHERE status = 'ACTIVE';
CREATE INDEX IF NOT EXISTS idx_subscription_paused_active ON "Subscription"("isPaused", "pauseEndDate") WHERE status = 'ACTIVE';
CREATE INDEX IF NOT EXISTS idx_payment_frequency_upcoming ON "PaymentFrequency"("nextPaymentDate") WHERE "nextPaymentDate" >= NOW();

-- Function to analyze query performance
CREATE OR REPLACE FUNCTION analyze_subscription_performance()
RETURNS TABLE(
    table_name text,
    index_name text,
    index_size text,
    table_size text,
    index_usage_count bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        schemaname||'.'||tablename as table_name,
        indexname as index_name,
        pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
        pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
        idx_scan as index_usage_count
    FROM pg_stat_user_indexes 
    WHERE schemaname = 'public' 
    AND (tablename LIKE '%Subscription%' OR tablename LIKE '%Payment%' OR tablename LIKE '%Reward%')
    ORDER BY pg_relation_size(indexrelid) DESC;
END;
$$ LANGUAGE plpgsql;