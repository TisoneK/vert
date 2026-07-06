# Devlog

Technical change log for developers working on Vert. Complements `CHANGELOG.md` (which is user-facing) with the implementation details, file references, and architectural reasoning that don't belong in a user-facing doc.

Entries are newest first. Each entry references the commits that introduced the change.

---

## July 2026 — Review pass & feature build-out

### Feature: Playlists
**Commits:** `38b6824`, `e84197e`, `e766218`

Full playlist CRUD wired up to the existing `Playlist` / `PlaylistItem` Prisma models (the schema was already there, only the API + UI were missing).

**API:**
- `GET /api/v1/playlists` — lists the current user's playlists with `videoCount` and `thumbnailUrl` (first video's thumbnail) via a `_count` + `take: 1` include. Avoids N+1 on the client.
- `POST /api/v1/playlists` — auto-looks-up `channelId` from the user's session if not provided in the body (the old code required it, which was redundant since the client always has `user.channelId`). Title validation: 1–100 chars. Description: max 1000 chars.
- `GET /api/v1/playlists/[id]` — returns the playlist + items ordered by `position`. Now filters out items whose `video.isRemoved = true` so removed videos don't appear in playlist views.
- `DELETE /api/v1/playlists/[id]` — owner-only. Cascade-deletes `PlaylistItem` rows via the schema's `onDelete: Cascade`.
- Existing `POST /items` and `DELETE /items/[videoId]` routes were already there — no changes needed.

**UI:**
- `src/components/vert/PlaylistsPage.tsx` — list + inline create form + delete with confirm. Empty state with CTA.
- `src/components/vert/PlaylistDetailPage.tsx` — grid of `VideoCard`s with per-card X button to remove from playlist. "Play all" jumps to first video. Delete playlist button.
- `src/components/vert/PlaylistPicker.tsx` — modal opened from `VideoCard` context menu. Lists user's playlists with checkmarks showing which already contain this video. On open, fetches all playlists + checks each for the video (N requests, but N is typically < 10 and only on modal open). Inline "create new playlist" creates the playlist AND adds the video in one flow.
- Deep-link routes `/playlists` and `/playlist/[id]` added to `src/lib/store.ts` (`viewToPath` + `pathToView`) and as Next.js page routes.
- Sidebar + MobileNav get a "Playlists" item (ListVideo icon) between Saved and Upload. Active state covers both `playlists` and `playlist` views.

**Known gap:** Playlist reordering (drag-and-drop) is not implemented. The `position` field exists on `PlaylistItem` and the API would accept a PATCH, but there's no UI for it yet.

---

### Feature: Admin user management
**Commits:** `cf6d3b3`, `e5fb497`

**API:**
- `GET /api/v1/admin/users` — paginated list with search (`?q=` filters by email OR username, case-insensitive) and role filter (`?role=member|admin`). Returns each user's id, email, username, role, isActive, oauthProvider, createdAt, channel info, and video/comment counts.
  - Video + comment counts are fetched via two `groupBy` queries (one for videos joined through `channel.userId`, one for comments by `userId`) and merged in JS. This avoids Prisma 6's filtered `_count` syntax which is fiddly to type.
- `PATCH /api/v1/admin/users/[id]` — update `role` (member|admin) or `isActive`. Self-demotion and self-deactivation are blocked with a 400. Logs to `AdminAction`.
- `DELETE /api/v1/admin/users/[id]` — hard delete. Self-deletion blocked. Requires `{ confirm: true }` in the body as a footgun guard. Cascade-deletes via schema `onDelete: Cascade`. Logs to `AdminAction`.

**UI:** New "Users" tab in `AdminDashboard` (4th tab). Search bar + role filter buttons + table with avatar, username/email, role badge, status badge (active/suspended + channel-suspended), video count, comment count, join date. Per-row action buttons: toggle role (UserCog), suspend/reactivate (UserX/UserCheck), delete (Trash2). Each action shows a per-row spinner. Self-protection enforced server-side.

---

### Feature: Admin DB migration system
**Commits:** `92a2273`, `7f07654`, `3ade367`, `29df927`, `13bac24`, `48b4522`, `782f6ca`

Lets admins apply schema migrations from the browser without shell access or a full deploy.

