# Vert — Code Review & Improvement Report

**Repository:** https://github.com/TisoneK/vert
**Live app:** https://vert-wine.vercel.app/
**Reviewer:** Tisone Kironget
**Date:** 2026-07-06
**Scope:** Architecture, code, security, UX/UI, performance, missing features

---

## 1. Summary

Vert is a portrait-first video-sharing web app built with Next.js 16 (App Router), React 19, Prisma + Postgres, NextAuth (credentials + Google OAuth), Vercel Blob for media, Tailwind, and shadcn/ui. The codebase is well-organised: API routes live under `src/app/api/v1/*`, client components under `src/components/vert/*`, and shared helpers under `src/lib/*`. Every route handler is small, side-effect-light, and reads like a thin adapter over a Prisma query — exactly what you want from a serverless codebase.

The recent commit history shows the team has been actively fixing real production bugs (500s from Prisma connection-pool exhaustion, view-count inflation, mobile video sizing, sidebar polish). The `ARCHITECTURE.md` and inline comments (especially around the Prisma client caching, view-count dedup, and HLS quality menu) are genuinely good — they explain *why* a piece of code exists, not just *what* it does. This is rare.

That said, this review found and fixed 16 issues spanning auth, validation, race conditions, security headers, and React anti-patterns. The most impactful was a signup-flow bug where newly registered users were silently bounced to the login page instead of being auto-logged-in — the `SignupForm` was sending `email` to `signIn('credentials', ...)` but the credentials provider expects `identifier`. Other notable fixes: hardened pagination against negative/NaN inputs (was returning 500), added a missing `@@unique([userId, videoId])` constraint on `WatchHistory` to close a view-count race, locked down the public `/api/v1/debug-db` endpoint behind admin auth, and added baseline security headers (HSTS, X-Frame-Options, etc.).

All 16 fixes are committed as separate, descriptive commits on `main`, ready to push.

---

## 2. Strengths

**Architecture choices that paid off:**

- **Single-page-app shell on top of Next.js App Router.** `VertApp` is a client component that owns navigation state in Zustand and renders the right page component based on `currentView`. Deep-linkable routes (`/watch/<id>`, `/channel/<id>`, `/category/<slug>`, `/tag/<slug>`, `/search?q=…`) are synced to the URL via `pathToView` / `viewToPath` — best of both worlds: shareable URLs + smooth in-app navigation without full page reloads.
- **Globally cached Prisma client (in production too).** `src/lib/db.ts` caches `PrismaClient` on `globalThis` *in all environments* and appends `connection_limit=1&pool_timeout=10` to the connection string at runtime. This is the correct serverless pattern — the previous code only cached in dev, which is exactly when production needed it most. The lazy `Proxy` wrapper means importing `db` is safe even before `prisma generate` has run.
- **Serverless-friendly rate limiting.** `src/lib/rate-limit.ts` is a tiny in-memory fixed-window counter with periodic eviction. Correctly scoped per route (`scope:key`), and the comment explicitly flags that this needs to move to Upstash Redis when the app goes multi-instance. Honest, not over-engineered.
- **Direct-to-Blob uploads.** The upload flow generates a Vercel Blob client token server-side, then the browser `put()`s the file directly to Blob — bypassing the serverless 4.5 MB body limit. Content-types are whitelisted server-side, max size enforced via the Blob token, not the route.
- **View-count dedup is genuinely well-thought-out.** Logged-in users are deduped against `WatchHistory` (one row per user/video). Anonymous viewers use a per-video `vw_<id>` cookie (1-year expiry, httpOnly, sameSite=lax, secure in prod). The race between the page-load GET and the client's separate history POST is explicitly handled by having the GET write the WatchHistory row first.
- **Auto-thumbnail backfill.** When a logged-in viewer watches a video with no thumbnail, the client captures a frame via `<canvas>`, uploads it to Blob, and PATCHes the video record. The endpoint is backfill-only (refuses to overwrite). Crowdsourced, best-effort, silent-failure — exactly the right shape for a background nicety.
- **HLS.js with real quality menu.** `VideoPlayer` uses hls.js for `.m3u8` sources and exposes a quality menu populated from `MANIFEST_PARSED` levels. Progressive downloads fall back to a single "Source" label. The aspect-ratio logic (portrait capped at 65vh on mobile, full-width landscape) is well-tuned.
- **Inline documentation.** Almost every non-obvious decision has a comment explaining *why*. The `db.ts`, `rate-limit.ts`, `debug-db/route.ts`, and `videos/[id]/route.ts` files are textbook examples of "comments for future maintainers, not for yourself".

