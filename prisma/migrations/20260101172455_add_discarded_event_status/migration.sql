-- Add 'discarded' value to EventStatus enum
ALTER TYPE "EventStatus" ADD VALUE IF NOT EXISTS 'discarded';