**Runner (`src/lib/migrations.ts`):**
- Reads SQL files from `prisma/migrations/admin/` (sorted by filename).
- Tracks applied migrations in a `_admin_migration` table.
- `ensureMigrationTable()` runs `CREATE TABLE IF NOT EXISTS` on every call to solve the chicken-and-egg of "the tracking table is itself created by a migration."
- `applyMigration(id)` runs each SQL statement inside a `db.$transaction`, with the tracking-row INSERT in the same transaction (atomic). Re-checks applied status inside the transaction to prevent races between two concurrent admin clicks.
- SQL splitter handles line comments (`--`), block comments (`/* */`), single-quoted strings, and double-quoted identifiers.
- Migration IDs validated against the file list — no path traversal.
- **Bug fix (`782f6ca`):** the initial implementation passed `appliedAt.toISOString()` to `$executeRaw`, but the `applied_at` column is `TIMESTAMP` (no timezone). Postgres saw the parameter as text and threw `42804`. Fixed by passing the JS `Date` object directly so Prisma binds it as a timestamp parameter.

**API:**
- `GET /api/v1/admin/db-migrations` — returns all migrations with `applied`/`appliedAt` status.
- `POST /api/v1/admin/db-migrations/[id]/apply` — applies one migration. Validates ID format (alphanumeric + underscores). Distinguishes 404 (not found), 409 (already applied), 500 (SQL failure).

**Build config:** `next.config.ts` `outputFileTracingIncludes` added for both migration routes so the SQL files ship in the standalone build (the runner reads them via `fs`, not `import`, so Next's file tracer wouldn't include them otherwise).

**UI:** "Database" tab in `AdminDashboard`. Warning banner, pending migrations with Apply buttons (orange border, confirm dialog), applied migrations with timestamps (green border), "all caught up" state, refresh button, loading/error/success states. Tab badge shows pending count.

**SQL files shipped:**
- `20260706000001_create_migration_table.sql` — bootstraps `_admin_migration`.
- `20260706000002_watchhistory_unique.sql` — `CREATE UNIQUE INDEX WatchHistory_userId_videoId_key` (the production counterpart to the `@@unique([userId, videoId])` added to `schema.prisma` in commit `249bdbf`).
- `20260706000003_add_query_indexes.sql` — composite indexes on `Video` and `Comment` (see Performance section below).

**CLI:** `scripts/apply-admin-migrations.sh` — same tracking table, stays in sync with the UI. Plus `db-push.sh`, `db-migrate.sh`, `db-deploy.sh`, `db-status.sh`, `db-studio.sh` for local dev.

---

### Feature: Account settings
**Commit:** `3a7774f`

**API:**
- `POST /api/v1/auth/change-password` — requires `currentPassword` as re-verification (prevents a stolen session from silently changing the password). Rate limited 5/min/IP. Validates new password is 6–200 chars and different from current. OAuth users (no `passwordHash`) get a clear error.
- `POST /api/v1/auth/delete-account` — hard delete. Requires `{ confirm: true }` + password re-verification for credential users (OAuth users skip the password check). Rate limited 3/min/IP. Cascade-deletes via schema. Signs out + redirects home on success (client-side).

**UI:** `src/components/vert/SettingsPage.tsx`. Two sections: Change Password (with show/hide toggles, client-side validation) and Danger Zone (multi-step delete confirmation: button → password entry + checkbox → final confirm dialog → API call). Deep-link route `/settings` added.

---

### Feature: Search improvements
**Commit:** `048af3b`