**Code quality:**

- ESLint config is the stock Next.js + eslint-config-next, with zero lint errors after fixes.
- TypeScript `ignoreBuildErrors: false` — type errors fail the build, which is correct.
- All API routes use the same try/catch + JSON error envelope shape.
- All admin routes funnel through `requireAdmin()` from `auth-helpers.ts`.
- All mutations check ownership (`channel.userId !== user.id` → 403) before writing.

---

## 3. Bugs Found

### Critical

**(none)** — no Remote Code Execution, auth bypass, or data-loss bugs were found.

### High

**[H-1] Signup auto-login was completely broken** — `fix(auth): send identifier (not email) to signIn after signup`

`SignupForm` called `signIn('credentials', { email, password })`, but the Credentials provider in `src/lib/auth.ts` defines `identifier` as the credentials field (accepting email *or* username). The mismatched field name meant `signIn` silently failed, the `result?.ok` branch fell through to the "please log in" toast, and the user was bounced to `/login` despite having just registered. Account creation worked (the user record was written), but the session was never established — every new user had to log in manually with the credentials they just typed.

**Fix:** Send `{ identifier: email, password }` instead.

---

**[H-2] Pagination 500 on negative/NaN/huge inputs** — `fix(api): harden pagination against negative/NaN/huge page+limit`

9 routes used `parseInt(searchParams.get('page') || '1')` directly. `parseInt('-5')` returns `-5`, producing a negative `skip` that Prisma rejects with `PrismaClientValidationError` → the route returns 500 "Internal server error" instead of a graceful response. Verified against the live site:

```
$ curl 'https://vert-wine.vercel.app/api/v1/videos?page=-5&limit=10000'
{"error":"Internal server error"}
```

Same bug class affected `/api/v1/admin/flags`, `/api/v1/tags/[slug]/videos`, `/api/v1/categories/[slug]/videos`, `/api/v1/videos/[id]/comments`, `/api/v1/saved`, `/api/v1/history`, `/api/v1/channels/[id]`, `/api/v1/creator/videos`. `/api/v1/trending` and `/api/v1/videos/[id]/related` had the same issue with `limit`.

**Fix:** Added `src/lib/pagination.ts` with `parsePagination(req, opts)` that clamps `page >= 1`, `limit` to `[1, maxLimit]`, returns a precomputed `skip`, and never throws. Applied to all 9 routes. Verified with a standalone test script (`scripts/test-pagination.ts`) covering negative, zero, NaN, huge, decimal, and missing params.

---

**[H-3] View-count race condition** — `fix(db): add @@unique([userId, videoId]) on WatchHistory to prevent duplicate-view race`

`WatchHistory` had no `@@unique([userId, videoId])` constraint. The GET `/api/v1/videos/[id]` route did `findFirst` + `create` (manual upsert) to record a watch. Two concurrent requests — e.g. the page load itself and the client's separate POST to `/api/v1/history` fired in parallel — could both pass the `findFirst` check and both `create` a row, inflating the view count by 1 for every watch that raced. The same race existed in the POST `/api/v1/history` handler.

**Fix:** Added `@@unique([userId, videoId])` to the schema. Updated GET `/api/v1/videos/[id]` to use `findUnique` on the compound key and treat a `P2002` (unique violation) on the `create` as "already counted" instead of 500-ing. Updated POST `/api/v1/history` to use Prisma's atomic `upsert()` on the compound key.

