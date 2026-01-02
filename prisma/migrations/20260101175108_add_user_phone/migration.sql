-- Add phone column to user table
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "phone" TEXT;
