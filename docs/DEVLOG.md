# Devlog

Technical change log for developers working on Vert. Complements
[`CHANGELOG.md`](../CHANGELOG.md) (which is user-facing) with implementation
details, file references, and architectural reasoning.

Entries are grouped by version, matching `CHANGELOG.md`. Newest first.

---

## [0.3.0] — 2026-07-06

### Added

#### Playlists
**Commits:** `38b6824`, `e84197e`, `e766218`

Full playlist CRUD wired to the existing `Playlist` / `PlaylistItem` Prisma models (schema was already there; only API + UI were missing).

- `GET /api/v1/playlists` — lists current user's playlists with `videoCount` and `thumbnailUrl` (first video's thumbnail) via `_count` + `take: 1` include. Avoids N+1.
- `POST /api/v1/playlists` — auto-looks-up `channelId` from session if not provided. Title validation 1–100 chars, description max 1000.
- `GET /api/v1/playlists/[id]` — filters out items whose `video.isRemoved = true`.
- `DELETE /api/v1/playlists/[id]` — owner-only, cascade-deletes items.
- `src/components/vert/PlaylistsPage.tsx` — list + inline create + delete.
- `src/components/vert/PlaylistDetailPage.tsx` — video grid with per-card remove button, Play All, delete playlist.
- `src/components/vert/PlaylistPicker.tsx` — modal from VideoCard context menu. On open, fetches all playlists + checks each for the video (N requests, N typically < 10).
- Deep-link routes `/playlists` and `/playlist/[id]` in `src/lib/store.ts` + Next.js page routes.
- Sidebar + MobileNav get Playlists item (ListVideo icon).

**Known gap:** drag-and-drop reordering not implemented. `position` field exists on `PlaylistItem`.

#### Admin user management
**Commits:** `cf6d3b3`, `e5fb497`

- `GET /api/v1/admin/users` — paginated, search by email OR username (case-insensitive), role filter. Video/comment counts via two `groupBy` queries merged in JS (avoids Prisma 6 filtered `_count` typing issues).
- `PATCH /api/v1/admin/users/[id]` — update `role` or `isActive`. Self-demotion and self-deactivation blocked. Logs to `AdminAction`.
- `DELETE /api/v1/admin/users/[id]` — hard delete. Self-deletion blocked. Requires `{ confirm: true }`. Cascade-deletes via schema. Logs to `AdminAction`.
- Users tab in `AdminDashboard` (4th tab). Search bar, role filter, table with avatar/role/status/counts/join date, per-row action buttons (toggle role, suspend/reactivate, delete).

#### Admin DB migration system
**Commits:** `92a2273`, `7f07654`, `3ade367`, `29df927`, `13bac24`, `48b4522`, `782f6ca`

- `src/lib/migrations.ts` — runner. Reads SQL from `prisma/migrations/admin/`, tracks in `_admin_migration` table, applies each in a `db.$transaction` with the tracking-row INSERT in the same transaction. SQL splitter handles comments + quoted strings. Migration IDs validated against file list (no path traversal).
- `ensureMigrationTable()` runs `CREATE TABLE IF NOT EXISTS` on every call (chicken-and-egg solver).
- `GET /api/v1/admin/db-migrations` + `POST /api/v1/admin/db-migrations/[id]/apply`.
- `next.config.ts` `outputFileTracingIncludes` so SQL files ship in standalone build.
- Database tab in `AdminDashboard` with pending/applied lists, apply buttons, confirm dialog.
- **Bug fix (`782f6ca`):** initial implementation passed `appliedAt.toISOString()` to `$executeRaw`, but `applied_at` is `TIMESTAMP`. Postgres threw `42804`. Fixed by passing the JS `Date` directly.
- CLI: `scripts/apply-admin-migrations.sh` + `db-push.sh`, `db-migrate.sh`, `db-deploy.sh`, `db-status.sh`, `db-studio.sh`.
- SQL files: `20260706000001_create_migration_table.sql`, `20260706000002_watchhistory_unique.sql`, `20260706000003_add_query_indexes.sql`.