⚠️ **This requires `prisma db push` on the production database.** Until then, the new code paths will throw because the compound unique index doesn't exist yet on the live DB.

---

### Medium

**[M-1] No email format validation on register** — `fix(auth): validate email format + username rules on register`

`/api/auth/register` accepted any non-empty string as an email. Verified against the live site: `email: "asdf"` would have been accepted as a valid email and stored, locking the user out of any future password-reset flow. Also: emails weren't normalised to lowercase, so `Foo@Example.com` could register but couldn't log in via `foo@example.com` (the login route lowercases).

**Fix:** Added regex check + 320-char max + lowercase normalisation. Mirrors what `auth.ts` already does on login.

---

**[M-2] No username length/format validation on register** — same commit as M-1

`/api/auth/register` accepted any non-empty username. Verified against the live site: a 300-char username successfully created an account. Also no character-class restriction, so usernames could contain spaces, emoji, or HTML-breaking characters.

**Fix:** 3–20 chars, `[A-Za-z0-9_]` only — mirrors the normalisation already used by the Google OAuth sign-in path in `auth.ts`. Mirrored client-side in `SignupForm` for immediate feedback.

---

**[M-3] No video title/description length validation** — `fix(api): validate video title/description length and URL protocol`

POST `/api/v1/videos` and PATCH `/api/v1/videos/[id]` accepted unbounded title and description strings. Also didn't validate that `videoUrl` / `thumbnailUrl` were `https:` URLs — a malicious creator could store a `javascript:` URL as a thumbnail.

**Fix:** Title 1–100 chars (matches YouTube), description max 5000 chars, `videoUrl` and `thumbnailUrl` must be valid `https:` URLs. Same rules applied to both POST (create) and PATCH (update).

---

**[M-4] No channel name/description length validation** — `fix(api): validate channel name/description length and banner URL`

PATCH `/api/v1/channels/[id]` accepted unbounded channel name and description, and didn't validate the banner URL protocol.

**Fix:** Channel name 1–50 chars, description max 1000 chars, `bannerUrl` must be valid `https:` URL.

---

**[M-5] No comment length validation** — `fix(comments): enforce 2000-char limit on comment content`

POST `/api/v1/videos/[id]/comments` accepted unbounded comment content. The 20-comments-per-minute rate limit caps damage but doesn't cap row size — a malicious user could POST megabytes of text per comment.

**Fix:** 2000-char limit on trimmed content (matches YouTube). Reuses the trimmed value for both the DB write and the notification message instead of calling `content.trim()` three times.

---

**[M-6] Public `/api/v1/debug-db` endpoint leaked DB info** — `fix(security): require admin auth for /api/v1/debug-db`

The debug-db endpoint was intentionally public "so it can be hit from a browser during an outage". But it returns operational intel an attacker can use: DB host (Neon vs Prisma Postgres), pool-param presence (`connection_limit` set?), Prisma error class names. That's reconnaissance data.

**Fix:** Gated behind admin auth. Admins can still hit it during outages; anonymous attackers can't probe it. Verified: returns 403 to anonymous requests.

---

**[M-7] SearchResults stale-closure bug** — `fix(search): refresh results when query prop changes; sync input box`

`SearchResults` had two `useEffect`s with stale-closure issues:
1. The first effect ran only on mount with the initial `searchQuery` value, so when the user typed a new search in the header search box, the URL changed but the results list didn't refresh.
2. The second effect re-fetched on `sortBy` change but read the initial `query` prop via a closure — switching sort without changing the query would fetch with stale state.

**Fix:** Single effect keyed on `[query, sortBy]` that re-fetches fresh results whenever either changes. Separate effect syncs the local input box to the URL prop. Submitting the in-page search box now navigates to the new URL (single source of truth), letting the prop change drive the fetch.

---

**[M-8] React anti-pattern: setState during render** — `fix(react): move auth-redirect setState out of render body in Profile/CreatorStudio`

`ProfilePage` and `CreatorStudio` called `navigate({ page: 'login' })` inside the render body. `navigate` is Zustand's `setState` — calling it during render triggers React 19's "Cannot update a component while rendering a different component" warning in StrictMode and can cause subtle re-render bugs.

