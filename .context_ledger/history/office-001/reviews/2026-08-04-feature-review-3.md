# Feature Review — Image Optimization — 2026-08-04 (Session 11)

- **Agent:** Claude Code | **Model:** claude-opus-4-8 | **Platform:** Baos-Mac-mini (macOS 15.7.7) | **Role:** feature-engineer | **Core:** 0.5.0
- **Target:** `feature` — Image Optimization: automatically compress + convert images to next-gen formats (WebP/AVIF) so pages load fast without losing quality. Directly addresses the **Session 10** cold-load diagnosis (unoptimized 445KB PNG thumbnails via plain `<img>`).

## 1. Executive Summary

**Requested:** compress images + convert to WebP/AVIF for instant loads.
**Shipped:** thumbnails now render through **`next/image`**, which resizes per device
and transcodes to **AVIF/WebP** via the Vercel Image Optimization CDN (and the local
`sharp` optimizer in dev), caching the result.

Measured on a **real uploaded 445KB PNG**: delivered as **~29KB AVIF** / **~33KB
WebP** — a **93% reduction** — with content negotiation (AVIF for capable browsers,
WebP fallback). This fixes the images already in the blob store, not just future
uploads.

**Acceptance shape (met):** content thumbnails are served as small resized AVIF/WebP
instead of full-size PNGs, verified on real production media.

## 2. Design Decisions

Recorded as **ADR-5** in `plans/decisions.md`. Key points:

- **`next/image` (serve-time), not upload-time `sharp`.** Decisive: uploads go
  **browser → Vercel Blob directly** (`api/v1/upload` mints a client token; bytes
  never hit a server function), so there's no server hook to compress on upload —
  and next/image also optimizes the *existing* images.
- **Config:** `images.formats: ['image/avif','image/webp']` (blob host +
  `lh3.googleusercontent.com` were already allowed `remotePatterns`).
- **Scope:** the high-impact **thumbnails**. Avatars (KB-range), the VideoPlayer
  poster, and banners left as plain `<img>` (backlogged).

## 3. What Was Built (per-commit)

| Commit | Type | What |
|---|---|---|
| `5a2d796` | feat | `images.formats` + migrate 9 thumbnail sites (8 components) to `<Image fill sizes>`; heroes get `priority`; `relative` added to aspect wrappers that needed it; manual lazy attrs dropped (next/image is lazy by default); fallbacks preserved. |
| `d18f37f` | docs | Public CHANGELOG (plain) + DEVLOG (technical). |

Migrated: `VideoCard` thumbnail (all 10 feeds), `RelatedVideos`, `HomeFeed` hero,
`TrendingPage` hero, `HistoryPage`, `PlaylistsPage`, `LandingPage`, `CreatorStudio`
(list + table). Pushed to `main` (`d107680..d18f37f`).

## 4. What Was Verified (and how)

Learning from Session 10, verified against **real media**, not empty seed data:

- **Optimizer (curl, real 445KB blob PNG):** `/_next/image?...&w=640` →
  `image/avif` **29.9KB**, `image/webp` **32.9KB**; `w=384` → AVIF **27KB**. Original
  445KB → **−93%**.
- **Browser render (dev server, real blob URL injected via `fetch` patch):** migrated
  components emit `<img src="/_next/image?url=…&w=…">`, `loading="lazy"`; the first
  image **loaded** (`complete`, naturalWidth 158) and its optimized URL returned
  **status 200, image/avif, 29KB**. Layout intact (correct aspect boxes, no shift),
  **no console errors**.
- **Static checks:** `tsc --noEmit` 0 errors; `eslint .` **0 errors**, 19 warnings
  (baseline unchanged — no new issues). CI lint stays green.

## 5. What Was NOT Verified (user should check)

- **Production behavior on the live deploy.** Verified locally against the live blob
  images; on Vercel the same next/image path uses Vercel's optimizer + edge cache —
  worth confirming a live feed now serves AVIF/WebP (DevTools → Network → Type) and
  that transformation quota/cost is acceptable for the traffic.
- **`next build`** not run this session (client-component + config change; Session 6
  confirmed the build works with placeholder env).
- **Video load** (the 20MB `.mov`) is a separate problem — not addressed here; see
  backlog (`preload="metadata"`, transcoding/HLS).

## 6. Open Items / Backlogged

- **Optimize the remaining images:** avatars, the `VideoPlayer` poster, channel/
  profile banners → `next/image` (same pattern).
- **Video load fixes** (from Session 10): `<video preload="metadata">`; transcode
  uploads to web-friendly MP4/HLS; convert/reject `.mov`.
- **Complementary:** upload-time `sharp` compression would need a post-upload
  blob-processing step (direct-to-blob uploads have no server hook) — shrinks stored
  bytes for new uploads.
- Shared `<OptimizedImage>` component to DRY the `next/image` + fallback pattern.
