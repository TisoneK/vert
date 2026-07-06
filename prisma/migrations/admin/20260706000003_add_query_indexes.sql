-- Add composite indexes on Video and Comment for common query patterns.
--
-- These are the indexes declared in schema.prisma. Without them, every
-- list/feed query does a sequential scan on Video, which gets slow as
-- the table grows. The composite (isRemoved, status, createdAt) index
-- alone covers:
--   - Home feed "latest" sort
--   - /explore
--   - /search default sort
--   - The WHERE clause of every public video query
--
-- All indexes use IF NOT EXISTS so re-running is safe. Index names
-- match what Prisma would generate, so a future `prisma db push` won't
-- try to recreate them.

-- Video: WHERE isRemoved=false AND status='ready' ORDER BY createdAt DESC
CREATE INDEX IF NOT EXISTS "Video_isRemoved_status_createdAt_idx"
  ON "Video" ("isRemoved", "status", "createdAt");

-- Video: WHERE isRemoved=false AND status='ready' ORDER BY viewCount DESC
CREATE INDEX IF NOT EXISTS "Video_isRemoved_status_viewCount_idx"
  ON "Video" ("isRemoved", "status", "viewCount");

-- Video: WHERE channelId=? AND isRemoved=false AND status='ready'
CREATE INDEX IF NOT EXISTS "Video_channelId_isRemoved_status_idx"
  ON "Video" ("channelId", "isRemoved", "status");

-- Comment: WHERE videoId=? AND isRemoved=false ORDER BY createdAt DESC
CREATE INDEX IF NOT EXISTS "Comment_videoId_isRemoved_createdAt_idx"
  ON "Comment" ("videoId", "isRemoved", "createdAt");