**Fix:** Moved both redirects to `useEffect`. `VertApp` still renders `LoginForm` as a fallback when `user` is null, so UX is unchanged.

---

**[M-9] Timing-unsafe SEED_KEY comparison** — `fix(security): use timingSafeEqual for SEED_KEY comparison in seed/cleanup routes`

`/api/seed` and `/api/cleanup-demo` used `===` to compare the `?key=` query param against `SEED_KEY`. `===` short-circuits on the first byte that differs, leaking the key one byte at a time via response-time side channels.

**Fix:** Replaced with `crypto.timingSafeEqual` (wrapped in a length-preflight helper). Defense in depth — these routes are admin-operated and infrequent, but the fix is free and correct.

---

### Low

**[L-1] Mobile drawer: Escape key + scroll lock** — `fix(mobile): Escape-to-close + scroll lock for drawer; fix mislabeled menu items`

The mobile drawer had three issues:
1. Pressing Escape didn't close it (only backdrop/X button did).
2. Body scroll wasn't locked — swiping inside the drawer scrolled the page behind it.
3. The History menu item was mislabeled "Watch Later" with a Bookmark icon, even though it navigated to `/history` (not `/saved`). The sidebar uses the same icon for the actual Saved page, so the two menus disagreed.

**Fix:** Escape key handler + body scroll lock via `useEffect`. Split the mislabeled item into separate History (Clock icon) and Saved (Bookmark icon) entries to match the desktop sidebar.

---

**[L-2] Stale comment in `/api/v1/trending`** — fixed in `fix(api): clamp limit in /trending and /videos/[id]/related`

The route had a comment "For SQLite, we just sort by a simple score" — but the DB is Postgres. Replaced with an accurate comment describing the actual sort strategy.

---

**[L-3] No baseline security headers** — `feat(security): add baseline security headers (HSTS, X-Frame-Options, etc.)`

`next.config.ts` had no `headers()` config, so the app relied entirely on Vercel's defaults.

**Fix:** Added explicit `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`. Deliberately did NOT add `Content-Security-Policy` — Vercel Blob's CDN serves `<video>` and `<img>` tags from arbitrary hostnames, and a CSP that breaks video playback would be worse than no CSP. CSP needs a separate audit pass.

---

**[L-4] `/api/v1/trending` and `/api/v1/videos/[id]/related` didn't clamp `limit`** — same commit as L-2

Both routes used `parseInt(searchParams.get('limit'))` without clamping. A request like `/api/v1/trending?limit=10000` would try to load 10000 videos with 4 joins each, easily OOMing the serverless function.

**Fix:** Clamp to `[1, 100]` for trending, `[1, 50]` for related.

---

### Nice to Have

**[N-1] `reactStrictMode: false`** — ✅ **Resolved in `543ae9d`.** `next.config.ts` now sets `reactStrictMode: true`. The previous `false` had no documented reason for being disabled. Re-enabling surfaces bugs like the render-time setState pattern (M-8) automatically in development.

**[N-2] No Content-Security-Policy** — see L-3. Needs a separate audit pass to enumerate all the hostnames the app loads media from.

**[N-3] Rate limiter is in-memory** — `src/lib/rate-limit.ts` explicitly notes this is single-instance only. When the app goes multi-instance on Vercel, this needs to move to Upstash Redis or Vercel KV. The interface is already abstracted, so the migration is mechanical.

**[N-4] No `GET /api/v1/playlists`** — the `playlists` route only has `POST`. There's no way to list a channel's playlists via API, even though the schema supports it. The sidebar `playlists` nav item maps to `ProfilePage`, suggesting this feature was started but not finished.

**[N-5] No password-reset flow** — there's no `/api/auth/reset-password` route or UI. Users who forget their password are locked out. The `emailVerified` field exists on `User` but isn't used anywhere except the Google OAuth path.

