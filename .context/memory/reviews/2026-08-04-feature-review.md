# Feature Review — Hover/Touch Pre-fetch — 2026-08-04

- **Agent:** Claude Code | **Model:** claude-opus-4-8 | **Platform:** Baos-Mac-mini (macOS 15.7.7) | **Role:** feature-engineer | **Core:** 0.5.0
- **Target:** `feature` — "Add features; Pre-fetch and Lazy Loading each in a separate session." This session delivered **Pre-fetch**; **Lazy Loading** is the next session's feature (backlogged).

## 1. Executive Summary

**Requested:** add a "Pre-fetch" feature. **Shipped:** react-query cache
warming on hover/touch intent, so opening a video renders the watch page from
cache instead of a loading skeleton.

The obvious approach — Next.js `<Link prefetch>` — does not apply: Vert navigates
via a client-side **zustand store** (`useNavigation().navigate({page,…})`), not
`next/link`. The thin Next route files just render `<VertApp/>`, which swaps the
view in place. So the felt latency is the **data fetch after the click**, not a
route transition. Pre-fetch therefore means warming the react-query cache for the
watch page's queries the moment the user shows intent.

**Acceptance shape (met):** hovering/touch-starting a video card fires the
`['video', id]` + `['related-videos', id]` fetches ahead of the click, so opening
that video renders from cache with no duplicate request and no skeleton.

## 2. Design Decisions

Recorded as **ADR-3** in `plans/decisions.md`. Summary:

- **Mechanism:** `queryClient.prefetchQuery`, not route prefetch (app doesn't use
  `next/link`).
- **Shared query module** (`src/lib/video-queries.ts`): prefetch and the on-mount
  `useQuery` must share a byte-identical `queryKey`+`queryFn`, so the definitions
  (`fetchVideoDetail`/`fetchRelated`, `videoDetailQueryOptions`/
  `relatedVideosQueryOptions`) live in one place. Also closes the backlog
  follow-up "shared query-key/hook factory".
- **Injection point:** the shared `VideoCard` (covers all 10 feeds) + the
  `RelatedVideos` "Up Next" rows + the logged-out `LandingPage` trending cards
  (its own inline card, not VideoCard).
- **Triggers:** `onMouseEnter` (desktop) + `onTouchStart` (mobile). No `onFocus`
  — the card root is a non-focusable `div` (existing pattern); wiring focus would
  imply an a11y affordance that isn't there (out of scope for this feature; see
  Open Items).
- **Cost control:** react-query in-flight dedup + the app's 60s `staleTime` — no
  manual debounce/guard. A failed prefetch is a silent no-op.

## 3. What Was Built (per-commit)

| Commit | Type | What |
|---|---|---|
| `dee2b9b` | refactor | Extract `src/lib/video-queries.ts`; `VideoDetail` consumes `videoDetailQueryOptions`. No behavior change — the enabling step. |
| `42acc99` | feat | New `usePrefetchVideo()` hook; wired `onMouseEnter`/`onTouchStart` into `VideoCard`, `RelatedVideos` rows, `LandingPage` cards; `RelatedVideos` moved to the shared query def; dropped a stray unused map `index`. |
| `2b4b9c4` | docs | Public CHANGELOG (plain language) + DEVLOG (technical) under `[Unreleased]`. |

Pushed to `main` (`1943d50..2b4b9c4`).

## 4. What Was Verified (and how)

Dev server on `:63588` (port 3000 was taken by an unrelated "LocalMind" app —
see Open Items), DB `vert` on `:51214`. Evidence from server request logs +
DOM inspection:

- **VideoCard (Trending feed):** real hover over a card →
  `GET /api/v1/videos/<id>` **and** `GET /api/v1/videos/<id>/related?limit=10`
  fired *before* any click. Clicking the same card → watch page rendered with the
  correct title, "Up Next" populated (6 items), **0 skeletons**, and **no
  duplicate** detail/related request (served from cache; only `comments` loaded,
  which is intentionally not prefetched).
- **RelatedVideos ("Up Next"):** hovering a row fired a prefetch for that row's
  *different* video id (`cmrem7zf9…`).
- **LandingPage (logged-out):** hovering a trending card fired a prefetch
  (`cmrem8074…`).
- **Quality gates:** `npx tsc --noEmit` → 0 errors. `npx eslint .` → **0 errors**,
  19 warnings (down from the 20-warning baseline — removed one unused var). CI
  lint is blocking; it stays green.

## 5. What Was NOT Verified (user should check)

- **Production timing / perceived speed.** Locally the fetches are sub-second and
  the seed video files don't exist (player shows "Video unavailable" — unrelated
  to prefetch). The real-world win depends on network latency; worth a look on the
  Vercel deploy.
- **Touch behavior on a real device.** `onTouchStart` was verified by code + the
  identical hook working on hover; not exercised on physical touch hardware.
- **`next build`** was not re-run this session (Session 6 confirmed it builds with
  placeholder env; these changes are client-component-only, no new server surface).

## 6. Open Items / Backlogged

- **Lazy Loading** — the second requested feature, its own session (see backlog).
- **Prefetch keyboard focus** — cards are non-focusable `div`s today; if they gain
  `tabIndex`/`role` for a11y, add `onFocus` to the prefetch triggers too. Minor;
  backlogged.
- **Unrelated:** the `LandingPage` still uses the legacy `useEffect`+`fetch`
  pattern (not migrated to react-query in Session 6). Left as-is — out of scope,
  no lint error. Noted for a future sweep.
