# Changelog

All notable changes to the Vert project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Deep-linkable routes** — videos, channels, categories, search, trending, and explore now have their own URLs.
  - `/watch/[id]`, `/channel/[id]`, `/category/[slug]`, `/search?q=`, `/trending`, `/explore` all render the `<VertApp />` shell, which parses the URL on mount and syncs the Zustand navigation store.
  - Browser back/forward now works (popstate listener added in `VertApp`).
  - URLs are shareable — pasting `https://vert.app/watch/<id>` into a fresh tab lands on the right video.
  - Account-state views (`upload`, `profile`, `admin`, `login`, `signup`, `history`, `saved`, `playlists`, `creator-studio`, `contact`) intentionally stay on `/` to match YouTube's pattern — they're not deep-linkable because they're tied to session state.
  - New helpers in `src/lib/store.ts`: `viewToPath()` and `pathToView()`.

- **Rate limiting** — in-memory, fixed-window counter per (scope, key).
  - Applied to: signup (5/min/IP), upload (10/min/user), vote (60/min/user), comment (20/min/user).
  - Returns HTTP 429 with `Retry-After` and `X-RateLimit-*` headers when exceeded.
  - New module: `src/lib/rate-limit.ts` with `RATE_LIMITS` constant for consistent policy.
  - Note: in-memory means per-instance; when we move to multi-instance deploys (see `ARCHITECTURE.md`), this needs to move to Upstash Redis or Vercel KV.

- **CI pipeline** — GitHub Actions workflow at `.github/workflows/ci.yml`.
  - Runs on every push to `main` and every PR targeting `main`.
  - Two jobs: `build` (lint + next build) and `prisma-schema-check` (validates schema against a throwaway SQLite DB).
  - Uses Bun for consistency with local dev.
  - `concurrency` block cancels in-progress runs when a new commit is pushed to the same ref.

- **`ARCHITECTURE.md`** — new file documenting the v1 architectural choices (SQLite, local-FS uploads, single-route SPA, NextAuth) and why they were chosen, alongside the originally-spec'd design (Postgres, Clerk, Cloudflare Stream, Redis) and the migration triggers that would force each deferral to be revisited.

### Changed

- **`src/lib/db.ts`** — Prisma client is now lazily instantiated via a `Proxy`. Previously, `new PrismaClient()` ran at module top-level, which meant a missing `prisma generate` (or blocked binary download) crashed the entire app at import time — cascading into a 500 on `/api/auth/session-info` and the UI never loading past the skeleton. With the lazy proxy, importing `db` is always safe; the constructor only runs on first property access, so only the route that actually queries the DB fails. The global-cache pattern is preserved to avoid leaking clients across dev HMR.
- **`src/lib/store.ts`** — `navigate()` now also pushes the new view's URL to browser history (via `viewToPath()`). New `skipHistoryPush` option for the inverse `popstate` flow. `View` type extended with `'contact'` (was already used in `VertApp` but missing from the type).
- **`src/components/vert/VertApp.tsx`** — new `useEffect` on mount parses `window.location` and syncs the Zustand store; `popstate` listener handles browser back/forward.
- **`README.md`** — cleaned up: removed duplicated `## Overview` section, fixed stale badges (npm package name didn't match project, GitHub user was wrong), added Quickstart with demo logins, replaced `npm` commands with `bun`, added Architecture section linking to `ARCHITECTURE.md`, added demo-credentials table.

### Fixed

- **Site no longer crashes when `prisma generate` hasn't run.** Previously a missing Prisma client binary would crash the entire app at import time; now only the route that needs the DB fails, and the UI shell still renders.

### Security

- **Dependency audit pass** — closed 44 of 54 known vulnerabilities (81% reduction).
  - Updated `next` from `16.1.3` → `16.2.9`, patching 15 Next.js CVEs (4 high, including SSRF in WebSocket upgrades, middleware/proxy bypass via dynamic route parameter injection, and DoS in Server Components).
  - Updated 18 other direct deps to latest patch versions within their existing semver ranges (`next-auth`, `prisma`, `react`, `zod`, `zustand`, etc.).
  - Added `overrides` to `package.json` for 11 transitive deps that had upstream fixes but were pinned by parents:
    - `prismjs` → `^1.30.0` (DOM clobbering)
    - `js-cookie` → `^3.0.6` (prototype hijack)
    - `@babel/core` → `^7.29.1` (arbitrary file read)
    - `picomatch` → `^2.3.2` (ReDoS)
    - `brace-expansion` → `^2.0.3` (memory exhaustion)
    - `minimatch` → `^9.0.5` (multiple ReDoS)
    - `postcss` → `^8.5.10` (XSS via unescaped `</style>`)
    - `flatted` → `^3.4.0` (DoS + prototype pollution)
    - `js-yaml` → `^4.1.2` (DoS in merge key handling)
    - `diff` → `^5.2.2` (DoS in parsePatch)
    - `uuid` → `^11.1.1` (missing buffer bounds check)
  - **10 vulnerabilities remain and cannot be fixed without upstream changes:**
    - `lodash@4.17.21` + `lodash-es@4.17.21` (3 CVEs) — no patched version published; latest release is still vulnerable per the advisory.
    - `defu@<=6.1.4` (1 high) — Prisma pins to 6.x via `@prisma/config → c12`; overriding to 7.x breaks Prisma's resolution.
    - These will resolve when upstream maintainers publish patched versions.

---

## [Unreleased — earlier batch]

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