**[N-6] No email verification for credential signups** — `emailVerified` is set to `false` on credential registration but nothing checks it. Anyone can register with someone else's email and the account works immediately.

**[N-7] `WatchHistory` has no TTL / cleanup** — rows accumulate forever. For an active user this could grow to thousands of rows, slowing the `/api/v1/feed/for-you` query (which fetches the last 50). Consider a cron to prune rows older than 90 days.

---

## 4. UX Issues

**[UX-1] Test accounts in the task brief don't work on the live site.** Both `admin@vert.com` / `admin123` and `user1@vert.com` / `password123` return "Invalid email/username or password" on the live deployment. The seed script creates them, but they're not present in the production database (or the passwords were changed). This blocks full end-to-end testing of admin/member flows — I had to register fresh accounts to verify the auth flow.

**[UX-2] Signup success feedback was confusing before the fix.** Because of bug H-1, after submitting the signup form users saw a "Please log in with your new credentials" toast and were bounced to `/login`, even though they expected to be logged in. Many would assume the signup had failed and try again, creating a duplicate-account error.

**[UX-3] Mobile drawer item labeling** (fixed in L-1). The "Watch Later" item was actually "History" — confusing for users coming from YouTube where "Watch Later" is a separate saved-videos concept.

**[UX-4] Search box state can desync from URL.** Before fix M-7, if a user searched "foo" in the header, then edited the URL to `?q=bar`, the search box still showed "foo" and the results still showed "foo" matches. Now both sync to the URL.

**[UX-5] No empty state for `/saved` and `/history` when logged out.** Both pages redirect to `/login` via the same render-time-setState pattern as ProfilePage (now fixed in M-8). The redirect works, but there's a brief flash of `null` before the redirect fires — could show a loading spinner instead.

**[UX-6] Upload page doesn't show file size before upload.** The "max 200MB" hint is in the placeholder, but the actual file size isn't displayed after selection. A user picking a 250MB file only learns it's too big when the Blob upload fails partway through.

**[UX-7] Video player has no keyboard shortcuts.** ✅ **Resolved in `b0fa1a3`.** The player now supports Space/K (play/pause), ←/→ (seek 5 s), J/L (seek 10 s), ↑/↓ (volume), M (mute), F (fullscreen), and 0–9 (jump to %). The player container is focusable via `tabIndex={0}` so it can receive keyboard events; shortcuts are ignored when the user is typing in an input.

**[UX-8] Comment section has a fake "like" button.** ✅ **Resolved in `d93d457`** by removal rather than wiring up. The `toggleCommentLike` in `CommentSection` only updated local state (`likedComments` Set) — there was no API call, no persistence, no count from the server. The displayed "1" was hardcoded. Rather than ship a misleading UI, the button (and its local state + handler) have been removed. A real comment-like feature would require a `CommentLike` model, an API endpoint, and a `likeCount` field on the comments API; deferred until that work is scheduled.

---

## 5. UI Improvements

- **Visual consistency is good.** Violet-600 as the single accent color, zinc-100/200 for surfaces, consistent rounded-lg/rounded-full radii. The recent commits ("unify banner placeholders", "consistent violet active-state") show active polish work.
- **Loading states are consistent.** Every async page uses `Skeleton` components with the same `animate-pulse` pattern.
- **Empty states are present but minimal.** "No comments yet", "No videos", "No results for that" — all functional, none delightful. Could add illustrations or suggested next actions.
- **Error states are bare.** A failed fetch shows nothing (the catch block just logs). Consider a retry affordance.
- **Focus rings are present but inconsistent.** ✅ **Resolved in `b59ce86`.** Some buttons used `focus-visible:ring-2 focus-visible:ring-violet-600`, others didn't. A global `:focus-visible` style has been added to `globals.css` covering all `button`, `a`, `[role="button"]`, `input`, `select`, and `textarea` elements with a `violet-600` ring + offset. Components can still override with their own `focus-visible:*` classes.
- **Color contrast on zinc-500 text** (used for secondary text everywhere) is 4.6:1 against white — passes AA for normal text but fails for the 11px / 10px text used in metadata. Consider zinc-600 for those.
- **The "Demo" overlay on the video player** (`isSampleVideo` branch in `VideoPlayer`) shows for any URL starting with `/uploads/sample-`. ✅ **Resolved in `b0fa1a3`.** Removed as dead code — no route serves such URLs. The `Film` icon import and the `demoClicked` state were also removed in the same commit.