#### Account settings
**Commit:** `3a7774f`

- `POST /api/v1/auth/change-password` — requires `currentPassword`, rate limited 5/min/IP, validates new password 6–200 chars and different from current. OAuth users get a clear error.
- `POST /api/v1/auth/delete-account` — requires `{ confirm: true }` + password re-verification for credential users. Rate limited 3/min/IP. Cascade-deletes.
- `src/components/vert/SettingsPage.tsx` — two sections (Change Password, Danger Zone). Multi-step delete confirmation. Deep-link route `/settings`.

#### Search improvements
**Commit:** `048af3b`

- `GET /api/v1/videos` — `search` now matches title OR description OR `channel.channelName` (case-insensitive via `mode: 'insensitive'`). New params: `channel`, `date` (today|week|month|year), `min_duration`, `max_duration`.
- `GET /api/v1/channels/search?q=` — new endpoint. Implemented as a branch in `[id]/route.ts` (when `id === 'search'`).
- `src/components/vert/SearchResults.tsx` rewritten. Two tabs (Videos/Channels), format filter chips, date filter dropdown, all filters trigger re-fetch via `useEffect` deps.

#### Performance
**Commit:** `e9fae0f`

- DB indexes: `Video(isRemoved, status, createdAt)`, `Video(isRemoved, status, viewCount)`, `Video(channelId, isRemoved, status)`, `Comment(videoId, isRemoved, createdAt)`.
- CDN caching: `/api/v1/trending` `s-maxage=60`, `/api/v1/categories` `s-maxage=300`, `/api/v1/tags` `s-maxage=120` (no-cache when `?q=` is set).
- For-you feed refactored to fetch 200 recent + 200 popular (was loading all unwatched videos).
- `next.config.ts` `images.remotePatterns` for `*.public.blob.vercel-storage.com` and `lh3.googleusercontent.com`.

### Changed

- `src/lib/pagination.ts` added — `parsePagination(req, opts)` clamps `page >= 1`, `limit` to `[1, maxLimit]`. Applied to 9 routes.
- `src/app/api/auth/register/route.ts` — email regex + 320-char max + lowercase normalization. Username 3–20 chars, `[A-Za-z0-9_]` only. Password 200-char max.
- `src/components/vert/SignupForm.tsx` — mirrors server-side username rules client-side.
- `src/components/vert/MobileNav.tsx` — Escape key handler + body scroll lock via `useEffect`. Split mislabeled "Watch Later" into History + Saved.
- `src/components/vert/ProfilePage.tsx` + `CreatorStudio.tsx` — auth redirects moved from render body to `useEffect`.
- `src/components/vert/SearchResults.tsx` — stale-closure fix, single effect keyed on `[query, sortBy]`.

### Fixed

- **`9bd62e7`** — SignupForm sent `email` instead of `identifier` to `signIn('credentials', ...)`.
- **`530b6ee`** — Pagination 500s on negative/NaN input. New `parsePagination` helper.
- **`249bdbf`** — `@@unique([userId, videoId])` on `WatchHistory` + `findUnique` + `P2002` handling.
- **`260b918`** — Email format + username rules on register.
- **`2f2c207`** — Video title/description length + URL protocol validation.
- **`d59fb37`** — Channel name/description length + banner URL validation.
- **`9a1f3a2`** — Comment 2000-char cap.
- **`f67b78f`** — `/api/v1/debug-db` locked behind admin auth.
- **`dbabdf5`** — SearchResults stale-closure fix.
- **`e53a129`** — Auth-redirect `setState` moved out of render body.
- **`de78e02`** — Mobile drawer Escape + scroll lock + mislabeled item.
- **`1a68452`** — `/trending` + `/videos/[id]/related` limit clamping.
- **`17fa10c`** — `timingSafeEqual` for `SEED_KEY` comparison.

### Security

- **`137fd17`** — Baseline security headers in `next.config.ts`.
- **`f67b78f`** — debug-db admin-only.
- **`17fa10c`** — timing-safe secret comparison.
- Input validation across register, video/channel/comment creation, URL fields.

