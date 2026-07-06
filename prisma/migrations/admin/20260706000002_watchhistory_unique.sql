-- Add unique constraint on WatchHistory (userId, videoId).
--
-- This is the production-side counterpart to the @@unique([userId, videoId])
-- added to schema.prisma in commit 249bdbf. Without this index, the
-- findUnique({ where: { userId_videoId: ... } }) and upsert() calls in
-- /api/v1/videos/[id] and /api/v1/history will throw P2021 (no unique
-- constraint on the compound key).
--
-- Why this is a separate SQL file rather than just running prisma db push:
--   1. prisma db push is destructive — it can drop columns/tables that
--      exist in the DB but not in the schema. Running it against prod
--      without a careful diff is risky.
--   2. This migration is idempotent (IF NOT EXISTS) and runs in a single
--      transaction, so it's safe to apply via the admin UI or CLI.
--   3. The index name matches what Prisma would generate, so a future
--      prisma db push won't try to recreate it.
--
-- After applying this, the view-count dedup logic in
-- /api/v1/videos/[id]/route.ts will work correctly: concurrent requests
-- that both pass the findUnique check will have one create succeed and
-- the other throw P2002 (handled gracefully as 'already counted').

CREATE UNIQUE INDEX IF NOT EXISTS "WatchHistory_userId_videoId_key"
  ON "WatchHistory" ("userId", "videoId");