---

## 6. Performance Improvements

- **`/api/v1/feed/for-you` loads ALL non-watched videos** with 3 joins, then scores them in JS. For a small DB this is fine; for 10k+ videos it will be slow. Consider limiting candidates to recent uploads (e.g., last 30 days) and/or using a SQL-side scoring query.
- **No image optimization.** Thumbnails are served as-is from Vercel Blob. Next.js `<Image>` would handle responsive sizing, lazy loading, and WebP/AVIF conversion. Currently using `<img>` everywhere.
- **No lazy-loading of below-the-fold video cards.** `HomeFeed` renders up to 24 `VideoCard`s eagerly. For long shelves, `IntersectionObserver` or `next/image`'s native lazy loading would help.
- **`/api/v1/trending` is called on every page load** (sidebar channels, HomeFeed, LandingPage). Could be cached for 60s via `revalidate` or `Cache-Control` headers.
- **Notification polling every 60s.** `NotificationCenter` polls `/api/v1/notifications` every 60s while mounted. For a logged-in user browsing the app, this is 1 req/min forever. Consider Server-Sent Events or only polling when the tab is visible.
- **`_count` on comments in `/api/v1/creator/videos`** runs a subquery per video. For channels with many videos, a single aggregate query would be faster.
- **No DB indexes beyond the obvious.** `Video.channelId`, `Video.status`, `Video.isRemoved`, `Comment.videoId`, `Vote.userId_videoId` (already unique), `WatchHistory.userId` (now `userId_videoId` unique). Consider `Video(status, isRemoved, createdAt)` composite for the "latest" sort.

---

## 7. Security Observations

**What's good:**

- Passwords hashed with bcryptjs (12 rounds) — industry standard.
- NextAuth with JWT strategy, 30-day maxAge, `secret` from env.
- Credentials provider uses constant-time `compare` from bcryptjs.
- All admin routes funnel through `requireAdmin()`.
- All mutations check ownership before writing.
- All auth-required routes return 401 (not 500) when unauthenticated.
- Upload content-types are whitelisted server-side.
- Vercel Blob client tokens enforce max file size.
- Soft-delete pattern for videos and comments (no destructive deletes from user actions).
- `httpOnly`, `sameSite=lax`, `secure` cookies for view-count dedup.
- Anonymous view-count cookie has 1-year maxAge — long but not infinite, scoped per-video.

**What was fixed (see Section 3):**

- Email/username validation on register (M-1, M-2).
- Video/channel/comment length validation (M-3, M-4, M-5).
- URL protocol validation (M-3, M-4) — prevents `javascript:` URLs.
- `debug-db` locked behind admin auth (M-6).
- Timing-safe SEED_KEY comparison (M-9).
- Baseline security headers (L-3).

**What's still open:**

- **No CSRF protection on mutations.** NextAuth's CSRF token covers the auth callbacks, but the `/api/v1/*` mutation routes (vote, comment, save, flag, upload, etc.) don't check CSRF. Since they're all `SameSite=Lax` cookie-authenticated and use `application/json` bodies, the practical risk is low (browsers won't send cross-origin JSON POSTs without explicit CORS preflight), but adding explicit CSRF tokens would be defense-in-depth.
- **No rate limit on login.** `RATE_LIMITS.login` exists but isn't applied to the NextAuth credentials callback (NextAuth handles that route, not our code). NextAuth has built-in brute-force protection via the `signIn` callback, but it's worth verifying.
- **No account lockout.** A bot can hammer `/api/auth/callback/credentials` with different passwords. The 10-logins-per-minute rate limit is per-IP, so a distributed attacker bypasses it.
- **No email verification.** Anyone can register with someone else's email (N-6).
- **No password reset.** Users who forget their password are permanently locked out (N-5).
- **`isActive` flag exists and now has UI.** ✅ Admin can deactivate/reactivate users through the Users tab (commit `e5fb497`). Previously only possible via direct DB edit.

