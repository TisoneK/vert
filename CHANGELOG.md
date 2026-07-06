# Changelog

All notable changes to Vert are documented in this file, newest first.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project aims to adhere to its principles. For technical implementation
details (file references, API routes, commit hashes), see
[`docs/DEVLOG.md`](./docs/DEVLOG.md).

---

## [Unreleased]

### Added
- Nothing yet.

### Changed
- Nothing yet.

### Fixed
- Nothing yet.

---

## [0.3.0] — 2026-07-06

### Added
- **Playlists.** Create, view, edit, and delete playlists. Add videos to playlists from any video card's menu. View a playlist's videos and play them in order.
- **Admin: User management.** Admins can now search, filter, promote/demote, suspend, and delete user accounts from a new Users tab in the admin dashboard. Self-demotion and self-deletion are blocked for safety.
- **Admin: Database migrations from the UI.** Admins can apply pending schema migrations directly from the browser via a new Database tab. Each migration runs in a transaction and is tracked for audit. CLI scripts are also available under `scripts/`.
- **Account settings.** Users can change their own password (requires current password verification) and delete their own account (multi-step confirmation) from a new Settings page.
- **Search by channel name.** Search now matches video titles, descriptions, and channel names. A new Channels tab in search results shows matching channels.
- **Search filters.** Filter video search results by format (portrait, landscape, square) and upload date (today, this week, this month, this year).
- **Security headers.** Added HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, and Permissions-Policy headers to all responses.
- **Database indexes.** Added composite indexes on Video and Comment tables for the most common query patterns, speeding up the home feed, trending, channel pages, and comment threads.
- **CDN caching.** Trending, categories, and popular tags are now cached at the edge for 1–5 minutes, reducing database load on every page view.
- **Admin migration SQL files.** Added `prisma/migrations/admin/` with timestamped SQL files for the WatchHistory unique constraint and the new query indexes.

### Changed
- **Search is now case-insensitive** across title, description, and channel name. Previously it was case-sensitive on title and description only.
- **For You feed no longer loads every unwatched video.** It now scores the 200 most recent plus 200 most viewed, preventing out-of-memory errors on large databases.
- **Signup form now auto-logs-in new users.** Previously, account creation succeeded but the session was never established, bouncing users to the login page.
- **Pagination is hardened** against negative, NaN, and absurdly large page/limit values. Previously these caused 500 errors.
- **Registration validation is stricter.** Email format is checked, usernames must be 3–20 alphanumeric characters, passwords capped at 200 characters.
- **Video, channel, and comment fields are length-validated** server-side. URLs for video/thumbnail/banner must be `https:`.
- **Mobile drawer behavior improved.** Escape key now closes it, body scroll is locked while open, and the mislabeled "Watch Later" item is now correctly split into History and Saved.
- **`docs/REVIEW.md`** moved from the repo root to `docs/` with status markers on every roadmap item.

### Fixed
- **Signup auto-login was broken.** The signup form sent `email` to the credentials provider but it expects `identifier`. New users were silently bounced to the login page after registering.
- **Pagination 500 errors.** Nine API routes used `parseInt` on query params without validation; requests like `?page=-5` crashed with a 500. All routes now use a shared `parsePagination` helper.
- **View counts could double-count.** A missing unique constraint on `WatchHistory(userId, videoId)` let concurrent page loads both record a view. Added the constraint and updated the view-counter code to handle the race.
- **React anti-pattern in ProfilePage and CreatorStudio.** Auth redirects were calling `setState` during render, which can cause subtle re-render bugs. Moved to `useEffect`.
- **Search results didn't refresh on URL change.** The `SearchResults` component had a stale-closure bug where typing a new search in the header updated the URL but the results list didn't update.
- **Public debug endpoint leaked database info.** `/api/v1/debug-db` was publicly accessible and returned database host details. Now admin-only.
- **Timing-unsafe secret comparison.** The seed and cleanup endpoints used `===` to compare the `SEED_KEY`, leaking it via response-time side channels. Now uses `crypto.timingSafeEqual`.

### Security
- **Input validation** added across registration, video/channel/comment creation, and URL fields to prevent storage of malformed or malicious data.
- **Security headers** (HSTS, X-Frame-Options, etc.) added to prevent clickjacking, MIME sniffing, and downgrade attacks.
- **Debug endpoint locked down** behind admin auth to prevent information leakage.
- **Timing-safe secret comparison** on seed/cleanup endpoints to prevent timing attacks.
- **`next/image` configured** for Vercel Blob and Google avatar URLs, enabling future migration from `<img>` to optimized `<Image>` components.

---

## [0.2.0] — Earlier 2026

### Added
- **Notifications.** Real in-app notifications for subscriptions, comments, likes, and flags. Unread count badge, mark-all-as-read, auto-refresh.
- **Hashtags.** Videos can have up to 8 creator-defined tags. New `/tag/<slug>` pages list all videos with a given tag. Tags appear as clickable chips on video cards and the watch page.
- **"For You" feed.** Personalized video recommendations on the home page for logged-in users, ranked by affinity (shared tags, categories, subscriptions, liked channels, recency).
- **Shareable URLs.** Every video, channel, category, tag, search, and the trending/explore pages now have their own URL. Browser back/forward works.
- **Rate limiting** on signup, upload, voting, and commenting to prevent abuse.
- **`ARCHITECTURE.md`** documenting the v1 design choices and migration triggers.

### Changed
- **Dependency audit** closed 44 of 54 known vulnerabilities (81% reduction). Updated Next.js, NextAuth, Prisma, React, and 18 other direct dependencies. Added `overrides` for 11 transitive deps with upstream fixes.

### Fixed
- **Video player no longer restarts playback** when toggling play/pause or settings. Side effects isolated in a `useEffect` keyed on `videoUrl`.
- **Site no longer crashes when `prisma generate` hasn't run.** Prisma client is now lazily instantiated via a Proxy, so a missing binary only fails the route that needs it, not the whole app.

---

## [0.1.0] — Initial release

### Added
- **Video uploads.** Logged-in users can upload videos (MP4, WebM, MOV up to 200MB) directly to Vercel Blob. Thumbnails auto-generate from the first frame.
- **Video player** with HLS adaptive streaming via hls.js, real quality menu from the manifest, and mobile-first portrait sizing.
- **Authentication** with email/username + password or Google OAuth. 30-day sessions. Admin role loaded from the database on every request.
- **Core pages:** home feed, trending, explore, categories, search, watch, channel, history, saved, creator studio, admin dashboard.
- **Voting, commenting, subscribing, flagging, and saving** videos.
- **Admin dashboard** with analytics, flag moderation, and channel suspension.

---

[Unreleased]: https://github.com/TisoneK/vert/compare/v0.3.0...HEAD
[0.3.0]: https://github.com/TisoneK/vert/releases/tag/v0.3.0
[0.2.0]: https://github.com/TisoneK/vert/releases/tag/v0.2.0
[0.1.0]: https://github.com/TisoneK/vert/releases/tag/v0.1.0
