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
- **Admin: User management.** Admins can now search, filter, change roles, suspend, and delete user accounts from a new Users tab in the admin dashboard. Safety guards prevent admins from locking themselves out of their own account.
- **Admin: Database updates from the UI.** Admins can apply pending database updates directly from the browser via a new Database tab, without needing shell access. Each update is applied safely and recorded for traceability.
- **Account settings.** Users can change their own password (requires current password verification) and delete their own account (multi-step confirmation) from a new Settings page.
- **Search by channel name.** Search now matches video titles, descriptions, and channel names. A new Channels tab in search results shows matching channels.
- **Search filters.** Filter video search results by format (portrait, landscape, square) and upload date (today, this week, this month, this year).
- **Security headers.** Added HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, and Permissions-Policy headers to all responses.
- **Database indexes.** Added composite indexes on Video and Comment tables for the most common query patterns, speeding up the home feed, trending, channel pages, and comment threads.
- **CDN caching.** Trending, categories, and popular tags are now cached at the edge for 1–5 minutes, reducing database load on every page view.
- **Database schema updates.** Added the missing unique constraint on watch history (fixes double-counted views) and performance indexes on the video and comment tables.

### Changed
- **Search is now case-insensitive** across title, description, and channel name. Previously it was case-sensitive on title and description only.
- **For You feed no longer loads every unwatched video.** It now scores the 200 most recent plus 200 most viewed, preventing out-of-memory errors on large databases.
- **Signup form now auto-logs-in new users.** Previously, account creation succeeded but the session was never established, bouncing users to the login page.
- **Pagination is hardened** against negative, NaN, and absurdly large page/limit values. Previously these caused 500 errors.
- **Registration validation is stricter.** Email format is checked, usernames must be 3–20 alphanumeric characters, passwords capped at 200 characters.
- **Video, channel, and comment fields are length-validated** server-side. URLs for video/thumbnail/banner must be `https:`.
- **Mobile drawer behavior improved.** Escape key now closes it, body scroll is locked while open, and the mislabeled "Watch Later" item is now correctly split into History and Saved.
- **Internal docs reorganized.** The code review report moved into a `docs/` folder with status markers showing what's done, partial, and not started.

### Fixed
- **Signup auto-login was broken.** The signup form sent `email` to the credentials provider but it expects `identifier`. New users were silently bounced to the login page after registering.
- **Pagination 500 errors.** Some API routes didn't validate page/limit query params, so requests like `?page=-5` crashed with a 500. All list endpoints now clamp to safe values.
- **View counts could double-count.** A missing database constraint meant concurrent page loads could both record a view for the same user. Added the constraint and made the view counter handle the race gracefully.
- **Profile and Creator Studio pages no longer trigger React warnings.** Auth redirects were happening during render instead of after, which could cause subtle re-render bugs. Fixed.
- **Search results didn't refresh on URL change.** Typing a new search in the header updated the URL but the results list didn't update. Fixed.
- **Public diagnostic endpoint leaked database info.** A built-in health-check endpoint was publicly accessible and exposed internal database details. Now restricted to admins.
- **Secret key comparison hardened.** Internal setup endpoints compared their secret key in a way that could leak it via response-time differences. Now uses a constant-time comparison.

### Security
- **Input validation** added across registration, video/channel/comment creation, and URL fields to prevent storage of malformed or malicious data.
- **Security headers** (HSTS, X-Frame-Options, etc.) added to prevent clickjacking, MIME sniffing, and downgrade attacks.
- **Diagnostic endpoint locked down** to admin-only access to prevent information leakage.
- **Secret key comparison hardened** on internal setup endpoints to prevent timing-based attacks.
- **Image optimization enabled.** The app is now configured to optimize images served from cloud storage and Google avatars, paving the way for faster-loading thumbnails and automatic WebP/AVIF conversion.

---

## [0.2.0] — Earlier 2026

### Added
- **Notifications.** Real in-app notifications for subscriptions, comments, likes, and flags. Unread count badge, mark-all-as-read, auto-refresh.
- **Hashtags.** Videos can have up to 8 creator-defined tags. New `/tag/<slug>` pages list all videos with a given tag. Tags appear as clickable chips on video cards and the watch page.
- **"For You" feed.** Personalized video recommendations on the home page for logged-in users, ranked by affinity (shared tags, categories, subscriptions, liked channels, recency).
- **Shareable URLs.** Every video, channel, category, tag, search, and the trending/explore pages now have their own URL. Browser back/forward works.
- **Rate limiting** on signup, upload, voting, and commenting to prevent abuse.
- **Architecture documentation** added, explaining the v1 design choices and what would trigger revisiting each deferred decision.

### Changed
- **Dependency security audit** closed 44 of 54 known vulnerabilities (81% reduction). Updated the framework, auth, database, and UI libraries to the latest patched versions, plus pinned 11 transitive dependencies that had upstream fixes available.

### Fixed
- **Video player no longer restarts playback** when toggling play/pause or settings. Player initialization is now properly tied to the video URL, not to control interactions.
- **Site no longer crashes when the database client hasn't been generated.** The database client is now loaded lazily, so a missing setup step only fails the route that needs it, not the whole app.

---

## [0.1.0] — Initial release

### Added
- **Video uploads.** Logged-in users can upload videos (MP4, WebM, MOV up to 200MB). Files upload directly to cloud storage from the browser, bypassing server size limits. Thumbnails auto-generate from the first frame.
- **Video player** with adaptive streaming for HLS sources, a real quality menu pulled from the video manifest, and mobile-first portrait sizing.
- **Authentication** with email/username + password or Google OAuth. 30-day sessions. Admin role loaded from the database on every request.
- **Core pages:** home feed, trending, explore, categories, search, watch, channel, history, saved, creator studio, admin dashboard.
- **Voting, commenting, subscribing, flagging, and saving** videos.
- **Admin dashboard** with analytics, flag moderation, and channel suspension.

---

[Unreleased]: https://github.com/TisoneK/vert/compare/v0.3.0...HEAD
[0.3.0]: https://github.com/TisoneK/vert/releases/tag/v0.3.0
[0.2.0]: https://github.com/TisoneK/vert/releases/tag/v0.2.0
[0.1.0]: https://github.com/TisoneK/vert/releases/tag/v0.1.0