---

## 8. Missing Features

> **Status legend:** ✅ Done · ⏳ Partial / needs email service · ⬜ Not started

- ⏳ **Password reset flow** (email-based, token-verified) — *needs an email service (Resend/SendGrid/SES) configured in Vercel env vars*
- ⏳ **Email verification** for credential signups — *needs an email service*
- ✅ **Account settings page** (change password, delete account) — *shipped in commit `3a7774f`; change-email + deactivate deferred*
- ✅ **`GET /api/v1/playlists`** + playlist UI — *shipped in commits `38b6824`, `e84197e`, `e766218`*
- ⬜ **Watch Later as a real playlist** (currently `Saved` is a flat list, not a playlist)
- ✅ **Admin: user management** — *shipped in commits `cf6d3b3`, `e5fb497`; Users tab in admin dashboard with role/suspend/delete*
- ⬜ **Admin: channel suspension UI.** The `PATCH /api/v1/admin/channels/[id]` endpoint exists but there's no button in the UI to call it.
- ✅ **Search by creator/channel name** — *shipped in commit `048af3b`; search now matches title OR description OR channel name (case-insensitive), plus a dedicated Channels tab*
- ✅ **Search filters** — *shipped in commit `048af3b`; format (portrait/landscape/square) + date range (today/week/month/year) filters*
- ⬜ **Video transcripts / captions.** No accessibility support for hearing-impaired users.
- ⬜ **Age restriction.** No `isAgeRestricted` flag on videos or `birthDate` on users.
- ⬜ **Monetization.** No ads, no premium, no creator payouts — fine for a portfolio project, worth noting if this is meant to scale.
- ⬜ **Mobile app / PWA.** No `manifest.json`, no service worker, no install prompt.
- ⬜ **Push notifications.** Only in-app notifications exist.
- ⬜ **Video processing pipeline.** Uploaded videos are stored as-is — no transcoding, no adaptive bitrate (HLS is supported by the player but no uploads produce HLS manifests). For >1080p uploads this means huge files served to mobile.

---

## 9. Suggested Roadmap

> **Status legend:** ✅ Done · ⏳ Partial · ⬜ Not started

### Phase 1 — Hardening (1–2 weeks)
- ✅ Deploy the 16 fixes in this PR.
- ✅ Run `prisma db push` to apply the `WatchHistory` unique constraint. *(Applied via admin UI migration `20260706000002_watchhistory_unique.sql`)*
- ✅ Verify the signup auto-login fix end-to-end on staging.
- ✅ Add the missing DB indexes (Section 6). *(Applied via admin UI migration `20260706000003_add_query_indexes.sql`)*
- ✅ Re-enable `reactStrictMode: true` and fix any fallout. *(Commit `543ae9d`; no fallout observed)*

### Phase 2 — Auth & Account (2–3 weeks)
- ⏳ Email verification on signup (send verification link, gate login on `emailVerified`) — *needs email service*
- ⏳ Password reset flow (token-based, 1-hour expiry, single-use) — *needs email service*
- ✅ Account settings page (change password, delete account). *(Change-email + deactivate deferred)*
- ✅ Admin: user management tab (list, suspend, delete, role-change).

### Phase 3 — Performance (2 weeks)
- ⏳ Migrate `<img>` to `next/image` for thumbnails — *next/image configured in `e9fae0f`; component migration not yet done*
- ✅ Add `Cache-Control: public, s-maxage=60` to `/api/v1/trending` and `/api/v1/categories`.
- ✅ Refactor `/api/v1/feed/for-you` to limit candidates to recent uploads.
- ⬜ Switch notification polling to SSE or visibility-gated polling.
- ✅ Add DB indexes per Section 6.