**API:**
- `GET /api/v1/videos` — `search` param now matches `title` OR `description` OR `channel.channelName` (case-insensitive via `mode: 'insensitive'`). Was case-sensitive title + description only.
- New query params: `channel` (channel-name-only filter), `date` (today|week|month|year → `createdAt >= cutoff`), `min_duration` / `max_duration` (seconds → `durationSeconds` range).
- `GET /api/v1/channels/search?q=` — new endpoint. Returns channels whose `channelName` matches, ordered by subscriber count. Implemented as a branch in `[id]/route.ts` — when `id === 'search'`, routes to `handleChannelSearch()` instead of `handleChannelGet()`. (Next.js App Router doesn't support a sibling `search/` folder alongside `[id]/`.)

**UI:** `SearchResults.tsx` rewritten. Two tabs (Videos / Channels). Sort buttons preserved. New format filter chips (All/Portrait/Landscape/Square with icons). New date filter dropdown. Channel results as horizontal cards. All filters trigger re-fetch via `useEffect` dependency array.

---

### Performance pass
**Commit:** `e9fae0f`

**DB indexes (`schema.prisma` + admin migration `20260706000003`):**
- `Video(isRemoved, status, createdAt)` — covers "latest" sort + the WHERE clause of every public video query.
- `Video(isRemoved, status, viewCount)` — covers "views" / trending sort.
- `Video(channelId, isRemoved, status)` — covers channel page queries.
- `Comment(videoId, isRemoved, createdAt)` — covers comment list fetch.
- `Notification(userId, isRead, createdAt)` already existed.

**CDN caching (Cache-Control headers):**
- `/api/v1/trending`: `public, s-maxage=60, stale-while-revalidate=300` — home feed + sidebar + landing page all hit this.
- `/api/v1/categories`: `public, s-maxage=300, stale-while-revalidate=600` — sidebar fetches on every page load.
- `/api/v1/tags`: `public, s-maxage=120, stale-while-revalidate=300` — only when no search query (search queries are user-specific, shouldn't be cached).

**For-you feed refactor (`src/app/api/v1/feed/for-you/route.ts`):**
Previously fetched ALL non-watched videos with 3 joins each, then scored in JS — would OOM on a 10k+ video DB. Now fetches the 200 most recent (by `createdAt`) + 200 most viewed (by `viewCount`), dedupes by id, then scores. Cold-start videos still surface via the recency half.

**next/image config (`next.config.ts`):**
`images.remotePatterns` configured for `*.public.blob.vercel-storage.com` (Vercel Blob) and `lh3.googleusercontent.com` (Google avatars). Components can now be incrementally migrated from `<img>` to `<Image>`. Migration not yet applied to existing components.

---

### Code review fixes (16 commits)
**Commits:** `9bd62e7` through `17fa10c` + `b8870e3`

Full list with severity rankings in `docs/REVIEW.md` §3. Highlights:

- **`9bd62e7`** — `SignupForm` was sending `email` to `signIn('credentials', ...)` but the credentials provider expects `identifier`. Signup created the account but never established a session.
- **`530b6ee`** — Added `src/lib/pagination.ts` with `parsePagination()` that clamps `page >= 1`, `limit` to `[1, maxLimit]`. Applied to 9 routes that were using `parseInt(searchParams.get('page'))` directly and 500-ing on negative/NaN input.
- **`249bdbf`** — Added `@@unique([userId, videoId])` to `WatchHistory` to close a view-count race where two concurrent page loads could both pass `findFirst` and both `create` a row. Updated the view-counter code to use `findUnique` on the compound key and treat `P2002` as "already counted."
- **`260b918`** — Email format validation + username length/character rules on register (was accepting 300-char usernames and `asdf` as an email).
- **`2f2c207`, `d59fb37`, `9a1f3a2`** — Title/description length validation + URL protocol checks on video, channel, and comment creation.
- **`f67b78f`** — `/api/v1/debug-db` locked behind admin auth (was public, leaked DB host info).
- **`dbabdf5`** — `SearchResults` stale-closure fix: results now refresh when the URL query prop changes.
- **`e53a129`** — Moved auth-redirect `setState` calls out of the render body in `ProfilePage` and `CreatorStudio` (React anti-pattern).
- **`137fd17`** — Baseline security headers in `next.config.ts` (HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy).
- **`17fa10c`** — `timingSafeEqual` for `SEED_KEY` comparison in seed/cleanup routes.
- **`de78e02`** — Mobile drawer: Escape-to-close, body scroll lock, fixed mislabeled "Watch Later" item.

---

## Earlier — Notifications, hashtags, For You feed, deep links

### Notifications
**Files:** `src/lib/notifications.ts`, `src/app/api/v1/notifications/*`, `src/components/vert/NotificationCenter.tsx`

- `createNotification()` and `notifyAllAdmins()` helpers — both best-effort (errors swallowed) so a notification failure never breaks the parent action.
- Wired to: subscription created, comment created, like created (new OR changed from dislike), flag created (notifies all admins via `createMany`).
- Self-action guard on all three user-facing events.
- `NotificationCenter` rewritten from hard-coded demo data to live fetch. Polls every 60s. Optimistic updates on mark-as-read.

### Hashtags
**Files:** `prisma/schema.prisma` (Tag, VideoTag models), `src/app/api/v1/tags/*`, `src/app/api/v1/tags/[slug]/videos/route.ts`, `src/components/vert/TagPage.tsx`

- `Tag` model: `name` (normalized lowercase, no spaces, unique), `label` (display form), `usageCount` (denormalized for fast "popular tags" queries).
- `VideoTag` join table with cascade-delete on video.
- Upload accepts `tags: string[]`, normalizes, dedupes, caps at 8, upserts `Tag` records, bumps `usageCount`.
- Seed creates 20 starter tags and attaches 2–4 to each of the 21 demo videos.

### For You feed
**File:** `src/app/api/v1/feed/for-you/route.ts`

Affinity scoring: +5 per shared tag, +3 per shared category, +4 if subscribed, +2 if user has liked from this channel, +1 recency bonus per 7 days (cap +3), −10 if disliked. Excludes already-watched and own uploads. Cold-start friendly (zero-affinity videos still appear). Response includes `personalized: true/false` flag + debug payload.

### Deep-linkable routes
**File:** `src/lib/store.ts` (`viewToPath` / `pathToView`)

`/watch/[id]`, `/channel/[id]`, `/category/[slug]`, `/tag/[slug]`, `/search?q=`, `/trending`, `/explore` all render `<VertApp />` which parses `window.location` on mount and syncs the Zustand store. `popstate` listener handles back/forward. Account-state views (`upload`, `profile`, `admin`, etc.) intentionally stay on `/` — they're session-tied, not deep-linkable.

### Rate limiting
**File:** `src/lib/rate-limit.ts`

In-memory fixed-window counter per `(scope, key)`. Applied to signup (5/min/IP), upload (10/min/user), vote (60/min/user), comment (20/min/user). Returns 429 with `Retry-After` and `X-RateLimit-*` headers. Comment explicitly flags that this needs to move to Upstash Redis / Vercel KV when the app goes multi-instance.

### Prisma client caching
**File:** `src/lib/db.ts`

`PrismaClient` cached on `globalThis` in ALL environments (was dev-only, which is exactly when production needed it most). Lazy `Proxy` wrapper means importing `db` is safe even before `prisma generate` has run — the constructor only runs on first property access. `withServerlessPoolParams()` appends `connection_limit=1&pool_timeout=10` to the connection string at runtime.

---

## Even earlier — Uploads, video player, auth

### Video uploads
**File:** `src/app/api/v1/upload/route.ts`

Browser → Vercel Blob direct upload via `@vercel/blob/client` `put()`. Server generates a client token with `generateClientTokenFromReadWriteToken` (content-type allowlist, 200MB max). Bypasses the serverless 4.5MB body limit. `generatePathname()` builds `uploads/{yyyy-mm}/{userIdShort}-{uuid}.{ext}`.

### Video player
**File:** `src/components/vert/VideoPlayer.tsx`

`hls.js` for `.m3u8` sources. Quality menu populated from `Hls.Events.MANIFEST_PARSED` levels. `LEVEL_SWITCHED` keeps the current label in sync. Progressive downloads show source quality from `videoHeight`. `hls.js` instance destroyed on URL change and unmount. Aspect-ratio logic: portrait capped at 65vh on mobile, full-width landscape. Auto-thumbnail backfill: client captures a frame via `<canvas>` after 1s of playback, uploads to Blob, PATCHes the video record (backfill-only — refuses to overwrite).

### Auth
**File:** `src/lib/auth.ts`

Credentials provider accepts `identifier` (email OR username) + `password`. `authorize()` lowercases email, looks up by email OR username, `bcryptjs.compare`. Google OAuth provider with auto-account-creation (username normalized to lowercase alphanumeric, max 20 chars, uniqueness-checked with suffix). JWT strategy, 30-day maxAge. `jwt` callback always reloads role from DB (not cached in token). `session` callback reads role from DB on every request via `/api/auth/session-info` — so role/isActive changes take effect immediately.

---

## Pre-devlog history

See `git log` for changes prior to this devlog being maintained.
