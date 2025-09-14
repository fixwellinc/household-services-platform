-- Add suspension tracking fields to User model
ALTER TABLE "User" ADD COLUMN "suspendedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "suspendedBy" TEXT;
ALTER TABLE "User" ADD COLUMN "suspensionReason" TEXT;
ALTER TABLE "User" ADD COLUMN "activatedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "activatedBy" TEXT;
ALTER TABLE "User" ADD COLUMN "activationReason" TEXT;

-- Add foreign key constraints for suspension/activation tracking
ALTER TABLE "User" ADD CONSTRAINT "User_suspendedBy_fkey" FOREIGN KEY ("suspendedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "User" ADD CONSTRAINT "User_activatedBy_fkey" FOREIGN KEY ("activatedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create index for suspension queries
CREATE INDEX "User_suspendedAt_idx" ON "User"("suspendedAt");
CREATE INDEX "User_activatedAt_idx" ON "User"("activatedAt");