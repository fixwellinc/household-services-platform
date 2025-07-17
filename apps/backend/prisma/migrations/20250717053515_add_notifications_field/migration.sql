-- AlterTable
ALTER TABLE "User" ADD COLUMN     "notifications" JSONB DEFAULT '{"email": true, "sms": false}';
