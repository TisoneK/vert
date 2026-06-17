# Changelog

All notable changes to the Vert project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **`POST /api/v1/upload`** — multipart/form-data file upload endpoint.
  - Authenticated (any logged-in user).
  - Accepts field name `video`, `thumbnail`, `file`, or the first file field present.
  - 200 MB hard size cap; MIME-type allowlist (`video/*`, `image/*`).
  - Files stored under `public/uploads/{yyyy-mm}/<userIdShort>-<uuid>.<ext>`, served at `/uploads/...`.
  - Returns `{ url, filename, size, mimeType, originalName }` with HTTP 201.
  - Production note: swap local FS for S3/R2 once storage env vars are wired (see `VERT-RULES.md` §6).

- **`Notification` Prisma model** — in-app notifications table.
  - Fields: `id`, `userId`, `type` (`subscription | comment | vote | flag | admin | system`), `title`, `message`, `actorId?`, `relatedVideoId?`, `relatedChannelId?`, `isRead`, `createdAt`.
  - Indexed on `(userId, isRead, createdAt)` for fast unread lookups.
  - Cascading delete on user removal.

- **Notifications API** — three new routes under `/api/v1/notifications`:
  - `GET /` — list current user's notifications; supports `?unread=true` and `?limit=N` (max 100). Returns `{ notifications, unreadCount, totalCount }`.
  - `PATCH /:id/read` — mark a single notification as read (ownership-checked).
  - `POST /read-all` — mark every unread notification as read; returns `{ updated }`.

- **Real adaptive streaming in `VideoPlayer`** via `hls.js`.
  - `.m3u8` URLs are loaded through `hls.js` (or Safari native HLS when supported).
  - The quality menu is now populated from the actual `Hls.Levels` parsed from the manifest — `Auto` plus one entry per rendition, highest first.
  - Selecting a level sets `hls.currentLevel`; the current label is kept in sync via the `LEVEL_SWITCHED` event.
  - For progressive (non-HLS) videos, the menu shows the source quality derived from `videoHeight` (e.g. `720p (source)`) instead of the previous hard-coded `1080p / 720p / 480p` placeholder.
  - `hls.js` instance is properly destroyed on URL change and unmount to avoid leaks.

- **Seed data** — `prisma/seed.ts` now creates four sample notifications for `user1@vert.com` (one read, three unread) covering subscription, vote, comment, and system types.

- **`CHANGELOG.md`** — this file.

### Changed

- **`NotificationCenter` component** — fully rewritten to consume live data.
  - Fetches `/api/v1/notifications?limit=50` on mount and when the logged-in user changes; refreshes every 60 s.
  - Unread count badge shows the actual number (capped at `9+`).
  - Clicking a notification marks it as read (optimistic update, reverts on failure).
  - "Mark all as read" button calls `POST /api/v1/notifications/read-all`.
  - Outside-click closes the dropdown.
  - Falls back gracefully when not logged in ("Sign in to see notifications").
  - Replaced hard-coded demo notifications array entirely.

- **`VideoPlayer` quality menu** — see "Real adaptive streaming" above. The hard-coded `1080p / 720p / 480p` list is gone.

### Fixed

- `VideoPlayer` previously called `video.src = videoUrl` directly on every render of the controls path; the new implementation isolates side effects in a `useEffect` keyed on `videoUrl`, so toggling play/pause or settings no longer restarts playback.

### Security

- Upload route enforces authentication, MIME-type allowlist, file-size cap, and uses `crypto.randomUUID()` for filename generation (no user-supplied filename reaches disk).
- All notification routes are ownership-checked — a user cannot read or mark another user's notifications.

### Dependencies

- Added `hls.js@^1.6.16` for adaptive HLS playback.

---

## Earlier history

See `git log` for changes prior to this changelog.
