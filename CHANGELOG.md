# Changelog

All notable changes to Vert are documented in this file, newest first.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project aims to adhere to its principles. For technical implementation
details (file references, API routes, commit hashes), see
[`docs/DEVLOG.md`](./docs/DEVLOG.md).

---

## [Unreleased]

### Added
- **Mobile-friendly video player controls.** Tapping the video now toggles the controls overlay on and off, so on touch devices you can finally reach the mute, settings, and fullscreen buttons (which were previously hover-only). Controls auto-hide after 3 seconds while playing, but stay visible while paused or while the settings menu is open.
- **iOS safe-area support.** The mobile bottom nav and side drawer now respect the notch and home indicator on iPhone X and later — they're no longer clipped or covered by system UI.
- **Scroll-fade hints on horizontal scroll rows.** Filter rows and tab bars that scroll horizontally now have a subtle fade on the right edge, signalling that more options are available beyond the viewport. Applied to search filters, trending category tabs, and the admin dashboard tab bar.
- **Public changelog page.** A new `/changelog` page renders this file in a clean, readable layout. On desktop, a sticky version sidebar lists every release with scroll-spy highlighting — click a version to jump to it. On mobile, the sidebar collapses and version badges show inline. Linked from the sidebar footer, mobile drawer, and landing-page footer. No login required.
- **Video player keyboard shortcuts.** The player is now keyboard-accessible. Click the player (or Tab to it), then: Space or K to play/pause, Left/Right arrows to seek 5 s, J/L to seek 10 s, Up/Down arrows for volume, M to mute, F for fullscreen, and 0–9 to jump to 0%/10%/…/90% of the video.
- **Consistent focus indicators.** All buttons, links, inputs, selects, and textareas now show a violet focus ring when navigated to by keyboard, making the app noticeably easier to use without a mouse.

### Changed
- **Portrait video player is now smaller on mobile.** Capped at 55% of the viewport height (was 65%), so the title, action buttons, and channel info are visible without scrolling immediately after the page loads.
- **Removed the non-functional "like" button on comments.** The button only updated local state — there was no API call, no persistence, and the displayed count was hardcoded. Rather than ship a misleading UI, it has been removed. A real comment-like feature would require a new database model, an API endpoint, and a `likeCount` field on the comments API; deferred until that work is scheduled.
- **Creator Studio tables now stack as cards on mobile.** The "Your Videos", "Top 5 Videos", and "Recent Uploads" tables previously required horizontal scrolling on a phone — you could only see two columns at a time. They now collapse into a stacked card layout on mobile, with the original tables preserved on desktop.

### Fixed
- **Video cards in the same row now have equal heights.** Previously a card with a short title was shorter than its neighbour with a longer title, making grids look ragged. Cards now stretch to match the tallest card in their row.
- **Long channel names no longer push the Subscribe button off-screen** on the watch page. The channel name truncates gracefully instead.
- **Landing page footer has better visual balance.** The "Vert" wordmark was too light (looked like a placeholder); it now has a heavier weight matching the links on the right.
- **Mobile users can now reach every action button that was previously hidden behind hover.** Across the comment section (delete-own-comment), watch history (remove entry), saved videos (unsave), playlists (delete playlist, remove video), and the video card context menu (Save / Add to playlist / Share / Report), buttons that used `opacity-0 group-hover:opacity-100` were completely invisible and untappable on touch devices. They're now visible by default on mobile and hover-revealed only on desktop.
- **Channel, profile, and watch pages no longer overflow on small phones.** The header rows that crammed avatar + name + action buttons into a single line were pushing the buttons off-screen on 360px-wide viewports. They now stack vertically on mobile and collapse back to a single row on larger screens.
- **Trending ranking badge no longer overlaps the format icon.** The `#2`, `#3` badges were sitting on top of the landscape/square format indicator on video cards. Moved to a non-conflicting position.
- **Search filters and admin tabs no longer wrap awkwardly.** Both rows are now horizontally scrollable on mobile so all options stay on one line.
- **Notification dropdown no longer overflows tiny viewports.** Width capped to `100vw - 1rem`.
- **Re-enabled React StrictMode in development.** StrictMode was previously disabled without a documented reason. Re-enabling it surfaces problems like setState-during-render automatically in dev, which is exactly the bug class fixed in [0.3.0] for the Profile and Creator Studio pages. No user-facing effect in production.

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