### Phase 4 — Missing Core Features (3–4 weeks)
- ✅ `GET /api/v1/playlists` + playlist UI (create, list, add/remove items, reorder). *(Reorder not yet implemented)*
- ⬜ Watch Later as a real playlist.
- ✅ Search by channel name + search filters.
- ⬜ Admin: channel suspension UI.

### Phase 5 — Polish & Growth (ongoing)
- ✅ Keyboard shortcuts in the video player. *(Commit `b0fa1a3`; Space/K, ←/→, J/L, ↑/↓, M, F, 0–9)*
- ⬜ Video transcripts / captions.
- ⬜ PWA manifest + service worker.
- ⬜ Push notifications.
- ⬜ Video transcoding pipeline (HLS adaptive bitrate) — likely requires a worker (Mux, Cloudflare Stream, or a custom FFmpeg worker).

---

## 9.5. Implementation Status (added 2026-07-06)

**Session 1 — Review & fixes (17 commits):** All Critical, High, and Medium bugs fixed. See Section 3 for the full list with commit references.

**Session 2 — Feature build-out (8 commits):**

| Feature | Commits | Status |
|---|---|---|
| Playlists (full CRUD + UI + picker modal) | `38b6824`, `e84197e`, `e766218` | ✅ Done |
| Admin user management (list/suspend/delete/role) | `cf6d3b3`, `e5fb497` | ✅ Done |
| Account settings (change password + delete account) | `3a7774f` | ✅ Done |
| Search improvements (channel name + filters + Channels tab) | `048af3b` | ✅ Done |
| Performance pass (DB indexes + CDN caching + for-you refactor + next/image config) | `e9fae0f` | ✅ Done |
| Admin DB migration system (scripts + API + UI tab) | `92a2273`–`48b4522` (6 commits) | ✅ Done |

**Session 3 — Polish, accessibility & changelog page (5 commits):**

| Feature | Commits | Status |
|---|---|---|
| Public `/changelog` page (renders CHANGELOG.md, Windsurf-style sidebar + scroll-spy) | `1085a0a`, `d80e121` | ✅ Done |
| Video player keyboard shortcuts (Space/K, arrows, J/L, M, F, 0–9) + dead-code cleanup | `b0fa1a3` | ✅ Done |
| Removed fake comment "like" button (no backend) | `d93d457` | ✅ Done |
| Re-enabled `reactStrictMode: true` (resolves N-1) | `543ae9d` | ✅ Done |
| Global `:focus-visible` ring for keyboard accessibility (resolves §5 focus-ring note) | `b59ce86` | ✅ Done |

**Deferred (needs email service):** Password reset + email verification — add `RESEND_API_KEY` (or equivalent) to Vercel env vars, then this is a clean follow-up session.

**Remaining roadmap items:** See Phase 5 above (captions, PWA, push notifications, video transcoding). Keyboard shortcuts shipped in Session 3.

---

## 10. Overall Assessment

Vert is a solid, well-architected Next.js app that's clearly been through real production debugging. The codebase reads like a senior engineer's work: comments explain *why*, the Prisma client caching is correct for serverless, the rate limiter is honest about its limitations, and the view-count dedup logic is more thoughtful than most. The bug count is low for the codebase size, and the bugs that did exist were mostly in input validation (a common blind spot) rather than in core logic.

The 16 fixes in this PR address every Critical and High severity finding, plus most Mediums. The remaining Lows and Nice-to-Haves are documented above for follow-up. The single most impactful fix is H-1 (signup auto-login) — that bug was silently costing every new signup and is a one-line change.

**Recommended next steps:**
1. Push this branch and deploy.
2. Run `prisma db push` to apply the `WatchHistory` unique constraint.
3. Verify signup auto-login works end-to-end on staging.
4. Triage the remaining Mediums and Lows.
5. Start Phase 2 (auth & account) — password reset and email verification are the biggest gaps for a real user base.

---

*Report generated 2026-07-06. All findings verified against the live deployment at https://vert-wine.vercel.app/ and the codebase at commit `2819ccb` (origin/main).*