---

## [0.2.0] — Earlier 2026

### Added

#### Notifications
**Files:** `src/lib/notifications.ts`, `src/app/api/v1/notifications/*`, `src/components/vert/NotificationCenter.tsx`

- `createNotification()` and `notifyAllAdmins()` — best-effort (errors swallowed).
- Wired to: subscription, comment, like (new OR changed), flag (notifies all admins via `createMany`).
- Self-action guard on all user-facing events.
- `NotificationCenter` rewritten from demo data to live fetch. Polls every 60s. Optimistic updates.

#### Hashtags
**Files:** `prisma/schema.prisma` (Tag, VideoTag), `src/app/api/v1/tags/*`, `src/components/vert/TagPage.tsx`

- `Tag` model: `name` (normalized, unique), `label` (display), `usageCount` (denormalized).
- Upload accepts `tags: string[]`, normalizes, dedupes, caps at 8, upserts, bumps `usageCount`.

#### For You feed
**File:** `src/app/api/v1/feed/for-you/route.ts`

Affinity: +5 shared tag, +3 shared category, +4 subscribed, +2 liked-channel, +1 recency/7d (cap +3), −10 disliked. Excludes watched + own uploads. Cold-start friendly.

#### Deep-linkable routes
**File:** `src/lib/store.ts` (`viewToPath` / `pathToView`)

`/watch/[id]`, `/channel/[id]`, `/category/[slug]`, `/tag/[slug]`, `/search?q=`, `/trending`, `/explore`. Account-state views stay on `/`.

#### Rate limiting
**File:** `src/lib/rate-limit.ts`

In-memory fixed-window counter. Signup 5/min/IP, upload 10/min/user, vote 60/min/user, comment 20/min/user. Needs Upstash Redis / Vercel KV for multi-instance.

#### Prisma client caching
**File:** `src/lib/db.ts`

`globalThis` cache in ALL environments (was dev-only). Lazy `Proxy` wrapper. `withServerlessPoolParams()` appends `connection_limit=1&pool_timeout=10`.

### Changed

- Dependency audit: 44/54 vulns closed. Next.js 16.1.3 → 16.2.9, plus 18 other direct deps. 11 `overrides` for transitive deps.

### Fixed

- `VideoPlayer` side effects isolated in `useEffect` keyed on `videoUrl`.
- Prisma client lazy instantiation prevents import-time crash.

---

## [0.1.0] — Initial release

### Added

#### Video uploads
**File:** `src/app/api/v1/upload/route.ts`

Browser → Vercel Blob direct via `@vercel/blob/client` `put()`. Server generates client token with `generateClientTokenFromReadWriteToken` (content-type allowlist, 200MB max). Bypasses serverless 4.5MB body limit.

#### Video player
**File:** `src/components/vert/VideoPlayer.tsx`

`hls.js` for `.m3u8`. Quality menu from `MANIFEST_PARSED`. `LEVEL_SWITCHED` sync. Progressive downloads show source quality from `videoHeight`. Instance destroyed on URL change + unmount. Portrait capped at 65vh on mobile. Auto-thumbnail backfill via `<canvas>` frame capture.

#### Auth
**File:** `src/lib/auth.ts`

Credentials provider: `identifier` (email OR username) + `password`. Google OAuth with auto-account-creation (username normalized, uniqueness-checked). JWT 30-day. `jwt` callback reloads role from DB. `session-info` reads role/isActive from DB on every request.

#### Core pages
Home feed, trending, explore, categories, search, watch, channel, history, saved, creator studio, admin dashboard. Voting, commenting, subscribing, flagging, saving.

---

[Unreleased]: https://github.com/TisoneK/vert/compare/v0.3.0...HEAD
[0.3.0]: https://github.com/TisoneK/vert/releases/tag/v0.3.0
[0.2.0]: https://github.com/TisoneK/vert/releases/tag/v0.2.0
[0.1.0]: https://github.com/TisoneK/vert/releases/tag/v0.1.0
