-- CreateEnum
CREATE TYPE "SubscriptionTier" AS ENUM ('STARTER', 'HOMECARE', 'PRIORITY');

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "perkType" TEXT,
ADD COLUMN     "usedSubscriptionPerk" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "canCancel" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "cancellationBlockedAt" TIMESTAMP(3),
ADD COLUMN     "cancellationBlockedReason" TEXT;

-- CreateTable
CREATE TABLE "SubscriptionUsage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "priorityBookingUsed" BOOLEAN NOT NULL DEFAULT false,
    "priorityBookingUsedAt" TIMESTAMP(3),
    "priorityBookingCount" INTEGER NOT NULL DEFAULT 0,
    "discountUsed" BOOLEAN NOT NULL DEFAULT false,
    "discountUsedAt" TIMESTAMP(3),
    "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "freeServiceUsed" BOOLEAN NOT NULL DEFAULT false,
    "freeServiceUsedAt" TIMESTAMP(3),
    "freeServiceType" TEXT,
    "emergencyServiceUsed" BOOLEAN NOT NULL DEFAULT false,
    "emergencyServiceUsedAt" TIMESTAMP(3),
    "maxPriorityBookings" INTEGER NOT NULL DEFAULT 0,
    "maxDiscountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "maxFreeServices" INTEGER NOT NULL DEFAULT 0,
    "maxEmergencyServices" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionUsage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionUsage_userId_key" ON "SubscriptionUsage"("userId");

-- AddForeignKey
ALTER TABLE "SubscriptionUsage" ADD CONSTRAINT "SubscriptionUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
