-- Bootstrap: create the _admin_migration tracking table.
--
-- This table records which admin-managed migrations have been applied.
-- The migration runner (src/lib/migrations.ts) reads this table to
-- determine what's pending. The table itself is created by this
-- migration — chicken-and-egg solved by having the runner also run
-- a 'CREATE TABLE IF NOT EXISTS' on every call as a safety net.

CREATE TABLE IF NOT EXISTS "_admin_migration" (
  "id"         VARCHAR(255) PRIMARY KEY,
  "applied_at" TIMESTAMP   NOT NULL DEFAULT NOW()
);
