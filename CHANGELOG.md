# Changelog

New things and fixes in Vert, newest first. Written for the people using the app — technical details are kept brief and linked from each entry.

---

## July 2026 — Review pass & feature build-out

### New features

#### Playlists
You can now organize videos into playlists.
- Create a playlist from the new **Playlists** page (sidebar → Playlists, or `/playlists`).
- Add a video to a playlist from any video card's `⋮` menu → **Add to playlist**. Pick an existing playlist or create a new one inline.
- View a playlist at `/playlist/<id>` — see all its videos, remove individual videos, or delete the whole playlist (videos themselves stay).
- "Play all" jumps to the first video in the playlist.

#### Admin: User management
Admins can now manage user accounts from the dashboard.
- Go to `/admin` → **Users** tab.
- Search by email or username. Filter by role (All / Members / Admins).
- Per row: promote/demote role, suspend/reactivate, or permanently delete.
- Safety guards: you can't demote, suspend, or delete your own account. Deletes require double confirmation. All actions are logged for audit.

#### Admin: Database migrations from the UI
Admins can now apply schema migrations from the browser — no shell access needed.
- Go to `/admin` → **Database** tab.
- See pending migrations and apply them with a click. Each runs in a transaction and is tracked in a `_admin_migration` table.
- CLI alternative: `./scripts/apply-admin-migrations.sh` (same tracking table, stays in sync with the UI).
- Bundle of helper scripts added under `scripts/` for local DB operations (`db-push.sh`, `db-migrate.sh`, `db-deploy.sh`, `db-status.sh`, `db-studio.sh`).

#### Account settings
Users can now manage their own account.
- Go to your profile menu → **Settings** (or `/settings`).
- **Change password** — requires your current password as verification.
- **Delete account** — multi-step confirmation. Cascade-deletes your channel, videos, comments, etc. Irreversible.

#### Better search
Search now finds more and lets you filter.
- Search matches video title, description, **and channel name** (was title + description only).
- New **Channels** tab in search results — see channels whose names match your query.
- New filters: format (Portrait / Landscape / Square) and upload date (Today / This week / This month / This year).
- Sort by Relevance, Date, or Views.

### Improvements

#### Faster page loads
- Added database indexes for the most common queries (home feed, trending, channel pages, comment threads). Pages that scanned the whole video table now use an index.
- Trending, categories, and popular tags are now cached at the CDN edge for 1–5 minutes. The sidebar fetches categories on every page load, so this cuts a DB query per request.
- The "For You" feed no longer loads every unwatched video into memory — it now scores the 200 most recent + 200 most viewed, which is plenty and won't OOM on a large database.

#### Security hardening (from the code review)
A full code review found and fixed 16 issues. The notable ones:
- **Signup now actually logs you in.** Previously, creating an account silently failed to establish a session and bounced you to the login page. Fixed.
- **Pagination no longer 500s on weird inputs.** Requests like `?page=-5` or `?limit=abc` now return sensible defaults instead of crashing.
- **View counts no longer double-count.** Added a unique constraint on `(userId, videoId)` in watch history so concurrent page loads can't both record a view.
- **Stricter input validation** on registration (email format, username length/characters), comments (2000-char cap), video/channel titles, and URLs (must be `https:`).
- **Public debug endpoint locked down.** `/api/v1/debug-db` was publicly accessible and leaked database host info. Now admin-only.
- **Security headers added.** HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy.
- **Timing-safe secret comparison** on the seed/cleanup endpoints to prevent timing attacks.
- **Mobile drawer fixed.** Escape key now closes it, body scroll is locked while open, and the mislabeled "Watch Later" item is now correctly split into History and Saved.

### Under the hood
- 25 files changed, ~800 lines added across the feature work.
- Build passes, lint clean, all commits are descriptive and per-feature.
- `REVIEW.md` moved to `docs/REVIEW.md` with status markers (✅ done / ⏳ partial / ⬜ not started) on every roadmap item.
- `next/image` configured for Vercel Blob URLs — components can now be incrementally migrated to `<Image>` for responsive sizing and WebP/AVIF conversion.

### Known gaps
- **Password reset and email verification** are not yet implemented — they need an email service (Resend, SendGrid, etc.) configured in Vercel env vars. Once you add `RESEND_API_KEY`, this is a clean follow-up.
- **Playlist reordering** is not yet implemented (drag-and-drop). Videos appear in add-order.
- **`<img>` → `<Image>` migration** is configured but not yet applied to existing components.
- **Notification polling** still hits the API every 60s. Should move to SSE or visibility-gated polling.

---

## Earlier — Notifications, hashtags, For You feed, deep links

### Notifications
- The notification bell now shows real notifications instead of demo data.
- You get notified when someone subscribes to your channel, comments on your video, or likes your video. Admins get notified when a video is flagged.
- Notifications self-suppress for your own actions (no "you liked your own video" spam).
- "Mark all as read" button, unread count badge, auto-refresh every 60s.

### Hashtags
- Videos can have up to 8 hashtags. Tags are separate from categories — categories are curated, tags are creator-defined.
- New `/tag/<slug>` pages list all videos with a given tag.
- Tags appear as clickable chips on video cards and the watch page.
- Tag input on the upload page (type and press Enter or comma).

### "For You" feed
- Logged-in users with watch history see a personalized "For You" shelf at the top of the home page.
- Ranking considers: shared tags with your watch history, shared categories, your subscriptions, channels you've liked, recency, and excludes videos you've disliked.
- Falls back to trending if you're not logged in or have no history.

### Shareable URLs
- Every video, channel, category, tag, search, and the trending/explore pages now have their own URL.
- Browser back/forward works. Pasting a URL into a fresh tab lands on the right page.

### Other
- Rate limiting added on signup, upload, voting, and commenting to prevent abuse.
- `ARCHITECTURE.md` added documenting the v1 design choices and when each deferral should be revisited.
- Dependency audit closed 44 of 54 known vulnerabilities (81% reduction). Remaining 10 are upstream issues with no patched version available.

---

## Even earlier — Uploads, video player, auth

### Video uploads
- Logged-in users can upload videos (MP4, WebM, MOV up to 200MB).
- Thumbnails auto-generate from the first frame if you don't pick one.
- Videos upload directly to Vercel Blob from your browser, bypassing the serverless body limit.

### Video player
- Real adaptive streaming via hls.js for `.m3u8` sources — the quality menu shows actual renditions from the manifest.
- Progressive (non-HLS) videos show their source quality (e.g. "720p (source)") instead of a hard-coded placeholder.
- Portrait videos cap at 65vh on mobile so the title and actions stay visible.

### Authentication
- Login with email or username + password, or Google OAuth.
- Sessions last 30 days.
- Admin role loaded from the database on every request (not cached in the JWT), so role changes take effect immediately.

---

## Pre-changelog history

See `git log` for changes prior to this changelog being maintained.
