-- Add lastSeenAt column to User table for online presence tracking.
-- Updated on every authenticated request via the session-info endpoint.
-- NULL means the user has never been seen (pre-existing users before
-- this migration will get updated on their next login).
-- No NOT NULL constraint so the migration works on existing rows without
-- a backfill.

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastSeenAt" TIMESTAMP(3);
