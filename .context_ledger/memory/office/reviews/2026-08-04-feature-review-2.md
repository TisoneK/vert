# Feature Review — Lazy Loading (images) — 2026-08-04 (Session 9)

- **Agent:** Claude Code | **Model:** claude-opus-4-8 | **Platform:** Baos-Mac-mini (macOS 15.7.7) | **Role:** feature-engineer | **Core:** 0.5.0
- **Target:** `feature` — Lazy Loading. Second of the two features the user requested ("each in a separate session"); Pre-fetch was Session 8. Scope confirmed with the user (chose **lazy-load images** over infinite-scroll / code-splitting).

## 1. Executive Summary

**Requested:** "Lazy Loading." **Scoped (user-confirmed):** defer off-screen
images. **Shipped:** native `loading="lazy"` + `decoding="async"` on the 12
thumbnail/avatar `<img>` sites that render inside repeating lists/grids, so
image-heavy feeds no longer download every picture up front.

No `<img>` in the app previously used lazy loading. All images already sit in
aspect-ratio / fixed-size wrappers, so deferring them causes **no layout shift**.
Complements Session 8's Pre-fetch: prefetch warms the JSON data cache, lazy
loading defers the image bytes.

**Acceptance shape (met at render level):** off-screen thumbnails/avatars in
feeds carry `loading="lazy"` so the browser defers them until near the viewport,
with no layout shift and hero/LCP images left eager.

## 2. Design Decisions

Recorded as **ADR-4** in `plans/decisions.md`. Key points:

- **Mechanism:** native `loading="lazy"` (+ `decoding="async"`), not
  IntersectionObserver or `next/image` — the surgical, behavior-preserving choice.
- **Deferred (12 sites, in lists/grids):** `VideoCard` thumbnail + channel avatar
  (all 10 feeds), `RelatedVideos` Up Next rows, `HistoryPage`, `PlaylistsPage`,
  `CommentSection` avatars, `LandingPage` cards, `CreatorStudio` (×2), `Sidebar`
  channel avatars, `SearchResults` avatars, `HomeFeed` "Popular Creators" shelf.
- **Left eager on purpose (LCP/above-the-fold singletons):** `VideoPlayer`
  poster, `TrendingPage` + `HomeFeed` heroes, `ChannelPage`/`ProfilePage` banners,
  `ChannelPage` header avatar, `VideoDetail` channel avatar, `UploadPage` preview.
  `loading="lazy"` on an LCP image can *delay* it — so these were not touched.
- **Rejected:** a shared `<LazyImage>` component (would touch each component's
  `onError` fallback state — scope creep); infinite scroll and code-splitting
  (valid "lazy" readings, backlogged for their own sessions).

## 3. What Was Built (per-commit)

| Commit | Type | What |
|---|---|---|
| `5a564d5` | feat | `loading="lazy"` + `decoding="async"` on the 12 list/grid `<img>` sites across 10 files. |
| `097427c` | docs | Public CHANGELOG (plain) + DEVLOG (technical) under `[Unreleased]`. |

Pushed to `main` (`ecd3a96..097427c`).

## 4. What Was Verified (and how)

- **Code:** `grep` confirms 12 `loading="lazy"` on the intended tags; `npx tsc
  --noEmit` → 0 errors; `npx eslint .` → **0 errors**, 19 warnings (baseline
  unchanged — no new issues). CI lint stays green.
- **Render (live dev server :63899):** seed data has `thumbnailUrl: null`, so
  cards normally show placeholders and no `<img>` renders. To exercise the real
  render path, I patched `window.fetch` in the page to inject a same-origin
  thumbnail URL, remounted the LandingPage feed, and inspected the DOM: **all
  rendered feed `<img>` elements carried `loading="lazy"` and `decoding="async"`**
  — confirming the JSX emits the attributes. The 3 on-screen vs 3 off-screen split
  was as expected from layout.
- **No regression:** after clearing the patch (fresh reload), the Trending feed
  renders normally (39 cards/headings, placeholders where thumbnails are null,
  layout intact) — screenshot captured.

## 5. What Was NOT Verified (user should check)

- **Network-timing deferral.** That the browser actually withholds the request for
  an off-screen `loading="lazy"` image is guaranteed native behavior, but it
  couldn't be *timing-measured* here: seed videos have no thumbnails, so no real
  images render locally, and injected fake images didn't load measurably in the
  browser tool (favicon isn't a decodable image; injected SVGs didn't load in the
  tool's timing window). On a **deploy with real thumbnails**, confirm in DevTools
  → Network that off-screen thumbnails are requested only on scroll.
- **`next build`** not re-run (client-only attribute change, no new server surface;
  Session 6 confirmed the build works with placeholder env).

## 6. Open Items / Backlogged

- **Infinite scroll** and **code-splitting** — the other two "lazy" readings, each
  its own session if wanted (backlog).
- Possible future refactor: a shared `<LazyImage>`/`<Thumbnail>` component to DRY
  up `loading`/`decoding`/`onError` across the ~20 `<img>` sites (deferred as scope
  creep this session).
