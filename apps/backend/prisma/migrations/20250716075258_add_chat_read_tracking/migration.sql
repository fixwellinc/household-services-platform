-- AlterTable
ALTER TABLE "ChatSession" ADD COLUMN     "lastAdminReadAt" TIMESTAMP(3),
ADD COLUMN     "lastCustomerReadAt" TIMESTAMP(3);
