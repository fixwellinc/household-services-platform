-- Add user activity tracking fields
ALTER TABLE "User" ADD COLUMN "lastLoginAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "passwordChangedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "isLocked" BOOLEAN DEFAULT false;
ALTER TABLE "User" ADD COLUMN "lockedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "lockedBy" TEXT;
ALTER TABLE "User" ADD COLUMN "lockReason" TEXT;
ALTER TABLE "User" ADD COLUMN "forcePasswordChange" BOOLEAN DEFAULT false;
ALTER TABLE "User" ADD COLUMN "failedLoginAttempts" INTEGER DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "lastFailedLoginAt" TIMESTAMP(3);

-- Add indexes for performance
CREATE INDEX "User_lastLoginAt_idx" ON "User"("lastLoginAt");
CREATE INDEX "User_isLocked_idx" ON "User"("isLocked");
CREATE INDEX "User_failedLoginAttempts_idx" ON "User"("failedLoginAttempts");
